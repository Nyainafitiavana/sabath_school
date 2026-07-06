import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AppelsService } from './appels.service';
import { CreateAppelDto } from './dto/create-appel.dto';
import { UpdateAppelDto } from './dto/update-appel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Sabbat } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appels')
export class AppelsController {
  constructor(private service: AppelsService) {}

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Get()
  findAll(
    @Query('classeId') classeId?: string,
    @Query('trimestre') trimestre?: string,
    @Query('mois') mois?: string,
    @Query('sabbat') sabbat?: Sabbat,
  ) {
    return this.service.findAll(
      classeId,
      trimestre ? parseInt(trimestre) : undefined,
      mois ? parseInt(mois) : undefined,
      sabbat,
    );
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Post()
  create(@Body() dto: CreateAppelDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.role, user.classeId);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppelDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.role, user.classeId);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.role, user.classeId);
  }
}
