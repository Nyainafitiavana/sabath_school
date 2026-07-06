import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendrierService } from './calendrier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendrier')
export class CalendrierController {
  constructor(private service: CalendrierService) {}

  @Get('sabbats')
  getSabbats(
    @Query('annee') annee: string,
    @Query('mois') mois: string,
  ) {
    return this.service.getSabbatsDuMois(parseInt(annee), parseInt(mois));
  }
}
