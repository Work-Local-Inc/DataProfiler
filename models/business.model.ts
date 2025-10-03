import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isPrimary: boolean;
  locationType: 'headquarters' | 'branch' | 'warehouse' | 'retail';
}

export interface IPerson {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  equity?: number;
  startDate?: Date;
}

export interface IMediaAsset {
  url: string;
  type: 'image' | 'video' | 'document';
  source: string;
  uploadDate: Date;
  tags: string[];
  isPrimary?: boolean;
}

export interface ISocialProfile {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
  username: string;
  followers?: number;
  engagement?: number;
  lastPost?: Date;
  verified?: boolean;
}

export interface ITechStack {
  hosting: {
    provider: string;
    type: 'shared' | 'vps' | 'dedicated' | 'cloud';
    ip?: string;
    cdn?: string;
    ssl: {
      provider: string;
      expiry: Date;
      grade?: string;
    };
  };
  domain: {
    registrar: string;
    nameservers: string[];
    dnsProvider: string;
    expirationDate: Date;
    whoisData?: any;
  };
  cms?: string;
  framework?: string[];
  ecommerce?: string;
  languages: string[];
  databases?: string[];
  analytics: Array<{
    tool: string;
    trackingId?: string;
  }>;
  emailProvider?: string;
  crm?: string;
  marketingAutomation?: string;
  chatbot?: string;
  pos?: string;
  reservationSystem?: string;
  deliveryPlatforms: string[];
  paymentProcessors: string[];
  security: string[];
  monitoring?: string[];
  detected: Date;
}

export interface IReview {
  platform: string;
  reviewId: string;
  author: string;
  rating: number;
  text: string;
  date: Date;
  verified: boolean;
  response?: {
    text: string;
    date: Date;
    author: string;
  };
  sentiment?: {
    score: number;
    aspects: Array<{
      aspect: string;
      sentiment: 'positive' | 'negative' | 'neutral';
    }>;
  };
  helpful?: number;
  images?: string[];
}

export interface ISEOProfile {
  domainAuthority: number;
  pageAuthority: number;
  trustFlow: number;
  citationFlow: number;
  backlinks: {
    total: number;
    dofollow: number;
    nofollow: number;
    referringDomains: number;
    topBacklinks: Array<{
      url: string;
      domain: string;
      authority: number;
      anchor: string;
      type: 'dofollow' | 'nofollow';
    }>;
    toxicScore: number;
  };
  keywords: {
    tracked: Array<{
      keyword: string;
      position: number;
      volume: number;
      difficulty: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    opportunities: Array<{
      keyword: string;
      volume: number;
      difficulty: number;
      estimatedTraffic: number;
    }>;
  };
  technical: {
    pageSpeed: {
      mobile: number;
      desktop: number;
      fcp: number;
      lcp: number;
      cls: number;
      tti: number;
    };
    mobileUsability: boolean;
    structuredData: string[];
    sitemapStatus: boolean;
    robotsTxt: boolean;
    httpsEnabled: boolean;
    crawlErrors: number;
  };
  localSEO: {
    napConsistency: number;
    citations: Array<{
      platform: string;
      url: string;
      accuracy: number;
    }>;
    googleMyBusinessOptimized: boolean;
    localSchema: boolean;
  };
  lastUpdated: Date;
}

export interface IDigitalAudit {
  score: number;
  lastAuditDate: Date;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    estimatedImpact: string;
    estimatedCost?: number;
    timeToImplement?: string;
  }>;
  competitiveAnalysis: {
    marketPosition: number;
    strengthsVsCompetitors: string[];
    weaknessesVsCompetitors: string[];
    opportunities: string[];
    threats: string[];
  };
  communityLinkOpportunities: Array<{
    businessId: string;
    businessName: string;
    connectionType: string;
    mutualBenefit: string;
    implementation: string;
    estimatedValue: number;
  }>;
}

export interface IBusiness extends Document {
  businessId: string;
  name: string;
  legalName?: string;
  ein?: string;
  established?: Date;
  
  locations: ILocation[];
  serviceAreas?: any[];
  deliveryZones?: any[];
  
  ownership: {
    owners: IPerson[];
    founders?: IPerson[];
    keyExecutives?: IPerson[];
    registeredAgent?: string;
    businessStructure?: 'LLC' | 'Corp' | 'Sole_Prop' | 'Partnership' | 'NonProfit';
  };
  
  websites: Array<{
    url: string;
    isPrimary: boolean;
    status: 'active' | 'inactive' | 'redirect';
  }>;
  
  socialProfiles: ISocialProfile[];
  techStack?: ITechStack;
  
  digitalAssets: {
    logos: IMediaAsset[];
    images: IMediaAsset[];
    videos: IMediaAsset[];
    menus?: IMediaAsset[];
  };
  
  reviews: {
    aggregate: {
      averageRating: number;
      totalReviews: number;
      distribution: {
        five: number;
        four: number;
        three: number;
        two: number;
        one: number;
      };
    };
    recent: IReview[];
    responseRate: number;
    averageResponseTime: number;
  };
  
  marketing: {
    ads: Array<{
      platform: string;
      campaignId: string;
      content: any;
      startDate: Date;
      endDate?: Date;
      spend?: number;
      impressions?: number;
      clicks?: number;
    }>;
    emailMarketing?: {
      provider: string;
      listSize?: number;
      openRate?: number;
      clickRate?: number;
      frequency?: string;
    };
    loyaltyPrograms?: any[];
    currentPromotions?: any[];
  };
  
  seoProfile?: ISEOProfile;
  digitalAudit?: IDigitalAudit;
  
  communityData: {
    nearbySchools?: Array<{
      name: string;
      type: string;
      distance: number;
    }>;
    nearbyBusinesses?: Array<{
      businessId: string;
      name: string;
      category: string;
      distance: number;
      relationship?: string;
    }>;
    partnerships?: Array<{
      partnerId: string;
      partnerName: string;
      type: string;
      since?: Date;
    }>;
    suppliers?: Array<{
      supplierId: string;
      supplierName: string;
      category: string;
    }>;
    competitors?: Array<{
      competitorId: string;
      competitorName: string;
      marketShare?: number;
      strengths?: string[];
    }>;
  };
  
  operations: {
    hours: Array<{
      dayOfWeek: number;
      open: string;
      close: string;
      isOpen: boolean;
    }>;
    capacity?: number;
    employees?: {
      fullTime?: number;
      partTime?: number;
      contractors?: number;
      total?: number;
    };
    revenue?: {
      estimated: number;
      range?: string;
      source?: string;
    };
    categories: string[];
    services?: string[];
    products?: any[];
    paymentMethods: string[];
    languages?: string[];
  };
  
  compliance: {
    licenses?: Array<{
      type: string;
      number: string;
      issuer: string;
      issued: Date;
      expires: Date;
      status: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: Date;
      expires?: Date;
    }>;
    healthScores?: Array<{
      score: number;
      grade?: string;
      date: Date;
      violations?: string[];
    }>;
  };
  
  metadata: {
    lastUpdated: Date;
    lastFullSync?: Date;
    dataQuality: {
      score: number;
      completeness: number;
      accuracy: number;
      consistency: number;
    };
    dataSources: Array<{
      source: string;
      lastSync: Date;
      status: 'active' | 'error' | 'pending';
      coverage: number;
    }>;
    updateFrequency: string;
    tags?: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>({
  businessId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  legalName: { type: String },
  ein: { type: String, sparse: true, index: true },
  established: { type: Date },
  
  locations: [{ type: Schema.Types.Mixed }],
  serviceAreas: [{ type: Schema.Types.Mixed }],
  deliveryZones: [{ type: Schema.Types.Mixed }],
  
  ownership: {
    owners: [{ type: Schema.Types.Mixed }],
    founders: [{ type: Schema.Types.Mixed }],
    keyExecutives: [{ type: Schema.Types.Mixed }],
    registeredAgent: String,
    businessStructure: {
      type: String,
      enum: ['LLC', 'Corp', 'Sole_Prop', 'Partnership', 'NonProfit']
    }
  },
  
  websites: [{
    url: String,
    isPrimary: Boolean,
    status: {
      type: String,
      enum: ['active', 'inactive', 'redirect']
    }
  }],
  
  socialProfiles: [{ type: Schema.Types.Mixed }],
  techStack: { type: Schema.Types.Mixed },
  
  digitalAssets: {
    logos: [{ type: Schema.Types.Mixed }],
    images: [{ type: Schema.Types.Mixed }],
    videos: [{ type: Schema.Types.Mixed }],
    menus: [{ type: Schema.Types.Mixed }]
  },
  
  reviews: {
    aggregate: {
      averageRating: Number,
      totalReviews: Number,
      distribution: {
        five: Number,
        four: Number,
        three: Number,
        two: Number,
        one: Number
      }
    },
    recent: [{ type: Schema.Types.Mixed }],
    responseRate: Number,
    averageResponseTime: Number
  },
  
  marketing: {
    ads: [{ type: Schema.Types.Mixed }],
    emailMarketing: { type: Schema.Types.Mixed },
    loyaltyPrograms: [{ type: Schema.Types.Mixed }],
    currentPromotions: [{ type: Schema.Types.Mixed }]
  },
  
  seoProfile: { type: Schema.Types.Mixed },
  digitalAudit: { type: Schema.Types.Mixed },
  
  communityData: {
    nearbySchools: [{ type: Schema.Types.Mixed }],
    nearbyBusinesses: [{ type: Schema.Types.Mixed }],
    partnerships: [{ type: Schema.Types.Mixed }],
    suppliers: [{ type: Schema.Types.Mixed }],
    competitors: [{ type: Schema.Types.Mixed }]
  },
  
  operations: {
    hours: [{
      dayOfWeek: Number,
      open: String,
      close: String,
      isOpen: Boolean
    }],
    capacity: Number,
    employees: {
      fullTime: Number,
      partTime: Number,
      contractors: Number,
      total: Number
    },
    revenue: {
      estimated: Number,
      range: String,
      source: String
    },
    categories: [String],
    services: [String],
    products: [{ type: Schema.Types.Mixed }],
    paymentMethods: [String],
    languages: [String]
  },
  
  compliance: {
    licenses: [{ type: Schema.Types.Mixed }],
    certifications: [{ type: Schema.Types.Mixed }],
    healthScores: [{ type: Schema.Types.Mixed }]
  },
  
  metadata: {
    lastUpdated: { type: Date, default: Date.now },
    lastFullSync: Date,
    dataQuality: {
      score: Number,
      completeness: Number,
      accuracy: Number,
      consistency: Number
    },
    dataSources: [{
      source: String,
      lastSync: Date,
      status: {
        type: String,
        enum: ['active', 'error', 'pending']
      },
      coverage: Number
    }],
    updateFrequency: String,
    tags: [String]
  }
}, {
  timestamps: true,
  collection: 'businesses'
});

BusinessSchema.index({ 'locations.coordinates': '2dsphere' });
BusinessSchema.index({ 'name': 'text', 'legalName': 'text' });
BusinessSchema.index({ 'operations.categories': 1 });
BusinessSchema.index({ 'metadata.lastUpdated': -1 });
BusinessSchema.index({ 'reviews.aggregate.averageRating': -1 });

export const Business = model<IBusiness>('Business', BusinessSchema);