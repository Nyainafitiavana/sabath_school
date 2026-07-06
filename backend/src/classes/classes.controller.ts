import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { UpdateClasseDto } from './dto/update-classe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClasseAccessGuard } from '../auth/guards/classe-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Get()
  findAll(@Query('registreId') registreId: string, @CurrentUser() user: any) {
    return this.service.findAll(registreId, user.id, user.role, user.classeId);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(ClasseAccessGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateClasseDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClasseDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(Role.ADMIN)
  @Get(':id/utilisateurs-disponibles')
  findUtilisateursDisponibles(@Param('id') id: string) {
    return this.service.findUtilisateursDisponibles(id);
  }
}
