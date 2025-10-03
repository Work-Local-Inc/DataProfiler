# Facebook Scraper3 API - Complete Endpoints Documentation

## Overview

This is the **complete reference** for all available endpoints in the Facebook Scraper3 RapidAPI. This includes endpoints we currently use and those available for future enhancement.

**Base URL**: `https://facebook-scraper3.p.rapidapi.com`

## Authentication Headers
```javascript
{
  'x-rapidapi-key': 'YOUR_FACEBOOK_RAPIDAPI_KEY',
  'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com'
}
```

---

## Page Information Endpoints

### 1. Get Page ID
**Endpoint**: `/page/page_id`  
**Method**: `GET`  
**Purpose**: Convert Facebook page URL to internal page ID  
**Status**: ✅ Currently Used

**Parameters**:
- `url` (required): Full Facebook page URL

**Example**:
```
GET /page/page_id?url=https%3A%2F%2Fwww.facebook.com%2Fmcdonalds
```

**Response**:
```json
{
  "page_id": "100064458773195"
}
```

### 2. Get Page Basic Info
**Endpoint**: `/page/info`  
**Method**: `GET`  
**Purpose**: Get basic page information and metadata  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Facebook page ID

**Example**:
```
GET /page/info?page_id=100064458773195
```

**Expected Response**:
```json
{
  "name": "McDonald's",
  "description": "Fast food restaurant chain",
  "category": "Restaurant",
  "followers_count": 50000000,
  "likes_count": 48000000,
  "website": "https://www.mcdonalds.com",
  "phone": "+1-800-244-6227",
  "address": {
    "street": "123 Oak Brook Ave",
    "city": "Oak Brook",
    "state": "IL",
    "country": "USA",
    "zip": "60523"
  },
  "hours": {
    "monday": "6:00 AM - 11:00 PM",
    "tuesday": "6:00 AM - 11:00 PM"
  },
  "verified": true,
  "cover_photo": "https://..."
}
```

---

## Content Extraction Endpoints

### 3. Get Page Posts
**Endpoint**: `/page/posts`  
**Method**: `GET`  
**Purpose**: Extract recent posts from Facebook page  
**Status**: ✅ Currently Used

**Parameters**:
- `page_id` (required): Facebook page ID
- `limit` (optional): Number of posts to retrieve (default: 10, max: 50)
- `cursor` (optional): Pagination cursor for next page

**Example**:
```
GET /page/posts?page_id=100064458773195&limit=20
```

**Response**:
```json
{
  "results": [
    {
      "post_id": "1218248533667094",
      "type": "post",
      "url": "https://www.facebook.com/McDonalds/posts/...",
      "message": "M0N0pOLY OCTOBER!!!",
      "timestamp": 1758227256,
      "comments_count": 45,
      "reactions_count": 128,
      "shares_count": 12,
      "media": [
        {
          "type": "photo",
          "url": "https://...",
          "width": 1080,
          "height": 1080
        }
      ]
    }
  ],
  "cursor": "next_page_token"
}
```

### 4. Get Page Photos
**Endpoint**: `/page/photos`  
**Method**: `GET`  
**Purpose**: Extract photos uploaded to Facebook page  
**Status**: ✅ Currently Used

**Parameters**:
- `page_id` (required): Facebook page ID
- `limit` (optional): Number of photos to retrieve (default: 10, max: 100)
- `cursor` (optional): Pagination cursor

**Example**:
```
GET /page/photos?page_id=100064458773195&limit=50
```

**Response**:
```json
{
  "results": [
    {
      "photo_id": "123456789012345",
      "url": "https://scontent.facebook.com/...",
      "thumbnail_url": "https://scontent.facebook.com/...",
      "width": 1080,
      "height": 1080,
      "timestamp": 1758225000,
      "description": "McDonald's seasonal promotion",
      "album": "Timeline Photos",
      "likes_count": 250,
      "comments_count": 15
    }
  ],
  "cursor": "next_page_token"
}
```

### 5. Get Page Videos
**Endpoint**: `/page/videos`  
**Method**: `GET`  
**Purpose**: Extract videos uploaded to Facebook page  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Facebook page ID
- `limit` (optional): Number of videos to retrieve (default: 10, max: 50)
- `cursor` (optional): Pagination cursor

**Example**:
```
GET /page/videos?page_id=100064458773195
```

**Expected Response**:
```json
{
  "results": [
    {
      "video_id": "123456789012345",
      "url": "https://www.facebook.com/McDonalds/videos/...",
      "video_url": "https://video.facebook.com/...",
      "thumbnail_url": "https://scontent.facebook.com/...",
      "title": "New Menu Items",
      "description": "Check out our latest offerings",
      "duration": 30,
      "timestamp": 1758220000,
      "views_count": 50000,
      "likes_count": 500,
      "comments_count": 25,
      "shares_count": 10
    }
  ],
  "cursor": "next_page_token"
}
```

### 6. Get Page Reviews
**Endpoint**: `/page/reviews`  
**Method**: `GET`  
**Purpose**: Extract customer reviews and ratings  
**Status**: ✅ Currently Used

**Parameters**:
- `page_id` (required): Facebook page ID
- `limit` (optional): Number of reviews to retrieve (default: 10, max: 50)
- `cursor` (optional): Pagination cursor

**Example**:
```
GET /page/reviews?page_id=100064458773195
```

**Response**:
```json
{
  "results": [
    {
      "review_id": "123456789012345",
      "reviewer_name": "John Smith",
      "reviewer_profile": "https://www.facebook.com/profile.php?id=...",
      "rating": 5,
      "review_text": "Great food and fast service!",
      "timestamp": 1758200000,
      "helpful_count": 3,
      "photos": [
        {
          "url": "https://scontent.facebook.com/...",
          "caption": "My order"
        }
      ]
    }
  ],
  "cursor": "next_page_token"
}
```

---

## Events and Community Endpoints

### 7. Get Page Events
**Endpoint**: `/page/events`  
**Method**: `GET`  
**Purpose**: Extract events hosted by the Facebook page  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Facebook page ID
- `time_filter` (optional): 'upcoming', 'past', 'all' (default: 'upcoming')
- `limit` (optional): Number of events to retrieve (default: 10, max: 50)

**Example**:
```
GET /page/events?page_id=100064458773195&time_filter=upcoming
```

**Expected Response**:
```json
{
  "results": [
    {
      "event_id": "123456789012345",
      "name": "McDonald's Grand Opening",
      "description": "Join us for our new location opening",
      "start_time": "2025-10-15T10:00:00Z",
      "end_time": "2025-10-15T18:00:00Z",
      "location": {
        "name": "McDonald's Downtown",
        "address": "123 Main St, City, State"
      },
      "attending_count": 150,
      "interested_count": 300,
      "cover_photo": "https://scontent.facebook.com/...",
      "event_url": "https://www.facebook.com/events/..."
    }
  ]
}
```

### 8. Get Community Posts
**Endpoint**: `/page/community`  
**Method**: `GET`  
**Purpose**: Extract posts by community members on page  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Facebook page ID
- `limit` (optional): Number of community posts (default: 10, max: 30)

---

## Advanced Content Endpoints

### 9. Get Post Comments
**Endpoint**: `/post/comments`  
**Method**: `GET`  
**Purpose**: Extract comments from specific Facebook post  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `post_id` (required): Facebook post ID
- `limit` (optional): Number of comments (default: 10, max: 100)
- `sort` (optional): 'top_level', 'chronological', 'reverse_chronological'

**Example**:
```
GET /post/comments?post_id=1218248533667094&limit=50&sort=top_level
```

**Expected Response**:
```json
{
  "results": [
    {
      "comment_id": "123456789012345",
      "commenter_name": "Jane Doe",
      "commenter_profile": "https://www.facebook.com/profile.php?id=...",
      "comment_text": "Love the new menu!",
      "timestamp": 1758227500,
      "likes_count": 5,
      "replies_count": 2,
      "replies": [
        {
          "reply_id": "123456789012346",
          "replier_name": "McDonald's",
          "reply_text": "Thank you for your feedback!",
          "timestamp": 1758227600
        }
      ]
    }
  ]
}
```

### 10. Get Page Insights
**Endpoint**: `/page/insights`  
**Method**: `GET`  
**Purpose**: Extract page analytics and engagement metrics  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Facebook page ID
- `metrics` (optional): Comma-separated list of metrics
- `period` (optional): 'day', 'week', 'days_28' (default: 'week')

**Expected Metrics**:
- `page_impressions`
- `page_reach`
- `page_engagement`
- `page_fans`
- `page_posts_impressions`
- `page_video_views`

---

## Search and Discovery Endpoints

### 11. Search Pages
**Endpoint**: `/search/pages`  
**Method**: `GET`  
**Purpose**: Search for Facebook pages by name or keyword  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search term
- `limit` (optional): Number of results (default: 10, max: 50)
- `location` (optional): Geographic filter

**Example**:
```
GET /search/pages?query=McDonald's&limit=20&location=Canada
```

### 12. Get Similar Pages
**Endpoint**: `/page/similar`  
**Method**: `GET`  
**Purpose**: Find pages similar to given page  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `page_id` (required): Reference Facebook page ID
- `limit` (optional): Number of similar pages (default: 10, max: 20)

---

## Rate Limits and Usage

### Current Usage Pattern
- **Page ID**: 1 call per business
- **Posts**: 1 call per business  
- **Photos**: 1 call per business
- **Reviews**: 1 call per business
- **Total**: 4 calls per business profile

### Future Enhancement Opportunities
- **Events**: Seasonal promotions and grand openings
- **Community Posts**: Customer-generated content analysis
- **Post Comments**: Detailed sentiment analysis
- **Videos**: Video marketing content assessment
- **Insights**: Performance analytics and reach metrics
- **Similar Pages**: Competitive analysis expansion

### Recommended Implementation Priority
1. **High Priority**: Page Info, Videos, Events (business intelligence)
2. **Medium Priority**: Post Comments, Community Posts (engagement analysis)  
3. **Low Priority**: Insights, Similar Pages, Search (advanced analytics)

---

## Technical Considerations

### Response Times
- **Simple Endpoints** (page_id, info): 1-2 seconds
- **Content Endpoints** (posts, photos, videos): 3-4 seconds  
- **Complex Endpoints** (comments, insights): 5-8 seconds

### Error Handling
All endpoints follow the same error patterns:
- **401**: Invalid API key
- **403**: Subscription required or page access denied
- **404**: Page/content not found
- **429**: Rate limit exceeded
- **500**: Server error

### Pagination
Most content endpoints support pagination via `cursor` parameter for retrieving large datasets efficiently.

This complete reference enables future expansion of Facebook data collection capabilities based on business intelligence requirements.