/**
 * Comprehensive Session and Authentication Test
 * Tests complete user flow including login, profile saving, and job posting
 */

class SessionTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('=== Starting Comprehensive Session Tests ===');
    
    await this.testLogin();
    await this.testCompanyProfileSave();
    await this.testJobPosting();
    await this.testSubscriptionAccess();
    
    this.generateReport();
  }

  async testLogin() {
    console.log('\n1. Testing Login Flow...');
    
    try {
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: 'ldnexus',
          password: 'password123'
        })
      });

      if (loginResponse.ok) {
        const user = await loginResponse.json();
        console.log('✓ Login successful:', user.username, '(Type:', user.userType + ')');
        
        // Test session persistence
        const meResponse = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (meResponse.ok) {
          console.log('✓ Session persisted successfully');
          this.testResults.push({ test: 'Login & Session', status: 'PASS' });
          return user;
        } else {
          console.log('✗ Session not persisted');
          this.testResults.push({ test: 'Login & Session', status: 'FAIL', error: 'Session lost' });
        }
      } else {
        console.log('✗ Login failed:', await loginResponse.text());
        this.testResults.push({ test: 'Login & Session', status: 'FAIL', error: 'Login failed' });
      }
    } catch (error) {
      console.log('✗ Login test error:', error);
      this.testResults.push({ test: 'Login & Session', status: 'ERROR', error: error.message });
    }
    
    return null;
  }

  async testCompanyProfileSave() {
    console.log('\n2. Testing Company Profile Save...');
    
    try {
      const formData = new FormData();
      formData.append('companyName', 'Test Company');
      formData.append('industry', 'Technology');
      formData.append('description', 'A test company for session validation');
      formData.append('website', 'https://testcompany.com');
      formData.append('size', '10-50');
      formData.append('location', 'Dubai, UAE');

      const profileResponse = await fetch('/api/company-profiles', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (profileResponse.ok) {
        console.log('✓ Company profile saved successfully');
        this.testResults.push({ test: 'Company Profile Save', status: 'PASS' });
      } else {
        const errorText = await profileResponse.text();
        console.log('✗ Company profile save failed:', errorText);
        this.testResults.push({ test: 'Company Profile Save', status: 'FAIL', error: errorText });
      }
    } catch (error) {
      console.log('✗ Company profile test error:', error);
      this.testResults.push({ test: 'Company Profile Save', status: 'ERROR', error: error.message });
    }
  }

  async testJobPosting() {
    console.log('\n3. Testing Job Posting...');
    
    try {
      const jobData = {
        title: 'Test L&D Specialist',
        description: 'Test job posting for session validation',
        requirements: 'Test requirements',
        location: 'Dubai, UAE',
        type: 'full-time',
        salaryRange: '5000-8000 AED',
        experience: 'mid-level'
      };

      const jobResponse = await fetch('/api/job-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jobData)
      });

      if (jobResponse.ok) {
        console.log('✓ Job posting created successfully');
        this.testResults.push({ test: 'Job Posting', status: 'PASS' });
      } else {
        const errorText = await jobResponse.text();
        console.log('✗ Job posting failed:', errorText);
        this.testResults.push({ test: 'Job Posting', status: 'FAIL', error: errorText });
      }
    } catch (error) {
      console.log('✗ Job posting test error:', error);
      this.testResults.push({ test: 'Job Posting', status: 'ERROR', error: error.message });
    }
  }

  async testSubscriptionAccess() {
    console.log('\n4. Testing Subscription Access...');
    
    try {
      const subResponse = await fetch('/api/subscription-status', {
        method: 'GET',
        credentials: 'include'
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log('✓ Subscription access working:', subData.tier);
        this.testResults.push({ test: 'Subscription Access', status: 'PASS' });
      } else {
        console.log('✗ Subscription access failed:', subResponse.status);
        this.testResults.push({ test: 'Subscription Access', status: 'FAIL', error: 'Access denied' });
      }
    } catch (error) {
      console.log('✗ Subscription test error:', error);
      this.testResults.push({ test: 'Subscription Access', status: 'ERROR', error: error.message });
    }
  }

  generateReport() {
    console.log('\n=== Test Results Summary ===');
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);
    console.log(`Tests Error: ${errors}`);
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      console.log(`${icon} ${result.test}: ${result.status}${result.error ? ` (${result.error})` : ''}`);
    });
    
    if (passed === this.testResults.length) {
      console.log('\n🎉 All tests passed! Session persistence is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Session persistence may need additional fixes.');
    }
  }
}

// Auto-execute comprehensive test
if (typeof window !== 'undefined') {
  const tester = new SessionTester();
  setTimeout(() => tester.runAllTests(), 3000);
}