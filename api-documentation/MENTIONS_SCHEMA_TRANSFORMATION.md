# Business Mentions API - Schema Transformation Guide

## Overview

This document shows how we transform raw business mentions search results into our structured business profiling schema. It includes content filtering, sentiment analysis, and competitive intelligence processing.

---

## Raw API Response Structure

### Current Response (Subscription Required)
```json
{
  "mentions_response": {
    "error": "403 Forbidden",
    "message": "You are not subscribed to this API.",
    "status": "failed"
  },
  "influencers_response": {
    "error": "403 Forbidden", 
    "message": "You are not subscribed to this API.",
    "status": "failed"
  }
}
```

### Expected Full Response Structure (When Subscribed)
```json
{
  "mentions_response": {
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
        "related_searches": ["McDonald's Ottawa locations", "McDonald's Ottawa hours"]
      }
    ],
    "total_results": "About 45,600 results",
    "search_time": 0.42,
    "query": "\"McDonald's\" Ottawa mentions OR reviews OR blog OR article"
  },
  "influencers_response": {
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
        "follower_count": 2500,
        "influence_score": 3.2
      }
    ]
  }
}
```

---

## Our Structured Output Schema

### Target Business Mentions Format
```json
{
  "mentions": [
    {
      "source": "web|news|social|review",
      "platform": "string",
      "title": "string",
      "url": "string",
      "content": "string",
      "domain": "string",
      "published_date": "ISO_8601_string",
      "sentiment": "positive|neutral|negative",
      "relevance_score": "number",
      "authority_score": "number",
      "mention_type": "review|news|blog|social|forum",
      "keywords": ["string"],
      "engagement": {
        "likes": "number",
        "shares": "number",
        "comments": "number"
      }
    }
  ],
  "socialInfluencers": [
    {
      "platform": "string",
      "username": "string",
      "display_name": "string",
      "profile_url": "string",
      "follower_count": "number",
      "influence_score": "number",
      "recent_mentions": [
        {
          "post_text": "string",
          "post_url": "string",
          "date": "ISO_8601_string",
          "engagement": "object",
          "sentiment": "string"
        }
      ]
    }
  ],
  "mentionAnalysis": {
    "totalMentions": "number",
    "sentimentDistribution": {
      "positive": "number",
      "neutral": "number", 
      "negative": "number"
    },
    "sourceDistribution": {
      "web": "number",
      "social": "number",
      "news": "number",
      "reviews": "number"
    },
    "topKeywords": ["string"],
    "authorityDomains": ["string"],
    "recentTrends": {
      "mention_velocity": "number",
      "sentiment_trend": "improving|stable|declining"
    }
  }
}
```

---

## Data Transformation Rules

### 1. Mention Classification and Filtering

**Content Classification**:
```javascript
function classifyMentionType(result) {
  const url = result.url.toLowerCase();
  const title = result.title.toLowerCase();
  const description = result.description.toLowerCase();
  
  // Review platforms
  if (url.includes('yelp.com') || url.includes('tripadvisor.com') || 
      url.includes('google.com/maps') || url.includes('foursquare.com')) {
    return 'review';
  }
  
  // News sites
  if (url.includes('news') || url.includes('cbc.ca') || url.includes('ctvnews.ca') ||
      title.includes('news') || description.includes('breaking')) {
    return 'news';
  }
  
  // Social media
  if (url.includes('twitter.com') || url.includes('facebook.com') || 
      url.includes('instagram.com') || url.includes('linkedin.com')) {
    return 'social';
  }
  
  // Blog content
  if (url.includes('blog') || title.includes('blog') || 
      description.includes('blogger') || description.includes('personal experience')) {
    return 'blog';
  }
  
  // Forum discussions
  if (url.includes('reddit.com') || url.includes('forum') || 
      url.includes('community') || title.includes('discussion')) {
    return 'forum';
  }
  
  return 'web'; // General web content
}

function calculateRelevanceScore(result, businessName, location) {
  let score = 0;
  const title = result.title.toLowerCase();
  const description = result.description.toLowerCase();
  const businessLower = businessName.toLowerCase();
  const locationLower = location.toLowerCase();
  
  // Business name relevance (0-40 points)
  if (title.includes(businessLower)) score += 20;
  if (description.includes(businessLower)) score += 15;
  if (result.url.includes(businessLower.replace(/\s+/g, ''))) score += 5;
  
  // Location relevance (0-30 points)
  if (title.includes(locationLower)) score += 15;
  if (description.includes(locationLower)) score += 10;
  if (result.url.includes(locationLower.replace(/\s+/g, ''))) score += 5;
  
  // Content quality indicators (0-30 points)
  if (result.published_date) score += 5; // Recent content
  if (result.description.length > 100) score += 5; // Substantial content
  if (isAuthorityDomain(result.domain)) score += 20; // Trusted source
  
  return Math.min(score, 100);
}
```

**Content Filtering Rules**:
```javascript
function filterBusinessMentions(results, businessName, location) {
  return results
    .filter(result => {
      // Must contain business name
      const containsBusinessName = 
        result.title.toLowerCase().includes(businessName.toLowerCase()) ||
        result.description.toLowerCase().includes(businessName.toLowerCase());
      
      if (!containsBusinessName) return false;
      
      // Filter out irrelevant content
      const isJobPosting = result.title.toLowerCase().includes('job') ||
                          result.title.toLowerCase().includes('hiring') ||
                          result.url.includes('indeed.com') ||
                          result.url.includes('linkedin.com/jobs');
      
      const isCorporatePage = result.url.includes('/careers') ||
                             result.url.includes('/investor-relations') ||
                             result.url.includes('/corporate');
      
      const isSpam = result.title.length < 10 ||
                    result.description.length < 20 ||
                    result.domain.includes('spam') ||
                    result.domain.includes('fake');
      
      return !isJobPosting && !isCorporatePage && !isSpam;
    })
    .map(result => transformMention(result, businessName, location))
    .sort((a, b) => b.relevance_score - a.relevance_score); // Sort by relevance
}

function transformMention(result, businessName, location) {
  return {
    source: determineSource(result),
    platform: extractPlatform(result.domain),
    title: cleanTitle(result.title),
    url: result.url,
    content: cleanContent(result.description),
    domain: result.domain,
    published_date: parseDate(result.published_date),
    sentiment: analyzeSentiment(result.title + ' ' + result.description),
    relevance_score: calculateRelevanceScore(result, businessName, location),
    authority_score: calculateAuthorityScore(result.domain),
    mention_type: classifyMentionType(result),
    keywords: extractKeywords(result.title + ' ' + result.description),
    engagement: extractEngagement(result)
  };
}
```

### 2. Sentiment Analysis Processing

**Sentiment Classification**:
```javascript
function analyzeSentiment(text) {
  if (!text) return { sentiment: 'neutral', confidence: 0 };
  
  const textLower = text.toLowerCase();
  
  // Positive sentiment indicators
  const positiveWords = [
    'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'love', 'best',
    'perfect', 'outstanding', 'incredible', 'awesome', 'superb', 'brilliant',
    'delicious', 'fast', 'friendly', 'clean', 'fresh', 'quality', 'recommend'
  ];
  
  // Negative sentiment indicators
  const negativeWords = [
    'terrible', 'awful', 'worst', 'horrible', 'disgusting', 'hate', 'bad',
    'pathetic', 'disappointing', 'slow', 'dirty', 'rude', 'cold', 'stale',
    'expensive', 'overpriced', 'poor', 'unprofessional', 'avoid', 'never again'
  ];
  
  // Neutral indicators
  const neutralWords = [
    'okay', 'average', 'normal', 'standard', 'typical', 'regular', 'fine',
    'adequate', 'decent', 'reasonable', 'acceptable'
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count sentiment words with context weighting
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      positiveScore += matches.length;
      // Boost score if word appears in title or first sentence
      if (textLower.indexOf(word) < 100) positiveScore += 0.5;
    }
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      negativeScore += matches.length;
      if (textLower.indexOf(word) < 100) negativeScore += 0.5;
    }
  });
  
  neutralWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) neutralScore += matches.length;
  });
  
  // Determine dominant sentiment
  const totalScore = positiveScore + negativeScore + neutralScore;
  if (totalScore === 0) return { sentiment: 'neutral', confidence: 0 };
  
  const positiveRatio = positiveScore / totalScore;
  const negativeRatio = negativeScore / totalScore;
  
  if (positiveRatio > 0.6) {
    return { sentiment: 'positive', confidence: positiveRatio };
  } else if (negativeRatio > 0.6) {
    return { sentiment: 'negative', confidence: negativeRatio };
  } else {
    return { sentiment: 'neutral', confidence: Math.max(positiveRatio, negativeRatio) };
  }
}

function calculateSentimentDistribution(mentions) {
  const total = mentions.length;
  if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
  
  const distribution = mentions.reduce((acc, mention) => {
    acc[mention.sentiment]++;
    return acc;
  }, { positive: 0, neutral: 0, negative: 0 });
  
  return {
    positive: Math.round((distribution.positive / total) * 100),
    neutral: Math.round((distribution.neutral / total) * 100),
    negative: Math.round((distribution.negative / total) * 100)
  };
}
```

### 3. Social Influencer Processing

**Influencer Analysis**:
```javascript
function processInfluencers(socialMentions) {
  if (!socialMentions || socialMentions.length === 0) {
    return {
      influencers: [],
      analysis: {
        totalInfluencers: 0,
        avgInfluenceScore: 0,
        platformDistribution: {},
        engagementLevels: {}
      }
    };
  }
  
  // Group mentions by username/account
  const influencerMap = {};
  
  socialMentions.forEach(mention => {
    const key = `${mention.platform}_${mention.username}`;
    
    if (!influencerMap[key]) {
      influencerMap[key] = {
        platform: mention.platform,
        username: mention.username,
        display_name: mention.display_name || mention.username,
        profile_url: constructProfileUrl(mention.platform, mention.username),
        follower_count: mention.follower_count || 0,
        influence_score: calculateInfluenceScore(mention),
        recent_mentions: []
      };
    }
    
    influencerMap[key].recent_mentions.push({
      post_text: mention.post_text,
      post_url: mention.post_url,
      date: mention.posted_date,
      engagement: mention.engagement,
      sentiment: analyzeSentiment(mention.post_text).sentiment
    });
  });
  
  // Convert to array and sort by influence
  const influencers = Object.values(influencerMap)
    .sort((a, b) => b.influence_score - a.influence_score);
  
  return {
    influencers: influencers,
    analysis: analyzeInfluencerData(influencers)
  };
}

function calculateInfluenceScore(mention) {
  let score = 0;
  
  // Follower count weight (0-50 points)
  const followers = mention.follower_count || 0;
  if (followers > 100000) score += 50;
  else if (followers > 10000) score += 30;
  else if (followers > 1000) score += 15;
  else if (followers > 100) score += 5;
  
  // Engagement weight (0-30 points)
  if (mention.engagement) {
    const totalEngagement = (mention.engagement.likes || 0) + 
                           (mention.engagement.shares || 0) + 
                           (mention.engagement.comments || 0);
    
    if (totalEngagement > 100) score += 30;
    else if (totalEngagement > 50) score += 20;
    else if (totalEngagement > 10) score += 10;
    else if (totalEngagement > 1) score += 5;
  }
  
  // Platform weight (0-20 points)
  const platformWeights = {
    'twitter': 15,
    'instagram': 20,
    'facebook': 10,
    'linkedin': 12,
    'tiktok': 18,
    'youtube': 20
  };
  score += platformWeights[mention.platform] || 5;
  
  return Math.min(score, 100);
}
```

### 4. Authority and Domain Analysis

**Authority Scoring**:
```javascript
function calculateAuthorityScore(domain) {
  // High authority domains (news, established review sites)
  const highAuthority = [
    'cbc.ca', 'ctvnews.ca', 'globalnews.ca', 'theglobeandmail.com',
    'yelp.com', 'tripadvisor.com', 'foursquare.com', 'google.com',
    'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'
  ];
  
  // Medium authority domains
  const mediumAuthority = [
    'blogto.com', 'narcity.com', 'dailyhive.com', 'mtlblog.com',
    'foodnetwork.ca', 'allrecipes.com', 'zomato.com', 'opentable.com'
  ];
  
  // Check against known authority lists
  if (highAuthority.includes(domain)) return 90;
  if (mediumAuthority.includes(domain)) return 60;
  
  // Calculate based on domain characteristics
  let score = 30; // Base score
  
  // TLD scoring
  if (domain.endsWith('.com')) score += 10;
  if (domain.endsWith('.ca') || domain.endsWith('.org')) score += 15;
  if (domain.endsWith('.gov') || domain.endsWith('.edu')) score += 25;
  
  // Domain age and length indicators
  if (domain.length < 15 && !domain.includes('-') && !domain.includes('123')) {
    score += 10; // Likely established domain
  }
  
  // News/media indicators
  if (domain.includes('news') || domain.includes('media') || domain.includes('press')) {
    score += 15;
  }
  
  // Food/restaurant specific domains
  if (domain.includes('food') || domain.includes('restaurant') || domain.includes('dining')) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function identifyAuthorityDomains(mentions) {
  const domainScores = {};
  
  mentions.forEach(mention => {
    const domain = mention.domain;
    if (!domainScores[domain]) {
      domainScores[domain] = {
        domain: domain,
        authority_score: calculateAuthorityScore(domain),
        mention_count: 0,
        avg_relevance: 0,
        total_relevance: 0
      };
    }
    
    domainScores[domain].mention_count++;
    domainScores[domain].total_relevance += mention.relevance_score;
    domainScores[domain].avg_relevance = domainScores[domain].total_relevance / domainScores[domain].mention_count;
  });
  
  return Object.values(domainScores)
    .filter(domain => domain.authority_score >= 60)
    .sort((a, b) => b.authority_score - a.authority_score)
    .slice(0, 10)
    .map(domain => domain.domain);
}
```

### 5. Keyword and Trend Analysis

**Keyword Extraction**:
```javascript
function extractKeywords(text, businessName) {
  if (!text) return [];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word))
    .filter(word => !businessName.toLowerCase().includes(word));
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeTrends(mentions) {
  if (mentions.length === 0) {
    return {
      mention_velocity: 0,
      sentiment_trend: 'stable'
    };
  }
  
  // Calculate mention velocity (mentions per day)
  const dates = mentions
    .map(m => new Date(m.published_date))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a - b);
  
  if (dates.length < 2) {
    return { mention_velocity: 0, sentiment_trend: 'stable' };
  }
  
  const daySpan = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
  const mentionVelocity = daySpan > 0 ? mentions.length / daySpan : 0;
  
  // Analyze sentiment trend
  const recentMentions = mentions.filter(m => {
    const date = new Date(m.published_date);
    const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7; // Last week
  });
  
  const olderMentions = mentions.filter(m => {
    const date = new Date(m.published_date);
    const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24);
    return daysAgo > 7 && daysAgo <= 14; // Previous week
  });
  
  const recentPositive = recentMentions.filter(m => m.sentiment === 'positive').length;
  const olderPositive = olderMentions.filter(m => m.sentiment === 'positive').length;
  
  const recentPositiveRate = recentMentions.length > 0 ? recentPositive / recentMentions.length : 0;
  const olderPositiveRate = olderMentions.length > 0 ? olderPositive / olderMentions.length : 0;
  
  let sentimentTrend = 'stable';
  if (recentPositiveRate > olderPositiveRate + 0.1) sentimentTrend = 'improving';
  else if (recentPositiveRate < olderPositiveRate - 0.1) sentimentTrend = 'declining';
  
  return {
    mention_velocity: Math.round(mentionVelocity * 10) / 10,
    sentiment_trend: sentimentTrend
  };
}
```

---

## Error Handling for API Limitations

### Current API Status Handling
```javascript
function handleMentionsApiLimitation(businessName, location) {
  return {
    mentions: [],
    socialInfluencers: [],
    mentionAnalysis: {
      totalMentions: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      sourceDistribution: { web: 0, social: 0, news: 0, reviews: 0 },
      topKeywords: [],
      authorityDomains: [],
      recentTrends: {
        mention_velocity: 0,
        sentiment_trend: 'unknown'
      }
    },
    apiStatus: {
      status: 'subscription_required',
      error: '403 Forbidden',
      message: 'You are not subscribed to this API',
      recommendations: [
        'Subscribe to Google Search74 API on RapidAPI',
        'Configure GOOGLE_RAPIDAPI_KEY environment variable',
        'Consider alternative mention monitoring services',
        'Implement manual brand monitoring workflow'
      ],
      alternatives: [
        'Google Alerts for email notifications',
        'Social media platform native search',
        'Manual review site monitoring',
        'Third-party brand monitoring tools'
      ]
    },
    lastAttempted: new Date().toISOString(),
    searchQueries: generateSearchQueries(businessName, location)
  };
}

function generateSearchQueries(businessName, location) {
  return [
    `"${businessName}" ${location} mentions OR reviews OR blog OR article`,
    `"${businessName}" ${location} instagram OR twitter OR facebook`,
    `"${businessName}" ${location} news OR press OR media`,
    `"${businessName}" ${location} customer OR experience OR service`
  ];
}
```

---

## Storage Schema Mapping

### Database Table Mapping
```sql
-- Business mentions storage
INSERT INTO business_mentions (business_id, platform, mention_type, url, title, content, sentiment, relevance_score)
VALUES (business_id, mention.platform, mention.mention_type, mention.url, mention.title, mention.content, mention.sentiment, mention.relevance_score);

-- Social influencers tracking
INSERT INTO business_influencers (business_id, platform, username, follower_count, influence_score, last_mention_date)
VALUES (business_id, influencer.platform, influencer.username, influencer.follower_count, influencer.influence_score, NOW());

-- Mention analytics
INSERT INTO business_mention_analytics (business_id, analysis_date, total_mentions, positive_sentiment_pct, negative_sentiment_pct, mention_velocity)
VALUES (business_id, NOW(), analysis.totalMentions, analysis.sentimentDistribution.positive, analysis.sentimentDistribution.negative, analysis.recentTrends.mention_velocity);
```

### Raw Data Archive
```javascript
const rawDataRecord = {
  business_id: businessId,
  source_type: 'api_response',
  source_name: 'google_search74',
  search_query: `"${businessName}" ${location} mentions`,
  raw_response_json: {
    mentions_response: mentionsData,
    influencers_response: influencersData,
    extraction_timestamp: new Date().toISOString(),
    api_version: 'google_search74_v1',
    subscription_status: 'required',
    search_queries_attempted: generateSearchQueries(businessName, location)
  },
  response_status: 403,
  processing_status: 'failed_subscription_required'
};
```

This schema transformation provides the framework for comprehensive brand monitoring and reputation management once API access is properly configured with the required subscription.