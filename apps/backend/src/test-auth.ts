/**
 * Test script for authentication endpoints
 * Run with: npm run dev and then node -r tsx/cjs test-auth.ts
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication Endpoints\n');

    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@demo.com',
      password: 'admin123',
    });

    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.data.user.name);
    console.log('Token:', loginResponse.data.data.token.substring(0, 20) + '...');
    
    const { token, refresh_token } = loginResponse.data.data;

    // Test /me endpoint
    console.log('\n2. Testing /me endpoint...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ /me endpoint successful');
    console.log('User:', meResponse.data.data.name);
    console.log('Role:', meResponse.data.data.role);
    console.log('Tenant:', meResponse.data.data.tenant.name);

    // Test token refresh
    console.log('\n3. Testing token refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token,
    });

    console.log('✅ Token refresh successful');
    console.log('New token:', refreshResponse.data.data.token.substring(0, 20) + '...');

    // Test logout
    console.log('\n4. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {
      refresh_token: refreshResponse.data.data.refresh_token,
    }, {
      headers: {
        Authorization: `Bearer ${refreshResponse.data.data.token}`,
      },
    });

    console.log('✅ Logout successful');
    console.log('Message:', logoutResponse.data.data.message);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAuth();
