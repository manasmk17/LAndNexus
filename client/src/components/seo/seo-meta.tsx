import { useEffect } from 'react';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
}

export function SEOMeta({
  title = "L&D Nexus | AI-Powered Corporate Training Platform UAE | International Certified Professionals",
  description = "L&D Nexus connects companies with verified freelance L&D experts and International Certified Professionals in UAE. AI trainer matching, global learning & development experts, certified professional trainers for businesses.",
  keywords = "corporate training UAE, AI trainer matching, International Certified Trainers, Global Learning & Development Experts, Certified Professional Trainers for Businesses, AI-Matched International Training Experts, learning and development platform, bilingual training marketplace, L&D Nexus",
  canonicalUrl = "https://www.ldnexus.com",
  ogImage = "https://www.ldnexus.com/og-image.jpg",
  structuredData
}: SEOMetaProps) {
  useEffect(() => {
    document.title = title;
    
    const updateMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      }
    };
    
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }
    
    if (structuredData) {
      let structuredDataScript = document.querySelector('#page-structured-data');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('id', 'page-structured-data');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(structuredData);
    }
    
  }, [title, description, keywords, canonicalUrl, ogImage, structuredData]);

  return null;
}

export const createJobPostingSchema = (job: any) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": job.title,
  "description": job.description,
  "datePosted": job.createdAt,
  "validThrough": job.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  "employmentType": job.jobType?.toUpperCase(),
  "hiringOrganization": {
    "@type": "Organization",
    "name": "L&D Nexus",
    "sameAs": "https://www.ldnexus.com"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": job.location,
      "addressCountry": "AE"
    }
  }
});

export const createProfessionalSchema = (professional: any) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": `${professional.firstName} ${professional.lastName}`,
  "jobTitle": professional.title,
  "description": professional.bio,
  "url": `https://www.ldnexus.com/professional-profile/${professional.id}`,
  "worksFor": {
    "@type": "Organization",
    "name": "L&D Nexus"
  },
  "knowsAbout": professional.expertise?.map((exp: any) => exp.name) || []
});

export const createPricingSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "L&D Nexus Professional Training Platform",
  "provider": {
    "@type": "Organization",
    "name": "L&D Nexus",
    "url": "https://www.ldnexus.com"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Basic Plan",
      "description": "Perfect for individual L&D professionals getting started",
      "price": "29.00",
      "priceCurrency": "USD",
      "billingIncrement": "month",
      "category": "Subscription",
      "itemOffered": {
        "@type": "Service",
        "name": "Basic L&D Platform Access"
      }
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "description": "Advanced features for experienced professionals and small teams",
      "price": "79.00",
      "priceCurrency": "USD",
      "billingIncrement": "month",
      "category": "Subscription",
      "itemOffered": {
        "@type": "Service",
        "name": "Pro L&D Platform Access"
      }
    },
    {
      "@type": "Offer",
      "name": "Enterprise Plan",
      "description": "Complete solution for organizations and training companies",
      "price": "199.00",
      "priceCurrency": "USD",
      "billingIncrement": "month",
      "category": "Subscription",
      "itemOffered": {
        "@type": "Service",
        "name": "Enterprise L&D Platform Access"
      }
    }
  ]
});