import axios from 'axios';
import * as cheerio from 'cheerio';
import dns from 'dns';
import { promisify } from 'util';
import whois from 'whois';
import sslChecker from 'ssl-checker';
import { URL } from 'url';
import pLimit from 'p-limit';
import winston from 'winston';

const logger = winston.createLogger({
  defaultMeta: { service: 'public-seo-analyzer' }
});

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);
const whoisLookup = promisify(whois.lookup);

// Rate limiting for external APIs
const limit = pLimit(5);

export interface SEOAnalysis {
  domain: string;
  timestamp: Date;
  
  // Technical SEO
  technical: {
    ssl: {
      enabled: boolean;
      issuer?: string;
      validFrom?: Date;
      validTo?: Date;
      daysRemaining?: number;
      grade?: string;
    };
    performance: {
      pageSpeed: {
        mobile: number;
        desktop: number;
        metrics: PageSpeedMetrics;
      };
      loadTime: number;
      size: number;
    };
    mobile: {
      isFriendly: boolean;
      viewport: boolean;
      textReadability: boolean;
      touchElements: boolean;
    };
    dns: {
      ip?: string;
      nameservers?: string[];
      mxRecords?: string[];
      txtRecords?: string[];
      loadBalanced?: boolean;
    };
  };
  
  // On-Page SEO
  onPage: {
    title?: string;
    titleLength?: number;
    metaDescription?: string;
    descriptionLength?: number;
    h1Tags: string[];
    h2Tags: string[];
    canonicalUrl?: string;
    ogTags: Record<string, string>;
    twitterCards: Record<string, string>;
    structuredData: any[];
    language?: string;
    robots?: string;
    alternateLanguages?: Array<{lang: string; url: string}>;
  };
  
  // Domain Authority (estimated)
  authority: {
    domainAge?: number;
    estimatedAuthority: number;
    trustIndicators: {
      hasSSL: boolean;
      domainAge: boolean;
      hasPrivacyPolicy: boolean;
      hasTerms: boolean;
      hasContact: boolean;
      hasSitemap: boolean;
      hasRobotsTxt: boolean;
    };
  };
  
  // Content Analysis
  content: {
    wordCount: number;
    imageCount: number;
    images: {
      total: number;
      withAlt: number;
      lazy: number;
      nextGen: number;
    };
    links: {
      internal: number;
      external: number;
      broken?: number;
      nofollow: number;
      sponsored: number;
    };
  };
  
  // SEO Score
  scores: {
    overall: number;
    technical: number;
    onPage: number;
    content: number;
    mobile: number;
    recommendations: string[];
  };
}

interface PageSpeedMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export class PublicSEOAnalyzer {
  private static instance: PublicSEOAnalyzer;
  private pageSpeedApiKey?: string;
  
  private constructor() {
    // Google PageSpeed API key is optional (works without but has higher limits with key)
    this.pageSpeedApiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  }
  
  static getInstance(): PublicSEOAnalyzer {
    if (!this.instance) {
      this.instance = new PublicSEOAnalyzer();
    }
    return this.instance;
  }
  
  /**
   * Perform complete SEO analysis using only public data
   */
  async analyzeDomain(domain: string): Promise<SEOAnalysis> {
    logger.info(`Starting public SEO analysis for ${domain}`);
    
    // Clean domain
    domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `https://${domain}`;
    
    // Run all checks in parallel where possible
    const [
      sslData,
      pageSpeedData,
      htmlAnalysis,
      domainInfo,
      dnsData,
      technicalChecks
    ] = await Promise.all([
      limit(() => this.checkSSL(domain)),
      limit(() => this.analyzePageSpeed(url)),
      limit(() => this.analyzeHTML(url)),
      limit(() => this.getDomainInfo(domain)),
      limit(() => this.analyzeDNS(domain)),
      limit(() => this.checkTechnicalSEO(domain))
    ]);
    
    // Calculate scores and generate recommendations
    const scores = this.calculateSEOScores({
      ssl: sslData,
      pageSpeed: pageSpeedData,
      html: htmlAnalysis,
      domain: domainInfo,
      technical: technicalChecks
    });
    
    const analysis: SEOAnalysis = {
      domain,
      timestamp: new Date(),
      
      technical: {
        ssl: sslData,
        performance: pageSpeedData,
        mobile: pageSpeedData.mobile || this.getDefaultMobileData(),
        dns: dnsData
      },
      
      onPage: htmlAnalysis,
      
      authority: {
        domainAge: domainInfo.age,
        estimatedAuthority: this.estimateAuthority(domainInfo, sslData, htmlAnalysis),
        trustIndicators: technicalChecks
      },
      
      content: htmlAnalysis.content || this.getDefaultContentData(),
      
      scores
    };
    
    logger.info(`SEO analysis complete for ${domain}`);
    return analysis;
  }
  
  /**
   * Check SSL certificate
   */
  private async checkSSL(domain: string): Promise<any> {
    try {
      const sslData = await sslChecker(domain, { method: 'GET', port: 443 });
      
      const validTo = new Date(sslData.validTo);
      const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return {
        enabled: sslData.valid,
        issuer: sslData.issuer?.O,
        validFrom: new Date(sslData.validFrom),
        validTo: validTo,
        daysRemaining,
        grade: this.calculateSSLGrade(sslData, daysRemaining)
      };
    } catch (error) {
      logger.warn(`SSL check failed for ${domain}:`, error);
      return { enabled: false, grade: 'F' };
    }
  }
  
  /**
   * Analyze page speed using Google PageSpeed Insights API
   */
  private async analyzePageSpeed(url: string): Promise<any> {
    try {
      const strategies = ['mobile', 'desktop'];
      const results: any = {};
      
      for (const strategy of strategies) {
        const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
        const params: any = {
          url,
          strategy,
          category: ['performance', 'seo', 'accessibility']
        };
        
        if (this.pageSpeedApiKey) {
          params.key = this.pageSpeedApiKey;
        }
        
        const response = await axios.get(apiUrl, { params });
        const data = response.data;
        
        const lighthouse = data.lighthouseResult;
        
        results[strategy] = {
          score: Math.round(lighthouse.categories.performance.score * 100),
          seoScore: Math.round(lighthouse.categories.seo.score * 100),
          metrics: {
            firstContentfulPaint: lighthouse.audits['first-contentful-paint'].numericValue,
            largestContentfulPaint: lighthouse.audits['largest-contentful-paint'].numericValue,
            cumulativeLayoutShift: lighthouse.audits['cumulative-layout-shift'].numericValue,
            totalBlockingTime: lighthouse.audits['total-blocking-time']?.numericValue || 0,
            speedIndex: lighthouse.audits['speed-index'].numericValue
          }
        };
        
        // Mobile-specific checks
        if (strategy === 'mobile') {
          results.mobile = {
            isFriendly: lighthouse.audits['viewport']?.score === 1,
            viewport: lighthouse.audits['viewport']?.score === 1,
            textReadability: lighthouse.audits['font-size']?.score === 1,
            touchElements: lighthouse.audits['tap-targets']?.score === 1
          };
        }
      }
      
      // Get page size and load time
      const resourceSummary = response.data.lighthouseResult.audits['resource-summary'];
      
      return {
        pageSpeed: {
          mobile: results.mobile.score,
          desktop: results.desktop.score,
          metrics: results.mobile.metrics
        },
        loadTime: results.mobile.metrics.largestContentfulPaint,
        size: resourceSummary?.details?.items?.[0]?.transferSize || 0,
        mobile: results.mobile
      };
    } catch (error: any) {
      logger.error(`PageSpeed analysis failed for ${url}:`, error.message);
      return this.getDefaultPageSpeedData();
    }
  }
  
  /**
   * Analyze HTML for SEO elements
   */
  private async analyzeHTML(url: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DataProfiler/1.0; +http://dataprofiler.com/bot)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract meta tags
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content');
      const canonical = $('link[rel="canonical"]').attr('href');
      const robots = $('meta[name="robots"]').attr('content');
      const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content');
      
      // Extract headings
      const h1Tags: string[] = [];
      const h2Tags: string[] = [];
      $('h1').each((_, el) => h1Tags.push($(el).text().trim()));
      $('h2').each((_, el) => h2Tags.push($(el).text().trim()));
      
      // Extract Open Graph tags
      const ogTags: Record<string, string> = {};
      $('meta[property^="og:"]').each((_, el) => {
        const property = $(el).attr('property')?.replace('og:', '');
        const content = $(el).attr('content');
        if (property && content) ogTags[property] = content;
      });
      
      // Extract Twitter Card tags
      const twitterCards: Record<string, string> = {};
      $('meta[name^="twitter:"]').each((_, el) => {
        const name = $(el).attr('name')?.replace('twitter:', '');
        const content = $(el).attr('content');
        if (name && content) twitterCards[name] = content;
      });
      
      // Extract structured data
      const structuredData: any[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          structuredData.push(data);
        } catch (e) {
          // Invalid JSON-LD
        }
      });
      
      // Extract alternate languages
      const alternateLanguages: Array<{lang: string; url: string}> = [];
      $('link[rel="alternate"][hreflang]').each((_, el) => {
        const lang = $(el).attr('hreflang');
        const url = $(el).attr('href');
        if (lang && url) alternateLanguages.push({ lang, url });
      });
      
      // Content analysis
      const bodyText = $('body').text();
      const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
      
      // Image analysis
      const images = $('img');
      const imagesWithAlt = $('img[alt]');
      const lazyImages = $('img[loading="lazy"]');
      const nextGenImages = $('img[src*=".webp"], img[src*=".avif"]');
      
      // Link analysis
      const allLinks = $('a[href]');
      let internalLinks = 0;
      let externalLinks = 0;
      let nofollowLinks = 0;
      let sponsoredLinks = 0;
      
      allLinks.each((_, el) => {
        const href = $(el).attr('href');
        const rel = $(el).attr('rel') || '';
        
        if (href?.startsWith('http')) {
          if (href.includes(url)) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        } else if (href?.startsWith('/')) {
          internalLinks++;
        }
        
        if (rel.includes('nofollow')) nofollowLinks++;
        if (rel.includes('sponsored')) sponsoredLinks++;
      });
      
      return {
        title,
        titleLength: title?.length,
        metaDescription,
        descriptionLength: metaDescription?.length,
        h1Tags,
        h2Tags,
        canonicalUrl: canonical,
        ogTags,
        twitterCards,
        structuredData,
        language,
        robots,
        alternateLanguages,
        content: {
          wordCount,
          imageCount: images.length,
          images: {
            total: images.length,
            withAlt: imagesWithAlt.length,
            lazy: lazyImages.length,
            nextGen: nextGenImages.length
          },
          links: {
            internal: internalLinks,
            external: externalLinks,
            nofollow: nofollowLinks,
            sponsored: sponsoredLinks
          }
        }
      };
    } catch (error: any) {
      logger.error(`HTML analysis failed for ${url}:`, error.message);
      return this.getDefaultHTMLData();
    }
  }
  
  /**
   * Get domain age and registration info
   */
  private async getDomainInfo(domain: string): Promise<any> {
    try {
      const whoisData = await whoisLookup(domain);
      
      // Parse creation date from WHOIS data
      const creationDateMatch = whoisData.match(/Creation Date: (.+)/i) ||
                               whoisData.match(/Created on: (.+)/i) ||
                               whoisData.match(/Registration Time: (.+)/i);
      
      if (creationDateMatch) {
        const creationDate = new Date(creationDateMatch[1]);
        const ageInDays = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
        const ageInYears = Math.floor(ageInDays / 365);
        
        return {
          creationDate,
          age: ageInYears,
          ageInDays
        };
      }
      
      return { age: 0 };
    } catch (error) {
      logger.warn(`WHOIS lookup failed for ${domain}:`, error);
      return { age: 0 };
    }
  }
  
  /**
   * Analyze DNS configuration
   */
  private async analyzeDNS(domain: string): Promise<any> {
    const dnsInfo: any = {};
    
    try {
      // Get IP address
      const { address } = await dnsLookup(domain);
      dnsInfo.ip = address;
      
      // Get nameservers
      try {
        const ns = await dnsResolve(domain, 'NS');
        dnsInfo.nameservers = ns;
      } catch (e) {}
      
      // Get MX records
      try {
        const mx = await dnsResolve(domain, 'MX');
        dnsInfo.mxRecords = mx.map((record: any) => record.exchange);
      } catch (e) {}
      
      // Get TXT records (for SPF, DMARC, etc.)
      try {
        const txt = await dnsResolve(domain, 'TXT');
        dnsInfo.txtRecords = txt.flat();
      } catch (e) {}
      
      // Check if using CDN/Load balancer
      dnsInfo.loadBalanced = dnsInfo.nameservers?.some((ns: string) => 
        ns.includes('cloudflare') || 
        ns.includes('awsdns') || 
        ns.includes('akamai')
      );
      
    } catch (error) {
      logger.warn(`DNS analysis failed for ${domain}:`, error);
    }
    
    return dnsInfo;
  }
  
  /**
   * Check technical SEO indicators
   */
  private async checkTechnicalSEO(domain: string): Promise<any> {
    const checks = {
      hasSSL: false,
      domainAge: false,
      hasPrivacyPolicy: false,
      hasTerms: false,
      hasContact: false,
      hasSitemap: false,
      hasRobotsTxt: false
    };
    
    const url = `https://${domain}`;
    
    // Check common pages in parallel
    const pagesToCheck = [
      { path: '/privacy', key: 'hasPrivacyPolicy' },
      { path: '/privacy-policy', key: 'hasPrivacyPolicy' },
      { path: '/terms', key: 'hasTerms' },
      { path: '/terms-of-service', key: 'hasTerms' },
      { path: '/contact', key: 'hasContact' },
      { path: '/contact-us', key: 'hasContact' },
      { path: '/sitemap.xml', key: 'hasSitemap' },
      { path: '/robots.txt', key: 'hasRobotsTxt' }
    ];
    
    await Promise.all(
      pagesToCheck.map(async ({ path, key }) => {
        try {
          const response = await axios.head(`${url}${path}`, {
            timeout: 5000,
            validateStatus: (status) => status < 400
          });
          if (response.status === 200) {
            checks[key as keyof typeof checks] = true;
          }
        } catch (e) {
          // Page doesn't exist or error
        }
      })
    );
    
    return checks;
  }
  
  /**
   * Calculate SSL grade
   */
  private calculateSSLGrade(sslData: any, daysRemaining: number): string {
    if (!sslData.valid) return 'F';
    if (daysRemaining < 7) return 'D';
    if (daysRemaining < 30) return 'C';
    if (daysRemaining < 90) return 'B';
    return 'A';
  }
  
  /**
   * Estimate domain authority
   */
  private estimateAuthority(domainInfo: any, ssl: any, html: any): number {
    let score = 0;
    
    // Domain age factor (max 30 points)
    if (domainInfo.age >= 5) score += 30;
    else if (domainInfo.age >= 3) score += 20;
    else if (domainInfo.age >= 1) score += 10;
    
    // SSL factor (20 points)
    if (ssl.enabled && ssl.grade === 'A') score += 20;
    else if (ssl.enabled) score += 10;
    
    // Content factors (max 30 points)
    if (html.structuredData?.length > 0) score += 10;
    if (html.content?.wordCount > 500) score += 10;
    if (html.content?.images?.withAlt > html.content?.images?.total * 0.8) score += 10;
    
    // Technical factors (max 20 points)
    if (html.canonicalUrl) score += 5;
    if (html.robots && !html.robots.includes('noindex')) score += 5;
    if (html.h1Tags?.length === 1) score += 5;
    if (html.metaDescription) score += 5;
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate SEO scores and generate recommendations
   */
  private calculateSEOScores(data: any): any {
    const scores = {
      technical: 0,
      onPage: 0,
      content: 0,
      mobile: 0,
      overall: 0
    };
    
    const recommendations: string[] = [];
    
    // Technical score (max 100)
    if (data.ssl?.enabled) scores.technical += 25;
    else recommendations.push('Enable SSL certificate for security');
    
    if (data.pageSpeed?.pageSpeed?.desktop > 80) scores.technical += 25;
    else if (data.pageSpeed?.pageSpeed?.desktop > 60) scores.technical += 15;
    else recommendations.push('Improve page speed performance');
    
    if (data.technical?.hasSitemap) scores.technical += 15;
    else recommendations.push('Add XML sitemap');
    
    if (data.technical?.hasRobotsTxt) scores.technical += 15;
    else recommendations.push('Add robots.txt file');
    
    if (data.dns?.loadBalanced) scores.technical += 20;
    
    // On-page score (max 100)
    if (data.html?.title && data.html.titleLength >= 30 && data.html.titleLength <= 60) {
      scores.onPage += 20;
    } else {
      recommendations.push('Optimize title tag (30-60 characters)');
    }
    
    if (data.html?.metaDescription && data.html.descriptionLength >= 120 && data.html.descriptionLength <= 160) {
      scores.onPage += 20;
    } else {
      recommendations.push('Add meta description (120-160 characters)');
    }
    
    if (data.html?.h1Tags?.length === 1) scores.onPage += 20;
    else recommendations.push('Use exactly one H1 tag');
    
    if (data.html?.structuredData?.length > 0) scores.onPage += 20;
    else recommendations.push('Add structured data markup');
    
    if (data.html?.canonicalUrl) scores.onPage += 10;
    if (data.html?.ogTags?.title) scores.onPage += 10;
    
    // Content score (max 100)
    if (data.html?.content?.wordCount > 300) scores.content += 30;
    else recommendations.push('Add more content (300+ words)');
    
    const imageAltRatio = data.html?.content?.images?.withAlt / data.html?.content?.images?.total;
    if (imageAltRatio > 0.8) scores.content += 25;
    else recommendations.push('Add alt text to images');
    
    if (data.html?.content?.links?.internal > 3) scores.content += 25;
    else recommendations.push('Add more internal links');
    
    if (data.html?.content?.images?.lazy > 0) scores.content += 20;
    else recommendations.push('Implement lazy loading for images');
    
    // Mobile score
    scores.mobile = data.pageSpeed?.mobile?.isFriendly ? 100 : 50;
    if (!data.pageSpeed?.mobile?.isFriendly) {
      recommendations.push('Optimize for mobile devices');
    }
    
    // Calculate overall score
    scores.overall = Math.round(
      (scores.technical * 0.3) +
      (scores.onPage * 0.3) +
      (scores.content * 0.2) +
      (scores.mobile * 0.2)
    );
    
    return {
      ...scores,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }
  
  // Default data methods
  private getDefaultMobileData() {
    return {
      isFriendly: false,
      viewport: false,
      textReadability: false,
      touchElements: false
    };
  }
  
  private getDefaultPageSpeedData() {
    return {
      pageSpeed: { mobile: 0, desktop: 0, metrics: {} },
      loadTime: 0,
      size: 0
    };
  }
  
  private getDefaultHTMLData() {
    return {
      title: '',
      metaDescription: '',
      h1Tags: [],
      h2Tags: [],
      ogTags: {},
      twitterCards: {},
      structuredData: [],
      content: {
        wordCount: 0,
        imageCount: 0,
        images: { total: 0, withAlt: 0, lazy: 0, nextGen: 0 },
        links: { internal: 0, external: 0, nofollow: 0, sponsored: 0 }
      }
    };
  }
  
  private getDefaultContentData() {
    return {
      wordCount: 0,
      imageCount: 0,
      images: { total: 0, withAlt: 0, lazy: 0, nextGen: 0 },
      links: { internal: 0, external: 0, broken: 0, nofollow: 0, sponsored: 0 }
    };
  }
}

export const publicSEOAnalyzer = PublicSEOAnalyzer.getInstance();