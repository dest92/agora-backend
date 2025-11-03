// Basic HTTP Tests - No WebSocket
const https = require('https');
const http = require('http');

const config = {
  gatewayUrl: 'http://localhost:3000',
  // Mock JWT for testing (sin Supabase real)
  jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzMwNzUwNDAwLCJpYXQiOjE3MzA3NDY4MDAsImlzcyI6Imh0dHBzOi8veW91ci1wcm9qZWN0LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4ODBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTczMDc0NjgwMH1dLCJzZXNzaW9uX2lkIjoiYWJjZGVmZ2gtaWprbC1tbm9wLXFyc3QtdXZ3eHl6MTIzNCJ9.test-signature',
  boardId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '880e8400-e29b-41d4-a716-446655440003'
};

async function httpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.gatewayUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.jwtToken}`
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('json') ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runBasicTests() {
  console.log('🚀 Running Basic HTTP Tests...');
  console.log(`Gateway: ${config.gatewayUrl}`);
  
  const results = [];

  // Test 1: Health Check
  try {
    console.log('\n📊 Testing Health Checks...');
    
    const health = await httpRequest('GET', '/health');
    console.log(`✅ Gateway Health: ${health.status} - ${JSON.stringify(health.data)}`);
    results.push({ test: 'Gateway Health', passed: health.status === 200 });

    const servicesHealth = await httpRequest('GET', '/_services/health');
    console.log(`📋 Services Health: ${servicesHealth.status}`);
    console.log(`   Response: ${JSON.stringify(servicesHealth.data)}`);
    results.push({ test: 'Services Health Matrix', passed: servicesHealth.status === 200 });

  } catch (error) {
    console.log(`❌ Health Check failed: ${error.message}`);
    results.push({ test: 'Health Checks', passed: false, error: error.message });
  }

  // Test 2: Auth Endpoints (sin Supabase real)
  try {
    console.log('\n🔐 Testing Auth Endpoints...');
    
    // Test register (esperamos error por Supabase no configurado)
    const register = await httpRequest('POST', '/auth/register', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log(`📝 Register: ${register.status} - ${register.data?.error || 'OK'}`);
    results.push({ test: 'Auth Register Endpoint', passed: register.status >= 400 }); // Esperamos error

  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
    results.push({ test: 'Auth Endpoints', passed: false, error: error.message });
  }

  // Test 3: Protected Endpoints (sin JWT válido)
  try {
    console.log('\n🏗️ Testing Protected Endpoints...');
    
    // Test workspaces (esperamos 401 sin JWT válido)
    const workspaces = await httpRequest('GET', '/workspaces');
    console.log(`🏢 Workspaces: ${workspaces.status} - ${workspaces.data?.message || 'OK'}`);
    results.push({ test: 'Protected Endpoints', passed: workspaces.status === 401 }); // Esperamos 401

  } catch (error) {
    console.log(`❌ Protected endpoints test failed: ${error.message}`);
    results.push({ test: 'Protected Endpoints', passed: false, error: error.message });
  }

  // Results Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('='.repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All basic tests passed!');
  } else {
    console.log('⚠️ Some tests failed - check configuration');
  }
}

runBasicTests().catch(console.error);
