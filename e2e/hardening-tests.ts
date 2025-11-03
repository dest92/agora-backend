import { E2ETestClient, TestConfig } from './setup';

/**
 * Hardening E2E Tests - Mínimos sin romper contratos
 * Patrones: API Gateway, EDA, Observer/Pub-Sub, Microservicios
 * Estilos: Microservicios, EDA, Cliente-Servidor
 */

const config: TestConfig = {
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:3000',
  jwtToken: process.env.JWT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  boardId: process.env.BOARD_ID,
  userId: process.env.USER_ID,
  workspaceId: process.env.WORKSPACE_ID,
  sessionId: process.env.SESSION_ID,
};

interface TestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly latencyMs?: number;
  readonly error?: string;
}

class HardeningTestSuite {
  private readonly client: E2ETestClient;
  private readonly results: TestResult[] = [];

  constructor() {
    this.client = new E2ETestClient(config);
  }

  /**
   * A) Health Tests
   * API Gateway Pattern: Verificar endpoints de salud
   */
  async testHealth(): Promise<void> {
    console.log('\n🏥 Testing Health Endpoints...');

    // Test: Gateway Health
    await this.runTest('Gateway Health', async () => {
      const response = await this.client.httpRequest('GET', '/health');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      if (response.data.status !== 'ok') {
        throw new Error(`Expected status 'ok', got '${response.data.status}'`);
      }

      return { latencyMs: response.latency };
    });

    // Test: Services Health Matrix
    await this.runTest('Services Health Matrix', async () => {
      const response = await this.client.httpRequest('GET', '/_services/health');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      if (!Array.isArray(response.data.services)) {
        throw new Error('Expected services array in response');
      }

      const allServicesChecked = response.data.services.length >= 3; // boards, collab, sessions
      if (!allServicesChecked) {
        throw new Error(`Expected at least 3 services, got ${response.data.services.length}`);
      }

      return { 
        latencyMs: response.latency,
        servicesCount: response.data.services.length,
      };
    });
  }

  /**
   * B) Auth Enforcement Tests
   * API Gateway Pattern: Verificar protección de endpoints
   */
  async testAuthEnforcement(): Promise<void> {
    console.log('\n🔒 Testing Auth Enforcement...');

    // Test: Protected endpoint without token
    await this.runTest('Protected Endpoint Security', async () => {
      // Remove JWT temporarily
      const originalToken = this.client['config'].jwtToken;
      (this.client as any).config = { ...this.client['config'], jwtToken: '' };

      try {
        const response = await this.client.httpRequest('GET', '/workspaces');
        
        if (response.status !== 401) {
          throw new Error(`Expected 401 Unauthorized, got ${response.status}`);
        }

        return { latencyMs: response.latency };
      } finally {
        // Restore token
        (this.client as any).config = { ...this.client['config'], jwtToken: originalToken };
      }
    });
  }

  /**
   * C) EDA Bridge Test (Smoke)
   * EDA Pattern: Verificar EventBus → WebSocket bridge
   */
  async testEDABridge(): Promise<void> {
    console.log('\n🌉 Testing EDA Bridge (Smoke)...');

    if (!config.jwtToken) {
      console.log('⚠️ Skipping EDA Bridge - no JWT token provided');
      return;
    }

    // Bootstrap workspace/session if needed
    let bootstrap;
    try {
      bootstrap = await this.client.bootstrap();
    } catch (error) {
      console.log('⚠️ Skipping EDA Bridge - bootstrap failed:', error instanceof Error ? error.message : error);
      return;
    }

    // Test: WebSocket connection and event reception
    await this.runTest('EDA Bridge - Session Creation', async () => {
      // Connect WebSocket to workspace room
      await this.client.connectWebSocket({
        workspaceId: bootstrap.workspaceId,
      });

      this.client.clearEvents();

      // Create a new session (should trigger session:created event)
      const sessionResponse = await this.client.httpRequest(
        'POST',
        `/workspaces/${bootstrap.workspaceId}/sessions`,
        { title: `EDA Test Session ${Date.now()}` }
      );

      if (sessionResponse.status !== 201) {
        throw new Error(`Expected 201, got ${sessionResponse.status}`);
      }

      // Wait for WebSocket event
      const wsEvent = await this.client.waitForEvent({
        eventName: 'session:created',
        timeout: 2000, // 2s as specified
        validator: (payload) => payload.workspaceId === bootstrap.workspaceId,
      });

      return {
        latencyMs: sessionResponse.latency,
        wsLatencyMs: wsEvent.latency,
      };
    });
  }

  /**
   * D) Idempotencia Test (Smoke)
   * EDA Pattern: Verificar que eventos no se dupliquen
   */
  async testIdempotencia(): Promise<void> {
    console.log('\n🔄 Testing Idempotencia (Smoke)...');

    if (!config.jwtToken) {
      console.log('⚠️ Skipping Idempotencia - no JWT token provided');
      return;
    }

    // Use existing session or skip
    const sessionId = process.env.E2E_SESSION_ID || config.sessionId;
    if (!sessionId) {
      console.log('⚠️ Skipping Idempotencia - no session ID available');
      return;
    }

    await this.runTest('Idempotencia - Session Join', async () => {
      // Connect WebSocket
      await this.client.connectWebSocket({
        sessionId,
      });

      const startTime = Date.now();
      this.client.clearEvents();

      // First join - should emit event
      const joinResponse1 = await this.client.httpRequest(
        'POST',
        `/sessions/${sessionId}/join`,
        {}
      );

      if (joinResponse1.status !== 200) {
        throw new Error(`First join failed: ${joinResponse1.status}`);
      }

      // Wait for first event
      await this.client.waitForEvent({
        eventName: 'session:user_joined',
        timeout: 1000,
      });

      // Second join - should NOT emit event (idempotent)
      const joinResponse2 = await this.client.httpRequest(
        'POST',
        `/sessions/${sessionId}/join`,
        {}
      );

      if (joinResponse2.status !== 200) {
        throw new Error(`Second join failed: ${joinResponse2.status}`);
      }

      // Wait a bit more and check event count
      await new Promise(resolve => setTimeout(resolve, 500));
      const eventCount = this.client.getEventCount('session:user_joined', startTime);

      if (eventCount !== 1) {
        throw new Error(`Expected 1 event (idempotent), got ${eventCount}`);
      }

      return {
        latencyMs: joinResponse1.latency,
        idempotent: true,
      };
    });
  }

  /**
   * Test Runner Helper
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    try {
      const result = await testFn();
      
      this.results.push({
        name,
        passed: true,
        latencyMs: result.latencyMs,
        ...result,
      });

      const latencyInfo = result.latencyMs ? ` (${result.latencyMs}ms)` : '';
      console.log(`✅ ${name}${latencyInfo}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${name} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Main Test Runner
   */
  async run(): Promise<void> {
    console.log('🔧 Starting Hardening E2E Tests...');
    console.log(`Gateway: ${config.gatewayUrl}`);
    console.log(`Redis: ${config.redisUrl.replace(/\/\/.*@/, '//***@')}`);

    try {
      // Run test suites
      await this.testHealth();
      await this.testAuthEnforcement();
      await this.testEDABridge();
      await this.testIdempotencia();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    } finally {
      await this.client.disconnect();
    }
  }

  private printResults(): void {
    console.log('\n📊 Hardening Test Results:');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const latency = result.latencyMs ? ` (${result.latencyMs}ms)` : '';
      console.log(`${status} ${result.name}${latency}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('=' .repeat(60));
    console.log(`Results: ${passed}/${total} tests passed`);

    // Generate evidence for documentation
    this.generateEvidence();

    if (passed !== total) {
      process.exit(1);
    }
  }

  private generateEvidence(): void {
    const evidence = {
      timestamp: new Date().toISOString(),
      gateway: config.gatewayUrl,
      results: this.results.map(r => ({
        test: r.name,
        passed: r.passed,
        latencyMs: r.latencyMs,
        error: r.error,
      })),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        avgLatency: Math.round(
          this.results
            .filter(r => r.latencyMs)
            .reduce((sum, r) => sum + (r.latencyMs || 0), 0) /
          this.results.filter(r => r.latencyMs).length
        ),
      },
    };

    console.log('\n📋 Evidence Summary:');
    console.log(`Average Latency: ${evidence.summary.avgLatency}ms`);
    console.log(`Success Rate: ${Math.round(evidence.summary.passed / evidence.summary.total * 100)}%`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new HardeningTestSuite();
  suite.run().catch(console.error);
}

export { HardeningTestSuite };
