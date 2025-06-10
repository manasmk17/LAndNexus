/**
 * Job Posting Functionality Test Script
 * Tests the complete flow of creating a job posting
 */

async function testJobPostingFlow() {
  console.log('🔍 Testing Job Posting Functionality...');
  
  const results = {
    authenticationTest: false,
    companyProfileCheck: false,
    jobPostingAPI: false,
    formValidation: false,
    errors: []
  };
  
  try {
    // Test 1: Authentication Check
    console.log('1. Testing authentication for job posting...');
    const authResponse = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (authResponse.ok) {
      const user = await authResponse.json();
      console.log('✅ User authenticated:', user.userType);
      results.authenticationTest = true;
      
      if (user.userType !== 'company') {
        results.errors.push('User must be a company to post jobs');
        console.log('❌ User is not a company type');
      }
    } else {
      results.errors.push('Authentication failed - user not logged in');
      console.log('❌ Authentication failed');
    }
    
    // Test 2: Company Profile Check
    console.log('2. Testing company profile availability...');
    const companyResponse = await fetch('/api/company-profiles/by-user', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (companyResponse.ok) {
      const companyProfile = await companyResponse.json();
      console.log('✅ Company profile found:', companyProfile.companyName);
      results.companyProfileCheck = true;
    } else if (companyResponse.status === 404) {
      results.errors.push('Company profile not found - user must complete company profile first');
      console.log('❌ Company profile not found');
    } else {
      results.errors.push(`Company profile check failed: ${companyResponse.status}`);
      console.log('❌ Company profile check failed');
    }
    
    // Test 3: Job Posting API Test
    console.log('3. Testing job posting API endpoint...');
    const testJobData = {
      title: "Test L&D Specialist Position",
      description: "This is a test job posting for L&D platform testing",
      location: "Remote",
      jobType: "full-time",
      minCompensation: 50000,
      maxCompensation: 70000,
      compensationUnit: "yearly",
      duration: "Permanent",
      requirements: "Training, Development, Communication",
      remote: true,
      featured: false,
      status: "open"
    };
    
    const jobResponse = await fetch('/api/job-postings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testJobData)
    });
    
    if (jobResponse.ok) {
      const createdJob = await jobResponse.json();
      console.log('✅ Job posting created successfully:', createdJob.id);
      results.jobPostingAPI = true;
      
      // Clean up test job
      await fetch(`/api/job-postings/${createdJob.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      console.log('🧹 Test job cleaned up');
    } else {
      const errorText = await jobResponse.text();
      results.errors.push(`Job posting failed: ${jobResponse.status} - ${errorText}`);
      console.log('❌ Job posting failed:', jobResponse.status, errorText);
    }
    
    // Test 4: Form Validation
    console.log('4. Testing form validation...');
    const invalidJobData = {
      title: "", // Empty title should fail
      description: "",
      location: ""
    };
    
    const validationResponse = await fetch('/api/job-postings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(invalidJobData)
    });
    
    if (validationResponse.status === 400) {
      console.log('✅ Form validation working correctly');
      results.formValidation = true;
    } else {
      results.errors.push('Form validation not working properly');
      console.log('❌ Form validation failed');
    }
    
    // Test 5: Frontend Form Elements
    console.log('5. Testing frontend form elements...');
    const jobForm = document.querySelector('form[data-job-form]') || 
                   document.querySelector('form') ||
                   document.querySelector('[data-testid="job-form"]');
    
    if (jobForm) {
      const titleInput = jobForm.querySelector('input[name="title"]');
      const descriptionInput = jobForm.querySelector('textarea[name="description"]');
      const submitButton = jobForm.querySelector('button[type="submit"]');
      
      if (titleInput && descriptionInput && submitButton) {
        console.log('✅ Job form elements found');
      } else {
        results.errors.push('Job form missing required elements');
        console.log('❌ Job form elements incomplete');
      }
    } else {
      results.errors.push('Job posting form not found on page');
      console.log('❌ Job form not found');
    }
    
  } catch (error) {
    results.errors.push(`Test execution error: ${error.message}`);
    console.error('❌ Test execution failed:', error);
  }
  
  // Generate Report
  console.log('\n📊 JOB POSTING TEST RESULTS:');
  console.log('================================');
  console.log(`Authentication: ${results.authenticationTest ? '✅' : '❌'}`);
  console.log(`Company Profile: ${results.companyProfileCheck ? '✅' : '❌'}`);
  console.log(`Job Posting API: ${results.jobPostingAPI ? '✅' : '❌'}`);
  console.log(`Form Validation: ${results.formValidation ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 IDENTIFIED ISSUES:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const passedTests = Object.values(results).filter(v => v === true).length;
  const totalTests = 4; // Excluding errors array
  console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Job posting functionality is working correctly!');
  } else {
    console.log('⚠️ Job posting has issues that need to be resolved.');
  }
  
  return results;
}

// Execute test if in browser environment
if (typeof window !== 'undefined') {
  // Add test button for manual execution
  const testButton = document.createElement('button');
  testButton.textContent = '🧪 Test Job Posting';
  testButton.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    z-index: 9999;
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  testButton.onclick = async () => {
    testButton.textContent = '🔄 Testing...';
    testButton.disabled = true;
    
    await testJobPostingFlow();
    
    testButton.textContent = '✅ Test Complete';
    setTimeout(() => {
      testButton.textContent = '🧪 Test Job Posting';
      testButton.disabled = false;
    }, 3000);
  };
  
  document.body.appendChild(testButton);
}