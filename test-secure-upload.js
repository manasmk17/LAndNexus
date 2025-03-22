// Test utility for secureFileUpload function
// To be run from the browser console

// Make the secureFileUpload function available globally for testing
async function makeSecureFileUploadGlobal() {
  // Simple implementation matching our utility
  window.secureFileUpload = async function(method, url, formData) {
    // Get CSRF token from cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('_csrf='))
      ?.split('=')[1];
    
    // Build headers with CSRF token only
    const headers = {};
    
    // Add CSRF token
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Make the request
    const res = await fetch(url, {
      method,
      headers,
      body: formData,
      credentials: "include",
    });

    return res;
  };
  
  console.log("secureFileUpload function is now available globally");
}

// Test the professional profile update
async function testProfessionalProfileUpdate() {
  console.log("Testing professional profile update...");
  
  try {
    // Create a test FormData
    const formData = new FormData();
    formData.append('firstName', 'Test');
    formData.append('lastName', 'User');
    formData.append('title', 'Security Tester');
    formData.append('bio', 'This is a test bio to verify security improvements.');
    
    // Create a small test image (1x1 pixel transparent GIF)
    const base64Data = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, {type: 'image/gif'});
    const testFile = new File([blob], "test-image.gif", { type: 'image/gif' });
    formData.append('profileImage', testFile);
    
    // Test with our utility
    const response = await window.secureFileUpload('PUT', '/api/professionals/me', formData);
    
    // Log the result
    if (response.ok) {
      console.log("✅ Profile update succeeded:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
    } else {
      console.error("❌ Profile update failed:", response.status);
      console.error("Error text:", await response.text());
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Test the company profile update
async function testCompanyProfileUpdate() {
  console.log("Testing company profile update...");
  
  try {
    // Create a test FormData
    const formData = new FormData();
    formData.append('companyName', 'Test Company');
    formData.append('industry', 'Technology');
    formData.append('description', 'This is a test company description.');
    formData.append('location', 'New York, NY');
    
    // Get the company profile ID (you would need to be logged in as a company)
    // This is just a placeholder - in reality this would come from the API
    const companyId = 1;
    
    // Test with our utility
    const response = await window.secureFileUpload('PUT', `/api/company-profiles/${companyId}`, formData);
    
    // Log the result
    if (response.ok) {
      console.log("✅ Company profile update succeeded:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
    } else {
      console.error("❌ Company profile update failed:", response.status);
      console.error("Error text:", await response.text());
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Initialize and run tests
async function runSecurityTests() {
  await makeSecureFileUploadGlobal();
  console.log("Security test utilities are ready!");
  console.log("");
  console.log("To test professional profile update: testProfessionalProfileUpdate()");
  console.log("To test company profile update: testCompanyProfileUpdate()");
  console.log("");
  console.log("Note: You must be logged in to run these tests successfully.");
}

// Export test functions
window.runSecurityTests = runSecurityTests;
window.testProfessionalProfileUpdate = testProfessionalProfileUpdate;
window.testCompanyProfileUpdate = testCompanyProfileUpdate;

// Automatically run setup
runSecurityTests();