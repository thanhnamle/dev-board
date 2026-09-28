import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface TelemetryPayload {
  id: string;
  type: 'push' | 'commit' | 'pull_request' | 'star' | 'release' | 'issue' | 'ping';
  repo: string;
  sender: {
    login: string;
    avatarUrl: string;
  };
  message: string;
  details?: {
    branch?: string;
    commitsCount?: number;
    headCommitSha?: string;
    prNumber?: number;
    prAction?: string;
    url?: string;
  };
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  },
})
export class TelemetryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('TelemetryGateway');
  private connectedClients = new Set<string>();

  afterInit(server: Server) {
    this.logger.log('📡 DevBoard Live Telemetry Gateway initialized!');
  }

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    this.logger.log(`🔌 Client connected: ${client.id} (Total: ${this.connectedClients.size})`);
    
    // Send immediate welcome status
    client.emit('telemetry.status', {
      connected: true,
      clientId: client.id,
      clientsCount: this.connectedClients.size,
      serverTime: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`❌ Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return {
      event: 'pong',
      data: {
        receivedAt: new Date().toISOString(),
        clientPayload: data,
      },
    };
  }

  /**
   * Broadcast an event to all connected Angular clients
   */
  broadcast(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
      this.logger.log(`⚡ Broadcasted '${event}' to ${this.connectedClients.size} client(s): ${payload?.message || ''}`);
    }
  }

  getClientCount(): number {
    return this.connectedClients.size;
  }
}
