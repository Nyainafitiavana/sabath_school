import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Sabbat } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Get()
  getStats(
    @Query('annee') annee?: string,
    @Query('trimestre') trimestre?: string,
    @Query('mois') mois?: string,
    @Query('sabbat') sabbat?: Sabbat,
    @Query('classeId') classeId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.getStats({
      annee: annee ? parseInt(annee) : undefined,
      trimestre: trimestre ? parseInt(trimestre) : undefined,
      mois: mois ? parseInt(mois) : undefined,
      sabbat,
      classeId,
      userRole: user.role,
      userClasseId: user.classeId,
    });
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @Get('serie')
  getSerie(
    @Query('annee') annee?: string,
    @Query('trimestre') trimestre?: string,
    @Query('mois') mois?: string,
    @Query('sabbat') sabbat?: Sabbat,
    @Query('classeId') classeId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.getSerie({
      annee: annee ? parseInt(annee) : undefined,
      trimestre: trimestre ? parseInt(trimestre) : undefined,
      mois: mois ? parseInt(mois) : undefined,
      sabbat,
      classeId,
      userRole: user.role,
      userClasseId: user.classeId,
    });
  }
}
