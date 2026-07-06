import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { UpdateClasseDto } from './dto/update-classe.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(registreId?: string, userId?: string, userRole?: Role, userClasseId?: string | null) {
    const where: any = {};
    if (registreId) where.registreId = registreId;

    // Un RESPONSABLE ne voit que sa classe
    if (userRole === Role.RESPONSABLE && userClasseId) {
      where.id = userClasseId;
    }

    return this.prisma.classe.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: {
        registre: { select: { annee: true } },
        _count: { select: { utilisateurs: true, appels: true } },
      },
    });
  }

  async findOne(id: string) {
    const classe = await this.prisma.classe.findUnique({
      where: { id },
      include: {
        registre: true,
        utilisateurs: { orderBy: [{ role: 'asc' }, { nom: 'asc' }] },
        _count: { select: { appels: true } },
      },
    });
    if (!classe) throw new NotFoundException('Classe introuvable.');
    return classe;
  }

  async create(dto: CreateClasseDto) {
    const existing = await this.prisma.classe.findFirst({
      where: { nom: dto.nom, registreId: dto.registreId },
    });
    if (existing) {
      throw new ConflictException(
        `Une classe nommée "${dto.nom}" existe déjà dans ce registre.`,
      );
    }
    return this.prisma.classe.create({
      data: { nom: dto.nom, description: dto.description, registreId: dto.registreId },
    });
  }

  async update(id: string, dto: UpdateClasseDto) {
    await this.findOne(id);
    return this.prisma.classe.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.classe.delete({ where: { id } });
  }

  /** Utilisateurs sans classe affectée (disponibles pour être ajoutés) */
  async findUtilisateursDisponibles(classeId: string) {
    return this.prisma.utilisateur.findMany({
      where: {
        classeId: null,
        role: { not: Role.ADMIN },
      },
      orderBy: [{ role: 'asc' }, { nom: 'asc' }],
    });
  }
}
