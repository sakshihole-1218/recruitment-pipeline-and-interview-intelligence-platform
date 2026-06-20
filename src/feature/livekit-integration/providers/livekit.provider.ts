import {
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  RoomServiceClient,
  type VideoGrant,
  WebhookReceiver,
} from 'livekit-server-sdk';

@Injectable()
export class LivekitProvider {
  private static readonly SERVICE_REQUEST_TIMEOUT_MS = 10000;

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    const value = this.configService.get<string>('LIVEKIT_API_KEY');
    if (!value) {
      throw new InternalServerErrorException({
        message: 'LiveKit API key is not configured',
        code: 'LIVEKIT_API_KEY_NOT_CONFIGURED',
      });
    }
    return value;
  }

  private get apiSecret(): string {
    const value = this.configService.get<string>('LIVEKIT_API_SECRET');
    if (!value) {
      throw new InternalServerErrorException({
        message: 'LiveKit API secret is not configured',
        code: 'LIVEKIT_API_SECRET_NOT_CONFIGURED',
      });
    }
    return value;
  }

  getPublicUrl(): string {
    const value = this.configService.get<string>('LIVEKIT_URL');
    if (!value) {
      throw new InternalServerErrorException({
        message: 'LiveKit URL is not configured',
        code: 'LIVEKIT_URL_NOT_CONFIGURED',
      });
    }
    return value;
  }

  private get serviceUrl(): string {
    const rawUrl = this.getPublicUrl().trim();

    if (rawUrl.startsWith('wss://')) {
      return `https://${rawUrl.slice(6)}`;
    }

    if (rawUrl.startsWith('ws://')) {
      return `http://${rawUrl.slice(5)}`;
    }

    return rawUrl;
  }

  private createRoomClient(): RoomServiceClient {
    return new RoomServiceClient(this.serviceUrl, this.apiKey, this.apiSecret);
  }

  private async withTimeout<T>(operation: Promise<T>, action: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new GatewayTimeoutException({
            message: `LiveKit ${action} timed out`,
            code: `LIVEKIT_${action.toUpperCase().replace(/\s+/g, '_')}_TIMEOUT`,
            meta: {
              timeout_ms: LivekitProvider.SERVICE_REQUEST_TIMEOUT_MS,
              service_url: this.serviceUrl,
            },
          }),
        );
      }, LivekitProvider.SERVICE_REQUEST_TIMEOUT_MS);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  async createRoom(input: {
    roomName: string;
    metadata?: Record<string, unknown>;
    emptyTimeout?: number;
    departureTimeout?: number;
    maxParticipants?: number;
  }): Promise<{ name: string; metadata: string | undefined }> {
    const room = await this.withTimeout(
      this.createRoomClient().createRoom({
        name: input.roomName,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        emptyTimeout: input.emptyTimeout,
        departureTimeout: input.departureTimeout,
        maxParticipants: input.maxParticipants,
      }),
      'create room',
    );

    return {
      name: room.name,
      metadata: room.metadata,
    };
  }

  deleteRoom(roomName: string): Promise<void> {
    return this.withTimeout(
      this.createRoomClient().deleteRoom(roomName),
      'delete room',
    );
  }

  async generateAccessToken(input: {
    roomName: string;
    identity: string;
    name: string;
    metadata?: Record<string, unknown>;
    grant: VideoGrant;
  }): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: input.identity,
      name: input.name,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    });

    token.addGrant({
      ...input.grant,
      room: input.roomName,
      roomJoin: true,
    });

    return token.toJwt();
  }

  async receiveWebhookEvent(
    rawBody: string,
    authorizationHeader?: string,
  ): Promise<any> {
    try {
      const receiver = new WebhookReceiver(this.apiKey, this.apiSecret);
      return await receiver.receive(rawBody, authorizationHeader);
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Invalid LiveKit webhook signature',
        code: 'LIVEKIT_WEBHOOK_SIGNATURE_INVALID',
      });
    }
  }
}
