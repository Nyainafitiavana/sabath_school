import { Module } from '@nestjs/common';
import { RegistresService } from './registres.service';
import { RegistresController } from './registres.controller';

@Module({
  providers: [RegistresService],
  controllers: [RegistresController],
  exports: [RegistresService],
})
export class RegistresModule {}
