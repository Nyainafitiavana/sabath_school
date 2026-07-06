import { Module } from '@nestjs/common';
import { QuestionsGlobalesService } from './questions-globales.service';
import { QuestionsGlobalesController } from './questions-globales.controller';

@Module({
  providers: [QuestionsGlobalesService],
  controllers: [QuestionsGlobalesController],
})
export class QuestionsGlobalesModule {}
