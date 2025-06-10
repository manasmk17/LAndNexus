/**
 * Authentication Test Script
 * Tests login functionality and session persistence
 */

async function testAuthentication() {
  console.log('=== Testing Authentication System ===');
  
  const testCredentials = {
    username: 'ldnexus',
    password: 'password123'
  };
  
  try {
    // Step 1: Test login
    console.log('1. Testing login...');
    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testCredentials)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Login failed:', errorText);
      return false;
    }
    
    const user = await loginResponse.json();
    console.log('✓ Login successful for user:', user.username);
    console.log('✓ User type:', user.userType);
    
    // Step 2: Test authenticated endpoint
    console.log('2. Testing authenticated endpoint...');
    const meResponse = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✓ Authenticated endpoint working for:', meData.username);
    } else {
      console.error('✗ Authenticated endpoint failed:', meResponse.status);
      return false;
    }
    
    // Step 3: Test company profile access (if company user)
    if (user.userType === 'company') {
      console.log('3. Testing company profile access...');
      const profileResponse = await fetch('/api/company-profiles', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        console.log('✓ Company profile access working');
      } else {
        console.error('✗ Company profile access failed:', profileResponse.status);
      }
    }
    
    console.log('=== Authentication Test Complete ===');
    return true;
    
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}

// Auto-execute test
if (typeof window !== 'undefined') {
  setTimeout(testAuthentication, 2000);
}