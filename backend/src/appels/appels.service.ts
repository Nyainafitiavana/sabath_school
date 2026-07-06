import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateAppelDto } from './dto/create-appel.dto';
import { UpdateAppelDto } from './dto/update-appel.dto';
import { Role, Sabbat, StatutAppel } from '@prisma/client';

@Injectable()
export class AppelsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async findAll(classeId?: string, annee?: number, trimestre?: number, mois?: number, sabbat?: Sabbat) {
    const where: any = {};
    if (classeId) where.classeId = classeId;
    if (annee)    where.classe   = { registre: { annee } };
    if (trimestre) where.trimestre = trimestre;
    if (mois) where.mois = mois;
    if (sabbat) where.sabbat = sabbat;

    return this.prisma.appel.findMany({
      where,
      orderBy: [{ trimestre: 'asc' }, { mois: 'asc' }, { sabbat: 'asc' }],
      include: {
        classe: { select: { id: true, nom: true } },
        _count: { select: { presences: true } },
      },
    });
  }

  async findOne(id: string) {
    const appel = await this.prisma.appel.findUnique({
      where: { id },
      include: {
        classe: { select: { id: true, nom: true } },
        presences: {
          include: {
            utilisateur: { select: { id: true, nom: true, prenom: true, role: true } },
          },
          orderBy: { utilisateur: { nom: 'asc' } },
        },
        reponses: {
          include: { question: true },
          orderBy: { question: { ordre: 'asc' } },
        },
      },
    });
    if (!appel) throw new NotFoundException('Appel introuvable.');
    return appel;
  }

  async create(dto: CreateAppelDto, userId: string, userRole: Role, userClasseId?: string | null) {
    // Guard classe pour RESPONSABLE
    if (userRole === Role.RESPONSABLE && userClasseId !== dto.classeId) {
      throw new ForbiddenException('Vous ne pouvez créer un appel que pour votre propre classe.');
    }

    // Vérifier que la classe existe
    const classe = await this.prisma.classe.findUnique({ where: { id: dto.classeId } });
    if (!classe) throw new NotFoundException('Classe introuvable.');

    // Contrainte unique : blocage explicite avec message clair
    const existing = await this.prisma.appel.findUnique({
      where: {
        classeId_trimestre_mois_sabbat: {
          classeId: dto.classeId,
          trimestre: dto.trimestre,
          mois: dto.mois,
          sabbat: dto.sabbat,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un appel existe déjà pour cette classe au trimestre ${dto.trimestre}, mois ${dto.mois}, ${dto.sabbat}. ` +
          `Identifiant de l'appel existant : ${existing.id}`,
      );
    }

    // Récupérer les membres de la classe pour initialiser les présences
    const membres = await this.prisma.utilisateur.findMany({
      where: { classeId: dto.classeId, role: { in: [Role.RESPONSABLE, Role.MEMBRE] } },
      select: { id: true },
    });

    // Récupérer les questions globales pour initialiser les réponses
    const questions = await this.prisma.questionGlobale.findMany({ select: { id: true } });

    const appel = await this.prisma.appel.create({
      data: {
        classeId: dto.classeId,
        trimestre: dto.trimestre,
        mois: dto.mois,
        sabbat: dto.sabbat,
        dateReelle: dto.dateReelle ? new Date(dto.dateReelle) : null,
        presences: {
          create: membres.map((m) => ({
            utilisateurId: m.id,
            present: false,
          })),
        },
        reponses: {
          create: questions.map((q) => ({
            questionId: q.id,
            valeur: 0,
          })),
        },
      },
      include: {
        presences: { include: { utilisateur: { select: { id: true, nom: true, prenom: true } } } },
        reponses: { include: { question: true } },
      },
    });

    this.realtime.emitAppelCreated({
      appelId: appel.id,
      classeId: appel.classeId,
      trimestre: appel.trimestre,
      mois: appel.mois,
      sabbat: appel.sabbat,
    });

    return appel;
  }

  async update(id: string, dto: UpdateAppelDto, userRole: Role, userClasseId?: string | null) {
    const appel = await this.findOne(id);

    if (userRole === Role.RESPONSABLE && userClasseId !== appel.classeId) {
      throw new ForbiddenException('Accès refusé : cet appel ne vous appartient pas.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Mettre à jour les présences
      if (dto.presences) {
        for (const p of dto.presences) {
          await tx.presence.upsert({
            where: { appelId_utilisateurId: { appelId: id, utilisateurId: p.utilisateurId } },
            update: {
              present: p.present,
              frequenceApprentissage: p.present ? (p.frequenceApprentissage ?? null) : null,
            },
            create: {
              appelId: id,
              utilisateurId: p.utilisateurId,
              present: p.present,
              frequenceApprentissage: p.present ? (p.frequenceApprentissage ?? null) : null,
            },
          });
        }
      }

      // Mettre à jour les réponses aux questions globales
      if (dto.reponses) {
        for (const r of dto.reponses) {
          await tx.reponseQuestionGlobale.upsert({
            where: { appelId_questionId: { appelId: id, questionId: r.questionId } },
            update: { valeur: r.valeur },
            create: { appelId: id, questionId: r.questionId, valeur: r.valeur },
          });
        }
      }

      // Mise à jour statut / dateReelle
      const updateData: any = {};
      if (dto.statut) updateData.statut = dto.statut;
      if (dto.dateReelle) updateData.dateReelle = new Date(dto.dateReelle);

      if (Object.keys(updateData).length > 0) {
        await tx.appel.update({ where: { id }, data: updateData });
      }
    });

    const updated = await this.findOne(id);

    this.realtime.emitAppelUpdated({
      appelId: updated.id,
      classeId: updated.classeId,
      statut: updated.statut,
    });
    this.realtime.emitDashboardRefresh({ classeId: updated.classeId });

    return updated;
  }

  async remove(id: string, userRole: Role, userClasseId?: string | null) {
    const appel = await this.findOne(id);

    if (userRole === Role.RESPONSABLE && userClasseId !== appel.classeId) {
      throw new ForbiddenException('Accès refusé : cet appel ne vous appartient pas.');
    }

    await this.prisma.appel.delete({ where: { id } });

    this.realtime.emitAppelDeleted({ appelId: id, classeId: appel.classeId });
    this.realtime.emitDashboardRefresh({ classeId: appel.classeId });

    return { message: 'Appel supprimé.' };
  }
}
