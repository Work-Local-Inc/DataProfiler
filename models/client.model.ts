import { Schema, model, Document, Types } from 'mongoose';

export interface IOAuthToken {
  platform: 'facebook' | 'instagram' | 'twitter' | 'google' | 'yelp' | 'tripadvisor';
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string[];
  accountId?: string;
  accountName?: string;
  pageIds?: string[];
  lastRefreshed: Date;
}

export interface IClientPermissions {
  dataAccess: {
    reviews: boolean;
    analytics: boolean;
    posts: boolean;
    ads: boolean;
    messages: boolean;
    insights: boolean;
  };
  management: {
    postContent: boolean;
    respondToReviews: boolean;
    manageAds: boolean;
    updateBusinessInfo: boolean;
    manageOffers: boolean;
  };
  reporting: {
    viewReports: boolean;
    exportData: boolean;
    shareReports: boolean;
  };
}

export interface IContract {
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'terminated' | 'expired';
  services: string[];
  monthlyFee?: number;
  performanceFee?: number;
  terms?: string;
  signedBy: {
    client: {
      name: string;
      date: Date;
      ip?: string;
    };
    agency?: {
      name: string;
      date: Date;
    };
  };
}

export interface IClient extends Document {
  clientId: string;
  businessId: string;
  businessName: string;
  
  relationship: {
    type: 'managed' | 'monitored' | 'prospect';
    startDate: Date;
    accountManager?: string;
    teamMembers?: string[];
  };
  
  oauthTokens: IOAuthToken[];
  
  permissions: IClientPermissions;
  
  contract?: IContract;
  
  integrations: {
    facebook?: {
      pageId: string;
      pageAccessToken: string;
      businessAccountId?: string;
      adAccountId?: string;
      connected: boolean;
      connectedAt?: Date;
      permissions: string[];
    };
    instagram?: {
      businessAccountId: string;
      username: string;
      connected: boolean;
      connectedAt?: Date;
    };
    google?: {
      accountId: string;
      locationId?: string;
      myBusinessAccountId?: string;
      analyticsViewId?: string;
      adsCustomerId?: string;
      connected: boolean;
      connectedAt?: Date;
    };
    twitter?: {
      userId: string;
      username: string;
      connected: boolean;
      connectedAt?: Date;
    };
    yelp?: {
      businessAlias: string;
      connected: boolean;
      connectedAt?: Date;
    };
    tripadvisor?: {
      locationId: string;
      connected: boolean;
      connectedAt?: Date;
    };
  };
  
  automations: {
    autoRespond: {
      enabled: boolean;
      platforms: string[];
      templates?: Map<string, string>;
      responseTime?: number;
    };
    scheduledPosts: {
      enabled: boolean;
      calendar?: Array<{
        platform: string;
        scheduledAt: Date;
        content: string;
        media?: string[];
        status: 'scheduled' | 'published' | 'failed';
      }>;
    };
    reporting: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      lastSent?: Date;
    };
  };
  
  activity: {
    lastAccess?: Date;
    totalApiCalls: number;
    monthlyApiCalls: Map<string, number>;
    actions: Array<{
      timestamp: Date;
      action: string;
      platform?: string;
      details?: any;
      performedBy?: string;
    }>;
  };
  
  billing: {
    status: 'active' | 'overdue' | 'suspended';
    lastPayment?: {
      date: Date;
      amount: number;
      method: string;
      invoiceId: string;
    };
    nextBilling?: Date;
    credits?: number;
    usage?: {
      apiCalls: number;
      storage: number;
      reports: number;
    };
  };
  
  notes?: Array<{
    date: Date;
    author: string;
    content: string;
    type: 'general' | 'technical' | 'billing' | 'support';
  }>;
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastSync?: Date;
    tags?: string[];
    customFields?: Map<string, any>;
  };
}

const ClientSchema = new Schema<IClient>({
  clientId: { type: String, required: true, unique: true },
  businessId: { type: String, required: true, ref: 'Business' },
  businessName: { type: String, required: true },
  
  relationship: {
    type: {
      type: String,
      enum: ['managed', 'monitored', 'prospect'],
      required: true
    },
    startDate: { type: Date, default: Date.now },
    accountManager: String,
    teamMembers: [String]
  },
  
  oauthTokens: [{
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'google', 'yelp', 'tripadvisor']
    },
    accessToken: { type: String, required: true },
    refreshToken: String,
    expiresAt: Date,
    scope: [String],
    accountId: String,
    accountName: String,
    pageIds: [String],
    lastRefreshed: { type: Date, default: Date.now }
  }],
  
  permissions: {
    dataAccess: {
      reviews: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      posts: { type: Boolean, default: false },
      ads: { type: Boolean, default: false },
      messages: { type: Boolean, default: false },
      insights: { type: Boolean, default: false }
    },
    management: {
      postContent: { type: Boolean, default: false },
      respondToReviews: { type: Boolean, default: false },
      manageAds: { type: Boolean, default: false },
      updateBusinessInfo: { type: Boolean, default: false },
      manageOffers: { type: Boolean, default: false }
    },
    reporting: {
      viewReports: { type: Boolean, default: true },
      exportData: { type: Boolean, default: false },
      shareReports: { type: Boolean, default: false }
    }
  },
  
  contract: {
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'terminated', 'expired']
    },
    services: [String],
    monthlyFee: Number,
    performanceFee: Number,
    terms: String,
    signedBy: {
      client: {
        name: String,
        date: Date,
        ip: String
      },
      agency: {
        name: String,
        date: Date
      }
    }
  },
  
  integrations: {
    facebook: {
      pageId: String,
      pageAccessToken: String,
      businessAccountId: String,
      adAccountId: String,
      connected: Boolean,
      connectedAt: Date,
      permissions: [String]
    },
    instagram: {
      businessAccountId: String,
      username: String,
      connected: Boolean,
      connectedAt: Date
    },
    google: {
      accountId: String,
      locationId: String,
      myBusinessAccountId: String,
      analyticsViewId: String,
      adsCustomerId: String,
      connected: Boolean,
      connectedAt: Date
    },
    twitter: {
      userId: String,
      username: String,
      connected: Boolean,
      connectedAt: Date
    },
    yelp: {
      businessAlias: String,
      connected: Boolean,
      connectedAt: Date
    },
    tripadvisor: {
      locationId: String,
      connected: Boolean,
      connectedAt: Date
    }
  },
  
  automations: {
    autoRespond: {
      enabled: { type: Boolean, default: false },
      platforms: [String],
      templates: { type: Map, of: String },
      responseTime: Number
    },
    scheduledPosts: {
      enabled: { type: Boolean, default: false },
      calendar: [{
        platform: String,
        scheduledAt: Date,
        content: String,
        media: [String],
        status: {
          type: String,
          enum: ['scheduled', 'published', 'failed']
        }
      }]
    },
    reporting: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      },
      recipients: [String],
      lastSent: Date
    }
  },
  
  activity: {
    lastAccess: Date,
    totalApiCalls: { type: Number, default: 0 },
    monthlyApiCalls: { type: Map, of: Number },
    actions: [{
      timestamp: { type: Date, default: Date.now },
      action: String,
      platform: String,
      details: Schema.Types.Mixed,
      performedBy: String
    }]
  },
  
  billing: {
    status: {
      type: String,
      enum: ['active', 'overdue', 'suspended'],
      default: 'active'
    },
    lastPayment: {
      date: Date,
      amount: Number,
      method: String,
      invoiceId: String
    },
    nextBilling: Date,
    credits: Number,
    usage: {
      apiCalls: Number,
      storage: Number,
      reports: Number
    }
  },
  
  notes: [{
    date: { type: Date, default: Date.now },
    author: String,
    content: String,
    type: {
      type: String,
      enum: ['general', 'technical', 'billing', 'support']
    }
  }],
  
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastSync: Date,
    tags: [String],
    customFields: { type: Map, of: Schema.Types.Mixed }
  }
}, {
  timestamps: true,
  collection: 'clients'
});

ClientSchema.index({ clientId: 1 });
ClientSchema.index({ businessId: 1 });
ClientSchema.index({ 'relationship.type': 1 });
ClientSchema.index({ 'billing.status': 1 });
ClientSchema.index({ 'metadata.updatedAt': -1 });

export const Client = model<IClient>('Client', ClientSchema);