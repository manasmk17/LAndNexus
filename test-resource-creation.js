// Test Resource Creation Script
import fetch from 'node-fetch';

async function testResourceCreation() {
  console.log("Starting resource creation tests...");
  
  // Sample resources of different types
  const resources = [
    {
      title: "Effective Leadership Development Course",
      description: "A comprehensive course covering leadership principles, communication strategies, and team-building exercises for emerging leaders in organizations of all sizes.",
      content: "https://example.com/leadership-course",
      resourceType: "Course",
      contentUrl: "https://example.com/leadership-course-access",
      featured: false,
      authorId: 1, // Make sure this is a valid user ID
      categoryId: 1
    },
    {
      title: "Onboarding Best Practices Video Tutorial",
      description: "This video tutorial demonstrates innovative onboarding techniques that improve employee engagement and reduce time-to-productivity.",
      content: "https://example.com/onboarding-video",
      resourceType: "Video",
      contentUrl: "https://example.com/onboarding-video-access",
      featured: false,
      authorId: 1,
      categoryId: 2
    },
    {
      title: "Remote Training Strategies E-Book",
      description: "A detailed guide to implementing and optimizing remote training programs, including technology recommendations and engagement techniques.",
      content: "https://example.com/remote-training-ebook",
      resourceType: "E-Book",
      contentUrl: "https://example.com/ebook-download",
      featured: false,
      authorId: 1,
      categoryId: 3
    },
    {
      title: "Performance Evaluation Templates",
      description: "Customizable templates for conducting comprehensive performance evaluations that focus on growth and development.",
      content: "https://example.com/evaluation-templates",
      resourceType: "Template",
      contentUrl: "https://example.com/templates-download",
      featured: false,
      authorId: 1,
      categoryId: 1
    },
    {
      title: "Diversity and Inclusion Webinar Series",
      description: "A recorded webinar series featuring experts discussing strategies for creating more inclusive workplace environments.",
      content: "https://example.com/diversity-webinar",
      resourceType: "Webinar",
      contentUrl: "https://example.com/webinar-access",
      featured: false,
      authorId: 1,
      categoryId: 2
    },
    {
      title: "Learning Management System Implementation Guide",
      description: "A step-by-step article on how to select, implement, and optimize a learning management system for organizations of any size.",
      content: "https://example.com/lms-guide",
      resourceType: "Article",
      contentUrl: "https://example.com/article-access",
      featured: false,
      authorId: 1,
      categoryId: 3
    }
  ];

  // Get a CSRF token first
  let csrfResponse;
  try {
    // Try both ports since the server might be running on either 5000 or 5001
    let port = 5000;
    try {
      csrfResponse = await fetch(`http://localhost:${port}/api/csrf-token`, {
        credentials: 'include'
      });
    } catch (e) {
      console.log("Trying alternate port 5001...");
      port = 5001;
      csrfResponse = await fetch(`http://localhost:${port}/api/csrf-token`, {
        credentials: 'include'
      });
    }
    
    if (!csrfResponse.ok) {
      throw new Error(`CSRF token request failed: ${csrfResponse.status}`);
    }
    
    console.log(`Successfully connected to server on port ${port}`);
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return;
  }
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  console.log(`Got CSRF token: ${csrfToken}`);
  
  // Process each resource
  for (const resource of resources) {
    try {
      console.log(`Creating resource: ${resource.title} (${resource.resourceType})`);
      
      // Use the port that worked for getting the CSRF token
      const port = csrfResponse.url.includes('5001') ? 5001 : 5000;
      const response = await fetch(`http://localhost:${port}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify(resource),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to create resource: ${response.status} ${response.statusText}`);
        console.error(`Error details: ${errorBody}`);
        continue;
      }
      
      const createdResource = await response.json();
      console.log(`Successfully created resource: ${createdResource.id} - ${createdResource.title}`);
    } catch (error) {
      console.error(`Error creating resource "${resource.title}":`, error);
    }
  }
  
  console.log("Resource creation tests completed!");
}

testResourceCreation().catch(error => {
  console.error("Test failed:", error);
});