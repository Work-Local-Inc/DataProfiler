# BuiltWith API - Schema Transformation Guide

## Overview
This guide shows how to transform BuiltWith API responses into our unified DataProfiler business schema.

## BuiltWith to DataProfiler Mapping

### Core Technology Stack Mapping

#### BuiltWith Response Structure
```json
{
  "Results": [{
    "Result": {
      "Paths": [
        {
          "Name": "Analytics and Tracking",
          "Technologies": [
            {
              "Name": "Google Analytics",
              "Link": "https://analytics.google.com",
              "Categories": ["Analytics", "Google"]
            }
          ]
        }
      ]
    }
  }]
}
```

#### DataProfiler techStack Schema
```typescript
techStack: {
  // Infrastructure
  hosting: {
    provider: string,     // Map from "Web Hosting" path
    type: string,        // Derive from provider
    cdn: string,         // Map from "CDN" path
    ssl: {
      provider: string,  // Map from "SSL Certificate" path
      grade: string
    }
  },
  
  // Platform & Framework
  cms: string,           // Map from "CMS" path
  framework: string[],   // Map from "Framework" path
  ecommerce: string,     // Map from "Ecommerce" path
  languages: string[],   // Map from "Programming Language" path
  
  // Marketing Tools
  analytics: [],         // Map from "Analytics and Tracking" path
  emailProvider: string, // Map from "Email Hosting" path
  crm: string,          // Map from "CRM" path
  marketingAutomation: string, // Map from "Marketing Automation" path
  
  // Additional mappings...
}
```

## Transformation Functions

### 1. Transform Core Technology Data

```javascript
function transformBuiltWithToTechStack(builtWithData) {
  const result = builtWithData.Results[0].Result;
  const techStack = {
    hosting: {},
    domain: {},
    analytics: [],
    security: [],
    detected: new Date()
  };
  
  // Process each technology path
  result.Paths.forEach(path => {
    switch(path.Name) {
      case 'Web Hosting':
        techStack.hosting = transformHosting(path.Technologies);
        break;
      case 'Analytics and Tracking':
        techStack.analytics = transformAnalytics(path.Technologies);
        break;
      case 'Content Management System':
        techStack.cms = path.Technologies[0]?.Name;
        break;
      case 'Ecommerce':
        techStack.ecommerce = transformEcommerce(path.Technologies);
        break;
      case 'SSL Certificate':
        techStack.hosting.ssl = transformSSL(path.Technologies);
        break;
      case 'CDN':
        techStack.hosting.cdn = path.Technologies[0]?.Name;
        break;
      case 'Email Hosting':
        techStack.emailProvider = path.Technologies[0]?.Name;
        break;
      case 'Framework':
        techStack.framework = path.Technologies.map(t => t.Name);
        break;
      case 'Programming Language':
        techStack.languages = path.Technologies.map(t => t.Name);
        break;
      case 'Payment':
        techStack.paymentProcessors = path.Technologies.map(t => t.Name);
        break;
      case 'Widgets':
        techStack.widgets = transformWidgets(path.Technologies);
        break;
      case 'Advertising':
        techStack.advertising = transformAdvertising(path.Technologies);
        break;
    }
  });
  
  return techStack;
}
```

### 2. Transform Hosting Information

```javascript
function transformHosting(technologies) {
  const hosting = {
    provider: '',
    type: 'unknown',
    ip: '',
    cdn: ''
  };
  
  technologies.forEach(tech => {
    hosting.provider = tech.Name;
    
    // Determine hosting type based on provider
    if (tech.Name.includes('AWS') || tech.Name.includes('Amazon')) {
      hosting.type = 'cloud';
    } else if (tech.Name.includes('Cloudflare')) {
      hosting.type = 'cloud';
      hosting.cdn = 'Cloudflare';
    } else if (tech.Name.includes('GoDaddy') || tech.Name.includes('Bluehost')) {
      hosting.type = 'shared';
    } else if (tech.Name.includes('DigitalOcean') || tech.Name.includes('Linode')) {
      hosting.type = 'vps';
    }
  });
  
  return hosting;
}
```

### 3. Transform Analytics Tools

```javascript
function transformAnalytics(technologies) {
  return technologies.map(tech => ({
    tool: tech.Name,
    trackingId: extractTrackingId(tech),
    category: tech.Categories[0] || 'analytics',
    isPremium: tech.IsPremium || false
  }));
}

function extractTrackingId(tech) {
  // Extract tracking IDs from technology data if available
  if (tech.Name === 'Google Analytics' && tech.Data) {
    return tech.Data.match(/UA-\d+-\d+/)?.[0] || null;
  }
  return null;
}
```

### 4. Transform E-commerce Data

```javascript
function transformEcommerce(technologies) {
  const primary = technologies[0];
  if (!primary) return null;
  
  const ecommerceData = {
    platform: primary.Name,
    version: primary.Version,
    plugins: [],
    features: []
  };
  
  // Map specific platforms to additional data
  switch(primary.Name.toLowerCase()) {
    case 'shopify':
      ecommerceData.tier = detectShopifyTier(technologies);
      ecommerceData.monthlySpend = estimateShopifySpend(ecommerceData.tier);
      break;
    case 'woocommerce':
      ecommerceData.plugins = technologies
        .filter(t => t.Name.includes('WooCommerce'))
        .map(t => t.Name);
      break;
    case 'magento':
      ecommerceData.edition = primary.Name.includes('Enterprise') ? 'enterprise' : 'community';
      break;
  }
  
  return ecommerceData;
}
```

### 5. Transform Company Metadata

```javascript
function transformMetadata(builtWithMeta) {
  return {
    ownership: {
      owners: [],
      businessStructure: determineStructure(builtWithMeta.CompanyName)
    },
    
    locations: [{
      address: builtWithMeta.Address,
      city: builtWithMeta.City,
      state: builtWithMeta.State,
      country: builtWithMeta.Country,
      postalCode: builtWithMeta.Postcode,
      isPrimary: true,
      locationType: 'headquarters'
    }],
    
    operations: {
      categories: [builtWithMeta.Vertical],
      revenue: {
        estimated: estimateRevenue(builtWithMeta),
        source: 'BuiltWith Estimation'
      }
    },
    
    socialProfiles: transformSocialProfiles(builtWithMeta.Social),
    
    metadata: {
      dataSources: [{
        source: 'BuiltWith',
        lastSync: new Date(),
        status: 'active',
        coverage: calculateCoverage(builtWithMeta)
      }]
    }
  };
}
```

### 6. Transform Social Profiles

```javascript
function transformSocialProfiles(socialData) {
  if (!socialData) return [];
  
  return socialData.map(profile => ({
    platform: profile.Platform.toLowerCase(),
    url: profile.Url || `https://${profile.Platform.toLowerCase()}.com/${profile.Handle}`,
    username: profile.Handle,
    verified: false
  }));
}
```

### 7. Calculate Technology Spend

```javascript
function calculateTechSpend(technologies) {
  let totalSpend = 0;
  const breakdown = {};
  
  technologies.forEach(path => {
    path.Technologies.forEach(tech => {
      const cost = estimateTechCost(tech.Name);
      if (cost > 0) {
        totalSpend += cost;
        breakdown[tech.Name] = cost;
      }
    });
  });
  
  return {
    estimated: totalSpend,
    breakdown: breakdown,
    currency: 'USD',
    period: 'monthly'
  };
}

function estimateTechCost(techName) {
  const costs = {
    // E-commerce Platforms
    'Shopify': 29,
    'Shopify Plus': 2000,
    'BigCommerce': 29,
    'WooCommerce': 0,
    'Magento': 0,
    
    // Analytics
    'Google Analytics': 0,
    'Google Analytics 360': 12500,
    'Adobe Analytics': 1000,
    'Mixpanel': 25,
    
    // Email Marketing
    'Mailchimp': 20,
    'Klaviyo': 45,
    'Constant Contact': 20,
    'SendGrid': 15,
    
    // CRM
    'Salesforce': 25,
    'HubSpot': 50,
    'Pipedrive': 15,
    
    // Support
    'Zendesk': 19,
    'Intercom': 74,
    'Drift': 50,
    
    // CDN
    'Cloudflare': 20,
    'Fastly': 50,
    'Akamai': 300
  };
  
  return costs[techName] || 0;
}
```

### 8. Lead Scoring Based on Technology

```javascript
function calculateLeadScore(techStack) {
  let score = 0;
  const signals = {
    // Positive signals
    hasEcommerce: techStack.ecommerce ? 20 : 0,
    hasAnalytics: techStack.analytics.length > 0 ? 10 : 0,
    hasMarketing: techStack.marketingAutomation ? 15 : 0,
    hasCRM: techStack.crm ? 15 : 0,
    hasSSL: techStack.hosting.ssl ? 10 : 0,
    
    // Technology maturity
    multipleAnalytics: techStack.analytics.length > 1 ? 10 : 0,
    premiumTools: techStack.analytics.some(a => a.isPremium) ? 20 : 0,
    
    // Spending indicators
    highSpend: calculateTechSpend(techStack).estimated > 500 ? 25 : 0
  };
  
  Object.values(signals).forEach(value => score += value);
  
  return {
    score: Math.min(100, score),
    signals: signals,
    tier: score > 75 ? 'hot' : score > 50 ? 'warm' : 'cold'
  };
}
```

### 9. Technology Migration Detection

```javascript
function detectMigrations(historicalData) {
  const migrations = [];
  const categories = ['ecommerce', 'cms', 'analytics', 'crm'];
  
  categories.forEach(category => {
    const history = historicalData[category];
    if (history && history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        if (history[i].name !== history[i-1].name) {
          migrations.push({
            category: category,
            from: history[i-1].name,
            to: history[i].name,
            date: history[i].detectedDate,
            daysAgo: daysBetween(new Date(), history[i].detectedDate)
          });
        }
      }
    }
  });
  
  return migrations;
}
```

### 10. Complete Transformation Pipeline

```javascript
class BuiltWithTransformer {
  async transformToDataProfiler(domain) {
    try {
      // 1. Fetch from BuiltWith API
      const builtWithData = await this.fetchBuiltWithData(domain);
      
      // 2. Transform technology stack
      const techStack = transformBuiltWithToTechStack(builtWithData);
      
      // 3. Transform company metadata
      const metadata = transformMetadata(builtWithData.Results[0].Result.Meta);
      
      // 4. Calculate technology spend
      const techSpend = calculateTechSpend(builtWithData.Results[0].Result.Paths);
      
      // 5. Generate lead score
      const leadScore = calculateLeadScore(techStack);
      
      // 6. Detect technology changes
      const historicalData = await this.fetchHistoricalData(domain);
      const migrations = detectMigrations(historicalData);
      
      // 7. Build final business object
      const business = {
        businessId: generateBusinessId(domain),
        name: metadata.ownership.businessName || domain,
        websites: [{
          url: `https://${domain}`,
          isPrimary: true,
          status: 'active'
        }],
        techStack: techStack,
        ...metadata,
        marketing: {
          techSpend: techSpend,
          leadScore: leadScore,
          migrations: migrations
        },
        metadata: {
          lastUpdated: new Date(),
          dataSources: [{
            source: 'BuiltWith',
            lastSync: new Date(),
            status: 'active',
            coverage: 85
          }],
          dataQuality: {
            score: calculateDataQuality(builtWithData),
            completeness: calculateCompleteness(builtWithData)
          }
        }
      };
      
      return business;
      
    } catch (error) {
      console.error('BuiltWith transformation error:', error);
      throw error;
    }
  }
  
  async fetchBuiltWithData(domain) {
    const response = await axios.get(
      `https://api.builtwith.com/v20/api.json`,
      {
        params: {
          KEY: process.env.BUILTWITH_API_KEY,
          LOOKUP: domain
        }
      }
    );
    return response.data;
  }
  
  async fetchHistoricalData(domain) {
    const response = await axios.get(
      `https://api.builtwith.com/v20/history.json`,
      {
        params: {
          KEY: process.env.BUILTWITH_API_KEY,
          LOOKUP: domain
        }
      }
    );
    return response.data;
  }
}
```

## Field Mapping Reference

| BuiltWith Field | DataProfiler Field | Transformation |
|-----------------|-------------------|----------------|
| Result.Paths[Web Hosting].Technologies | techStack.hosting.provider | Direct mapping |
| Result.Paths[CDN].Technologies | techStack.hosting.cdn | Direct mapping |
| Result.Paths[SSL Certificate] | techStack.hosting.ssl | Transform to object |
| Result.Paths[Analytics and Tracking] | techStack.analytics | Array transformation |
| Result.Paths[Ecommerce] | techStack.ecommerce | Platform detection |
| Result.Paths[Payment] | techStack.paymentProcessors | Array mapping |
| Result.Paths[Framework] | techStack.framework | Array mapping |
| Result.Meta.CompanyName | ownership.businessName | Direct mapping |
| Result.Meta.Vertical | operations.categories | Array wrap |
| Result.Meta.Country | locations[0].country | Direct mapping |
| Result.Meta.ARank | seoProfile.domainAuthority | Scale transformation |
| Result.Meta.Social | socialProfiles | Array transformation |
| Result.Attributes.Live | metadata.isLive | Boolean mapping |
| Result.Attributes.LastUpdated | metadata.lastUpdated | Date parsing |

## Usage Example

```javascript
// In your data collection service
const transformer = new BuiltWithTransformer();
const businessData = await transformer.transformToDataProfiler('example.com');

// Save to database
await Business.findOneAndUpdate(
  { businessId: businessData.businessId },
  businessData,
  { upsert: true, new: true }
);
```