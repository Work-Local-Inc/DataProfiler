# DataForSEO API Documentation

## Overview
DataForSEO provides comprehensive SEO data including backlinks, keywords, SERP, and traffic analytics at a fraction of the cost of traditional SEO tools. Pay-as-you-go pricing with no monthly commitments.

## Why DataForSEO?

### Cost Comparison (1000 domains/month)
| Service | Backlinks | Keywords | Traffic | Total Cost |
|---------|-----------|----------|---------|------------|
| DataForSEO | $20 | $30 | $10 | **$60/month** |
| Ahrefs API | Included | Included | Included | $449/month |
| SEMrush API | Included | Included | Included | $499/month |
| Moz API | Limited | No | No | $179/month |

### Key Advantages
- ✅ No monthly commitment - pure pay-per-use
- ✅ 180+ million domains in database
- ✅ 7+ billion keywords database
- ✅ 93 languages, 230 locations
- ✅ Real-time and historical data
- ✅ 99.95% uptime SLA

## API Endpoints

### Base URL
```
https://api.dataforseo.com/v3/
```

### Authentication
```http
Authorization: Basic base64(login:password)
```

## 1. Backlinks API

### Get Backlinks Summary
```http
POST https://api.dataforseo.com/v3/backlinks/summary/live
```

**Request:**
```json
[{
  "target": "example.com",
  "internal_list_limit": 10,
  "backlinks_filters": ["dofollow", "=", true],
  "include_subdomains": true
}]
```

**Response:**
```json
{
  "tasks": [{
    "result": [{
      "target": "example.com",
      "live_item_count": 15234,
      "lost_item_count": 892,
      "new_item_count": 234,
      "referring_domains": 892,
      "referring_domains_nofollow": 123,
      "referring_ips": 756,
      "referring_pages": 12456,
      "backlinks": 45678,
      "dofollow": 38920,
      "nofollow": 6758,
      "rank": 76,
      "main_domain_rank": 82,
      "last_updated": "2024-01-15"
    }]
  }]
}
```

### Get Detailed Backlinks
```http
POST https://api.dataforseo.com/v3/backlinks/backlinks/live
```

**Request:**
```json
[{
  "target": "example.com",
  "limit": 100,
  "offset": 0,
  "filters": [
    ["dofollow", "=", true],
    "and",
    ["domain_from_rank", ">", 50]
  ],
  "order_by": ["rank,desc"]
}]
```

**Response Fields:**
- `url_from` - Source URL
- `url_to` - Target URL
- `domain_from` - Source domain
- `domain_from_rank` - Source domain authority (0-100)
- `page_from_rank` - Source page authority
- `anchor` - Anchor text
- `dofollow` - Follow/nofollow status
- `original` - Is original link
- `alt` - Image alt text (for image links)
- `text_pre` - Text before link
- `text_post` - Text after link
- `semantic_location` - Link location (title, body, footer)
- `links_count` - Total links on source page
- `group_count` - Sitewide link count
- `is_broken` - Link status
- `first_seen` - First detection date
- `last_seen` - Last check date

### Get Referring Domains
```http
POST https://api.dataforseo.com/v3/backlinks/referring_domains/live
```

### Get Anchors
```http
POST https://api.dataforseo.com/v3/backlinks/anchors/live
```

### Get Competitors
```http
POST https://api.dataforseo.com/v3/backlinks/competitors/live
```

## 2. Keywords API

### Get Keyword Data
```http
POST https://api.dataforseo.com/v3/keywords_data/google/search_volume/live
```

**Request:**
```json
[{
  "keywords": [
    "seo tools",
    "keyword research",
    "backlink checker"
  ],
  "language_code": "en",
  "location_code": 2840
}]
```

**Response:**
```json
{
  "tasks": [{
    "result": [{
      "keyword": "seo tools",
      "search_volume": 74000,
      "competition": 0.65,
      "competition_level": "MEDIUM",
      "cpc": 5.23,
      "monthly_searches": [
        {"year": 2024, "month": 1, "search_volume": 68500},
        {"year": 2024, "month": 2, "search_volume": 71200}
      ],
      "keyword_difficulty": 67
    }]
  }]
}
```

### Get Keyword Suggestions
```http
POST https://api.dataforseo.com/v3/keywords_data/google/keywords_for_site/live
```

### Get Related Keywords
```http
POST https://api.dataforseo.com/v3/keywords_data/google/related_keywords/live
```

### Get Search Intent
```http
POST https://api.dataforseo.com/v3/keywords_data/google/search_intent/live
```

## 3. SERP API

### Get Search Results
```http
POST https://api.dataforseo.com/v3/serp/google/organic/live/advanced
```

**Request:**
```json
[{
  "keyword": "coffee shops near me",
  "location_code": 2840,
  "language_code": "en",
  "device": "desktop",
  "depth": 100
}]
```

**Response includes:**
- Organic results with positions
- Featured snippets
- Knowledge graph
- Local pack
- Related searches
- People also ask

### Get Rankings for Domain
```http
POST https://api.dataforseo.com/v3/serp/google/organic/live/regular
```

**Request:**
```json
[{
  "target": "example.com",
  "keywords": ["keyword1", "keyword2"],
  "location_code": 2840,
  "language_code": "en"
}]
```

## 4. Traffic Analytics API

### Get Traffic Estimation
```http
POST https://api.dataforseo.com/v3/traffic_analytics/similarweb/live
```

**Request:**
```json
[{
  "target": "example.com"
}]
```

**Response:**
```json
{
  "tasks": [{
    "result": [{
      "target": "example.com",
      "traffic": {
        "value": 523000,
        "percent_change": 5.2
      },
      "average_visit_duration": 245,
      "bounce_rate": 0.34,
      "page_views_per_visit": 3.4,
      "traffic_sources": {
        "direct": 0.42,
        "search": 0.35,
        "social": 0.12,
        "referral": 0.08,
        "mail": 0.03
      },
      "top_keywords": [
        {"keyword": "brand name", "traffic": 45000},
        {"keyword": "product category", "traffic": 23000}
      ],
      "competitors": [
        {"domain": "competitor1.com", "overlap": 0.65},
        {"domain": "competitor2.com", "overlap": 0.45}
      ]
    }]
  }]
}
```

## 5. Domain Analytics API

### Get Domain Overview
```http
POST https://api.dataforseo.com/v3/domain_analytics/overview/live
```

**Request:**
```json
[{
  "target": "example.com",
  "location_code": 2840,
  "language_code": "en"
}]
```

**Response:**
```json
{
  "domain": "example.com",
  "domain_rank": 82,
  "organic_traffic": 125000,
  "organic_keywords": 8934,
  "organic_cost": 45600,
  "adwords_traffic": 23000,
  "adwords_keywords": 234,
  "adwords_cost": 12300
}
```

## 6. On-Page API

### Website Audit
```http
POST https://api.dataforseo.com/v3/on_page/instant_pages
```

**Request:**
```json
[{
  "url": "https://example.com",
  "max_crawl_pages": 100,
  "load_resources": true,
  "enable_javascript": true
}]
```

**Response includes:**
- Page speed metrics
- Core Web Vitals
- Meta tags analysis
- Content quality
- Technical issues
- Mobile usability

## 7. Content Analysis API

### Analyze Content
```http
POST https://api.dataforseo.com/v3/content_analysis/search/live
```

**Request:**
```json
[{
  "keyword": "coffee brewing methods",
  "search_mode": "as_is",
  "filters": [
    ["content_info.word_count", ">", 1000]
  ]
}]
```

## Rate Limits & Pricing

### API Limits
- **Requests per second**: 10
- **Concurrent requests**: 30
- **Max results per request**: 1000

### Pricing Structure
| Endpoint | Price | Unit |
|----------|-------|------|
| Backlinks Summary | $0.02 | 1000 results |
| Backlinks List | $0.02 | 1000 results |
| Keywords Data | $0.75 | 1000 keywords |
| SERP Data | $3.00 | 1000 SERPs |
| Traffic Analytics | $0.0006 | per request |
| Domain Overview | $0.0006 | per request |
| On-Page Audit | $0.0015 | per page |

### Cost Examples

**Analyzing 100 businesses:**
```
- Domain overview: 100 × $0.0006 = $0.06
- Backlinks (1000 each): 100 × $0.02 = $2.00
- Keywords (100 each): 10,000 × $0.00075 = $7.50
- Traffic data: 100 × $0.0006 = $0.06
Total: ~$10
```

**Analyzing 1000 businesses:**
```
- Domain overview: 1000 × $0.0006 = $0.60
- Backlinks (1000 each): 1000 × $0.02 = $20.00
- Keywords (100 each): 100,000 × $0.00075 = $75.00
- Traffic data: 1000 × $0.0006 = $0.60
Total: ~$96
```

## Error Codes

| Code | Description |
|------|-------------|
| 20000 | Success |
| 40001 | Invalid field |
| 40006 | Invalid URL |
| 40101 | Invalid target |
| 40201 | API limit exceeded |
| 40401 | Authentication failed |
| 50001 | Internal error |

## SDK & Libraries

### Node.js
```bash
npm install @dataforseo/client
```

```javascript
const { Client } = require('@dataforseo/client');
const client = new Client('login', 'password');

// Get backlinks
const backlinks = await client.backlinks.summary.live([{
  target: 'example.com'
}]);

// Get keywords
const keywords = await client.keywords_data.google.search_volume.live([{
  keywords: ['seo', 'marketing'],
  location_code: 2840
}]);
```

### Python
```bash
pip install dataforseo-client
```

```python
from dataforseo_client import Client

client = Client('login', 'password')

# Get backlinks
response = client.backlinks.summary.live([{
    'target': 'example.com'
}])

# Get keywords
response = client.keywords_data.google.search_volume.live([{
    'keywords': ['seo', 'marketing'],
    'location_code': 2840
}])
```

## Best Practices

1. **Batch Requests**: Send multiple targets in one request to reduce API calls
2. **Use Filters**: Apply filters to get only relevant data
3. **Cache Results**: Store results for at least 24 hours
4. **Rate Limiting**: Implement exponential backoff for retries
5. **Pagination**: Use offset/limit for large result sets
6. **Webhook Support**: Use postback_url for async processing

## Use Cases

### Complete Business Analysis
```javascript
async function analyzeBusinessSEO(domain) {
  const tasks = await Promise.all([
    // Get domain overview
    client.domain_analytics.overview.live([{ target: domain }]),
    
    // Get backlinks profile
    client.backlinks.summary.live([{ target: domain }]),
    
    // Get top keywords
    client.domain_analytics.organic.live([{ 
      target: domain,
      limit: 100 
    }]),
    
    // Get traffic estimate
    client.traffic_analytics.similarweb.live([{ target: domain }]),
    
    // Get top competitors
    client.backlinks.competitors.live([{ target: domain }])
  ]);
  
  return consolidateData(tasks);
}
```

### Monitor Keyword Rankings
```javascript
async function trackKeywords(domain, keywords) {
  return await client.serp.google.organic.live.regular([{
    target: domain,
    keywords: keywords,
    location_code: 2840,
    language_code: 'en'
  }]);
}
```

### Find Link Building Opportunities
```javascript
async function findLinkOpportunities(domain) {
  // Get competitor backlinks
  const competitors = await client.backlinks.competitors.live([{
    target: domain
  }]);
  
  // Get their unique referring domains
  const opportunities = await client.backlinks.intersections.live([{
    targets: competitors.map(c => c.domain),
    exclude_targets: [domain]
  }]);
  
  return opportunities;
}
```

## Support

- Documentation: https://docs.dataforseo.com/
- API Playground: https://api.dataforseo.com/v3/explorer
- Status Page: https://status.dataforseo.com/
- Support: support@dataforseo.com