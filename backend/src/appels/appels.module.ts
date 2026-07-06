import { Module } from '@nestjs/common';
import { AppelsService } from './appels.service';
import { AppelsController } from './appels.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [AppelsService],
  controllers: [AppelsController],
})
export class AppelsModule {}
