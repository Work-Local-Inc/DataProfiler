# Facebook API - Schema Transformation Guide

## Overview

This document shows how we transform raw Facebook API responses into our structured business profiling schema. It includes data filtering rules, image prioritization, and content selection guidelines.

---

## Raw API Response Structure

### Example: Real McDonald's Facebook Data
```json
{
  "page_id_response": {
    "page_id": "100064458773195"
  },
  "posts_response": {
    "results": [
      {
        "post_id": "1218248533667094",
        "type": "post",
        "url": "https://www.facebook.com/McDonalds/posts/pfbid0GkJbfCopqZzgpZkrF3rnPhebHkMwDdUKBxASXU3qBRTpNxAjLeuVTgzd1eA1E4mEl",
        "message": "M0N0pOLY OCTOBER!!! 1-844-GT-URBAG…. YOU MIGHT WANNA DOWNLOAD MCD APP",
        "timestamp": 1758227256,
        "comments_count": 45,
        "reactions_count": 128,
        "shares_count": 12,
        "media": [
          {
            "type": "photo",
            "url": "https://scontent.facebook.com/v/t39.30808-6/123456.jpg",
            "width": 1080,
            "height": 1080
          }
        ]
      }
    ],
    "cursor": "next_page_token"
  },
  "photos_response": {
    "results": [
      {
        "photo_id": "123456789012345",
        "url": "https://scontent.facebook.com/v/t39.30808-6/high_res.jpg",
        "thumbnail_url": "https://scontent.facebook.com/v/t39.30808-6/thumbnail.jpg",
        "width": 1080,
        "height": 1080,
        "timestamp": 1758225000,
        "description": "McDonald's seasonal promotion",
        "album": "Timeline Photos"
      }
    ]
  },
  "reviews_response": {
    "results": []
  }
}
```

---

## Our Structured Output Schema

### Target Business Profile Format
```json
{
  "pageInfo": {
    "pageId": "string",
    "name": "string", 
    "url": "string",
    "verified": "boolean",
    "category": "string"
  },
  "posts": [
    {
      "post_id": "string",
      "content": "string",
      "url": "string", 
      "timestamp": "ISO_8601_string",
      "engagement": {
        "comments": "number",
        "reactions": "number", 
        "shares": "number"
      },
      "media": [
        {
          "type": "photo|video",
          "url": "string",
          "priority": "high|medium|low"
        }
      ]
    }
  ],
  "images": [
    {
      "url": "string",
      "type": "profile|cover|post|product",
      "priority": "high|medium|low",
      "width": "number",
      "height": "number",
      "source_post_id": "string"
    }
  ],
  "reviews": [
    {
      "reviewer": "string",
      "rating": "number",
      "text": "string", 
      "date": "ISO_8601_string"
    }
  ]
}
```

---

## Data Transformation Rules

### 1. Page Information Processing

**Input Processing**:
```javascript
// Extract page ID from initial response
const pageId = page_id_response.page_id;

// Build page info object
const pageInfo = {
  pageId: pageId,
  name: inferNameFromUrl(originalUrl) || "Facebook Business", // Fallback
  url: originalUrl,
  verified: null, // Not available in current endpoint
  category: null   // Not available in current endpoint  
};
```

**Data Quality Rules**:
- ✅ **Keep**: Page ID (essential for other API calls)
- ✅ **Keep**: Original URL (source tracking)
- ⚠️ **Missing**: Name, verification status, category (requires `/page/info` endpoint)
- 📝 **Action**: Recommend implementing `/page/info` endpoint for complete data

### 2. Posts Content Filtering

**Content Selection Criteria**:
```javascript
function filterPosts(rawPosts) {
  return rawPosts
    .filter(post => {
      // Only keep posts with meaningful content
      return post.message && post.message.length > 10;
    })
    .filter(post => {
      // Skip posts that are just shares without original content
      return post.type !== 'share_only';
    })
    .map(post => transformPost(post));
}

function transformPost(rawPost) {
  return {
    post_id: rawPost.post_id,
    content: cleanPostContent(rawPost.message),
    url: rawPost.url,
    timestamp: convertUnixToISO(rawPost.timestamp),
    engagement: {
      comments: rawPost.comments_count || 0,
      reactions: rawPost.reactions_count || 0,  
      shares: rawPost.shares_count || 0
    },
    media: extractPostMedia(rawPost.media)
  };
}
```

**Content Cleaning Rules**:
- ✅ **Keep**: Original promotional content ("M0N0pOLY OCTOBER!!!")
- ✅ **Keep**: Call-to-action text ("YOU MIGHT WANNA DOWNLOAD MCD APP") 
- ✅ **Keep**: Phone numbers and contact info ("1-844-GT-URBAG")
- ❌ **Remove**: Excessive whitespace and formatting characters
- ❌ **Remove**: Facebook-specific markup (if present)
- ✅ **Keep**: Hashtags and @ mentions (valuable for analysis)

### 3. Image Prioritization System

**Priority Classification**:
```javascript
function classifyImagePriority(image, context) {
  // HIGH PRIORITY - Business critical images
  if (image.album === 'Profile Pictures') return 'high';
  if (image.album === 'Cover Photos') return 'high';
  if (image.width >= 1080 && image.height >= 1080) return 'high';
  
  // MEDIUM PRIORITY - Marketing content
  if (image.description?.includes('promotion|menu|product|food')) return 'medium';
  if (image.likes_count > 100) return 'medium';
  if (context.isFromRecentPost) return 'medium';
  
  // LOW PRIORITY - General content
  return 'low';
}

function categorizeImageType(image, context) {
  if (image.album === 'Profile Pictures') return 'profile';
  if (image.album === 'Cover Photos') return 'cover';
  if (context.fromPost && context.postContent?.includes('menu|food|product')) return 'product';
  return 'post';
}
```

**Image Selection Rules**:
- ✅ **Always Include**: Profile pictures, cover photos
- ✅ **High Priority**: Images ≥1080x1080 resolution  
- ✅ **High Priority**: Images with >100 likes/engagement
- ✅ **Include**: Marketing content (promotions, products, food)
- ⚠️ **Medium Priority**: Recent post images (last 30 days)
- ❌ **Exclude**: Low-resolution images (<500px width)
- ❌ **Exclude**: Generic stock photos or memes
- ❌ **Exclude**: User-generated content (unless highly engaged)

### 4. Engagement Metrics Processing

**Engagement Quality Scoring**:
```javascript
function calculateEngagementScore(post) {
  const comments = post.comments_count || 0;
  const reactions = post.reactions_count || 0;
  const shares = post.shares_count || 0;
  
  // Weighted scoring (shares worth more than likes)
  const score = (shares * 3) + (comments * 2) + (reactions * 1);
  
  return {
    score: score,
    level: score > 100 ? 'high' : score > 20 ? 'medium' : 'low',
    details: { comments, reactions, shares }
  };
}
```

**What We Track**:
- ✅ **Comments Count**: Direct customer interaction indicator
- ✅ **Reactions Count**: General sentiment and reach indicator  
- ✅ **Shares Count**: Viral potential and content quality indicator
- 📊 **Engagement Rate**: Total interactions / followers (if follower count available)

### 5. Review Data Processing

**Current Status**: 
```javascript
// McDonald's page returns empty reviews array
{
  "reviews_response": {
    "results": []  // No reviews available
  }
}
```

**Processing Rules** (for when data is available):
- ✅ **Include**: All reviews with ratings ≥1 star
- ✅ **Include**: Reviews with text content >20 characters
- ✅ **Prioritize**: Recent reviews (last 6 months)
- ✅ **Prioritize**: Reviews with photos
- ❌ **Filter**: Spam or obviously fake reviews
- ❌ **Filter**: Reviews without ratings

---

## Data Quality Guidelines

### Essential Data (Must Have)
- Page ID (for future API calls)
- At least 1 recent post with content
- At least 1 high-resolution image
- Engagement metrics for all posts

### Important Data (Should Have)  
- Page name and category
- 3-5 recent posts with good engagement
- Profile picture and cover photo
- Contact information (phone, website)

### Optional Data (Nice to Have)
- Customer reviews and ratings
- Event information
- Video content
- Historical posts (>30 days old)

### Data Validation Rules
```javascript
function validateFacebookProfile(profile) {
  const errors = [];
  
  // Critical validations
  if (!profile.pageInfo?.pageId) {
    errors.push('Missing page ID - cannot make additional API calls');
  }
  
  if (!profile.posts || profile.posts.length === 0) {
    errors.push('No posts found - may indicate private page or API issues');
  }
  
  if (!profile.images || profile.images.length === 0) {
    errors.push('No images found - may affect visual business representation');
  }
  
  // Quality validations
  const recentPosts = profile.posts.filter(post => 
    isWithinDays(post.timestamp, 30)
  );
  
  if (recentPosts.length === 0) {
    errors.push('No recent posts - business may be inactive');
  }
  
  const highQualityImages = profile.images.filter(img => 
    img.priority === 'high'
  );
  
  if (highQualityImages.length === 0) {
    errors.push('No high-quality images - may affect visual appeal');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    quality: calculateDataQuality(profile)
  };
}
```

---

## Storage Schema Mapping

### Database Table Mapping
```sql
-- Business profile main record
INSERT INTO business_profiles (name, primary_website, business_type)
VALUES (pageInfo.name, pageInfo.url, 'Facebook Page');

-- Social media record
INSERT INTO business_social (business_id, platform, profile_url, followers_count)
VALUES (business_id, 'facebook', pageInfo.url, estimated_followers);

-- Posts storage
INSERT INTO business_posts (business_id, platform, post_id, content, engagement_metrics)
VALUES (business_id, 'facebook', post.post_id, post.content, post.engagement);

-- Images storage
INSERT INTO business_images (business_id, platform, image_url, image_type, priority)
VALUES (business_id, 'facebook', image.url, image.type, image.priority);
```

### Raw Data Archive
```javascript
// Store complete raw response for future reprocessing
const rawDataRecord = {
  business_id: businessId,
  source_type: 'api_response',
  source_name: 'facebook_scraper3',
  search_query: originalUrl,
  raw_response_json: {
    page_id_response: pageIdData,
    posts_response: postsData,
    photos_response: photosData,
    reviews_response: reviewsData,
    extraction_timestamp: new Date().toISOString(),
    api_version: 'facebook_scraper3_v1'
  },
  response_status: 200,
  processing_status: 'processed'
};
```

---

## Error Handling Schema

### Partial Data Scenarios
```javascript
// Handle cases where some endpoints fail
function createPartialProfile(successfulResponses, failedResponses) {
  const profile = {
    pageInfo: successfulResponses.page_id ? createPageInfo() : null,
    posts: successfulResponses.posts ? processPosts() : [],
    images: successfulResponses.photos ? processImages() : [],
    reviews: successfulResponses.reviews ? processReviews() : [],
    dataQuality: {
      completeness: calculateCompleteness(successfulResponses),
      reliability: assessReliability(failedResponses),
      freshness: calculateFreshness(successfulResponses)
    }
  };
  
  return profile;
}
```

This schema transformation ensures we extract maximum business value from Facebook data while maintaining data quality and usefulness for business profiling.