// Debug Resource API Script
import fetch from 'node-fetch';

// Create a simple test resource that matches the schema
const testResource = {
  title: "Test Resource for Debugging",
  description: "This is a detailed test resource description with sufficient length to pass validation requirements.",
  content: "https://example.com/test-content",
  contentUrl: "https://example.com/test-content-alternative",
  resourceType: "Article",
  featured: false,
  authorId: 1, // Use an ID that exists in the database
  categoryId: 1 // Use a real category ID
};

async function debugResourceAPI() {
  console.log("Starting resource API debugging...");
  
  try {
    // 1. Make direct request to resources endpoint to check the server-side error
    console.log("Making direct POST request to /api/resources...");
    
    // Try both ports since server might be on either
    let port = 5001; // Let's try the second port first since there's a port conflict
    let csrfToken = null;
    
    try {
      console.log(`Trying to connect to server on port ${port}...`);
      
      // First, try to get a simple endpoint to confirm the server is running
      const testResponse = await fetch(`http://localhost:${port}/api/resource-categories`);
      
      if (testResponse.ok) {
        console.log(`Server is running on port ${port}`);
      } else {
        console.log(`Server responded with ${testResponse.status} on port ${port}`);
      }
      
      // Try to get CSRF token
      try {
        console.log('Trying to get CSRF token...');
        const csrfResponse = await fetch(`http://localhost:${port}/api/csrf-token`, {
          credentials: 'include'
        });
        
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
          console.log(`Got CSRF token: ${csrfToken}`);
        } else {
          console.log(`Failed to get CSRF token: ${csrfResponse.status}`);
          // Continue without CSRF token for testing
          console.log('Continuing without CSRF token for testing...');
        }
      } catch (csrfError) {
        console.error('Error getting CSRF token:', csrfError.message);
        // Continue without CSRF token
        console.log('Continuing without CSRF token...');
      }
    } catch (e) {
      console.log(`Error connecting to port ${port}: ${e.message}`);
      port = 5000; // Try the original port
      console.log(`Trying alternate port ${port}...`);
      
      try {
        const testResponse = await fetch(`http://localhost:${port}/api/resource-categories`);
        
        if (testResponse.ok) {
          console.log(`Server is running on port ${port}`);
        } else {
          console.log(`Server responded with ${testResponse.status} on port ${port}`);
        }
      } catch (portError) {
        console.error(`Error connecting to port ${port}: ${portError.message}`);
        console.error('Unable to connect to the server on any port.');
        return;
      }
    }
    
    console.log(`Connected to server on port ${port}`);
    
    // Let's first get a valid CSRF token 
    console.log("Trying to get a valid CSRF token...");
    let validCsrfToken = null;
    
    try {
      // Visit a page first to initialize a session
      await fetch(`http://localhost:${port}/`, {
        credentials: 'include'
      });
      
      // Get CSRF token
      const csrfTokenResponse = await fetch(`http://localhost:${port}/api/csrf-token`, {
        credentials: 'include'
      });
      
      if (csrfTokenResponse.ok) {
        const csrfData = await csrfTokenResponse.json();
        validCsrfToken = csrfData.csrfToken;
        console.log(`Got valid CSRF token: ${validCsrfToken}`);
      } else {
        console.log(`Failed to get valid CSRF token: ${csrfTokenResponse.status}`);
      }
    } catch (err) {
      console.error("Error getting valid CSRF token:", err.message);
    }
    
    // Create authentication bypass scenario since we're in development mode
    // In development mode, the server uses a mock user ID 9999
    testResource.authorId = 9999;
    
    // Then make resource creation request
    console.log("Sending resource data:", JSON.stringify(testResource, null, 2));
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (validCsrfToken) {
      // Use X-CSRF-Token header which matches what the client code uses
      headers['X-CSRF-Token'] = validCsrfToken;
    }
    
    const response = await fetch(`http://localhost:${port}/api/resources`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testResource),
      credentials: 'include'
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get the response body
    let responseBody;
    try {
      responseBody = await response.json();
      console.log("Response JSON:", JSON.stringify(responseBody, null, 2));
    } catch (jsonError) {
      const textBody = await response.text();
      console.log("Response text:", textBody);
    }
    
    if (!response.ok) {
      console.error("Resource creation failed");
    } else {
      console.log("Resource created successfully!");
    }
  } catch (error) {
    console.error("Error during API debug:", error);
  }
  
  console.log("Resource API debugging completed");
}

// Run the debug function
debugResourceAPI().catch(error => {
  console.error("Debug script failed:", error);
});