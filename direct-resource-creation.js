// Direct Resource Creation Script - uses direct database access to bypass authentication
// This script will insert resources directly into the database

import { db } from './server/db.js';
import { resources } from './shared/schema.js';

async function createResourcesDirectly() {
  console.log("Starting direct resource creation...");
  
  // Sample resources of different types
  const resourceData = [
    {
      title: "Effective Leadership Development Course",
      description: "A comprehensive course covering leadership principles, communication strategies, and team-building exercises for emerging leaders in organizations of all sizes.",
      content: "https://example.com/leadership-course",
      resourceType: "Course",
      contentUrl: "https://example.com/leadership-course-access",
      featured: false,
      authorId: 1, // Use an existing user ID
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Onboarding Best Practices Video Tutorial",
      description: "This video tutorial demonstrates innovative onboarding techniques that improve employee engagement and reduce time-to-productivity.",
      content: "https://example.com/onboarding-video",
      resourceType: "Video",
      contentUrl: "https://example.com/onboarding-video-access",
      featured: false,
      authorId: 1,
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Remote Training Strategies E-Book",
      description: "A detailed guide to implementing and optimizing remote training programs, including technology recommendations and engagement techniques.",
      content: "https://example.com/remote-training-ebook",
      resourceType: "Ebook",
      contentUrl: "https://example.com/ebook-download",
      featured: false,
      authorId: 1,
      categoryId: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Performance Evaluation Templates",
      description: "Customizable templates for conducting comprehensive performance evaluations that focus on growth and development.",
      content: "https://example.com/evaluation-templates",
      resourceType: "Template",
      contentUrl: "https://example.com/templates-download",
      featured: false,
      authorId: 1,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Diversity and Inclusion Webinar Series",
      description: "A recorded webinar series featuring experts discussing strategies for creating more inclusive workplace environments.",
      content: "https://example.com/diversity-webinar",
      resourceType: "Webinar",
      contentUrl: "https://example.com/webinar-access",
      featured: false,
      authorId: 1,
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Learning Management System Implementation Guide",
      description: "A step-by-step article on how to select, implement, and optimize a learning management system for organizations of any size.",
      content: "https://example.com/lms-guide",
      resourceType: "Article",
      contentUrl: "https://example.com/article-access",
      featured: false,
      authorId: 1,
      categoryId: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  try {
    // Insert all resources directly into the database
    const createdResources = await db.insert(resources).values(resourceData).returning();
    
    console.log(`Successfully created ${createdResources.length} resources:`);
    createdResources.forEach(resource => {
      console.log(`- ${resource.id}: ${resource.title} (${resource.resourceType})`);
    });
  } catch (error) {
    console.error("Error inserting resources:", error);
  }
}

// Run the creation script
createResourcesDirectly().then(() => {
  console.log("Direct resource creation completed!");
  process.exit(0);
}).catch(error => {
  console.error("Creation script failed:", error);
  process.exit(1);
});