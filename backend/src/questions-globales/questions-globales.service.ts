import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionGlobaleDto } from './dto/create-question-globale.dto';
import { UpdateQuestionGlobaleDto } from './dto/update-question-globale.dto';

@Injectable()
export class QuestionsGlobalesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.questionGlobale.findMany({ orderBy: { ordre: 'asc' } });
  }

  async create(dto: CreateQuestionGlobaleDto) {
    const existing = await this.prisma.questionGlobale.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Le code "${dto.code}" est déjà utilisé.`);

    const maxOrdre = await this.prisma.questionGlobale.aggregate({ _max: { ordre: true } });
    const ordre = dto.ordre ?? (maxOrdre._max.ordre ?? 0) + 1;

    return this.prisma.questionGlobale.create({ data: { code: dto.code, libelle: dto.libelle, ordre } });
  }

  async update(id: string, dto: UpdateQuestionGlobaleDto) {
    await this.findOneOrFail(id);

    if (dto.code) {
      const conflict = await this.prisma.questionGlobale.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Le code "${dto.code}" est déjà utilisé.`);
    }

    return this.prisma.questionGlobale.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrFail(id);
    return this.prisma.questionGlobale.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const q = await this.prisma.questionGlobale.findUnique({ where: { id } });
    if (!q) throw new NotFoundException(`Question globale introuvable : ${id}`);
    return q;
  }
}
