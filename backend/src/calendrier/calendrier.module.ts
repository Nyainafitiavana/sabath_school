import { Module } from '@nestjs/common';
import { CalendrierService } from './calendrier.service';
import { CalendrierController } from './calendrier.controller';

@Module({
  providers: [CalendrierService],
  controllers: [CalendrierController],
})
export class CalendrierModule {}
