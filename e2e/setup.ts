import { io, Socket } from 'socket.io-client';

/**
 * E2E Test Setup
 * Patrones: API Gateway (HTTP + WS), Cliente-Servidor, Observer/Pub-Sub
 * Estilos: Microservicios, EDA, Cliente-Servidor
 */

export interface TestConfig {
  readonly gatewayUrl: string;
  readonly jwtToken: string;
  readonly redisUrl: string;
  readonly boardId?: string;
  readonly userId?: string;
  readonly workspaceId?: string;
  readonly sessionId?: string;
}

export interface BootstrapResult {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly userId: string;
}

export interface EventAssertion {
  readonly eventName: string;
  readonly timeout: number;
  readonly validator?: (payload: any) => boolean;
}

export class E2ETestClient {
  private socket: Socket | null = null;
  private readonly receivedEvents: Array<{ name: string; payload: any; timestamp: number }> = [];

  constructor(private readonly config: TestConfig) {}

  /**
   * Observer Pattern: Setup WebSocket listener para eventos de dominio
   * EDA: Suscribirse a eventos via Socket.IO
   */
  async connectWebSocket(rooms?: { boardId?: string; workspaceId?: string; sessionId?: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.gatewayUrl, {
        query: {
          boardId: rooms?.boardId || this.config.boardId,
          workspaceId: rooms?.workspaceId || this.config.workspaceId,
          sessionId: rooms?.sessionId || this.config.sessionId,
        },
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log(`✅ WebSocket connected to ${this.config.gatewayUrl}`);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection failed:', error);
        reject(error);
      });

      // Observer: Capturar TODOS los eventos de dominio
      this.socket.onAny((eventName: string, payload: any) => {
        const timestamp = Date.now();
        this.receivedEvents.push({ name: eventName, payload, timestamp });
        console.log(`📡 Event received: ${eventName}`, { payload, timestamp });
      });
    });
  }

  /**
   * Cliente-Servidor: HTTP requests al API Gateway
   */
  async httpRequest(method: string, path: string, body?: any): Promise<{ status: number; data: any; latency: number }> {
    const startTime = Date.now();
    const url = `${this.config.gatewayUrl}${path}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.jwtToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = response.headers.get('content-type')?.includes('application/json') 
      ? await response.json() 
      : await response.text();

    const latency = Date.now() - startTime;

    return { status: response.status, data, latency };
  }

  /**
   * EDA Assertion: Verificar que evento de dominio fue emitido
   * Pub-Sub: Confirmar que Gateway re-emitió evento a room correcto
   */
  async waitForEvent(assertion: EventAssertion): Promise<{ payload: any; latency: number }> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${assertion.eventName}`));
      }, assertion.timeout);

      const checkEvent = () => {
        const event = this.receivedEvents.find(e => 
          e.name === assertion.eventName && 
          e.timestamp >= startTime &&
          (!assertion.validator || assertion.validator(e.payload))
        );

        if (event) {
          clearTimeout(timeout);
          const latency = event.timestamp - startTime;
          resolve({ payload: event.payload, latency });
        } else {
          setTimeout(checkEvent, 50); // Poll every 50ms
        }
      };

      checkEvent();
    });
  }

  /**
   * Idempotencia: Verificar que evento NO se duplica
   */
  getEventCount(eventName: string, since: number): number {
    return this.receivedEvents.filter(e => 
      e.name === eventName && e.timestamp >= since
    ).length;
  }

  /**
   * Cleanup: Cerrar conexiones
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Debug: Obtener todos los eventos recibidos
   */
  getReceivedEvents(): ReadonlyArray<{ name: string; payload: any; timestamp: number }> {
    return [...this.receivedEvents];
  }

  /**
   * Reset: Limpiar eventos para nueva prueba
   */
  clearEvents(): void {
    this.receivedEvents.length = 0;
  }

  /**
   * Bootstrap: Crear workspace y session si no existen
   * EDA: Crear recursos necesarios para E2E tests
   */
  async bootstrap(): Promise<BootstrapResult> {
    // Extract userId from JWT (basic decode without verification)
    let userId = this.config.userId;
    if (!userId && this.config.jwtToken) {
      try {
        const payload = JSON.parse(atob(this.config.jwtToken.split('.')[1]));
        userId = payload.sub || payload.user_id || payload.id;
      } catch (error) {
        console.warn('Could not extract userId from JWT');
      }
    }

    if (!userId) {
      throw new Error('USER_ID is required for E2E tests');
    }

    let workspaceId = this.config.workspaceId;
    let sessionId = this.config.sessionId;

    // Create workspace if not provided
    if (!workspaceId) {
      console.log('🏗️ Creating workspace for E2E tests...');
      const workspaceResponse = await this.httpRequest('POST', '/workspaces', {
        name: `E2E Test Workspace ${Date.now()}`,
      });

      if (workspaceResponse.status !== 201) {
        throw new Error(`Failed to create workspace: ${workspaceResponse.status}`);
      }

      workspaceId = workspaceResponse.data.id;
      console.log(`✅ Created workspace: ${workspaceId}`);
    }

    // Create session if not provided
    if (!sessionId && workspaceId) {
      console.log('🏗️ Creating session for E2E tests...');
      const sessionResponse = await this.httpRequest('POST', `/workspaces/${workspaceId}/sessions`, {
        title: `E2E Test Session ${Date.now()}`,
      });

      if (sessionResponse.status !== 201) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }

      sessionId = sessionResponse.data.id;
      console.log(`✅ Created session: ${sessionId}`);
    }

    // Store in process variables for other tests
    process.env.E2E_WORKSPACE_ID = workspaceId;
    process.env.E2E_SESSION_ID = sessionId;
    process.env.E2E_USER_ID = userId;

    return {
      workspaceId: workspaceId!,
      sessionId: sessionId!,
      userId,
    };
  }
}
