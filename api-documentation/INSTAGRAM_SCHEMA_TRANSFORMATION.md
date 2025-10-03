# Instagram API - Schema Transformation Guide

## Overview

This document shows how we transform raw Instagram API responses into our structured business profiling schema. It includes content filtering, image prioritization, and engagement analysis guidelines.

---

## Raw API Response Structure

### Example: Real McDonald's Instagram Data
```json
{
  "profile_response": {
    "username": "mcdonalds",
    "full_name": "McDonald's",
    "biography": "The official Instagram for McDonald's. Download our app for exclusive deals! 🍟",
    "followers_count": 4200000,
    "following_count": 1250,
    "posts_count": 3420,
    "profile_picture_url": "https://scontent.cdninstagram.com/v/t51.2885-19/123456789.jpg",
    "is_verified": true,
    "is_private": false,
    "is_business": true,
    "business_category": "Restaurant",
    "website": "https://www.mcdonalds.com",
    "posts": [
      {
        "post_id": "3234567890123456789",
        "shortcode": "Cx1234567",
        "post_url": "https://www.instagram.com/p/Cx1234567/",
        "media_type": "photo",
        "media_url": "https://scontent.cdninstagram.com/v/t51.2885-15/high_res.jpg",
        "thumbnail_url": "https://scontent.cdninstagram.com/v/t51.2885-15/thumbnail.jpg",
        "caption": "Nothing beats our classic Big Mac! 🍔 What's your McDonald's go-to? #BigMac #McDonalds #FastFood",
        "likes_count": 15420,
        "comments_count": 350,
        "timestamp": 1758225000,
        "location": {
          "name": "McDonald's Times Square",
          "coordinates": {
            "lat": 40.758896,
            "lng": -73.985130
          }
        },
        "hashtags": ["#BigMac", "#McDonalds", "#FastFood"],
        "mentions": ["@mcdonalds"],
        "is_video": false
      }
    ]
  }
}
```

---

## Our Structured Output Schema

### Target Business Profile Format
```json
{
  "profileInfo": {
    "username": "string",
    "name": "string",
    "bio": "string",
    "verified": "boolean",
    "business": "boolean",
    "category": "string",
    "website": "string",
    "followers": "number",
    "following": "number",
    "postsCount": "number"
  },
  "posts": [
    {
      "post_id": "string",
      "shortcode": "string",
      "caption": "string",
      "url": "string",
      "timestamp": "ISO_8601_string",
      "location": {
        "name": "string",
        "coordinates": {
          "lat": "number",
          "lng": "number"
        }
      },
      "engagement": {
        "likes": "number",
        "comments": "number",
        "engagement_rate": "number"
      },
      "content_analysis": {
        "hashtags": ["string"],
        "mentions": ["string"],
        "type": "product|promotional|lifestyle|event",
        "sentiment": "positive|neutral|negative"
      }
    }
  ],
  "images": [
    {
      "url": "string",
      "type": "profile|post|product|lifestyle",
      "priority": "high|medium|low",
      "width": "number",
      "height": "number",
      "source_post_id": "string",
      "engagement_score": "number"
    }
  ],
  "marketing_insights": {
    "top_hashtags": ["string"],
    "posting_frequency": "number",
    "engagement_metrics": {
      "average_likes": "number",
      "average_comments": "number",
      "engagement_rate": "number"
    },
    "content_themes": ["string"]
  }
}
```

---

## Data Transformation Rules

### 1. Profile Information Processing

**Input Processing**:
```javascript
function transformProfileInfo(rawProfile) {
  return {
    username: rawProfile.username,
    name: rawProfile.full_name || rawProfile.username,
    bio: cleanBiography(rawProfile.biography),
    verified: rawProfile.is_verified || false,
    business: rawProfile.is_business || false,
    category: rawProfile.business_category || null,
    website: validateWebsite(rawProfile.website),
    followers: rawProfile.followers_count || 0,
    following: rawProfile.following_count || 0,
    postsCount: rawProfile.posts_count || 0,
    profilePicture: {
      url: rawProfile.profile_picture_url,
      type: 'profile',
      priority: 'high'
    }
  };
}

function cleanBiography(bio) {
  if (!bio) return '';
  
  // Keep emojis and meaningful content
  return bio
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim()
    .substring(0, 150);     // Limit length for database storage
}
```

**Data Quality Rules**:
- ✅ **Keep**: Username (essential identifier)
- ✅ **Keep**: Display name and bio (brand information)
- ✅ **Keep**: Verification status (credibility indicator)
- ✅ **Keep**: Business category (industry classification)
- ✅ **Keep**: Follower counts (audience size indicator)
- ✅ **Keep**: Website links (cross-platform connection)

### 2. Posts Content Analysis and Filtering

**Content Classification**:
```javascript
function classifyPostContent(post) {
  const caption = post.caption?.toLowerCase() || '';
  const hashtags = post.hashtags || [];
  
  // Product-focused content
  if (caption.includes('menu|burger|fries|drink|meal') || 
      hashtags.some(tag => tag.includes('BigMac|McNuggets|McFlurry'))) {
    return 'product';
  }
  
  // Promotional content
  if (caption.includes('deal|offer|discount|app|download|promo') ||
      hashtags.some(tag => tag.includes('deal|promo|app'))) {
    return 'promotional';
  }
  
  // Event content
  if (caption.includes('event|opening|celebration|anniversary') ||
      post.location?.name) {
    return 'event';
  }
  
  // Lifestyle/brand content
  return 'lifestyle';
}

function calculateEngagementRate(post, followerCount) {
  const totalEngagement = (post.likes_count || 0) + (post.comments_count || 0);
  const rate = followerCount > 0 ? (totalEngagement / followerCount) * 100 : 0;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}
```

**Content Selection Criteria**:
```javascript
function filterPosts(rawPosts, followerCount) {
  return rawPosts
    .filter(post => {
      // Only keep posts with meaningful content
      return post.caption && post.caption.length > 10;
    })
    .filter(post => {
      // Skip posts with very low engagement (possible bot/spam)
      const engagementRate = calculateEngagementRate(post, followerCount);
      return engagementRate > 0.1; // At least 0.1% engagement rate
    })
    .map(post => transformPost(post, followerCount))
    .sort((a, b) => b.engagement.engagement_rate - a.engagement.engagement_rate); // Sort by engagement
}
```

**Post Transformation**:
```javascript
function transformPost(rawPost, followerCount) {
  return {
    post_id: rawPost.post_id,
    shortcode: rawPost.shortcode,
    caption: cleanCaption(rawPost.caption),
    url: rawPost.post_url,
    timestamp: convertUnixToISO(rawPost.timestamp),
    location: rawPost.location || null,
    engagement: {
      likes: rawPost.likes_count || 0,
      comments: rawPost.comments_count || 0,
      engagement_rate: calculateEngagementRate(rawPost, followerCount)
    },
    content_analysis: {
      hashtags: extractHashtags(rawPost.caption),
      mentions: extractMentions(rawPost.caption),
      type: classifyPostContent(rawPost),
      sentiment: analyzeSentiment(rawPost.caption)
    },
    media: {
      url: rawPost.media_url,
      thumbnail: rawPost.thumbnail_url,
      type: rawPost.is_video ? 'video' : 'photo'
    }
  };
}
```

### 3. Image Prioritization and Classification

**Priority Classification System**:
```javascript
function classifyInstagramImage(post, profileInfo) {
  const caption = post.caption?.toLowerCase() || '';
  const engagement = post.engagement;
  
  // HIGH PRIORITY - Business critical images
  if (post.media.type === 'profile') return { priority: 'high', type: 'profile' };
  if (engagement.engagement_rate > 5.0) return { priority: 'high', type: 'viral' };
  if (caption.includes('new|menu|product|launch')) return { priority: 'high', type: 'product' };
  
  // MEDIUM PRIORITY - Marketing content
  if (engagement.likes > 10000) return { priority: 'medium', type: 'popular' };
  if (post.content_analysis.type === 'promotional') return { priority: 'medium', type: 'promotional' };
  if (post.location?.name) return { priority: 'medium', type: 'location' };
  
  // LOW PRIORITY - General content
  return { priority: 'low', type: 'lifestyle' };
}

function calculateImageScore(post) {
  const likes = post.engagement.likes || 0;
  const comments = post.engagement.comments || 0;
  const engagementRate = post.engagement.engagement_rate || 0;
  
  // Weighted scoring formula
  return (likes * 0.5) + (comments * 2) + (engagementRate * 1000);
}
```

**Image Selection Rules**:
- ✅ **Always Include**: Profile pictures
- ✅ **High Priority**: Posts with >5% engagement rate
- ✅ **High Priority**: Product/menu-related content
- ✅ **High Priority**: Posts with >10,000 likes
- ⚠️ **Medium Priority**: Promotional content with moderate engagement
- ⚠️ **Medium Priority**: Location-tagged posts
- ❌ **Exclude**: Posts with <0.1% engagement rate
- ❌ **Exclude**: Obviously promotional posts with low engagement
- ❌ **Exclude**: Blurry or low-quality images

### 4. Hashtag and Mention Analysis

**Hashtag Processing**:
```javascript
function analyzeHashtags(posts) {
  const hashtagFrequency = {};
  const brandHashtags = [];
  const productHashtags = [];
  
  posts.forEach(post => {
    (post.content_analysis.hashtags || []).forEach(hashtag => {
      const tag = hashtag.toLowerCase();
      hashtagFrequency[tag] = (hashtagFrequency[tag] || 0) + 1;
      
      // Classify hashtag types
      if (tag.includes('mcdonald|mcnugget|bigmac|mcflurry')) {
        brandHashtags.push(hashtag);
      } else if (tag.includes('menu|food|burger|fries')) {
        productHashtags.push(hashtag);
      }
    });
  });
  
  // Sort by frequency and return top hashtags
  const topHashtags = Object.entries(hashtagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag);
    
  return {
    top_hashtags: topHashtags,
    brand_hashtags: [...new Set(brandHashtags)],
    product_hashtags: [...new Set(productHashtags)],
    hashtag_frequency: hashtagFrequency
  };
}
```

**What We Track**:
- ✅ **Brand Hashtags**: Company-specific tags (#McDonalds, #BigMac)
- ✅ **Product Hashtags**: Menu/product-related tags (#burger, #fries)
- ✅ **Industry Hashtags**: Category-related tags (#fastfood, #restaurant)
- ✅ **Campaign Hashtags**: Promotional tags (#MonopolyMcDonalds)
- ❌ **Filter**: Generic tags (#food, #yummy) with low business value

### 5. Marketing Insights Generation

**Engagement Analysis**:
```javascript
function generateMarketingInsights(posts, profileInfo) {
  const insights = {
    engagement_metrics: calculateAverageEngagement(posts),
    content_performance: analyzeContentPerformance(posts),
    posting_patterns: analyzePostingPatterns(posts),
    audience_engagement: analyzeAudienceEngagement(posts)
  };
  
  return insights;
}

function calculateAverageEngagement(posts) {
  if (posts.length === 0) return { average_likes: 0, average_comments: 0, engagement_rate: 0 };
  
  const totalLikes = posts.reduce((sum, post) => sum + (post.engagement.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.engagement.comments || 0), 0);
  const totalEngagementRate = posts.reduce((sum, post) => sum + (post.engagement.engagement_rate || 0), 0);
  
  return {
    average_likes: Math.round(totalLikes / posts.length),
    average_comments: Math.round(totalComments / posts.length),
    engagement_rate: Math.round((totalEngagementRate / posts.length) * 100) / 100
  };
}

function analyzeContentPerformance(posts) {
  const typePerformance = {};
  
  posts.forEach(post => {
    const type = post.content_analysis.type;
    if (!typePerformance[type]) {
      typePerformance[type] = { count: 0, total_engagement: 0 };
    }
    
    typePerformance[type].count++;
    typePerformance[type].total_engagement += post.engagement.engagement_rate;
  });
  
  // Calculate average performance by content type
  Object.keys(typePerformance).forEach(type => {
    const data = typePerformance[type];
    data.average_engagement = data.total_engagement / data.count;
  });
  
  return typePerformance;
}
```

---

## Data Quality Guidelines

### Essential Data (Must Have)
- Username and profile verification status
- At least 3 recent posts with engagement data
- Profile picture (high resolution)
- Follower count and basic profile info

### Important Data (Should Have)
- 10-15 recent posts with varied content types
- Hashtag analysis with brand/product classification
- Engagement metrics and performance trends
- Location data for relevant posts

### Optional Data (Nice to Have)
- Stories and highlights content
- Video content (Reels, IGTV)
- Detailed comment analysis
- Competitor comparison data

### Data Validation Rules
```javascript
function validateInstagramProfile(profile) {
  const errors = [];
  const warnings = [];
  
  // Critical validations
  if (!profile.profileInfo?.username) {
    errors.push('Missing username - profile cannot be identified');
  }
  
  if (!profile.posts || profile.posts.length === 0) {
    errors.push('No posts found - may indicate private profile or API issues');
  }
  
  if (profile.profileInfo?.followers < 100) {
    warnings.push('Very low follower count - may not be established business');
  }
  
  // Quality validations
  const recentPosts = profile.posts.filter(post => 
    isWithinDays(post.timestamp, 30)
  );
  
  if (recentPosts.length === 0) {
    warnings.push('No recent posts - account may be inactive');
  }
  
  const avgEngagement = profile.marketing_insights?.engagement_metrics?.engagement_rate || 0;
  if (avgEngagement < 1.0) {
    warnings.push('Low engagement rate - audience may not be active');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    quality_score: calculateQualityScore(profile)
  };
}

function calculateQualityScore(profile) {
  let score = 0;
  
  // Profile completeness (0-30 points)
  if (profile.profileInfo?.verified) score += 10;
  if (profile.profileInfo?.bio) score += 5;
  if (profile.profileInfo?.website) score += 5;
  if (profile.profileInfo?.business) score += 10;
  
  // Content quality (0-40 points)
  const avgEngagement = profile.marketing_insights?.engagement_metrics?.engagement_rate || 0;
  score += Math.min(avgEngagement * 10, 20); // Max 20 points for engagement
  score += Math.min(profile.posts?.length || 0, 20); // Max 20 points for post count
  
  // Marketing value (0-30 points)
  const hashtagCount = profile.marketing_insights?.top_hashtags?.length || 0;
  score += Math.min(hashtagCount * 2, 10); // Max 10 points for hashtag diversity
  
  const contentTypes = new Set(profile.posts?.map(p => p.content_analysis?.type) || []);
  score += contentTypes.size * 5; // Max 20 points for content variety (4 types * 5)
  
  return Math.min(score, 100); // Cap at 100
}
```

---

## Storage Schema Mapping

### Database Table Mapping
```sql
-- Business profile main record
INSERT INTO business_profiles (name, primary_website, business_type)
VALUES (profileInfo.name, profileInfo.website, 'Instagram Business');

-- Social media record  
INSERT INTO business_social (business_id, platform, profile_url, username, followers_count, verified)
VALUES (business_id, 'instagram', instagram_url, profileInfo.username, profileInfo.followers, profileInfo.verified);

-- Posts storage
INSERT INTO business_posts (business_id, platform, post_id, content, engagement_metrics, content_type)
VALUES (business_id, 'instagram', post.post_id, post.caption, post.engagement, post.content_analysis.type);

-- Images storage with priority
INSERT INTO business_images (business_id, platform, image_url, image_type, priority, engagement_score)
VALUES (business_id, 'instagram', image.url, image.type, image.priority, image.engagement_score);

-- Hashtag analysis
INSERT INTO business_hashtags (business_id, platform, hashtag, frequency, category)
VALUES (business_id, 'instagram', hashtag, frequency, category);
```

### Raw Data Archive
```javascript
const rawDataRecord = {
  business_id: businessId,
  source_type: 'api_response', 
  source_name: 'instagram_looter2',
  search_query: originalUrl,
  raw_response_json: {
    profile_response: profileData,
    extraction_timestamp: new Date().toISOString(),
    api_version: 'instagram_looter2_v1',
    posts_analyzed: posts.length,
    engagement_calculated: true
  },
  response_status: 200,
  processing_status: 'processed'
};
```

This schema transformation ensures we extract maximum marketing intelligence from Instagram data while maintaining high data quality standards for business profiling and competitive analysis.