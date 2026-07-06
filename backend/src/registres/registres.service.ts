import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistreDto } from './dto/create-registre.dto';

@Injectable()
export class RegistresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.registre.findMany({
      orderBy: { annee: 'desc' },
      include: { _count: { select: { classes: true } } },
    });
  }

  async findOne(id: string) {
    const registre = await this.prisma.registre.findUnique({
      where: { id },
      include: { classes: { orderBy: { nom: 'asc' } } },
    });
    if (!registre) throw new NotFoundException('Registre introuvable.');
    return registre;
  }

  async create(dto: CreateRegistreDto) {
    const existing = await this.prisma.registre.findUnique({ where: { annee: dto.annee } });
    if (existing) throw new ConflictException(`Un registre pour l'année ${dto.annee} existe déjà.`);
    return this.prisma.registre.create({ data: { annee: dto.annee } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.registre.delete({ where: { id } });
  }
}
