import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Pour un RESPONSABLE, vérifie que la classeId demandée correspond
 * à sa propre classeId. L'ADMIN passe toujours.
 * Cherche classeId dans params, query, puis body.
 */
@Injectable()
export class ClasseAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.role === Role.ADMIN) return true;

    const classeId =
      request.params?.classeId ||
      request.params?.id ||
      request.query?.classeId ||
      request.body?.classeId;

    if (!classeId) return true;

    if (user.classeId !== classeId) {
      throw new ForbiddenException('Accès refusé : cette classe ne vous appartient pas.');
    }
    return true;
  }
}
