import { storage } from "./storage";

export class SitemapGenerator {
  private baseUrl = "https://www.ldnexus.com";
  
  async generateSitemap(): Promise<string> {
    const urls: Array<{
      loc: string;
      lastmod?: string;
      changefreq?: string;
      priority?: string;
    }> = [];

    // Add static pages
    urls.push(
      {
        loc: this.baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "1.0"
      },
      {
        loc: `${this.baseUrl}/about`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.8"
      },
      {
        loc: `${this.baseUrl}/jobs`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.9"
      },
      {
        loc: `${this.baseUrl}/professionals`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.9"
      },
      {
        loc: `${this.baseUrl}/resources`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "0.8"
      },
      {
        loc: `${this.baseUrl}/forum`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.7"
      },
      {
        loc: `${this.baseUrl}/subscription-plans`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.6"
      }
    );

    try {
      // Add job postings
      const jobs = await storage.getAllJobPostings();
      jobs.forEach(job => {
        if (job.status === 'open') {
          urls.push({
            loc: `${this.baseUrl}/job/${job.id}`,
            lastmod: job.createdAt?.toISOString() || new Date().toISOString(),
            changefreq: "weekly",
            priority: "0.8"
          });
        }
      });

      // Add professional profiles
      const professionals = await storage.getAllProfessionalProfiles();
      professionals.forEach(professional => {
        urls.push({
          loc: `${this.baseUrl}/professional-profile/${professional.id}`,
          lastmod: professional.createdAt?.toISOString() || new Date().toISOString(),
          changefreq: "monthly",
          priority: "0.7"
        });
      });

      // Add resources
      const resources = await storage.getAllResources();
      resources.forEach(resource => {
        urls.push({
          loc: `${this.baseUrl}/resource/${resource.id}`,
          lastmod: resource.createdAt?.toISOString() || new Date().toISOString(),
          changefreq: "monthly",
          priority: "0.6"
        });
      });

    } catch (error) {
      console.error("Error generating dynamic sitemap content:", error);
    }

    // Generate XML
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    const urlEntries = urls.map(url => {
      let entry = '  <url>\n';
      entry += `    <loc>${url.loc}</loc>\n`;
      if (url.lastmod) {
        entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      if (url.changefreq) {
        entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      if (url.priority) {
        entry += `    <priority>${url.priority}</priority>\n`;
      }
      entry += '  </url>\n';
      return entry;
    }).join('');
    
    const urlsetClose = '</urlset>';
    
    return xmlHeader + urlsetOpen + urlEntries + urlsetClose;
  }

  async generateRobotsTxt(): Promise<string> {
    return `User-agent: *
Allow: /

# Allow crawling of all public content
Allow: /
Allow: /jobs
Allow: /professionals
Allow: /resources
Allow: /about
Allow: /forum
Allow: /subscription-plans

# Disallow private/admin areas
Disallow: /admin*
Disallow: /admin-*
Disallow: /edit-profile
Disallow: /messages
Disallow: /checkout
Disallow: /subscribe
Disallow: /manage-*
Disallow: /reset-password
Disallow: /forgot-password

# Allow access to static assets
Allow: /uploads/
Allow: /assets/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Disallow: /*.svg
Allow: /*.webp

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1`;
  }
}

export const sitemapGenerator = new SitemapGenerator();