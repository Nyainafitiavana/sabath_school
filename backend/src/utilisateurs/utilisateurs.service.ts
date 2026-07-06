import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  async findAll(classeId?: string, registreId?: string, role?: Role) {
    const where: any = {};
    if (classeId) where.classeId = classeId;
    if (role) where.role = role;
    if (registreId) where.classe = { registreId };

    return this.prisma.utilisateur.findMany({
      where,
      select: {
        id: true, nom: true, prenom: true, email: true, role: true,
        classeId: true, contact: true, createdAt: true,
        classe: { select: { id: true, nom: true } },
      },
      orderBy: [{ nom: 'asc' }],
    });
  }

  async findOne(id: string) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true, nom: true, prenom: true, email: true, role: true,
        classeId: true, contact: true, createdAt: true, updatedAt: true,
        classe: { select: { id: true, nom: true } },
      },
    });
    if (!u) throw new NotFoundException('Utilisateur introuvable.');
    return u;
  }

  async create(dto: CreateUtilisateurDto) {
    this.validateRoleConstraints(dto.role, dto.email, dto.classeId);

    if (dto.email) {
      const existing = await this.prisma.utilisateur.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Cet email est déjà utilisé.');
    }

    const data: any = {
      nom: dto.nom,
      prenom: dto.prenom,
      role: dto.role,
      contact: dto.contact,
      classeId: dto.classeId ?? null,
    };

    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.utilisateur.create({
      data,
      select: {
        id: true, nom: true, prenom: true, email: true, role: true,
        classeId: true, contact: true, createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUtilisateurDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    // classeId: null signifie "retirer de la classe"
    if ('classeId' in dto) {
      data.classeId = dto.classeId ?? null;
    }

    return this.prisma.utilisateur.update({
      where: { id },
      data,
      select: {
        id: true, nom: true, prenom: true, email: true, role: true,
        classeId: true, contact: true, updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.utilisateur.delete({ where: { id } });
  }

  private validateRoleConstraints(role: Role, email?: string, classeId?: string) {
    if ((role === Role.ADMIN || role === Role.RESPONSABLE) && !email) {
      throw new BadRequestException('Un email est requis pour les rôles ADMIN et RESPONSABLE.');
    }
    if (role === Role.ADMIN && classeId) {
      throw new BadRequestException('Un ADMIN ne peut pas être affecté à une classe.');
    }
    if ((role === Role.RESPONSABLE || role === Role.MEMBRE) && !classeId) {
      throw new BadRequestException('Une classe est requise pour les rôles RESPONSABLE et MEMBRE.');
    }
  }
}
