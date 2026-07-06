import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté : ${client.id}`);
  }

  /** Le client rejoint la room de sa/ses classe(s) */
  @SubscribeMessage('join:classe')
  handleJoinClasse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classeId: string },
  ) {
    client.join(`classe:${data.classeId}`);
    this.logger.log(`${client.id} a rejoint classe:${data.classeId}`);
  }

  /** Le client rejoint la room admin (pour l'Admin) */
  @SubscribeMessage('join:admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    this.logger.log(`${client.id} a rejoint la room admin`);
  }

  emitAppelCreated(payload: {
    appelId: string;
    classeId: string;
    trimestre: number;
    mois: number;
    sabbat: string;
  }) {
    this.server.to(`classe:${payload.classeId}`).emit('appel:created', payload);
    this.server.to('admin').emit('appel:created', payload);
  }

  emitAppelUpdated(payload: { appelId: string; classeId: string; statut: string }) {
    this.server.to(`classe:${payload.classeId}`).emit('appel:updated', payload);
    this.server.to('admin').emit('appel:updated', payload);
  }

  emitAppelDeleted(payload: { appelId: string; classeId: string }) {
    this.server.to(`classe:${payload.classeId}`).emit('appel:deleted', payload);
    this.server.to('admin').emit('appel:deleted', payload);
  }

  emitDashboardRefresh(payload: { classeId: string }) {
    this.server.to(`classe:${payload.classeId}`).emit('dashboard:refresh', payload);
    this.server.to('admin').emit('dashboard:refresh', payload);
  }
}
