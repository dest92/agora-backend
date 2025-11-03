import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events';

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
@Injectable()
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  constructor(@Inject('EventBus') private readonly eventBus: EventBus) {}

  async onModuleInit() {
    // Subscribe to all domain events
    await this.eventBus.subscribe('card', this.handleDomainEvent.bind(this));
    await this.eventBus.subscribe('comment', this.handleDomainEvent.bind(this));
    await this.eventBus.subscribe('vote', this.handleDomainEvent.bind(this));
    await this.eventBus.subscribe('tag', this.handleDomainEvent.bind(this));
    await this.eventBus.subscribe(
      'assignee',
      this.handleDomainEvent.bind(this),
    );
    await this.eventBus.subscribe('workspace', this.handleDomainEvent.bind(this));
    await this.eventBus.subscribe('session', this.handleDomainEvent.bind(this));
  }

  handleConnection(client: Socket): void {
    const boardId = client.handshake.query.boardId as string;
    const workspaceId = client.handshake.query.workspaceId as string;
    const sessionId = client.handshake.query.sessionId as string;

    // Observer Pattern: Auto-join to rooms based on context
    if (boardId) {
      client.join(`room:board:${boardId}`);
      console.log(`Client ${client.id} joined board ${boardId}`);
    }
    if (workspaceId) {
      client.join(`room:workspace:${workspaceId}`);
      console.log(`Client ${client.id} joined workspace ${workspaceId}`);
    }
    if (sessionId) {
      client.join(`room:session:${sessionId}`);
      console.log(`Client ${client.id} joined session ${sessionId}`);
    }
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId?: string; workspaceId?: string; sessionId?: string },
  ): void {
    if (data.boardId) {
      client.join(`room:board:${data.boardId}`);
    }
    if (data.workspaceId) {
      client.join(`room:workspace:${data.workspaceId}`);
    }
    if (data.sessionId) {
      client.join(`room:session:${data.sessionId}`);
    }
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId?: string; workspaceId?: string; sessionId?: string },
  ): void {
    if (data.boardId) {
      client.leave(`room:board:${data.boardId}`);
    }
    if (data.workspaceId) {
      client.leave(`room:workspace:${data.workspaceId}`);
    }
    if (data.sessionId) {
      client.leave(`room:session:${data.sessionId}`);
    }
  }

  private handleDomainEvent(event: DomainEvent): void {
    const { name, payload, meta } = event;

    // Observer Pattern: Broadcast to appropriate rooms
    // Broadcast to board room
    if (meta?.boardId) {
      this.server.to(`room:board:${meta.boardId}`).emit(name, payload);
    }

    // Broadcast to workspace room
    if (meta?.workspaceId) {
      this.server.to(`room:workspace:${meta.workspaceId}`).emit(name, payload);
    }

    // Broadcast to session room (for session-related events)
    if (meta?.sessionId) {
      this.server.to(`room:session:${meta.sessionId}`).emit(name, payload);
    }
  }
}
