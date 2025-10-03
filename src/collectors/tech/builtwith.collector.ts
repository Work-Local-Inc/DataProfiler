import axios, { AxiosInstance } from 'axios';
import { Business } from '../../../models/business.model';
import { CacheService } from '../../services/cache.service';
import winston from 'winston';

const logger = winston.createLogger({
  defaultMeta: { service: 'builtwith-collector' }
});

export interface BuiltWithConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface BuiltWithTechnology {
  Name: string;
  Link?: string;
  Description?: string;
  Tag?: string;
  Categories?: string[];
  FirstDetected?: number;
  LastDetected?: number;
  IsPremium?: boolean;
  Version?: string;
}

export interface BuiltWithPath {
  Name: string;
  Technologies: BuiltWithTechnology[];
}

export interface BuiltWithMeta {
  CompanyName?: string;
  Vertical?: string;
  Social?: Array<{
    Platform: string;
    Handle?: string;
    Url?: string;
  }>;
  Emails?: string[];
  Telephones?: string[];
  Country?: string;
  State?: string;
  City?: string;
  Postcode?: string;
  Address?: string;
  ARank?: number;
  QRank?: number;
}

export interface BuiltWithResult {
  Result: {
    Paths: BuiltWithPath[];
    Meta?: BuiltWithMeta;
    Attributes?: any;
  };
  Lookup: string;
}

export class BuiltWithCollector {
  private client: AxiosInstance;
  private cache: CacheService;
  private config: BuiltWithConfig;
  
  constructor(config: BuiltWithConfig) {
    this.config = {
      baseUrl: 'https://api.builtwith.com/v20',
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
      cacheTTL: 86400, // 24 hours
      ...config
    };
    
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      params: {
        KEY: this.config.apiKey
      }
    });
    
    this.cache = CacheService.getInstance();
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Response interceptor for error handling and retry
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const { config, response } = error;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }
        
        if (config.retry >= this.config.retryAttempts!) {
          return Promise.reject(error);
        }
        
        if (response?.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers['retry-after'] || 5;
          config.retry += 1;
          
          logger.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          
          return this.client(config);
        }
        
        if (response?.status >= 500) {
          // Server error - retry with exponential backoff
          config.retry += 1;
          const delay = Math.pow(2, config.retry) * 1000;
          
          logger.warn(`Server error. Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client(config);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get technology profile for a domain
   */
  async getDomainProfile(domain: string, options?: {
    onlyLive?: boolean;
    noMeta?: boolean;
    noAttributes?: boolean;
  }): Promise<BuiltWithResult> {
    const cacheKey = `builtwith:domain:${domain}`;
    
    // Check cache
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.info(`Cache hit for domain: ${domain}`);
        return cached;
      }
    }
    
    try {
      const response = await this.client.get('/api.json', {
        params: {
          LOOKUP: domain,
          onlyLiveTechnologies: options?.onlyLive,
          noMetaData: options?.noMeta,
          noAttributeData: options?.noAttributes
        }
      });
      
      const result = response.data.Results[0];
      
      // Cache the result
      if (this.config.cacheEnabled && result) {
        await this.cache.set(cacheKey, result, this.config.cacheTTL);
      }
      
      return result;
    } catch (error: any) {
      logger.error(`Failed to get domain profile for ${domain}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get list of sites using a specific technology
   */
  async getSitesUsingTechnology(
    technology: string,
    options?: {
      offset?: number;
      limit?: number;
      meta?: boolean;
      since?: Date;
      country?: string;
      state?: string;
      city?: string;
      vertical?: string;
      spendMin?: number;
      spendMax?: number;
    }
  ): Promise<any> {
    try {
      const response = await this.client.get('/lists.json', {
        params: {
          TECH: technology,
          OFFSET: options?.offset || 0,
          LIMIT: options?.limit || 100,
          META: options?.meta || false,
          SINCE: options?.since?.toISOString().split('T')[0],
          COUNTRY: options?.country,
          STATE: options?.state,
          CITY: options?.city,
          VERTICAL: options?.vertical,
          SPEND_MIN: options?.spendMin,
          SPEND_MAX: options?.spendMax
        }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get sites using ${technology}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Find technology combinations
   */
  async findTechnologyCombinations(
    tech1: string,
    tech2: string,
    limit: number = 100
  ): Promise<any> {
    try {
      const response = await this.client.get('/relationships.json', {
        params: {
          TECH1: tech1,
          TECH2: tech2,
          LIMIT: limit
        }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to find combinations of ${tech1} and ${tech2}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get technology trends
   */
  async getTechnologyTrends(
    technology: string,
    range: '1m' | '3m' | '6m' | '1y' | '5y' = '1y'
  ): Promise<any> {
    try {
      const response = await this.client.get('/trends.json', {
        params: {
          TECH: technology,
          RANGE: range
        }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get trends for ${technology}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Batch lookup multiple domains
   */
  async batchLookup(
    domains: string[],
    options?: {
      onlyLive?: boolean;
      noMeta?: boolean;
    }
  ): Promise<BuiltWithResult[]> {
    try {
      const response = await this.client.post('/bulk.json', {
        domains: domains,
        options: {
          onlyLiveTechnologies: options?.onlyLive,
          noMetaData: options?.noMeta
        }
      });
      
      return response.data.Results;
    } catch (error: any) {
      logger.error(`Batch lookup failed:`, error.message);
      throw error;
    }
  }
  
  /**
   * Transform BuiltWith data to our schema
   */
  transformToBusinessSchema(builtWithData: BuiltWithResult): Partial<any> {
    const result = builtWithData.Result;
    const techStack: any = {
      hosting: {},
      analytics: [],
      detected: new Date()
    };
    
    // Process technology paths
    result.Paths.forEach(path => {
      switch(path.Name) {
        case 'Web Hosting':
          techStack.hosting.provider = path.Technologies[0]?.Name;
          break;
          
        case 'CDN':
          techStack.hosting.cdn = path.Technologies[0]?.Name;
          break;
          
        case 'SSL Certificate':
          if (path.Technologies[0]) {
            techStack.hosting.ssl = {
              provider: path.Technologies[0].Name,
              grade: 'A' // Default, would need additional checks
            };
          }
          break;
          
        case 'Analytics and Tracking':
          techStack.analytics = path.Technologies.map(tech => ({
            tool: tech.Name,
            trackingId: null
          }));
          break;
          
        case 'Content Management System':
        case 'CMS':
          techStack.cms = path.Technologies[0]?.Name;
          break;
          
        case 'Ecommerce':
        case 'Shopping Cart':
          techStack.ecommerce = path.Technologies[0]?.Name;
          break;
          
        case 'Framework':
        case 'JavaScript Framework':
          techStack.framework = path.Technologies.map(t => t.Name);
          break;
          
        case 'Programming Language':
          techStack.languages = path.Technologies.map(t => t.Name);
          break;
          
        case 'Email Hosting':
        case 'Email Provider':
          techStack.emailProvider = path.Technologies[0]?.Name;
          break;
          
        case 'Marketing Automation':
          techStack.marketingAutomation = path.Technologies[0]?.Name;
          break;
          
        case 'CRM':
        case 'Customer Relationship Management':
          techStack.crm = path.Technologies[0]?.Name;
          break;
          
        case 'Live Chat':
        case 'Chat':
          techStack.chatbot = path.Technologies[0]?.Name;
          break;
          
        case 'Payment':
        case 'Payment Processor':
          techStack.paymentProcessors = path.Technologies.map(t => t.Name);
          break;
          
        case 'Widgets':
          techStack.widgets = path.Technologies.map(t => ({
            name: t.Name,
            category: t.Categories?.[0]
          }));
          break;
      }
    });
    
    // Transform metadata
    const businessData: any = {
      techStack: techStack,
      websites: [{
        url: `https://${builtWithData.Lookup}`,
        isPrimary: true,
        status: 'active'
      }]
    };
    
    if (result.Meta) {
      const meta = result.Meta;
      
      if (meta.CompanyName) {
        businessData.name = meta.CompanyName;
        businessData.legalName = meta.CompanyName;
      }
      
      if (meta.Address || meta.City) {
        businessData.locations = [{
          address: meta.Address,
          city: meta.City,
          state: meta.State,
          country: meta.Country,
          postalCode: meta.Postcode,
          isPrimary: true,
          locationType: 'headquarters'
        }];
      }
      
      if (meta.Vertical) {
        businessData.operations = {
          categories: [meta.Vertical]
        };
      }
      
      if (meta.Social && meta.Social.length > 0) {
        businessData.socialProfiles = meta.Social.map(social => ({
          platform: social.Platform.toLowerCase(),
          url: social.Url,
          username: social.Handle
        }));
      }
    }
    
    return businessData;
  }
  
  /**
   * Collect and update business technology data
   */
  async collectBusinessTechnology(businessId: string, domain: string): Promise<void> {
    try {
      logger.info(`Collecting technology data for ${domain}`);
      
      // Get technology profile
      const builtWithData = await this.getDomainProfile(domain);
      
      // Transform to our schema
      const businessUpdate = this.transformToBusinessSchema(builtWithData);
      
      // Calculate technology spend
      const techSpend = this.calculateTechnologySpend(builtWithData);
      businessUpdate.techSpend = techSpend;
      
      // Generate lead score
      const leadScore = this.calculateLeadScore(builtWithData);
      businessUpdate.leadScore = leadScore;
      
      // Update business record
      await Business.findOneAndUpdate(
        { businessId },
        {
          $set: businessUpdate,
          $push: {
            'metadata.dataSources': {
              source: 'BuiltWith',
              lastSync: new Date(),
              status: 'active',
              coverage: 85
            }
          }
        },
        { upsert: true }
      );
      
      logger.info(`Successfully updated technology data for ${domain}`);
    } catch (error: any) {
      logger.error(`Failed to collect technology for ${domain}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Calculate estimated technology spend
   */
  private calculateTechnologySpend(data: BuiltWithResult): {
    estimated: number;
    breakdown: Record<string, number>;
    currency: string;
  } {
    const costs: Record<string, number> = {
      // E-commerce
      'Shopify': 29,
      'Shopify Plus': 2000,
      'BigCommerce': 29,
      'Magento': 0,
      'WooCommerce': 0,
      
      // Analytics
      'Google Analytics 360': 12500,
      'Adobe Analytics': 1000,
      'Mixpanel': 25,
      'Hotjar': 39,
      
      // Email
      'Mailchimp': 20,
      'Klaviyo': 45,
      'SendGrid': 15,
      
      // CRM
      'Salesforce': 25,
      'HubSpot': 50,
      'Pipedrive': 15,
      
      // Support
      'Zendesk': 19,
      'Intercom': 74,
      'Drift': 50
    };
    
    let total = 0;
    const breakdown: Record<string, number> = {};
    
    data.Result.Paths.forEach(path => {
      path.Technologies.forEach(tech => {
        const cost = costs[tech.Name] || 0;
        if (cost > 0) {
          total += cost;
          breakdown[tech.Name] = cost;
        }
      });
    });
    
    return {
      estimated: total,
      breakdown: breakdown,
      currency: 'USD'
    };
  }
  
  /**
   * Calculate lead score based on technology signals
   */
  private calculateLeadScore(data: BuiltWithResult): {
    score: number;
    signals: Record<string, boolean>;
    tier: 'hot' | 'warm' | 'cold';
  } {
    let score = 0;
    const signals: Record<string, boolean> = {};
    
    // Check for key technologies
    const paths = data.Result.Paths;
    
    // E-commerce presence
    if (paths.find(p => p.Name === 'Ecommerce')) {
      score += 20;
      signals.hasEcommerce = true;
    }
    
    // Analytics
    const analytics = paths.find(p => p.Name === 'Analytics and Tracking');
    if (analytics && analytics.Technologies.length > 0) {
      score += 10;
      signals.hasAnalytics = true;
      
      if (analytics.Technologies.length > 2) {
        score += 10;
        signals.multipleAnalytics = true;
      }
    }
    
    // Marketing automation
    if (paths.find(p => p.Name === 'Marketing Automation')) {
      score += 15;
      signals.hasMarketingAutomation = true;
    }
    
    // CRM
    if (paths.find(p => p.Name === 'CRM')) {
      score += 15;
      signals.hasCRM = true;
    }
    
    // SSL
    if (paths.find(p => p.Name === 'SSL Certificate')) {
      score += 10;
      signals.hasSSL = true;
    }
    
    // CDN
    if (paths.find(p => p.Name === 'CDN')) {
      score += 10;
      signals.hasCDN = true;
    }
    
    // Chat/Support
    if (paths.find(p => p.Name === 'Live Chat')) {
      score += 10;
      signals.hasLiveChat = true;
    }
    
    const finalScore = Math.min(100, score);
    
    return {
      score: finalScore,
      signals: signals,
      tier: finalScore > 75 ? 'hot' : finalScore > 50 ? 'warm' : 'cold'
    };
  }
}

// Export singleton instance
export const builtWithCollector = new BuiltWithCollector({
  apiKey: process.env.BUILTWITH_API_KEY!
});