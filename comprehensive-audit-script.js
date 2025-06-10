/**
 * Comprehensive L&D Nexus Platform Audit Script
 * Tests all features, user flows, and functionality across the entire platform
 */

const AUDIT_CONFIG = {
  baseUrl: window.location.origin,
  timeout: 10000,
  retryCount: 3,
  testUsers: {
    professional: { username: 'ldnexus', password: 'password123' },
    company: { username: 'techcorp', password: 'password123' },
    admin: { username: 'admin', password: 'admin123' }
  }
};

class PlatformAuditor {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      performance: {},
      brokenLinks: [],
      missingImages: [],
      apiErrors: [],
      userFlowIssues: []
    };
    this.startTime = Date.now();
  }

  async runComprehensiveAudit() {
    console.log('🚀 Starting Comprehensive Platform Audit...');
    
    try {
      // Core Infrastructure Tests
      await this.testCoreInfrastructure();
      
      // Navigation and UI Tests
      await this.testNavigationAndUI();
      
      // Authentication System Tests
      await this.testAuthenticationSystem();
      
      // User Role Specific Tests
      await this.testProfessionalUserFlow();
      await this.testCompanyUserFlow();
      await this.testAdminUserFlow();
      
      // Feature-Specific Tests
      await this.testSubscriptionSystem();
      await this.testJobPostingAndApplications();
      await this.testMessagingSystem();
      await this.testConsultationBooking();
      await this.testAIMatching();
      await this.testResourceManagement();
      
      // Performance and Technical Tests
      await this.testPerformanceMetrics();
      await this.testAPIEndpoints();
      await this.testResponsiveness();
      
      // Security and Data Integrity Tests
      await this.testSecurityFeatures();
      await this.testDataIntegrity();
      
    } catch (error) {
      this.logError('Critical audit failure', error);
    }
    
    this.generateComprehensiveReport();
  }

  // =================== CORE INFRASTRUCTURE TESTS ===================

  async testCoreInfrastructure() {
    console.log('📋 Testing Core Infrastructure...');
    
    // Test page loading
    await this.testPageLoading();
    
    // Test static assets
    await this.testStaticAssets();
    
    // Test console errors
    this.checkConsoleErrors();
    
    // Test basic connectivity
    await this.testBasicConnectivity();
  }

  async testPageLoading() {
    const pages = [
      '/',
      '/login',
      '/register',
      '/subscribe',
      '/jobs',
      '/professionals',
      '/resources',
      '/about',
      '/contact'
    ];
    
    for (const page of pages) {
      try {
        const startTime = performance.now();
        await this.navigateToPage(page);
        const loadTime = performance.now() - startTime;
        
        this.results.performance[page] = loadTime;
        
        if (loadTime > 3000) {
          this.logWarning(`Slow page load: ${page} took ${loadTime.toFixed(2)}ms`);
        }
        
        this.incrementTest(true);
      } catch (error) {
        this.logError(`Failed to load page: ${page}`, error);
        this.incrementTest(false);
      }
    }
  }

  async testStaticAssets() {
    const images = document.querySelectorAll('img');
    const links = document.querySelectorAll('a[href]');
    
    // Test images
    for (const img of images) {
      if (img.src && !img.complete) {
        this.results.missingImages.push(img.src);
        this.logWarning(`Broken image: ${img.src}`);
      }
    }
    
    // Test internal links
    for (const link of links) {
      if (link.href.startsWith(window.location.origin)) {
        try {
          const response = await fetch(link.href, { method: 'HEAD' });
          if (!response.ok) {
            this.results.brokenLinks.push({
              url: link.href,
              status: response.status,
              text: link.textContent
            });
            this.logError(`Broken link: ${link.href} (${response.status})`);
          }
        } catch (error) {
          this.results.brokenLinks.push({
            url: link.href,
            error: error.message,
            text: link.textContent
          });
        }
      }
    }
  }

  checkConsoleErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      this.results.errors.push({
        type: 'console.error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.results.warnings++;
      originalWarn.apply(console, args);
    };
  }

  // =================== NAVIGATION AND UI TESTS ===================

  async testNavigationAndUI() {
    console.log('🧭 Testing Navigation and UI Components...');
    
    await this.testMainNavigation();
    await this.testMobileNavigation();
    await this.testFooterLinks();
    await this.testUIComponents();
  }

  async testMainNavigation() {
    const navItems = [
      { text: 'Home', expectedUrl: '/' },
      { text: 'Jobs', expectedUrl: '/jobs' },
      { text: 'Professionals', expectedUrl: '/professionals' },
      { text: 'Resources', expectedUrl: '/resources' },
      { text: 'Subscribe', expectedUrl: '/subscribe' }
    ];
    
    for (const item of navItems) {
      try {
        const navLink = document.querySelector(`nav a[href*="${item.expectedUrl}"]`);
        if (navLink) {
          navLink.click();
          await this.wait(1000);
          
          if (window.location.pathname === item.expectedUrl) {
            this.incrementTest(true);
          } else {
            this.logError(`Navigation failed: ${item.text} didn't navigate to ${item.expectedUrl}`);
            this.incrementTest(false);
          }
        } else {
          this.logError(`Navigation link not found: ${item.text}`);
          this.incrementTest(false);
        }
      } catch (error) {
        this.logError(`Navigation error for ${item.text}`, error);
        this.incrementTest(false);
      }
    }
  }

  async testMobileNavigation() {
    // Simulate mobile viewport
    const originalWidth = window.innerWidth;
    window.resizeTo(375, 667);
    
    try {
      const hamburgerButton = document.querySelector('[data-mobile-menu-button]') || 
                             document.querySelector('.mobile-menu-button') ||
                             document.querySelector('button[aria-label*="menu"]');
      
      if (hamburgerButton) {
        hamburgerButton.click();
        await this.wait(500);
        
        const mobileMenu = document.querySelector('[data-mobile-menu]') || 
                          document.querySelector('.mobile-menu');
        
        if (mobileMenu && window.getComputedStyle(mobileMenu).display !== 'none') {
          this.incrementTest(true);
        } else {
          this.logError('Mobile menu not visible after hamburger click');
          this.incrementTest(false);
        }
      } else {
        this.logWarning('Mobile menu button not found');
      }
    } finally {
      window.resizeTo(originalWidth, window.innerHeight);
    }
  }

  async testUIComponents() {
    // Test buttons
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (!button.disabled && button.textContent.trim()) {
        try {
          const rect = button.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            this.incrementTest(true);
          } else {
            this.logWarning(`Button not visible: ${button.textContent}`);
          }
        } catch (error) {
          this.logError(`Button test failed: ${button.textContent}`, error);
          this.incrementTest(false);
        }
      }
    }
    
    // Test forms
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      const requiredFields = form.querySelectorAll('[required]');
      const submitButton = form.querySelector('button[type="submit"]') || 
                          form.querySelector('input[type="submit"]');
      
      if (submitButton && requiredFields.length > 0) {
        this.incrementTest(true);
      } else if (submitButton) {
        this.logWarning('Form found without required fields');
      }
    }
  }

  // =================== AUTHENTICATION SYSTEM TESTS ===================

  async testAuthenticationSystem() {
    console.log('🔐 Testing Authentication System...');
    
    await this.testLoginFunctionality();
    await this.testRegistrationFunctionality();
    await this.testLogoutFunctionality();
    await this.testSessionPersistence();
    await this.testPasswordRecovery();
  }

  async testLoginFunctionality() {
    for (const [role, credentials] of Object.entries(AUDIT_CONFIG.testUsers)) {
      try {
        await this.navigateToPage('/login');
        await this.wait(1000);
        
        const usernameField = document.querySelector('input[name="username"]') || 
                             document.querySelector('input[type="email"]');
        const passwordField = document.querySelector('input[name="password"]') || 
                             document.querySelector('input[type="password"]');
        const submitButton = document.querySelector('button[type="submit"]') || 
                           document.querySelector('input[type="submit"]');
        
        if (usernameField && passwordField && submitButton) {
          usernameField.value = credentials.username;
          passwordField.value = credentials.password;
          
          submitButton.click();
          await this.wait(3000);
          
          // Check if redirected away from login page
          if (window.location.pathname !== '/login') {
            this.incrementTest(true);
            console.log(`✅ Login successful for ${role}`);
            
            // Test logout for next iteration
            await this.performLogout();
          } else {
            this.logError(`Login failed for ${role}`);
            this.incrementTest(false);
          }
        } else {
          this.logError(`Login form elements missing for ${role} test`);
          this.incrementTest(false);
        }
      } catch (error) {
        this.logError(`Login test failed for ${role}`, error);
        this.incrementTest(false);
      }
    }
  }

  async testRegistrationFunctionality() {
    try {
      await this.navigateToPage('/register');
      await this.wait(1000);
      
      const form = document.querySelector('form');
      if (form) {
        const fields = {
          username: document.querySelector('input[name="username"]'),
          email: document.querySelector('input[name="email"]'),
          password: document.querySelector('input[name="password"]'),
          firstName: document.querySelector('input[name="firstName"]'),
          lastName: document.querySelector('input[name="lastName"]')
        };
        
        const missingFields = Object.entries(fields)
          .filter(([name, field]) => !field)
          .map(([name]) => name);
        
        if (missingFields.length === 0) {
          this.incrementTest(true);
          console.log('✅ Registration form structure valid');
        } else {
          this.logError(`Registration form missing fields: ${missingFields.join(', ')}`);
          this.incrementTest(false);
        }
      } else {
        this.logError('Registration form not found');
        this.incrementTest(false);
      }
    } catch (error) {
      this.logError('Registration test failed', error);
      this.incrementTest(false);
    }
  }

  async performLogout() {
    const logoutButton = document.querySelector('button[data-logout]') || 
                        document.querySelector('a[href*="logout"]') ||
                        document.querySelector('button:contains("Logout")');
    
    if (logoutButton) {
      logoutButton.click();
      await this.wait(2000);
    }
  }

  // =================== USER FLOW TESTS ===================

  async testProfessionalUserFlow() {
    console.log('👨‍💼 Testing Professional User Flow...');
    
    await this.loginAsUser('professional');
    
    // Test dashboard access
    await this.testDashboardAccess('/dashboard');
    
    // Test profile management
    await this.testProfileManagement();
    
    // Test job search and applications
    await this.testJobSearchAndApplications();
    
    // Test messaging
    await this.testMessagingFeatures();
    
    await this.performLogout();
  }

  async testCompanyUserFlow() {
    console.log('🏢 Testing Company User Flow...');
    
    await this.loginAsUser('company');
    
    // Test company dashboard
    await this.testDashboardAccess('/dashboard');
    
    // Test job posting
    await this.testJobPosting();
    
    // Test candidate management
    await this.testCandidateManagement();
    
    // Test consultation booking
    await this.testConsultationManagement();
    
    await this.performLogout();
  }

  async testAdminUserFlow() {
    console.log('⚙️ Testing Admin User Flow...');
    
    await this.loginAsUser('admin');
    
    // Test admin dashboard
    await this.testDashboardAccess('/admin');
    
    // Test user management
    await this.testUserManagement();
    
    // Test platform analytics
    await this.testPlatformAnalytics();
    
    await this.performLogout();
  }

  // =================== FEATURE-SPECIFIC TESTS ===================

  async testSubscriptionSystem() {
    console.log('💳 Testing Subscription System...');
    
    try {
      await this.navigateToPage('/subscribe');
      await this.wait(2000);
      
      // Test plan display
      const plans = document.querySelectorAll('[data-plan]') || 
                   document.querySelectorAll('.subscription-plan');
      
      if (plans.length > 0) {
        this.incrementTest(true);
        console.log(`✅ Found ${plans.length} subscription plans`);
        
        // Test plan selection
        for (const plan of plans) {
          const subscribeButton = plan.querySelector('button') || 
                                 plan.querySelector('a[href*="subscribe"]');
          
          if (subscribeButton) {
            this.incrementTest(true);
          } else {
            this.logWarning('Subscription plan missing subscribe button');
          }
        }
      } else {
        this.logError('No subscription plans found');
        this.incrementTest(false);
      }
      
      // Test payment integration
      await this.testPaymentIntegration();
      
    } catch (error) {
      this.logError('Subscription system test failed', error);
      this.incrementTest(false);
    }
  }

  async testPaymentIntegration() {
    // Note: This tests the integration setup, not actual payments
    try {
      const stripeElements = document.querySelectorAll('[data-stripe]') ||
                           document.querySelectorAll('.StripeElement');
      
      if (stripeElements.length > 0) {
        this.incrementTest(true);
        console.log('✅ Stripe payment elements detected');
      } else {
        this.logWarning('Stripe payment elements not found (may not be loaded yet)');
      }
    } catch (error) {
      this.logError('Payment integration test failed', error);
    }
  }

  async testJobPostingAndApplications() {
    console.log('💼 Testing Job System...');
    
    try {
      await this.navigateToPage('/jobs');
      await this.wait(2000);
      
      const jobListings = document.querySelectorAll('[data-job]') || 
                         document.querySelectorAll('.job-card');
      
      if (jobListings.length > 0) {
        this.incrementTest(true);
        console.log(`✅ Found ${jobListings.length} job listings`);
        
        // Test job detail view
        const firstJob = jobListings[0];
        const detailLink = firstJob.querySelector('a') || 
                          firstJob.querySelector('button');
        
        if (detailLink) {
          detailLink.click();
          await this.wait(2000);
          
          // Check if on job detail page
          const applyButton = document.querySelector('button[data-apply]') ||
                             document.querySelector('button:contains("Apply")');
          
          if (applyButton) {
            this.incrementTest(true);
            console.log('✅ Job application functionality available');
          } else {
            this.logWarning('Job application button not found');
          }
        }
      } else {
        this.logError('No job listings found');
        this.incrementTest(false);
      }
    } catch (error) {
      this.logError('Job system test failed', error);
      this.incrementTest(false);
    }
  }

  async testAIMatching() {
    console.log('🤖 Testing AI Matching System...');
    
    try {
      // Test AI matching endpoint
      const response = await fetch('/api/ai-matching/test', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        this.incrementTest(true);
        console.log('✅ AI matching endpoint accessible');
      } else {
        this.logError(`AI matching endpoint failed: ${response.status}`);
        this.incrementTest(false);
      }
      
      // Test matching interface
      const matchingElements = document.querySelectorAll('[data-ai-match]') ||
                              document.querySelectorAll('.ai-match');
      
      if (matchingElements.length > 0) {
        this.incrementTest(true);
        console.log('✅ AI matching interface elements found');
      } else {
        this.logWarning('AI matching interface elements not found');
      }
      
    } catch (error) {
      this.logError('AI matching test failed', error);
      this.incrementTest(false);
    }
  }

  // =================== API AND PERFORMANCE TESTS ===================

  async testAPIEndpoints() {
    console.log('🔌 Testing API Endpoints...');
    
    const endpoints = [
      { url: '/api/users', method: 'GET', authRequired: true },
      { url: '/api/jobs', method: 'GET', authRequired: false },
      { url: '/api/professionals', method: 'GET', authRequired: false },
      { url: '/api/resources', method: 'GET', authRequired: false },
      { url: '/api/subscription-plans', method: 'GET', authRequired: false },
      { url: '/api/me', method: 'GET', authRequired: true }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          credentials: 'include'
        });
        
        if (endpoint.authRequired && response.status === 401) {
          this.incrementTest(true); // Expected for protected endpoints
        } else if (!endpoint.authRequired && response.ok) {
          this.incrementTest(true);
        } else if (endpoint.authRequired && response.ok) {
          this.incrementTest(true);
        } else {
          this.results.apiErrors.push({
            endpoint: endpoint.url,
            status: response.status,
            expected: endpoint.authRequired ? '200 or 401' : '200'
          });
          this.incrementTest(false);
        }
      } catch (error) {
        this.results.apiErrors.push({
          endpoint: endpoint.url,
          error: error.message
        });
        this.incrementTest(false);
      }
    }
  }

  async testPerformanceMetrics() {
    console.log('⚡ Testing Performance Metrics...');
    
    const performanceData = performance.getEntriesByType('navigation')[0];
    
    this.results.performance.overall = {
      domContentLoaded: performanceData.domContentLoadedEventEnd - performanceData.domContentLoadedEventStart,
      loadComplete: performanceData.loadEventEnd - performanceData.loadEventStart,
      totalPageLoad: performanceData.loadEventEnd - performanceData.fetchStart
    };
    
    // Test critical web vitals
    if ('web-vitals' in window) {
      // This would require the web-vitals library
      console.log('📊 Web vitals testing would require additional library');
    }
    
    // Test memory usage
    if (performance.memory) {
      this.results.performance.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
  }

  // =================== UTILITY METHODS ===================

  async loginAsUser(role) {
    const credentials = AUDIT_CONFIG.testUsers[role];
    if (!credentials) return false;
    
    await this.navigateToPage('/login');
    await this.wait(1000);
    
    const usernameField = document.querySelector('input[name="username"]');
    const passwordField = document.querySelector('input[name="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (usernameField && passwordField && submitButton) {
      usernameField.value = credentials.username;
      passwordField.value = credentials.password;
      submitButton.click();
      await this.wait(3000);
      return window.location.pathname !== '/login';
    }
    return false;
  }

  async navigateToPage(path) {
    if (window.location.pathname !== path) {
      history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      await this.wait(1000);
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  incrementTest(passed) {
    this.results.totalTests++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  logError(message, error = null) {
    this.results.errors.push({
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      stack: error?.stack
    });
    console.error(`❌ ${message}`, error);
  }

  logWarning(message) {
    this.results.warnings++;
    console.warn(`⚠️ ${message}`);
  }

  // =================== REPORT GENERATION ===================

  generateComprehensiveReport() {
    const duration = Date.now() - this.startTime;
    const successRate = (this.results.passed / this.results.totalTests * 100).toFixed(1);
    
    const report = `
🔍 COMPREHENSIVE L&D NEXUS PLATFORM AUDIT REPORT
${'='.repeat(60)}

📊 SUMMARY
- Total Tests: ${this.results.totalTests}
- Passed: ${this.results.passed} (${successRate}%)
- Failed: ${this.results.failed}
- Warnings: ${this.results.warnings}
- Duration: ${(duration / 1000).toFixed(2)} seconds

🚨 CRITICAL ISSUES (${this.results.errors.length})
${this.results.errors.map(error => `- ${error.message}`).join('\n')}

🔗 BROKEN LINKS (${this.results.brokenLinks.length})
${this.results.brokenLinks.map(link => `- ${link.url} (${link.status || link.error})`).join('\n')}

🖼️ MISSING IMAGES (${this.results.missingImages.length})
${this.results.missingImages.map(img => `- ${img}`).join('\n')}

🔌 API ISSUES (${this.results.apiErrors.length})
${this.results.apiErrors.map(api => `- ${api.endpoint}: ${api.status || api.error}`).join('\n')}

⚡ PERFORMANCE METRICS
${Object.entries(this.results.performance).map(([key, value]) => 
  `- ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`
).join('\n')}

💡 RECOMMENDATIONS
${this.generateRecommendations()}

${'='.repeat(60)}
Audit completed at: ${new Date().toISOString()}
    `;
    
    console.log(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.failed > 0) {
      recommendations.push('- Address failed tests to improve platform stability');
    }
    
    if (this.results.brokenLinks.length > 0) {
      recommendations.push('- Fix broken links to improve user experience');
    }
    
    if (this.results.missingImages.length > 0) {
      recommendations.push('- Add missing images or fix image paths');
    }
    
    if (this.results.apiErrors.length > 0) {
      recommendations.push('- Resolve API endpoint issues for full functionality');
    }
    
    if (this.results.warnings > 5) {
      recommendations.push('- Review warnings to prevent potential issues');
    }
    
    // Performance recommendations
    const avgLoadTime = Object.values(this.results.performance)
      .filter(v => typeof v === 'number')
      .reduce((a, b) => a + b, 0) / Object.keys(this.results.performance).length;
    
    if (avgLoadTime > 2000) {
      recommendations.push('- Optimize page load times for better performance');
    }
    
    return recommendations.join('\n') || '- Platform appears to be functioning well overall';
  }
}

// Auto-run audit when script is loaded
if (typeof window !== 'undefined') {
  window.PlatformAuditor = PlatformAuditor;
  
  // Add audit trigger button
  const auditButton = document.createElement('button');
  auditButton.textContent = '🔍 Run Platform Audit';
  auditButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  auditButton.onclick = async () => {
    auditButton.textContent = '🔄 Running Audit...';
    auditButton.disabled = true;
    
    const auditor = new PlatformAuditor();
    await auditor.runComprehensiveAudit();
    
    auditButton.textContent = '✅ Audit Complete';
    setTimeout(() => {
      auditButton.textContent = '🔍 Run Platform Audit';
      auditButton.disabled = false;
    }, 3000);
  };
  
  document.body.appendChild(auditButton);
}