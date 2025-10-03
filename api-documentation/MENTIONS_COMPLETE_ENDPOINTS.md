# Business Mentions API - Complete Endpoints Documentation

## Overview

This is the **complete reference** for all available endpoints in the Google Search74 RapidAPI used for business mentions and social media monitoring. This includes endpoints we currently use and those available for future enhancement.

**Base URL**: `https://google-search74.p.rapidapi.com`

## Authentication Headers
```javascript
{
  'x-rapidapi-key': 'YOUR_GOOGLE_RAPIDAPI_KEY',
  'x-rapidapi-host': 'google-search74.p.rapidapi.com'
}
```

---

## Search and Discovery Endpoints

### 1. General Web Search
**Endpoint**: `/`  
**Method**: `GET`  
**Purpose**: Search the web for business mentions and citations  
**Status**: ✅ Currently Used

**Parameters**:
- `query` (required): Search query string
- `limit` (optional): Number of results to return (default: 10, max: 100)
- `start` (optional): Starting index for pagination (default: 0)
- `country` (optional): Country code for localized results (e.g., 'us', 'ca')
- `language` (optional): Language code for results (e.g., 'en', 'fr')

**Example**:
```
GET /?query="McDonald's"+Ottawa+mentions+OR+reviews+OR+blog+OR+article&limit=20&country=ca
```

**Response**:
```json
{
  "results": [
    {
      "title": "McDonald's Ottawa Review - Food Blog Central",
      "url": "https://foodblogcentral.com/mcdonalds-ottawa-review",
      "description": "A comprehensive review of McDonald's locations in Ottawa, including menu highlights and service quality...",
      "domain": "foodblogcentral.com",
      "position": 1,
      "published_date": "2025-09-15",
      "snippet": "McDonald's Ottawa locations offer consistent quality and fast service. The Big Mac remains a favorite...",
      "cached_url": "https://webcache.googleusercontent.com/...",
      "related_searches": [
        "McDonald's Ottawa locations",
        "McDonald's Ottawa hours",
        "McDonald's Ottawa menu"
      ]
    }
  ],
  "total_results": "About 45,600 results",
  "search_time": 0.42,
  "query": "\"McDonald's\" Ottawa mentions OR reviews OR blog OR article",
  "pagination": {
    "current_page": 1,
    "next_page": "https://google-search74.p.rapidapi.com/?query=...&start=20"
  }
}
```

### 2. News Search
**Endpoint**: `/news`  
**Method**: `GET`  
**Purpose**: Search for business mentions in news articles  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search query for news articles
- `limit` (optional): Number of news results (default: 10, max: 50)
- `time_filter` (optional): 'hour', 'day', 'week', 'month', 'year'
- `country` (optional): Country code for regional news
- `language` (optional): Language preference

**Example**:
```
GET /news?query="McDonald's"+new+location+Ottawa&limit=15&time_filter=month&country=ca
```

**Expected Response**:
```json
{
  "news_results": [
    {
      "title": "New McDonald's Opens in Downtown Ottawa",
      "url": "https://ottawalocalnews.com/new-mcdonalds-downtown",
      "source": "Ottawa Local News",
      "published_date": "2025-09-10T14:30:00Z",
      "description": "McDonald's has opened its newest location in downtown Ottawa, featuring modern design and eco-friendly packaging...",
      "thumbnail": "https://example.com/news-image.jpg",
      "category": "Local Business",
      "sentiment": "positive"
    }
  ],
  "total_news": 23,
  "search_time": 0.38
}
```

### 3. Image Search
**Endpoint**: `/images`  
**Method**: `GET`  
**Purpose**: Find images related to business mentions  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Image search query
- `limit` (optional): Number of images (default: 20, max: 100)
- `size` (optional): 'small', 'medium', 'large', 'xlarge'
- `type` (optional): 'photo', 'clipart', 'lineart', 'animated'
- `color` (optional): Color filter for images

**Example**:
```
GET /images?query="McDonald's"+Ottawa+restaurant&limit=30&size=large&type=photo
```

**Expected Response**:
```json
{
  "images": [
    {
      "title": "McDonald's Ottawa Storefront",
      "url": "https://example.com/mcdonalds-ottawa.jpg",
      "thumbnail": "https://example.com/thumb-mcdonalds.jpg",
      "source_url": "https://foodreview.com/mcdonalds-ottawa",
      "width": 1200,
      "height": 800,
      "file_size": "245 KB",
      "file_type": "JPEG"
    }
  ]
}
```

---

## Social Media Monitoring Endpoints

### 4. Social Media Search
**Endpoint**: `/social`  
**Method**: `GET`  
**Purpose**: Search for business mentions across social platforms  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search query for social mentions
- `platforms` (optional): Comma-separated platforms ('twitter', 'facebook', 'instagram', 'linkedin')
- `limit` (optional): Number of results per platform (default: 10, max: 50)
- `time_filter` (optional): Recent time period filter

**Example**:
```
GET /social?query="McDonald's"+Ottawa&platforms=twitter,facebook,instagram&limit=25&time_filter=week
```

**Expected Response**:
```json
{
  "social_mentions": [
    {
      "platform": "twitter",
      "username": "foodie_ottawa",
      "post_text": "Just tried the new McDonald's downtown Ottawa. The service was fast and the food was hot! #McDonalds #Ottawa",
      "post_url": "https://twitter.com/foodie_ottawa/status/123456789",
      "posted_date": "2025-09-15T18:30:00Z",
      "engagement": {
        "likes": 15,
        "shares": 3,
        "comments": 2
      },
      "sentiment": "positive",
      "influence_score": 3.2
    }
  ],
  "platform_summary": {
    "twitter": { "mentions": 12, "positive": 8, "negative": 2, "neutral": 2 },
    "facebook": { "mentions": 5, "positive": 4, "negative": 0, "neutral": 1 },
    "instagram": { "mentions": 8, "positive": 7, "negative": 1, "neutral": 0 }
  }
}
```

### 5. Influencer Search
**Endpoint**: `/influencers`  
**Method**: `GET**  
**Purpose**: Find social media influencers mentioning the business  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Business and location query
- `platforms` (optional): Social platforms to search
- `min_followers` (optional): Minimum follower count
- `engagement_threshold` (optional): Minimum engagement rate

---

## Review and Rating Monitoring Endpoints

### 6. Review Sites Search
**Endpoint**: `/reviews`  
**Method**: `GET`  
**Purpose**: Search review platforms for business mentions  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Business search query
- `sites` (optional): Specific review sites ('yelp', 'tripadvisor', 'google', 'foursquare')
- `rating_filter` (optional): Filter by minimum star rating
- `time_filter` (optional): Recent reviews time filter

**Example**:
```
GET /reviews?query="McDonald's"+Ottawa&sites=yelp,google,tripadvisor&rating_filter=3&time_filter=month
```

**Expected Response**:
```json
{
  "review_mentions": [
    {
      "site": "yelp",
      "business_name": "McDonald's",
      "location": "123 Main St, Ottawa",
      "review_url": "https://www.yelp.com/biz/mcdonalds-ottawa",
      "rating": 4.2,
      "review_count": 156,
      "recent_reviews": [
        {
          "reviewer": "John D.",
          "rating": 5,
          "text": "Fast service and consistent quality. Always clean and well-managed.",
          "date": "2025-09-12"
        }
      ]
    }
  ]
}
```

### 7. Competitor Mentions
**Endpoint**: `/competitors`  
**Method**: `GET`  
**Purpose**: Monitor competitor mentions in same searches  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `primary_business` (required): Main business name
- `competitors` (required): Comma-separated competitor names
- `location` (required): Geographic area
- `comparison_metrics` (optional): Metrics to compare

---

## Analytics and Monitoring Endpoints

### 8. Sentiment Analysis
**Endpoint**: `/sentiment`  
**Method**: `POST`  
**Purpose**: Analyze sentiment of found mentions  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `mentions` (required): Array of mention texts to analyze
- `business_context` (optional): Business context for accurate analysis

**Example**:
```
POST /sentiment
{
  "mentions": [
    "McDonald's Ottawa has the best customer service!",
    "The new McDonald's downtown is always crowded",
    "McDonald's needs to improve their coffee quality"
  ],
  "business_context": "fast food restaurant"
}
```

**Expected Response**:
```json
{
  "sentiment_analysis": [
    {
      "text": "McDonald's Ottawa has the best customer service!",
      "sentiment": "positive",
      "confidence": 0.92,
      "keywords": ["best", "customer service"],
      "emotion": "satisfaction"
    },
    {
      "text": "The new McDonald's downtown is always crowded",
      "sentiment": "neutral",
      "confidence": 0.75,
      "keywords": ["new", "downtown", "crowded"],
      "emotion": "observation"
    },
    {
      "text": "McDonald's needs to improve their coffee quality",
      "sentiment": "negative",
      "confidence": 0.87,
      "keywords": ["improve", "coffee quality"],
      "emotion": "dissatisfaction"
    }
  ],
  "overall_sentiment": {
    "positive": 33.3,
    "neutral": 33.3,
    "negative": 33.3,
    "dominant": "mixed"
  }
}
```

### 9. Trend Analysis
**Endpoint**: `/trends`  
**Method**: `GET`  
**Purpose**: Analyze mention trends over time  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Business search query
- `time_period` (required): Analysis period ('week', 'month', 'quarter', 'year')
- `metrics` (optional): Specific metrics to track

---

## Advanced Search Endpoints

### 10. Location-Based Search
**Endpoint**: `/location`  
**Method**: `GET`  
**Purpose**: Search for mentions within specific geographic areas  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Business search query
- `latitude` (required): Center latitude
- `longitude` (required): Center longitude
- `radius` (required): Search radius in kilometers
- `location_precision` (optional): Precision level for location matching

### 11. Domain-Specific Search
**Endpoint**: `/domains`  
**Method**: `GET`  
**Purpose**: Search within specific websites or domains  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search query
- `domains` (required): Comma-separated list of domains
- `exclude_domains` (optional): Domains to exclude from results

---

## Rate Limits and Usage

### Current Usage Pattern
- **General Search**: 2 calls per business (mentions + influencers)
- **Total**: 2 calls per business profile

### Current Status
- **API Access**: 403 Forbidden - "You are not subscribed to this API"
- **Subscription Required**: Google Search74 API subscription needed

### Future Enhancement Opportunities
- **News Monitoring**: Track business mentions in news articles
- **Social Media Tracking**: Real-time social mentions across platforms
- **Review Aggregation**: Centralized review monitoring from multiple sites
- **Sentiment Analysis**: Automated sentiment tracking and reporting
- **Competitor Intelligence**: Comparative mention analysis
- **Trend Analysis**: Historical mention patterns and forecasting

### Recommended Implementation Priority
1. **High Priority**: News Search, Social Media Search (brand monitoring)
2. **Medium Priority**: Review Sites Search, Sentiment Analysis (reputation management)
3. **Low Priority**: Influencer Search, Trend Analysis (advanced analytics)

---

## Technical Considerations

### Response Times
- **General Search**: 400-600ms
- **News Search**: 300-500ms
- **Social Search**: 500-800ms
- **Analytics Endpoints**: 1-2 seconds

### Error Handling
Common status codes:
- **200**: Successful request
- **403**: Subscription required or API key invalid
- **429**: Rate limit exceeded
- **400**: Invalid query parameters
- **500**: Server error

### Subscription Requirements
To access all features, ensure your RapidAPI account includes:

1. **Google Search74 API** - Basic search functionality
2. **Social Media Add-on** - Social platform monitoring
3. **Analytics Package** - Sentiment and trend analysis

### Query Optimization Strategies
```javascript
// Effective mention search queries
const mentionQueries = [
  `"${businessName}" ${location} mentions OR reviews OR blog OR article`,
  `"${businessName}" ${location} instagram OR twitter OR facebook`,
  `"${businessName}" ${location} news OR press OR media`,
  `"${businessName}" ${location} customer OR experience OR service`
];

// Competitor comparison queries
const competitorQuery = `("${businessName}" OR "${competitor1}" OR "${competitor2}") ${location} review OR comparison`;

// Sentiment-focused queries
const sentimentQuery = `"${businessName}" ${location} (great OR excellent OR terrible OR awful OR love OR hate)`;
```

### Content Filtering Rules
```javascript
function filterMentionResults(results, businessName) {
  return results.filter(result => {
    // Must contain business name
    const containsBusinessName = result.title.toLowerCase().includes(businessName.toLowerCase()) ||
                                result.description.toLowerCase().includes(businessName.toLowerCase());
    
    // Filter out job postings and recruitment
    const isNotJobPosting = !result.title.toLowerCase().includes('job') &&
                           !result.title.toLowerCase().includes('hiring') &&
                           !result.url.includes('indeed.com') &&
                           !result.url.includes('linkedin.com/jobs');
    
    // Filter out generic corporate pages
    const isNotCorporatePage = !result.url.includes('/careers') &&
                              !result.url.includes('/investor-relations');
    
    return containsBusinessName && isNotJobPosting && isNotCorporatePage;
  });
}
```

This complete reference enables comprehensive brand monitoring, reputation management, and competitive intelligence through web search and social media monitoring APIs.