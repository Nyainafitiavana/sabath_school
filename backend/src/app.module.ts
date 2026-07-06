import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RegistresModule } from './registres/registres.module';
import { ClassesModule } from './classes/classes.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AppelsModule } from './appels/appels.module';
import { QuestionsGlobalesModule } from './questions-globales/questions-globales.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CalendrierModule } from './calendrier/calendrier.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RegistresModule,
    ClassesModule,
    UtilisateursModule,
    AppelsModule,
    QuestionsGlobalesModule,
    DashboardModule,
    CalendrierModule,
    RealtimeModule,
  ],
})
export class AppModule {}
