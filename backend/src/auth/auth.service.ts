import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        classeId: user.classeId,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id: userId } });
    if (!user?.password) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: 'Mot de passe modifié avec succès.' };
  }
}
