/**
 * Session Persistence Test
 * Validates that authentication sessions maintain properly across requests
 */

async function testSessionPersistence() {
  console.log('Testing session persistence...');
  
  const testCredentials = {
    username: 'ldnexus',
    password: 'password123'
  };
  
  try {
    // Step 1: Clear all cookies first
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('1. Cleared existing cookies');
    
    // Step 2: Login and capture session
    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testCredentials)
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return false;
    }
    
    const user = await loginResponse.json();
    console.log('2. Login successful for user:', user.username);
    
    // Step 3: Wait a moment for session to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Test authenticated endpoint
    const meResponse = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('3. Authenticated endpoint working:', meData.username);
      return true;
    } else {
      console.error('4. Authenticated endpoint failed:', meResponse.status);
      return false;
    }
    
  } catch (error) {
    console.error('Session test failed:', error);
    return false;
  }
}

// Auto-execute test
if (typeof window !== 'undefined') {
  setTimeout(testSessionPersistence, 2000);
}