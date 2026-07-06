import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuestionsGlobalesService } from './questions-globales.service';
import { CreateQuestionGlobaleDto } from './dto/create-question-globale.dto';
import { UpdateQuestionGlobaleDto } from './dto/update-question-globale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions-globales')
export class QuestionsGlobalesController {
  constructor(private service: QuestionsGlobalesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateQuestionGlobaleDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionGlobaleDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
