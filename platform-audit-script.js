// Comprehensive L&D Nexus Platform Audit Script
// Run this in browser console to test all navigation and functionality

const auditResults = {
  navigation: [],
  forms: [],
  apiEndpoints: [],
  userFlows: [],
  performance: [],
  errors: []
};

console.log('🔍 Starting L&D Nexus Platform Audit...');

// Test Navigation Links
async function testNavigation() {
  console.log('📍 Testing Navigation Links...');
  
  const links = document.querySelectorAll('a[href]');
  const results = [];
  
  for (const link of links) {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    
    if (href.startsWith('http')) {
      // External link
      results.push({
        type: 'external',
        href,
        text,
        status: 'external_link'
      });
    } else if (href === '#' || href === 'javascript:void(0)') {
      // Broken placeholder link
      results.push({
        type: 'broken',
        href,
        text,
        status: 'placeholder_link',
        issue: 'Links to nowhere'
      });
    } else {
      // Internal link
      results.push({
        type: 'internal',
        href,
        text,
        status: 'valid_internal'
      });
    }
  }
  
  auditResults.navigation = results;
  console.log(`✅ Navigation audit complete: ${results.length} links found`);
  
  const brokenLinks = results.filter(r => r.type === 'broken');
  if (brokenLinks.length > 0) {
    console.warn(`⚠️ Found ${brokenLinks.length} broken placeholder links:`, brokenLinks);
  }
}

// Test Forms
async function testForms() {
  console.log('📝 Testing Forms...');
  
  const forms = document.querySelectorAll('form');
  const results = [];
  
  forms.forEach((form, index) => {
    const action = form.getAttribute('action') || 'no-action';
    const method = form.getAttribute('method') || 'GET';
    const inputs = form.querySelectorAll('input, textarea, select').length;
    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]').length;
    
    results.push({
      formIndex: index,
      action,
      method,
      inputCount: inputs,
      submitButtonCount: submitButtons,
      hasValidation: form.querySelectorAll('[required]').length > 0
    });
  });
  
  auditResults.forms = results;
  console.log(`✅ Forms audit complete: ${results.length} forms found`);
}

// Test API Endpoints
async function testAPIEndpoints() {
  console.log('🔌 Testing API Endpoints...');
  
  const endpoints = [
    '/api/me',
    '/api/professional-profiles/featured',
    '/api/job-postings/latest',
    '/api/resources/featured',
    '/api/subscription-plans',
    '/api/pages/careers',
    '/api/pages/privacy',
    '/api/pages/terms'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      results.push({
        endpoint,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      });
    } catch (error) {
      results.push({
        endpoint,
        status: 'ERROR',
        statusText: error.message,
        success: false
      });
    }
  }
  
  auditResults.apiEndpoints = results;
  console.log(`✅ API endpoints audit complete: ${results.length} endpoints tested`);
  
  const failedEndpoints = results.filter(r => !r.success && r.status !== 401);
  if (failedEndpoints.length > 0) {
    console.warn(`⚠️ Failed API endpoints:`, failedEndpoints);
  }
}

// Test User Flows
async function testUserFlows() {
  console.log('👤 Testing User Flows...');
  
  const flows = [];
  
  // Check if login form exists
  const loginForm = document.querySelector('form[action*="login"], form input[type="email"] + input[type="password"]');
  if (loginForm) {
    flows.push({
      flow: 'login',
      available: true,
      elements: loginForm.querySelectorAll('input').length
    });
  }
  
  // Check if registration form exists
  const registerForm = document.querySelector('form[action*="register"], form input[name*="username"], form input[name*="firstName"]');
  if (registerForm) {
    flows.push({
      flow: 'registration',
      available: true,
      elements: registerForm.querySelectorAll('input').length
    });
  }
  
  // Check navigation menu
  const navMenu = document.querySelector('nav, .navbar, [role="navigation"]');
  if (navMenu) {
    flows.push({
      flow: 'navigation',
      available: true,
      menuItems: navMenu.querySelectorAll('a').length
    });
  }
  
  auditResults.userFlows = flows;
  console.log(`✅ User flows audit complete: ${flows.length} flows identified`);
}

// Test Performance
async function testPerformance() {
  console.log('⚡ Testing Performance...');
  
  const results = {
    pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    imageCount: document.querySelectorAll('img').length,
    scriptCount: document.querySelectorAll('script').length,
    stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
    totalElements: document.querySelectorAll('*').length
  };
  
  auditResults.performance = results;
  console.log(`✅ Performance audit complete`);
  
  if (results.pageLoadTime > 3000) {
    console.warn(`⚠️ Slow page load time: ${results.pageLoadTime}ms`);
  }
}

// Check for JavaScript Errors
function checkErrors() {
  console.log('🐛 Checking for JavaScript Errors...');
  
  // Store original console.error
  const originalError = console.error;
  const errors = [];
  
  // Override console.error to capture errors
  console.error = function(...args) {
    errors.push({
      timestamp: new Date().toISOString(),
      message: args.join(' ')
    });
    originalError.apply(console, args);
  };
  
  // Restore after 5 seconds
  setTimeout(() => {
    console.error = originalError;
    auditResults.errors = errors;
    console.log(`✅ Error monitoring complete: ${errors.length} errors captured`);
  }, 5000);
}

// Generate Report
function generateReport() {
  console.log('\n📊 PLATFORM AUDIT REPORT');
  console.log('========================');
  
  console.log('\n🔗 NAVIGATION ANALYSIS:');
  const brokenNav = auditResults.navigation.filter(n => n.type === 'broken');
  const externalNav = auditResults.navigation.filter(n => n.type === 'external');
  const internalNav = auditResults.navigation.filter(n => n.type === 'internal');
  
  console.log(`- Total links: ${auditResults.navigation.length}`);
  console.log(`- Internal links: ${internalNav.length}`);
  console.log(`- External links: ${externalNav.length}`);
  console.log(`- Broken/placeholder links: ${brokenNav.length}`);
  
  if (brokenNav.length > 0) {
    console.log('\n⚠️ BROKEN LINKS FOUND:');
    brokenNav.forEach(link => {
      console.log(`  - "${link.text}" → ${link.href}`);
    });
  }
  
  console.log('\n📝 FORMS ANALYSIS:');
  console.log(`- Total forms: ${auditResults.forms.length}`);
  auditResults.forms.forEach((form, i) => {
    console.log(`  Form ${i + 1}: ${form.inputCount} inputs, method: ${form.method}, validation: ${form.hasValidation}`);
  });
  
  console.log('\n🔌 API ENDPOINTS:');
  auditResults.apiEndpoints.forEach(api => {
    const status = api.success ? '✅' : '❌';
    console.log(`  ${status} ${api.endpoint} (${api.status})`);
  });
  
  console.log('\n⚡ PERFORMANCE METRICS:');
  console.log(`- Page load time: ${auditResults.performance.pageLoadTime}ms`);
  console.log(`- DOM content loaded: ${auditResults.performance.domContentLoaded}ms`);
  console.log(`- Images: ${auditResults.performance.imageCount}`);
  console.log(`- Scripts: ${auditResults.performance.scriptCount}`);
  console.log(`- Total elements: ${auditResults.performance.totalElements}`);
  
  if (auditResults.errors.length > 0) {
    console.log('\n🐛 JAVASCRIPT ERRORS:');
    auditResults.errors.forEach(error => {
      console.log(`  - ${error.timestamp}: ${error.message}`);
    });
  }
  
  console.log('\n📋 RECOMMENDATIONS:');
  
  if (brokenNav.length > 0) {
    console.log('- Fix broken placeholder links in navigation');
  }
  
  if (auditResults.performance.pageLoadTime > 3000) {
    console.log('- Optimize page load time (currently over 3 seconds)');
  }
  
  const failedAPIs = auditResults.apiEndpoints.filter(api => !api.success && api.status !== 401);
  if (failedAPIs.length > 0) {
    console.log('- Fix failed API endpoints');
  }
  
  console.log('\n✅ Audit Complete!');
  console.log('Run individual test functions for detailed analysis:');
  console.log('- testNavigation()');
  console.log('- testForms()');
  console.log('- testAPIEndpoints()');
  console.log('- testUserFlows()');
  console.log('- testPerformance()');
  
  return auditResults;
}

// Run Complete Audit
async function runCompleteAudit() {
  checkErrors();
  await testNavigation();
  await testForms();
  await testAPIEndpoints();
  await testUserFlows();
  await testPerformance();
  
  // Wait for error monitoring to complete
  setTimeout(() => {
    generateReport();
  }, 6000);
}

// Auto-run audit
runCompleteAudit();

// Export functions for manual testing
window.platformAudit = {
  testNavigation,
  testForms,
  testAPIEndpoints,
  testUserFlows,
  testPerformance,
  generateReport,
  runCompleteAudit,
  results: auditResults
};