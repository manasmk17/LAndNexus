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
  title = "L&D Nexus | AI-Powered Marketplace for Corporate Learning MENA | Connect with Top Learning & Development Experts UAE",
  description = "The AI-Powered Marketplace for Corporate Learning in the MENA Region. Connect with Top Learning & Development Experts - Instantly, Intelligently, with AI-Powered Matching. Empowering companies and L&D professionals across the UAE and beyond with intelligent corporate training solutions.",
  keywords = "AI-powered marketplace corporate learning MENA, top learning development experts UAE, instant intelligent L&D matching, corporate training MENA region, L&D professionals UAE Dubai Abu Dhabi, AI training marketplace Middle East, corporate learning solutions MENA, learning development experts Saudi Arabia Kuwait Qatar, intelligent training matching platform, MENA corporate education, UAE business training experts",
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

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "L&D Nexus",
  "alternateName": "Learning and Development Nexus",
  "description": "The AI-Powered Marketplace for Corporate Learning in the MENA Region. Connect with Top Learning & Development Experts - Instantly, Intelligently, with AI-Powered Matching.",
  "url": "https://www.ldnexus.com",
  "logo": "https://www.ldnexus.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "official.ldnexus@gmail.com",
    "contactType": "customer service",
    "areaServed": ["AE", "SA", "QA", "KW", "OM", "BH"],
    "availableLanguage": ["English", "Arabic"]
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "71–75 Shelton Street, Covent Garden",
    "addressLocality": "London",
    "addressCountry": "GB",
    "postalCode": "WC2H 9JQ"
  },
  "areaServed": [
    {
      "@type": "Country",
      "name": "United Arab Emirates"
    },
    {
      "@type": "Country", 
      "name": "Saudi Arabia"
    },
    {
      "@type": "Country",
      "name": "Qatar"
    },
    {
      "@type": "Country",
      "name": "Kuwait"
    },
    {
      "@type": "Country",
      "name": "Oman"
    },
    {
      "@type": "Country",
      "name": "Bahrain"
    }
  ],
  "knowsAbout": [
    "Corporate Learning",
    "AI-Powered Matching",
    "Learning and Development",
    "Professional Training",
    "MENA Region",
    "Corporate Training",
    "Artificial Intelligence"
  ],
  "sameAs": [
    "https://www.linkedin.com/company/l-d-nexus/",
    "https://ldnmag.com"
  ]
});

export const createPricingSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "L&D Nexus AI-Powered Learning Marketplace",
  "description": "AI-powered marketplace connecting companies with learning & development experts across MENA region",
  "provider": {
    "@type": "Organization",
    "name": "L&D Nexus",
    "url": "https://www.ldnexus.com"
  },
  "areaServed": ["AE", "SA", "QA", "KW", "OM", "BH"],
  "audience": {
    "@type": "Audience",
    "audienceType": "Corporate Learning Professionals"
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