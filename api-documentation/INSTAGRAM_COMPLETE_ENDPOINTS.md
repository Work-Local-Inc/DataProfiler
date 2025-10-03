# Instagram Looter2 API - Complete Endpoints Documentation

## Overview

This is the **complete reference** for all available endpoints in the Instagram Looter2 RapidAPI. This includes endpoints we currently use and those available for future enhancement.

**Base URL**: `https://instagram-looter2.p.rapidapi.com`

## Authentication Headers
```javascript
{
  'x-rapidapi-key': 'YOUR_INSTAGRAM_RAPIDAPI_KEY',
  'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com'
}
```

---

## Profile Information Endpoints

### 1. Get Profile Data
**Endpoint**: `/profile`  
**Method**: `GET`  
**Purpose**: Get comprehensive Instagram profile information  
**Status**: ✅ Currently Used

**Parameters**:
- `username` (required): Instagram username (without @ symbol)

**Example**:
```
GET /profile?username=mcdonalds
```

**Response**:
```json
{
  "username": "mcdonalds",
  "full_name": "McDonald's",
  "biography": "The official Instagram for McDonald's. Download our app for exclusive deals! 🍟",
  "followers_count": 4200000,
  "following_count": 1250,
  "posts_count": 3420,
  "profile_picture_url": "https://scontent.cdninstagram.com/...",
  "profile_picture_hd": "https://scontent.cdninstagram.com/...",
  "is_verified": true,
  "is_private": false,
  "is_business": true,
  "business_category": "Restaurant",
  "website": "https://www.mcdonalds.com",
  "contact_phone": "+1-800-244-6227",
  "contact_email": "contact@mcdonalds.com",
  "address": "Oak Brook, Illinois"
}
```

### 2. Get Profile Stories
**Endpoint**: `/profile/stories`  
**Method**: `GET`  
**Purpose**: Get active Instagram stories from profile  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `username` (required): Instagram username
- `include_highlights` (optional): Include story highlights (default: false)

**Example**:
```
GET /profile/stories?username=mcdonalds&include_highlights=true
```

**Expected Response**:
```json
{
  "active_stories": [
    {
      "story_id": "123456789012345",
      "media_type": "photo",
      "media_url": "https://scontent.cdninstagram.com/...",
      "timestamp": 1758230000,
      "expires_at": 1758316400,
      "viewers_count": 25000,
      "text_overlay": "New menu item alert! 🍔"
    }
  ],
  "story_highlights": [
    {
      "highlight_id": "123456789012345",
      "title": "Menu Items",
      "cover_url": "https://scontent.cdninstagram.com/...",
      "stories_count": 8,
      "stories": [...]
    }
  ]
}
```

---

## Content Extraction Endpoints

### 3. Get Profile Posts
**Endpoint**: `/profile/posts`  
**Method**: `GET`  
**Purpose**: Get recent posts from Instagram profile  
**Status**: ✅ Currently Used (included in main profile call)

**Parameters**:
- `username` (required): Instagram username
- `limit` (optional): Number of posts to retrieve (default: 12, max: 50)
- `max_id` (optional): Pagination cursor for older posts

**Example**:
```
GET /profile/posts?username=mcdonalds&limit=24
```

**Response**:
```json
{
  "posts": [
    {
      "post_id": "3234567890123456789",
      "shortcode": "Cx1234567",
      "post_url": "https://www.instagram.com/p/Cx1234567/",
      "media_type": "photo",
      "media_url": "https://scontent.cdninstagram.com/...",
      "thumbnail_url": "https://scontent.cdninstagram.com/...",
      "caption": "Nothing beats our classic Big Mac! 🍔 What's your McDonald's go-to? #BigMac #McDonalds",
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
      "hashtags": ["#BigMac", "#McDonalds"],
      "mentions": ["@mcdonalds"],
      "is_video": false,
      "video_duration": null
    }
  ],
  "has_next_page": true,
  "end_cursor": "next_page_token"
}
```

### 4. Get Post Details
**Endpoint**: `/post`  
**Method**: `GET`  
**Purpose**: Get detailed information about specific Instagram post  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `shortcode` (required): Instagram post shortcode (from post URL)
- `include_comments` (optional): Include comments data (default: false)

**Example**:
```
GET /post?shortcode=Cx1234567&include_comments=true
```

**Expected Response**:
```json
{
  "post_id": "3234567890123456789",
  "shortcode": "Cx1234567",
  "owner": {
    "username": "mcdonalds",
    "full_name": "McDonald's",
    "profile_picture": "https://..."
  },
  "media_type": "photo",
  "media_url": "https://scontent.cdninstagram.com/...",
  "caption": "Nothing beats our classic Big Mac! 🍔",
  "likes_count": 15420,
  "comments_count": 350,
  "timestamp": 1758225000,
  "location": {...},
  "comments": [
    {
      "comment_id": "123456789012345",
      "username": "foodlover123",
      "text": "Best burger ever! 😍",
      "likes_count": 12,
      "timestamp": 1758225300
    }
  ]
}
```

### 5. Get Profile Reels
**Endpoint**: `/profile/reels`  
**Method**: `GET`  
**Purpose**: Get Instagram Reels from profile  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `username` (required): Instagram username
- `limit` (optional): Number of reels (default: 12, max: 30)

**Example**:
```
GET /profile/reels?username=mcdonalds
```

**Expected Response**:
```json
{
  "reels": [
    {
      "reel_id": "3234567890123456789",
      "shortcode": "Cx1234567",
      "video_url": "https://scontent.cdninstagram.com/...",
      "thumbnail_url": "https://scontent.cdninstagram.com/...",
      "caption": "Making your favorite Big Mac! 🍔✨",
      "views_count": 125000,
      "likes_count": 8500,
      "comments_count": 180,
      "duration": 15,
      "timestamp": 1758220000,
      "music": {
        "artist": "Trending Audio",
        "title": "Kitchen Sounds"
      }
    }
  ]
}
```

### 6. Get IGTV Videos
**Endpoint**: `/profile/igtv`  
**Method**: `GET`  
**Purpose**: Get IGTV videos from profile  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `username` (required): Instagram username
- `limit` (optional): Number of IGTV videos (default: 12, max: 24)

---

## Engagement and Analytics Endpoints

### 7. Get Post Likes
**Endpoint**: `/post/likes`  
**Method**: `GET`  
**Purpose**: Get users who liked a specific post  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `shortcode` (required): Instagram post shortcode
- `limit` (optional): Number of likes to retrieve (default: 50, max: 200)

**Example**:
```
GET /post/likes?shortcode=Cx1234567&limit=100
```

**Expected Response**:
```json
{
  "likes": [
    {
      "username": "foodlover123",
      "full_name": "Food Lover",
      "profile_picture": "https://...",
      "is_verified": false,
      "is_private": false,
      "follower_count": 1250
    }
  ],
  "total_likes": 15420
}
```

### 8. Get Post Comments
**Endpoint**: `/post/comments`  
**Method**: `GET`  
**Purpose**: Get comments from specific Instagram post  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `shortcode` (required): Instagram post shortcode
- `limit` (optional): Number of comments (default: 50, max: 200)
- `sort` (optional): 'newest', 'oldest', 'top' (default: 'newest')

---

## Search and Discovery Endpoints

### 9. Search Profiles
**Endpoint**: `/search/users`  
**Method**: `GET`  
**Purpose**: Search for Instagram profiles by username or name  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search term
- `limit` (optional): Number of results (default: 20, max: 50)

**Example**:
```
GET /search/users?query=mcdonalds&limit=10
```

**Expected Response**:
```json
{
  "users": [
    {
      "username": "mcdonalds",
      "full_name": "McDonald's",
      "profile_picture": "https://...",
      "is_verified": true,
      "followers_count": 4200000,
      "bio_snippet": "The official Instagram for McDonald's..."
    }
  ]
}
```

### 10. Get Hashtag Posts
**Endpoint**: `/hashtag/posts`  
**Method**: `GET`  
**Purpose**: Get recent posts from specific hashtag  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `hashtag` (required): Hashtag name (without #)
- `limit` (optional): Number of posts (default: 20, max: 50)

**Example**:
```
GET /hashtag/posts?hashtag=McDonalds&limit=30
```

---

## Advanced Features Endpoints

### 11. Get Similar Profiles
**Endpoint**: `/profile/similar`  
**Method**: `GET`  
**Purpose**: Find Instagram profiles similar to given profile  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `username` (required): Reference Instagram username
- `limit` (optional): Number of similar profiles (default: 10, max: 20)

### 12. Get Profile Analytics
**Endpoint**: `/profile/analytics`  
**Method**: `GET`  
**Purpose**: Get engagement analytics for Instagram profile  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `username` (required): Instagram username
- `period` (optional): 'week', 'month', 'quarter' (default: 'month')

**Expected Response**:
```json
{
  "engagement_rate": 3.2,
  "average_likes": 12500,
  "average_comments": 280,
  "posting_frequency": 1.2,
  "best_posting_times": ["18:00", "20:00"],
  "top_hashtags": ["#McDonalds", "#BigMac", "#FastFood"],
  "audience_demographics": {
    "age_groups": {
      "18-24": 35,
      "25-34": 40,
      "35-44": 20,
      "45+": 5
    },
    "top_countries": ["US", "Canada", "UK"]
  }
}
```

---

## Rate Limits and Usage

### Current Usage Pattern
- **Profile Data**: 1 call per business (includes basic posts)
- **Total**: 1 call per business profile

### Future Enhancement Opportunities
- **Stories**: Real-time promotional content and limited-time offers
- **Reels**: Video marketing content analysis
- **Post Comments**: Customer sentiment analysis
- **Hashtag Posts**: Brand mention tracking across platform
- **Analytics**: Performance metrics and audience insights
- **Similar Profiles**: Competitive analysis and market positioning

### Recommended Implementation Priority
1. **High Priority**: Stories, Reels, Post Comments (engagement analysis)
2. **Medium Priority**: Hashtag Posts, Analytics (brand monitoring)
3. **Low Priority**: Similar Profiles, Search (competitive analysis)

---

## Technical Considerations

### Response Times
- **Profile Data**: 2-3 seconds
- **Stories/Reels**: 3-4 seconds
- **Comments/Analytics**: 4-6 seconds
- **Search Operations**: 2-3 seconds

### Error Handling
All endpoints follow the same error patterns:
- **401**: Invalid API key
- **403**: Subscription required or private profile
- **404**: Profile/content not found
- **429**: Rate limit exceeded
- **500**: Server error

### Content Limitations
- **Public Profiles Only**: API cannot access private Instagram accounts
- **Rate Limiting**: Instagram enforces strict rate limits
- **Content Freshness**: Recent content prioritized over historical posts

This complete reference enables comprehensive Instagram business intelligence and social media monitoring capabilities.