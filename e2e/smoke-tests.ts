import { E2ETestClient, TestConfig } from './setup';

/**
 * E2E Smoke Tests Suite
 * Patrones: Microservicios, EDA (Redis Pub/Sub), API Gateway, Observer/Pub-Sub, CQRS-light
 * Estilos: Microservicios, Arquitectura Orientada a Eventos, Cliente-Servidor
 */

const config: TestConfig = {
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:3000',
  jwtToken: process.env.JWT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  boardId: process.env.BOARD_ID || '',
  userId: process.env.USER_ID || '',
  workspaceId: process.env.WORKSPACE_ID || '',
  sessionId: process.env.SESSION_ID || '',
};

interface TestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly httpLatency?: number;
  readonly wsLatency?: number;
  readonly error?: string;
}

class SmokeTestSuite {
  private readonly client: E2ETestClient;
  private readonly results: TestResult[] = [];

  constructor() {
    this.client = new E2ETestClient(config);
  }

  /**
   * A) Boards Tests - CQRS Pattern: Commands → Events
   * EDA: HTTP write → Domain Event → WebSocket broadcast
   */
  async testBoards(): Promise<void> {
    console.log('\n🏗️ Testing Boards (Cards)...');

    // Test: Create Card
    await this.runTest('Create Card', async () => {
      const cardData = {
        content: 'E2E Test Card',
        priority: 'normal' as const,
      };

      const httpResponse = await this.client.httpRequest(
        'POST',
        `/boards/${config.boardId}/cards`,
        cardData
      );

      if (httpResponse.status !== 201) {
        throw new Error(`Expected 201, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'card:created',
        timeout: 3000,
        validator: (payload) => payload.content === cardData.content,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
        cardId: httpResponse.data.id,
      };
    });

    // Test: Move Card (Update)
    const cardId = this.getLastResult()?.cardId;
    if (cardId) {
      await this.runTest('Move Card', async () => {
        const updateData = {
          laneId: config.boardId, // Move to different lane
          position: 1,
        };

        const httpResponse = await this.client.httpRequest(
          'PATCH',
          `/boards/${config.boardId}/cards/${cardId}`,
          updateData
        );

        if (httpResponse.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse.status}`);
        }

        const wsEvent = await this.client.waitForEvent({
          eventName: 'card:moved',
          timeout: 3000,
          validator: (payload) => payload.cardId === cardId,
        });

        return {
          httpLatency: httpResponse.latency,
          wsLatency: wsEvent.latency,
        };
      });

      // Test: Archive Card
      await this.runTest('Archive Card', async () => {
        const httpResponse = await this.client.httpRequest(
          'POST',
          `/boards/${config.boardId}/cards/${cardId}/archive`,
          {}
        );

        if (httpResponse.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse.status}`);
        }

        const wsEvent = await this.client.waitForEvent({
          eventName: 'card:archived',
          timeout: 3000,
          validator: (payload) => payload.cardId === cardId,
        });

        return {
          httpLatency: httpResponse.latency,
          wsLatency: wsEvent.latency,
        };
      });
    }
  }

  /**
   * B) Comments/Votes Tests - EDA Pattern
   */
  async testCommentsVotes(): Promise<void> {
    console.log('\n💬 Testing Comments & Votes...');

    const cardId = this.getLastResult()?.cardId;
    if (!cardId) {
      console.log('⚠️ Skipping Comments/Votes - no cardId available');
      return;
    }

    // Test: Add Comment
    await this.runTest('Add Comment', async () => {
      const commentData = {
        content: 'E2E Test Comment',
      };

      const httpResponse = await this.client.httpRequest(
        'POST',
        `/boards/${config.boardId}/cards/${cardId}/comments`,
        commentData
      );

      if (httpResponse.status !== 201) {
        throw new Error(`Expected 201, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'comment:added',
        timeout: 3000,
        validator: (payload) => payload.content === commentData.content,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
        commentId: httpResponse.data.id,
      };
    });

    // Test: Cast Vote
    await this.runTest('Cast Vote', async () => {
      const httpResponse = await this.client.httpRequest(
        'POST',
        `/boards/${config.boardId}/cards/${cardId}/votes`,
        {}
      );

      if (httpResponse.status !== 201) {
        throw new Error(`Expected 201, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'vote:cast',
        timeout: 3000,
        validator: (payload) => payload.cardId === cardId,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
        voteId: httpResponse.data.id,
      };
    });

    // Test: Remove Vote
    const voteId = this.getLastResult()?.voteId;
    if (voteId) {
      await this.runTest('Remove Vote', async () => {
        const httpResponse = await this.client.httpRequest(
          'DELETE',
          `/boards/${config.boardId}/cards/${cardId}/votes/${voteId}`,
          {}
        );

        if (httpResponse.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse.status}`);
        }

        const wsEvent = await this.client.waitForEvent({
          eventName: 'vote:removed',
          timeout: 3000,
          validator: (payload) => payload.voteId === voteId,
        });

        return {
          httpLatency: httpResponse.latency,
          wsLatency: wsEvent.latency,
        };
      });
    }
  }

  /**
   * C) Tags/Assignees Tests - Idempotencia Pattern
   */
  async testTagsAssignees(): Promise<void> {
    console.log('\n🏷️ Testing Tags & Assignees...');

    const cardId = this.getLastResult()?.cardId;
    if (!cardId) {
      console.log('⚠️ Skipping Tags/Assignees - no cardId available');
      return;
    }

    // Test: Create Tag
    await this.runTest('Create Tag', async () => {
      const tagData = {
        name: 'E2E-Test-Tag',
        color: '#FF5733',
      };

      const httpResponse = await this.client.httpRequest(
        'POST',
        `/boards/${config.boardId}/tags`,
        tagData
      );

      if (httpResponse.status !== 201) {
        throw new Error(`Expected 201, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'tag:created',
        timeout: 3000,
        validator: (payload) => payload.name === tagData.name,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
        tagId: httpResponse.data.id,
      };
    });

    // Test: Assign Tag (with Idempotencia)
    const tagId = this.getLastResult()?.tagId;
    if (tagId) {
      await this.runTest('Assign Tag (Idempotent)', async () => {
        const startTime = Date.now();

        // Primera asignación
        const httpResponse1 = await this.client.httpRequest(
          'POST',
          `/boards/${config.boardId}/cards/${cardId}/tags/${tagId}`,
          {}
        );

        if (httpResponse1.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse1.status}`);
        }

        const wsEvent1 = await this.client.waitForEvent({
          eventName: 'tag:assigned',
          timeout: 3000,
          validator: (payload) => payload.tagId === tagId,
        });

        // Segunda asignación (idempotente)
        const httpResponse2 = await this.client.httpRequest(
          'POST',
          `/boards/${config.boardId}/cards/${cardId}/tags/${tagId}`,
          {}
        );

        if (httpResponse2.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse2.status}`);
        }

        // Verificar idempotencia: solo 1 evento
        await new Promise(resolve => setTimeout(resolve, 1000));
        const eventCount = this.client.getEventCount('tag:assigned', startTime);

        if (eventCount !== 1) {
          throw new Error(`Expected 1 event, got ${eventCount} (idempotencia failed)`);
        }

        return {
          httpLatency: httpResponse1.latency,
          wsLatency: wsEvent1.latency,
          idempotent: true,
        };
      });

      // Test: Unassign Tag
      await this.runTest('Unassign Tag', async () => {
        const httpResponse = await this.client.httpRequest(
          'DELETE',
          `/boards/${config.boardId}/cards/${cardId}/tags/${tagId}`,
          {}
        );

        if (httpResponse.status !== 200) {
          throw new Error(`Expected 200, got ${httpResponse.status}`);
        }

        const wsEvent = await this.client.waitForEvent({
          eventName: 'tag:unassigned',
          timeout: 3000,
          validator: (payload) => payload.tagId === tagId,
        });

        return {
          httpLatency: httpResponse.latency,
          wsLatency: wsEvent.latency,
        };
      });
    }

    // Test: Add Assignee
    await this.runTest('Add Assignee', async () => {
      const httpResponse = await this.client.httpRequest(
        'POST',
        `/boards/${config.boardId}/cards/${cardId}/assignees/${config.userId}`,
        {}
      );

      if (httpResponse.status !== 200) {
        throw new Error(`Expected 200, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'assignee:added',
        timeout: 3000,
        validator: (payload) => payload.userId === config.userId,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
      };
    });

    // Test: Remove Assignee
    await this.runTest('Remove Assignee', async () => {
      const httpResponse = await this.client.httpRequest(
        'DELETE',
        `/boards/${config.boardId}/cards/${cardId}/assignees/${config.userId}`,
        {}
      );

      if (httpResponse.status !== 200) {
        throw new Error(`Expected 200, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'assignee:removed',
        timeout: 3000,
        validator: (payload) => payload.userId === config.userId,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
      };
    });
  }

  /**
   * D) Sessions/Presence Tests - Microservicios Pattern
   */
  async testSessionsPresence(): Promise<void> {
    console.log('\n🏢 Testing Sessions & Presence...');

    // Test: Create Workspace
    await this.runTest('Create Workspace', async () => {
      const workspaceData = {
        name: 'E2E Test Workspace',
      };

      const httpResponse = await this.client.httpRequest(
        'POST',
        '/workspaces',
        workspaceData
      );

      if (httpResponse.status !== 201) {
        throw new Error(`Expected 201, got ${httpResponse.status}`);
      }

      const wsEvent = await this.client.waitForEvent({
        eventName: 'workspace:created',
        timeout: 3000,
        validator: (payload) => payload.name === workspaceData.name,
      });

      return {
        httpLatency: httpResponse.latency,
        wsLatency: wsEvent.latency,
        workspaceId: httpResponse.data.id,
      };
    });

    // Test: Create Session
    const workspaceId = this.getLastResult()?.workspaceId;
    if (workspaceId) {
      await this.runTest('Create Session', async () => {
        const sessionData = {
          title: 'E2E Test Session',
        };

        const httpResponse = await this.client.httpRequest(
          'POST',
          `/workspaces/${workspaceId}/sessions`,
          sessionData
        );

        if (httpResponse.status !== 201) {
          throw new Error(`Expected 201, got ${httpResponse.status}`);
        }

        const wsEvent = await this.client.waitForEvent({
          eventName: 'session:created',
          timeout: 3000,
          validator: (payload) => payload.title === sessionData.title,
        });

        return {
          httpLatency: httpResponse.latency,
          wsLatency: wsEvent.latency,
          sessionId: httpResponse.data.id,
        };
      });

      // Test: Join Session (with Idempotencia)
      const sessionId = this.getLastResult()?.sessionId;
      if (sessionId) {
        await this.runTest('Join Session (Idempotent)', async () => {
          const startTime = Date.now();

          // Primera unión
          const httpResponse1 = await this.client.httpRequest(
            'POST',
            `/sessions/${sessionId}/join`,
            {}
          );

          if (httpResponse1.status !== 200) {
            throw new Error(`Expected 200, got ${httpResponse1.status}`);
          }

          const wsEvent1 = await this.client.waitForEvent({
            eventName: 'session:user_joined',
            timeout: 3000,
            validator: (payload) => payload.sessionId === sessionId,
          });

          // Segunda unión (idempotente)
          const httpResponse2 = await this.client.httpRequest(
            'POST',
            `/sessions/${sessionId}/join`,
            {}
          );

          if (httpResponse2.status !== 200) {
            throw new Error(`Expected 200, got ${httpResponse2.status}`);
          }

          // Verificar idempotencia: solo 1 evento
          await new Promise(resolve => setTimeout(resolve, 1000));
          const eventCount = this.client.getEventCount('session:user_joined', startTime);

          if (eventCount !== 1) {
            throw new Error(`Expected 1 event, got ${eventCount} (idempotencia failed)`);
          }

          return {
            httpLatency: httpResponse1.latency,
            wsLatency: wsEvent1.latency,
            idempotent: true,
          };
        });

        // Test: Get Presence
        await this.runTest('Get Presence', async () => {
          const httpResponse = await this.client.httpRequest(
            'GET',
            `/sessions/${sessionId}/presence`,
            undefined
          );

          if (httpResponse.status !== 200) {
            throw new Error(`Expected 200, got ${httpResponse.status}`);
          }

          const users = httpResponse.data.users;
          if (!Array.isArray(users) || !users.includes(config.userId)) {
            throw new Error('Current user not found in presence');
          }

          return {
            httpLatency: httpResponse.latency,
            presenceCount: users.length,
          };
        });

        // Test: Leave Session
        await this.runTest('Leave Session', async () => {
          const httpResponse = await this.client.httpRequest(
            'POST',
            `/sessions/${sessionId}/leave`,
            {}
          );

          if (httpResponse.status !== 200) {
            throw new Error(`Expected 200, got ${httpResponse.status}`);
          }

          const wsEvent = await this.client.waitForEvent({
            eventName: 'session:user_left',
            timeout: 3000,
            validator: (payload) => payload.sessionId === sessionId,
          });

          return {
            httpLatency: httpResponse.latency,
            wsLatency: wsEvent.latency,
          };
        });
      }
    }
  }

  /**
   * Test Runner Helper
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    try {
      this.client.clearEvents();
      const result = await testFn();
      
      this.results.push({
        name,
        passed: true,
        httpLatency: result.httpLatency,
        wsLatency: result.wsLatency,
        ...result,
      });

      console.log(`✅ ${name} - HTTP: ${result.httpLatency}ms, WS: ${result.wsLatency || 'N/A'}ms`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${name} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getLastResult(): any {
    const lastResult = this.results[this.results.length - 1];
    return lastResult?.passed ? lastResult : null;
  }

  /**
   * Main Test Runner
   */
  async run(): Promise<void> {
    console.log('🚀 Starting E2E Smoke Tests...');
    console.log(`Gateway: ${config.gatewayUrl}`);
    console.log(`Board: ${config.boardId}`);
    console.log(`Workspace: ${config.workspaceId}`);

    try {
      // Setup WebSocket connection
      await this.client.connectWebSocket({
        boardId: config.boardId,
        workspaceId: config.workspaceId,
      });

      // Run test suites
      await this.testBoards();
      await this.testCommentsVotes();
      await this.testTagsAssignees();
      await this.testSessionsPresence();

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
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const latency = result.httpLatency ? ` (${result.httpLatency}ms)` : '';
      console.log(`${status} ${result.name}${latency}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('=' .repeat(60));
    console.log(`Results: ${passed}/${total} tests passed`);

    if (passed !== total) {
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new SmokeTestSuite();
  suite.run().catch(console.error);
}

export { SmokeTestSuite };
