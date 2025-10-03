import { Schema, model, Document } from 'mongoose';
import winston from 'winston';
import { EventEmitter } from 'events';

const logger = winston.createLogger({
  defaultMeta: { service: 'api-cost-tracker' }
});

// API Provider Configuration
export interface APIProvider {
  name: string;
  displayName: string;
  billingType: 'subscription' | 'pay-per-use' | 'hybrid';
  endpoints: APIEndpoint[];
  subscription?: SubscriptionPlan;
  limits?: RateLimits;
  costs: CostStructure;
}

export interface APIEndpoint {
  name: string;
  path: string;
  cost: number;
  unit: string;
  category: string;
}

export interface SubscriptionPlan {
  name: string;
  cost: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  credits?: number;
  features: string[];
  limits: Record<string, number>;
}

export interface RateLimits {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  requestsPerMonth?: number;
  concurrentRequests?: number;
}

export interface CostStructure {
  base?: number;
  overage?: number;
  tiers?: Array<{
    from: number;
    to: number;
    price: number;
    unit: string;
  }>;
}

// Usage Tracking Schema
const APIUsageSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  provider: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: String,
  path: String,
  
  // Request details
  requestSize: Number,
  responseSize: Number,
  responseTime: Number,
  statusCode: Number,
  success: Boolean,
  
  // Cost tracking
  cost: { type: Number, required: true },
  unit: String,
  quantity: { type: Number, default: 1 },
  
  // Business tracking
  businessId: String,
  clientId: String,
  userId: String,
  
  // Metadata
  metadata: Schema.Types.Mixed,
  error: String
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes'
  }
});

// Subscription tracking
const SubscriptionSchema = new Schema({
  provider: { type: String, required: true },
  plan: {
    name: String,
    tier: String,
    cost: Number,
    billingPeriod: String,
    startDate: Date,
    renewalDate: Date,
    cancelDate: Date,
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'active'
    }
  },
  
  usage: {
    credits: { used: Number, total: Number },
    requests: { used: Number, total: Number },
    dataPoints: { used: Number, total: Number }
  },
  
  billing: {
    lastPayment: Date,
    nextPayment: Date,
    paymentMethod: String,
    autoRenew: Boolean,
    invoices: [{
      date: Date,
      amount: Number,
      invoiceId: String,
      status: String
    }]
  },
  
  alerts: [{
    type: String,
    threshold: Number,
    enabled: Boolean,
    lastTriggered: Date
  }]
});

export const APIUsage = model('APIUsage', APIUsageSchema);
export const Subscription = model('Subscription', SubscriptionSchema);

export class APICostTracker extends EventEmitter {
  private static instance: APICostTracker;
  private providers: Map<string, APIProvider>;
  private currentUsage: Map<string, number>;
  private monthlyBudget: number = 0;
  
  private constructor() {
    super();
    this.providers = new Map();
    this.currentUsage = new Map();
    this.initializeProviders();
    this.startMonitoring();
  }
  
  static getInstance(): APICostTracker {
    if (!this.instance) {
      this.instance = new APICostTracker();
    }
    return this.instance;
  }
  
  private initializeProviders() {
    // DataForSEO Configuration
    this.providers.set('dataforseo', {
      name: 'dataforseo',
      displayName: 'DataForSEO',
      billingType: 'pay-per-use',
      endpoints: [
        { name: 'backlinks_summary', path: '/backlinks/summary', cost: 0.00002, unit: 'request', category: 'backlinks' },
        { name: 'backlinks_list', path: '/backlinks/backlinks', cost: 0.00002, unit: 'result', category: 'backlinks' },
        { name: 'keywords_volume', path: '/keywords_data/search_volume', cost: 0.00075, unit: 'keyword', category: 'keywords' },
        { name: 'serp_results', path: '/serp/google/organic', cost: 0.003, unit: 'serp', category: 'serp' },
        { name: 'traffic_analytics', path: '/traffic_analytics', cost: 0.0006, unit: 'request', category: 'traffic' },
        { name: 'domain_overview', path: '/domain_analytics/overview', cost: 0.0006, unit: 'request', category: 'domain' },
        { name: 'on_page_audit', path: '/on_page/instant_pages', cost: 0.0015, unit: 'page', category: 'audit' }
      ],
      limits: {
        requestsPerSecond: 10,
        concurrentRequests: 30
      },
      costs: {
        base: 0,
        overage: 0
      }
    });
    
    // BuiltWith Configuration
    this.providers.set('builtwith', {
      name: 'builtwith',
      displayName: 'BuiltWith',
      billingType: 'hybrid',
      subscription: {
        name: 'Pro',
        cost: 295,
        period: 'monthly',
        startDate: new Date(),
        credits: 5000,
        features: ['Domain API', 'Lists API', 'Relationships API'],
        limits: {
          lookups: 5000,
          exports: 50000
        }
      },
      endpoints: [
        { name: 'domain_lookup', path: '/api.json', cost: 0.059, unit: 'lookup', category: 'technology' },
        { name: 'lists', path: '/lists.json', cost: 0.001, unit: 'result', category: 'leads' },
        { name: 'relationships', path: '/relationships.json', cost: 0.01, unit: 'request', category: 'relationships' },
        { name: 'trends', path: '/trends.json', cost: 0.005, unit: 'request', category: 'analytics' }
      ],
      limits: {
        requestsPerSecond: 10,
        concurrentRequests: 8
      },
      costs: {
        base: 295,
        overage: 0.1
      }
    });
    
    // Google APIs (Free tier + paid)
    this.providers.set('google', {
      name: 'google',
      displayName: 'Google APIs',
      billingType: 'pay-per-use',
      endpoints: [
        { name: 'pagespeed', path: '/pagespeedonline', cost: 0, unit: 'request', category: 'performance' },
        { name: 'places_details', path: '/places/details', cost: 0.017, unit: 'request', category: 'places' },
        { name: 'places_search', path: '/places/search', cost: 0.032, unit: 'request', category: 'places' },
        { name: 'places_photos', path: '/places/photos', cost: 0.007, unit: 'photo', category: 'places' }
      ],
      limits: {
        requestsPerSecond: 10,
        requestsPerDay: 25000 // PageSpeed free tier
      },
      costs: {
        base: 0,
        overage: 0
      }
    });
    
    // Social Media APIs (OAuth - mostly free)
    this.providers.set('facebook', {
      name: 'facebook',
      displayName: 'Facebook/Instagram Graph API',
      billingType: 'pay-per-use',
      endpoints: [
        { name: 'graph_api', path: '/graph', cost: 0, unit: 'request', category: 'social' },
        { name: 'insights', path: '/insights', cost: 0, unit: 'request', category: 'analytics' }
      ],
      limits: {
        requestsPerHour: 200
      },
      costs: {
        base: 0,
        overage: 0
      }
    });
  }
  
  /**
   * Track API usage and calculate cost
   */
  async trackUsage(params: {
    provider: string;
    endpoint: string;
    method?: string;
    path?: string;
    quantity?: number;
    businessId?: string;
    clientId?: string;
    responseTime?: number;
    statusCode?: number;
    success?: boolean;
    metadata?: any;
  }): Promise<void> {
    try {
      const provider = this.providers.get(params.provider);
      if (!provider) {
        logger.warn(`Unknown provider: ${params.provider}`);
        return;
      }
      
      // Find endpoint configuration
      const endpointConfig = provider.endpoints.find(e => 
        e.name === params.endpoint || e.path === params.path
      );
      
      if (!endpointConfig) {
        logger.warn(`Unknown endpoint: ${params.endpoint} for ${params.provider}`);
        return;
      }
      
      // Calculate cost
      const quantity = params.quantity || 1;
      const cost = endpointConfig.cost * quantity;
      
      // Save usage record
      const usage = new APIUsage({
        provider: params.provider,
        endpoint: params.endpoint,
        method: params.method,
        path: params.path,
        cost: cost,
        unit: endpointConfig.unit,
        quantity: quantity,
        businessId: params.businessId,
        clientId: params.clientId,
        responseTime: params.responseTime,
        statusCode: params.statusCode,
        success: params.success !== false,
        metadata: params.metadata
      });
      
      await usage.save();
      
      // Update current usage
      const currentMonth = this.getCurrentMonthKey();
      const currentTotal = this.currentUsage.get(currentMonth) || 0;
      this.currentUsage.set(currentMonth, currentTotal + cost);
      
      // Check for alerts
      await this.checkAlerts(params.provider, cost);
      
      // Emit usage event
      this.emit('usage', {
        provider: params.provider,
        endpoint: params.endpoint,
        cost: cost,
        totalMonthly: currentTotal + cost
      });
      
      logger.info(`API usage tracked: ${params.provider}/${params.endpoint} - $${cost.toFixed(4)}`);
    } catch (error) {
      logger.error('Failed to track API usage:', error);
    }
  }
  
  /**
   * Get current month's usage summary
   */
  async getMonthlyUsage(month?: Date): Promise<any> {
    const startDate = month || new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    const usage = await APIUsage.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            provider: '$provider',
            endpoint: '$endpoint'
          },
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' },
          successRate: {
            $avg: { $cond: ['$success', 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: '$_id.provider',
          endpoints: {
            $push: {
              endpoint: '$_id.endpoint',
              count: '$count',
              quantity: '$quantity',
              cost: '$totalCost',
              avgResponseTime: '$avgResponseTime',
              successRate: '$successRate'
            }
          },
          totalCost: { $sum: '$totalCost' },
          totalRequests: { $sum: '$count' }
        }
      }
    ]);
    
    // Get subscription costs
    const subscriptions = await Subscription.find({ 
      'plan.status': 'active' 
    });
    
    let subscriptionCosts = 0;
    subscriptions.forEach(sub => {
      if (sub.plan.billingPeriod === 'monthly') {
        subscriptionCosts += sub.plan.cost;
      } else if (sub.plan.billingPeriod === 'yearly') {
        subscriptionCosts += sub.plan.cost / 12;
      }
    });
    
    // Calculate totals
    const usageCosts = usage.reduce((sum, provider) => sum + provider.totalCost, 0);
    const totalCosts = subscriptionCosts + usageCosts;
    
    return {
      month: startDate.toISOString().substring(0, 7),
      providers: usage,
      subscriptions: subscriptions,
      costs: {
        usage: usageCosts,
        subscriptions: subscriptionCosts,
        total: totalCosts
      },
      budget: {
        allocated: this.monthlyBudget,
        spent: totalCosts,
        remaining: this.monthlyBudget - totalCosts,
        percentage: (totalCosts / this.monthlyBudget) * 100
      }
    };
  }
  
  /**
   * Get detailed cost breakdown
   */
  async getCostBreakdown(params?: {
    provider?: string;
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any> {
    const match: any = {};
    
    if (params?.provider) {
      match.provider = params.provider;
    }
    
    if (params?.startDate || params?.endDate) {
      match.timestamp = {};
      if (params.startDate) match.timestamp.$gte = params.startDate;
      if (params.endDate) match.timestamp.$lte = params.endDate;
    }
    
    const groupBy = params?.groupBy || 'day';
    const dateFormat = groupBy === 'month' ? '%Y-%m' : 
                      groupBy === 'week' ? '%Y-W%V' : '%Y-%m-%d';
    
    return await APIUsage.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$timestamp' } },
            provider: '$provider',
            category: '$category'
          },
          cost: { $sum: '$cost' },
          requests: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
  }
  
  /**
   * Set budget and alerts
   */
  async setBudget(monthly: number, alerts?: Array<{
    threshold: number; // percentage
    action: 'email' | 'webhook' | 'log';
    target?: string;
  }>): Promise<void> {
    this.monthlyBudget = monthly;
    
    if (alerts) {
      for (const alert of alerts) {
        this.on(`budget_${alert.threshold}`, async (data) => {
          switch (alert.action) {
            case 'email':
              // Send email notification
              logger.warn(`Budget alert: ${alert.threshold}% reached`, data);
              break;
            case 'webhook':
              // Call webhook
              if (alert.target) {
                await this.callWebhook(alert.target, data);
              }
              break;
            case 'log':
            default:
              logger.warn(`Budget alert: ${alert.threshold}% reached`, data);
          }
        });
      }
    }
  }
  
  /**
   * Check and trigger alerts
   */
  private async checkAlerts(provider: string, cost: number): Promise<void> {
    const monthlyUsage = await this.getMonthlyUsage();
    const percentUsed = (monthlyUsage.costs.total / this.monthlyBudget) * 100;
    
    // Check budget thresholds
    [50, 75, 90, 100].forEach(threshold => {
      if (percentUsed >= threshold && percentUsed < threshold + 5) {
        this.emit(`budget_${threshold}`, {
          threshold,
          spent: monthlyUsage.costs.total,
          budget: this.monthlyBudget,
          provider: provider,
          lastCost: cost
        });
      }
    });
    
    // Check provider-specific limits
    const providerConfig = this.providers.get(provider);
    if (providerConfig?.subscription) {
      const sub = await Subscription.findOne({ 
        provider: provider,
        'plan.status': 'active'
      });
      
      if (sub && sub.usage.credits) {
        const creditsUsed = (sub.usage.credits.used / sub.usage.credits.total) * 100;
        if (creditsUsed >= 90) {
          this.emit('credits_low', {
            provider: provider,
            used: sub.usage.credits.used,
            total: sub.usage.credits.total
          });
        }
      }
    }
  }
  
  /**
   * Get API health and performance metrics
   */
  async getAPIHealth(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const health = await APIUsage.aggregate([
      {
        $match: {
          timestamp: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: '$provider',
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: ['$success', 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' },
          p95ResponseTime: { $percentile: { input: '$responseTime', p: [0.95] } },
          errors: {
            $push: {
              $cond: [
                { $eq: ['$success', false] },
                { error: '$error', timestamp: '$timestamp' },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          provider: '$_id',
          totalRequests: 1,
          successRate: {
            $multiply: [
              { $divide: ['$successfulRequests', '$totalRequests'] },
              100
            ]
          },
          avgResponseTime: 1,
          p95ResponseTime: 1,
          recentErrors: {
            $slice: [
              { $filter: { input: '$errors', cond: { $ne: ['$$this', null] } } },
              5
            ]
          },
          status: {
            $cond: [
              { $gte: [{ $divide: ['$successfulRequests', '$totalRequests'] }, 0.99] },
              'healthy',
              {
                $cond: [
                  { $gte: [{ $divide: ['$successfulRequests', '$totalRequests'] }, 0.95] },
                  'degraded',
                  'unhealthy'
                ]
              }
            ]
          }
        }
      }
    ]);
    
    // Add rate limit status
    for (const provider of health) {
      const config = this.providers.get(provider.provider);
      if (config?.limits) {
        const recentRequests = await APIUsage.countDocuments({
          provider: provider.provider,
          timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
        });
        
        provider.rateLimitStatus = {
          current: recentRequests,
          limit: config.limits.requestsPerMinute || 60,
          percentage: (recentRequests / (config.limits.requestsPerMinute || 60)) * 100
        };
      }
    }
    
    return health;
  }
  
  /**
   * Optimize API usage
   */
  async getOptimizationSuggestions(): Promise<any> {
    const usage = await this.getMonthlyUsage();
    const suggestions = [];
    
    // Analyze usage patterns
    for (const provider of usage.providers) {
      const config = this.providers.get(provider._id);
      
      // Check for better plans
      if (config?.billingType === 'pay-per-use' && provider.totalCost > 100) {
        suggestions.push({
          provider: provider._id,
          type: 'plan_upgrade',
          message: `Consider switching to a subscription plan for ${provider._id}`,
          potentialSavings: provider.totalCost * 0.3
        });
      }
      
      // Check for inefficient endpoints
      for (const endpoint of provider.endpoints) {
        if (endpoint.successRate < 0.9) {
          suggestions.push({
            provider: provider._id,
            endpoint: endpoint.endpoint,
            type: 'error_rate',
            message: `High error rate (${Math.round((1 - endpoint.successRate) * 100)}%) on ${endpoint.endpoint}`,
            impact: endpoint.cost * (1 - endpoint.successRate)
          });
        }
        
        if (endpoint.avgResponseTime > 5000) {
          suggestions.push({
            provider: provider._id,
            endpoint: endpoint.endpoint,
            type: 'performance',
            message: `Slow response time (${Math.round(endpoint.avgResponseTime)}ms) on ${endpoint.endpoint}`,
            recommendation: 'Consider caching or batching requests'
          });
        }
      }
    }
    
    // Check for duplicate requests
    const duplicates = await APIUsage.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            provider: '$provider',
            endpoint: '$endpoint',
            path: '$path'
          },
          count: { $sum: 1 },
          cost: { $sum: '$cost' }
        }
      },
      {
        $match: { count: { $gt: 5 } }
      }
    ]);
    
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'caching',
        message: `Found ${duplicates.length} frequently repeated requests`,
        potentialSavings: duplicates.reduce((sum, d) => sum + (d.cost * 0.8), 0),
        recommendation: 'Implement caching to reduce duplicate API calls'
      });
    }
    
    return {
      suggestions,
      totalPotentialSavings: suggestions.reduce((sum, s) => sum + (s.potentialSavings || 0), 0)
    };
  }
  
  /**
   * Export usage report
   */
  async exportReport(format: 'json' | 'csv', params?: {
    startDate?: Date;
    endDate?: Date;
    providers?: string[];
  }): Promise<any> {
    const match: any = {};
    
    if (params?.startDate || params?.endDate) {
      match.timestamp = {};
      if (params.startDate) match.timestamp.$gte = params.startDate;
      if (params.endDate) match.timestamp.$lte = params.endDate;
    }
    
    if (params?.providers) {
      match.provider = { $in: params.providers };
    }
    
    const data = await APIUsage.find(match).sort({ timestamp: -1 });
    
    if (format === 'json') {
      return data;
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = ['timestamp', 'provider', 'endpoint', 'cost', 'quantity', 'success'];
      const rows = data.map(row => [
        row.timestamp,
        row.provider,
        row.endpoint,
        row.cost,
        row.quantity,
        row.success
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
  
  // Helper methods
  private getCurrentMonthKey(): string {
    return new Date().toISOString().substring(0, 7);
  }
  
  private async callWebhook(url: string, data: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      logger.error('Webhook call failed:', error);
    }
  }
  
  /**
   * Start monitoring background tasks
   */
  private startMonitoring(): void {
    // Check API health every 5 minutes
    setInterval(async () => {
      const health = await this.getAPIHealth();
      health.forEach((provider: any) => {
        if (provider.status === 'unhealthy') {
          this.emit('provider_unhealthy', provider);
        }
      });
    }, 5 * 60 * 1000);
    
    // Daily usage report
    setInterval(async () => {
      const usage = await this.getMonthlyUsage();
      logger.info('Daily API usage report:', usage);
      this.emit('daily_report', usage);
    }, 24 * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const apiCostTracker = APICostTracker.getInstance();