# BuiltWith API Documentation

## Overview
BuiltWith is a web technology profiler that detects what technologies websites are using. The API provides access to current and historical technology information of websites, including CMS, frameworks, analytics tools, hosting providers, and over 68,000+ tracked technologies.

## Key Features
- Technology detection across 68,000+ technologies
- Historical technology data
- Lead generation lists
- Competitor analysis
- Technology trends
- SaaS customer discovery

## API Endpoints

### Base URL
```
https://api.builtwith.com/v20/
```

### Authentication
All requests require an API key passed as a parameter:
```
?KEY=[YOUR_API_KEY]
```

## Core APIs

### 1. Domain API
Get detailed technology profile for a specific domain.

**Endpoint:**
```
GET https://api.builtwith.com/v20/api.json
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| KEY | string | Yes | Your API key |
| LOOKUP | string | Yes | Domain to analyze (e.g., "example.com") |
| hideAll | boolean | No | Hide technology description, link, tag and category fields |
| hideDescriptionAndLinks | boolean | No | Hide technology description and link fields |
| onlyLiveTechnologies | boolean | No | Only return currently active technologies |
| noMetaData | boolean | No | Exclude metadata (address, names, etc.) |
| noAttributeData | boolean | No | Exclude attributes data |

**Example Request:**
```bash
GET https://api.builtwith.com/v20/api.json?KEY=your_key&LOOKUP=spotify.com
```

**Response Structure:**
```json
{
  "Results": [
    {
      "Result": {
        "Paths": [
          {
            "Name": "Analytics and Tracking",
            "Technologies": [
              {
                "Name": "Google Analytics",
                "Link": "https://analytics.google.com",
                "Description": "Google Analytics is a web analytics service...",
                "Tag": "analytics",
                "Categories": ["Analytics", "Google"],
                "FirstDetected": 1234567890000,
                "LastDetected": 1634567890000,
                "IsPremium": false
              }
            ]
          }
        ],
        "Meta": {
          "CompanyName": "Spotify AB",
          "Vertical": "Entertainment",
          "Social": [
            {
              "Platform": "Twitter",
              "Handle": "@spotify"
            }
          ],
          "Emails": ["press@spotify.com"],
          "Telephones": ["+1-xxx-xxx-xxxx"],
          "Country": "United States",
          "State": "New York",
          "City": "New York",
          "Postcode": "10001",
          "Address": "xxx Street Name",
          "ARank": 150,
          "QRank": 200000
        },
        "Attributes": {
          "MJRank": 1500,
          "MJTLDRank": 800,
          "RefSN": 1000,
          "RefIP": 500,
          "DMOZ": "",
          "Live": true,
          "LastUpdated": "2024-01-15",
          "Language": "en"
        }
      },
      "Lookup": "spotify.com"
    }
  ],
  "Errors": []
}
```

### 2. Lists API
Get lists of websites using specific technologies.

**Endpoint:**
```
GET https://api.builtwith.com/v20/lists.json
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| KEY | string | Yes | Your API key |
| TECH | string | Yes | Technology name (e.g., "Shopify") |
| OFFSET | integer | No | Starting position (default: 0) |
| LIMIT | integer | No | Number of results (max: 1000) |
| META | boolean | No | Include metadata |
| SINCE | date | No | Sites added since date (YYYY-MM-DD) |

**Example Request:**
```bash
GET https://api.builtwith.com/v20/lists.json?KEY=your_key&TECH=shopify&LIMIT=100
```

**Response Structure:**
```json
{
  "Results": [
    {
      "Domain": "example-store.com",
      "FirstDetected": 1234567890000,
      "LastDetected": 1634567890000,
      "Spend": 299,
      "Meta": {
        "CompanyName": "Example Store Inc",
        "Country": "United States",
        "ARank": 50000
      }
    }
  ],
  "Total": 150000,
  "Offset": 0,
  "Limit": 100,
  "Errors": []
}
```

### 3. Relationships API
Find websites with technology relationships.

**Endpoint:**
```
GET https://api.builtwith.com/v20/relationships.json
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| KEY | string | Yes | Your API key |
| LOOKUP | string | Yes | Domain to analyze |
| TECH1 | string | Yes | First technology |
| TECH2 | string | Yes | Second technology |

**Example Request:**
```bash
GET https://api.builtwith.com/v20/relationships.json?KEY=your_key&LOOKUP=example.com&TECH1=shopify&TECH2=klaviyo
```

### 4. Trends API
Get technology trend data.

**Endpoint:**
```
GET https://api.builtwith.com/v20/trends.json
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| KEY | string | Yes | Your API key |
| TECH | string | Yes | Technology name |
| DATE | string | No | Specific date (YYYY-MM-DD) |
| RANGE | string | No | Date range (e.g., "1m", "3m", "1y") |

### 5. Free API
Limited free access for basic lookups.

**Endpoint:**
```
GET https://api.builtwith.com/free1/api.json
```

**Rate Limit:** 1 request per second

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| KEY | string | Yes | Your free API key |
| LOOKUP | string | Yes | Domain to analyze |

## Technology Categories

BuiltWith tracks technologies across these major categories:

### Infrastructure
- Hosting Providers
- SSL Certificates
- CDN
- Name Servers
- Email Hosting
- DNS Providers

### Analytics & Tracking
- Web Analytics
- Tag Managers
- Conversion Tracking
- Heatmaps
- A/B Testing

### E-commerce
- Shopping Carts
- Payment Processors
- Shipping Providers
- Product Reviews
- Inventory Management

### Marketing
- Email Marketing
- Marketing Automation
- CRM
- Live Chat
- Push Notifications
- Popup/Form Builders

### Content Management
- CMS
- Blogging Platforms
- Wiki Software
- Forum Software

### Frameworks & Libraries
- JavaScript Frameworks
- CSS Frameworks
- PHP Frameworks
- Python Frameworks
- Mobile Frameworks

### Advertising
- Ad Networks
- Retargeting
- Affiliate Programs
- Ad Servers

### Widgets
- Social Widgets
- Video Players
- Audio Players
- Photo Galleries

## Response Fields

### Technology Object
| Field | Type | Description |
|-------|------|-------------|
| Name | string | Technology name |
| Link | string | Technology website/documentation |
| Description | string | Technology description |
| Tag | string | Primary category tag |
| Categories | array | All applicable categories |
| FirstDetected | timestamp | First detection date (milliseconds) |
| LastDetected | timestamp | Last detection date (milliseconds) |
| IsPremium | boolean | Premium technology flag |

### Meta Object
| Field | Type | Description |
|-------|------|-------------|
| CompanyName | string | Company/organization name |
| Vertical | string | Industry vertical |
| Social | array | Social media profiles |
| Emails | array | Contact emails |
| Telephones | array | Phone numbers |
| Country | string | Country |
| State | string | State/Province |
| City | string | City |
| Postcode | string | Postal code |
| Address | string | Street address |
| ARank | integer | Alexa rank |
| QRank | integer | Quantcast rank |

### Attributes Object
| Field | Type | Description |
|-------|------|-------------|
| MJRank | integer | Majestic rank |
| MJTLDRank | integer | Majestic TLD rank |
| RefSN | integer | Referring subnets |
| RefIP | integer | Referring IPs |
| Live | boolean | Site is live |
| LastUpdated | date | Last update date |
| Language | string | Primary language |

## Rate Limits

- **Standard:** Maximum 10 requests per second
- **Concurrent:** Maximum 8 concurrent requests
- **Free API:** 1 request per second

For rate limit removal, contact BuiltWith for dedicated endpoint solutions.

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Exceeded rate limits |
| 404 | Not found - Domain not found |
| 429 | Too many requests |
| 500 | Internal server error |

## Best Practices

1. **Caching:** Cache responses for at least 24 hours to reduce API calls
2. **Batch Processing:** Use the Lists API for bulk lookups instead of individual domain calls
3. **Rate Management:** Implement exponential backoff for rate limit errors
4. **Data Freshness:** Use LastUpdated field to determine if data needs refresh
5. **Error Handling:** Always check the Errors array in responses

## Use Cases

### Lead Generation
Find potential customers using specific technologies:
```javascript
// Find all Shopify stores spending >$1000/month
const leads = await builtwith.getLists({
  tech: 'shopify',
  spend: { min: 1000 },
  limit: 1000
});
```

### Competitor Analysis
Analyze competitor technology stacks:
```javascript
// Get competitor's full tech stack
const competitor = await builtwith.getDomain({
  lookup: 'competitor.com',
  onlyLiveTechnologies: true
});
```

### Technology Migration Tracking
Monitor technology changes:
```javascript
// Find sites that switched from WooCommerce to Shopify
const migrations = await builtwith.getRelationships({
  tech1: 'woocommerce',
  tech2: 'shopify',
  relationship: 'switched'
});
```

### Market Research
Analyze technology trends:
```javascript
// Get Shopify adoption trend over last year
const trend = await builtwith.getTrends({
  tech: 'shopify',
  range: '1y'
});
```

## Pricing Tiers

### Basic Plan
- 5,000 lookups/month
- Domain API access
- Basic support

### Pro Plan
- 50,000 lookups/month
- All API endpoints
- Historical data
- Priority support

### Enterprise Plan
- Unlimited lookups
- Custom rate limits
- Dedicated endpoints
- SLA guarantees
- Custom integrations

## Support

- Documentation: https://api.builtwith.com
- Support Email: support@builtwith.com
- Status Page: https://status.builtwith.com