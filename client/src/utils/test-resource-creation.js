// Test Resource Creation Script for browser console
// Copy and paste this entire script into the browser console on the Create Resource page

async function testCreateResources() {
  console.log("Starting resource creation tests in browser...");
  
  // Sample resources of different types
  const resources = [
    {
      title: "Effective Leadership Development Course",
      description: "A comprehensive course covering leadership principles, communication strategies, and team-building exercises for emerging leaders in organizations of all sizes.",
      content: "https://example.com/leadership-course",
      resourceType: "Course",
      contentUrl: "https://example.com/leadership-course-access",
      featured: false,
    },
    {
      title: "Onboarding Best Practices Video Tutorial",
      description: "This video tutorial demonstrates innovative onboarding techniques that improve employee engagement and reduce time-to-productivity.",
      content: "https://example.com/onboarding-video",
      resourceType: "Video",
      contentUrl: "https://example.com/onboarding-video-access",
      featured: false,
    },
    {
      title: "Remote Training Strategies E-Book",
      description: "A detailed guide to implementing and optimizing remote training programs, including technology recommendations and engagement techniques.",
      content: "https://example.com/remote-training-ebook",
      resourceType: "Ebook",
      contentUrl: "https://example.com/ebook-download",
      featured: false,
    },
    {
      title: "Performance Evaluation Templates",
      description: "Customizable templates for conducting comprehensive performance evaluations that focus on growth and development.",
      content: "https://example.com/evaluation-templates", 
      resourceType: "Template",
      contentUrl: "https://example.com/templates-download",
      featured: false,
    },
    {
      title: "Diversity and Inclusion Webinar Series",
      description: "A recorded webinar series featuring experts discussing strategies for creating more inclusive workplace environments.",
      content: "https://example.com/diversity-webinar",
      resourceType: "Webinar",
      contentUrl: "https://example.com/webinar-access",
      featured: false,
    },
    {
      title: "Learning Management System Implementation Guide",
      description: "A step-by-step article on how to select, implement, and optimize a learning management system for organizations of any size.",
      content: "https://example.com/lms-guide",
      resourceType: "Article",
      contentUrl: "https://example.com/article-access",
      featured: false,
    }
  ];

  // Import needed functions from queryClient
  const { apiRequest, getCsrfToken } = window.require('@/lib/queryClient');
  
  // Process each resource
  for (const resource of resources) {
    try {
      console.log(`Creating resource: ${resource.title} (${resource.resourceType})`);
      
      // Add category ID - assuming category 1 exists
      resource.categoryId = 1;
      
      // Make the API request using the client's built-in CSRF protection
      const response = await apiRequest('POST', '/api/resources', resource);
      
      if (response.ok) {
        const createdResource = await response.json();
        console.log(`Successfully created resource: ${createdResource.id} - ${createdResource.title}`);
      } else {
        const errorBody = await response.text();
        console.error(`Failed to create resource: ${response.status} ${response.statusText}`);
        console.error(`Error details: ${errorBody}`);
      }
    } catch (error) {
      console.error(`Error creating resource "${resource.title}":`, error);
    }
  }
  
  console.log("Resource creation tests completed!");
}

// Provide instructions on how to use this script
console.log(`
====== RESOURCE CREATION TEST SCRIPT ======
Instructions:
1. Navigate to the "Create Resource" page in the application
2. Open the browser developer console (F12 or right-click > Inspect > Console)
3. Call the testCreateResources() function to create test resources
4. Check the console for results
=======================================
`);

// Return the function so it can be called from console
testCreateResources;