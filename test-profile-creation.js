// Test script for profile creation and updating

async function testProfileCreation() {
  try {
    // 1. Test professional profile creation
    console.log("Testing professional profile creation...");
    const professionalData = {
      firstName: "Test",
      lastName: "Professional",
      title: "L&D Specialist",
      bio: "This is a test profile for security verification",
      location: "New York, NY",
      ratePerHour: 150,
      yearsExperience: 8,
      userId: 99 // Test user ID
    };

    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('_csrf='))
      ?.split('=')[1];
    
    if (!csrfToken) {
      console.error("CSRF token not found. Make sure you're logged in.");
      return;
    }

    // Traditional fetch - without our secure utility
    const response1 = await fetch("/api/professionals/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(professionalData),
      credentials: "include"
    });

    console.log("Traditional fetch result:", response1.status, response1.ok);

    // 2. Test with our secureFileUpload utility for a file upload
    console.log("Testing file upload with secureFileUpload...");
    
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
    const testFile = new File([blob], "test-profile-pic.gif", { type: 'image/gif' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('firstName', professionalData.firstName);
    formData.append('lastName', professionalData.lastName);
    formData.append('title', professionalData.title);
    formData.append('bio', professionalData.bio);
    formData.append('location', professionalData.location);
    formData.append('ratePerHour', professionalData.ratePerHour);
    formData.append('yearsExperience', professionalData.yearsExperience);
    formData.append('userId', professionalData.userId);
    formData.append('profileImage', testFile);
    
    // Use our secure upload utility function (via the global window object for testing)
    if (typeof window.secureFileUpload !== 'function') {
      console.log("secureFileUpload function not available globally. Using direct fetch instead.");
      
      // Fall back to direct fetch
      const response2 = await fetch("/api/professionals/me", {
        method: "PUT",
        headers: {
          "X-CSRF-Token": csrfToken
        },
        body: formData,
        credentials: "include"
      });
      
      console.log("File upload result:", response2.status, response2.ok);
    } else {
      const response2 = await window.secureFileUpload('PUT', "/api/professionals/me", formData);
      console.log("File upload result:", response2.status, response2.ok);
    }
    
    console.log("Profile tests completed");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Execute the test when script is loaded in browser console
console.log("Profile creation test ready. Run testProfileCreation() to execute tests.");
// testProfileCreation(); // Uncomment to run automatically