#!/usr/bin/env node

/**
 * Smoke Test - Verificación E2E de la arquitectura de microservicios
 * 
 * Este script verifica:
 * 1. Health check del gateway
 * 2. Conexión WebSocket
 * 3. Creación de card y evento en tiempo real
 * 4. Redis funcionando
 */

const { io } = require('socket.io-client');
const fetch = require('cross-fetch');

const GATEWAY_URL = 'http://localhost:3000';
const BOARD_ID = '550e8400-e29b-41d4-a716-446655440000';

async function runSmokeTest() {
  console.log('🧪 Starting Smoke Test...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${GATEWAY_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: WebSocket Connection
    console.log('\n2️⃣ Testing WebSocket Connection...');
    const socket = io(GATEWAY_URL, {
      query: { boardId: BOARD_ID }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connected:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Test 3: Listen for events
    console.log('\n3️⃣ Listening for real-time events...');
    let eventReceived = false;

    socket.on('card:created', (payload) => {
      console.log('✅ Received card:created event:', payload);
      eventReceived = true;
    });

    // Test 4: Create a card (if you have JWT token)
    const JWT_TOKEN = process.env.JWT_TOKEN;
    if (JWT_TOKEN) {
      console.log('\n4️⃣ Testing Card Creation...');
      
      const cardResponse = await fetch(`${GATEWAY_URL}/boards/${BOARD_ID}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify({
          content: 'Smoke test card',
          priority: 'normal',
          position: 1
        })
      });

      if (cardResponse.ok) {
        const cardData = await cardResponse.json();
        console.log('✅ Card created:', cardData.id);
        
        // Wait for event
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (eventReceived) {
          console.log('✅ Real-time event received!');
        } else {
          console.log('⚠️ No real-time event received (check Redis connection)');
        }
      } else {
        console.log('⚠️ Card creation failed (check JWT token)');
      }
    } else {
      console.log('⚠️ No JWT_TOKEN provided, skipping card creation test');
      console.log('   Set JWT_TOKEN environment variable to test full flow');
    }

    socket.disconnect();
    console.log('\n🎉 Smoke test completed!');
    
  } catch (error) {
    console.error('❌ Smoke test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runSmokeTest();
