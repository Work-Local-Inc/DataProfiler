# TikTok API Documentation (RapidAPI)

## Overview
TikTok API provides access to user profiles, videos, hashtags, music, and trending content. Multiple providers available on RapidAPI with varying features and pricing.

## Why TikTok Data Matters
- 1.5+ billion active users globally
- Highest engagement rates among social platforms
- Gen Z and Millennial audience dominance
- Viral content and trend discovery
- E-commerce integration growing rapidly

## API Providers Comparison

### Recommended Options on RapidAPI

| Provider | Monthly Cost | Requests | Best For |
|----------|-------------|----------|----------|
| TikTok API (Basic) | $0-9 | 500/mo | Testing |
| TikTok API (Pro) | $29-49 | 10,000/mo | Small Business |
| TikTok API (Ultra) | $99-149 | 100,000/mo | Agencies |
| TikTok API (Mega) | $299+ | Unlimited | Enterprise |

## Authentication

### RapidAPI Headers
```http
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: tiktok-api23.p.rapidapi.com
```

## Core Endpoints

### Base URL
```
https://tiktok-api23.p.rapidapi.com/api/
```

## 1. User Endpoints

### Get User Profile
```http
GET /user/info
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes* | TikTok username |
| user_id | string | Yes* | TikTok user ID |
| sec_uid | string | Yes* | Secure user ID |

*One of username, user_id, or sec_uid required

**Response:**
```json
{
  "user": {
    "id": "6789998899221464325",
    "uniqueId": "cristiano",
    "nickname": "Cristiano Ronaldo",
    "avatarLarger": "https://p16-sign-sg.tiktokcdn.com/...",
    "signature": "Official Account",
    "verified": true,
    "secUid": "MS4wLjABAAAA...",
    "privateAccount": false,
    "region": "PT",
    "language": "en",
    "stats": {
      "followerCount": 62834567,
      "followingCount": 234,
      "videoCount": 892,
      "heartCount": 982345678,
      "diggCount": 0
    },
    "isUnderAge18": false,
    "relation": 0,
    "bioLink": {
      "link": "https://cristianoronaldo.com",
      "risk": 0
    },
    "commerce": {
      "commerceUser": true,
      "category": "Sports"
    }
  }
}
```

### Get User Videos
```http
GET /user/videos
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | TikTok username |
| count | number | No | Number of videos (default: 30) |
| cursor | string | No | Pagination cursor |

**Response:**
```json
{
  "videos": [
    {
      "id": "7234567890123456789",
      "desc": "Video description #hashtag",
      "createTime": 1682345678,
      "duration": 15,
      "video": {
        "height": 1024,
        "width": 576,
        "duration": 15,
        "ratio": "720p",
        "cover": "https://p16-sign.tiktokcdn.com/...",
        "playAddr": "https://v16-webapp.tiktok.com/..."
      },
      "author": {
        "id": "6789998899221464325",
        "uniqueId": "cristiano",
        "nickname": "Cristiano Ronaldo",
        "verified": true
      },
      "stats": {
        "diggCount": 2345678,
        "shareCount": 45678,
        "commentCount": 23456,
        "playCount": 45678901
      },
      "music": {
        "id": "7234567890",
        "title": "Original Sound",
        "authorName": "cristiano",
        "duration": 15,
        "original": true
      },
      "challenges": [
        {
          "id": "229207",
          "title": "football",
          "desc": "Football related content"
        }
      ]
    }
  ],
  "cursor": "1682345678000",
  "hasMore": true
}
```

### Get User Followers
```http
GET /user/followers
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | TikTok user ID |
| count | number | No | Number of followers (max: 50) |
| cursor | string | No | Pagination cursor |

### Get User Following
```http
GET /user/following
```

## 2. Video Endpoints

### Get Video Details
```http
GET /video/info
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes* | TikTok video URL |
| video_id | string | Yes* | Video ID |

**Response:**
```json
{
  "video": {
    "id": "7234567890123456789",
    "desc": "Video caption #viral #fyp",
    "createTime": 1682345678,
    "duration": 30,
    "stats": {
      "diggCount": 1234567,
      "shareCount": 23456,
      "commentCount": 12345,
      "playCount": 12345678,
      "collectCount": 5678
    },
    "author": { ... },
    "music": { ... },
    "challenges": [ ... ],
    "isAd": false,
    "duetEnabled": true,
    "stitchEnabled": true,
    "shareEnabled": true
  }
}
```

### Get Video Comments
```http
GET /video/comments
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| video_id | string | Yes | Video ID |
| count | number | No | Number of comments (default: 20) |
| cursor | string | No | Pagination cursor |

**Response:**
```json
{
  "comments": [
    {
      "cid": "7234567890123456789",
      "text": "Amazing video! 🔥",
      "createTime": 1682345678,
      "user": {
        "id": "6789998899",
        "uniqueId": "user123",
        "nickname": "User Name",
        "avatar": "https://..."
      },
      "diggCount": 234,
      "replyCount": 5,
      "isAuthorDigged": false
    }
  ],
  "cursor": "1682345678000",
  "hasMore": true,
  "total": 12345
}
```

### Download Video (No Watermark)
```http
GET /video/download
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | TikTok video URL |

## 3. Discovery Endpoints

### Search Videos
```http
GET /search/video
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| count | number | No | Number of results (default: 30) |
| cursor | string | No | Pagination cursor |
| region | string | No | Country code (e.g., US, GB) |

### Search Users
```http
GET /search/user
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| count | number | No | Number of results |

### Get Trending Videos
```http
GET /trending/videos
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| region | string | No | Country code (default: US) |
| count | number | No | Number of videos |

### Get Hashtag Details
```http
GET /hashtag/info
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hashtag | string | Yes | Hashtag name (without #) |

**Response:**
```json
{
  "hashtag": {
    "id": "229207",
    "title": "viral",
    "desc": "Viral content",
    "stats": {
      "videoCount": 234567890,
      "viewCount": 456789012345
    },
    "isCommerce": false,
    "type": 0
  }
}
```

### Get Hashtag Videos
```http
GET /hashtag/videos
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hashtag | string | Yes | Hashtag name |
| count | number | No | Number of videos |
| cursor | string | No | Pagination cursor |

## 4. Music Endpoints

### Get Music Details
```http
GET /music/info
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| music_id | string | Yes | Music ID |

### Get Music Videos
```http
GET /music/videos
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| music_id | string | Yes | Music ID |
| count | number | No | Number of videos |

## 5. Analytics Endpoints

### Get User Analytics
```http
GET /analytics/user
```

**Response:**
```json
{
  "analytics": {
    "username": "brandname",
    "engagementRate": 5.23,
    "avgViews": 234567,
    "avgLikes": 12345,
    "avgComments": 567,
    "avgShares": 234,
    "postingFrequency": 3.5,
    "bestPostingTime": "19:00",
    "topHashtags": ["viral", "fyp", "trending"],
    "contentCategories": {
      "entertainment": 45,
      "education": 30,
      "lifestyle": 25
    }
  }
}
```

## 6. Live Stream Endpoints

### Get Live Stream Info
```http
GET /live/info
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| room_id | string | Yes | Live room ID |

### Search Live Streams
```http
GET /live/search
```

## Rate Limits

| Plan | Requests/Month | Requests/Second | Concurrent |
|------|---------------|-----------------|------------|
| Free | 500 | 1 | 1 |
| Basic | 10,000 | 5 | 3 |
| Pro | 100,000 | 10 | 5 |
| Ultra | 1,000,000 | 20 | 10 |
| Mega | Unlimited | 50 | 20 |

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Rate limit exceeded |
| 404 | Not Found - User/Video not found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Response Headers
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9876
X-RateLimit-Reset: 1642234567
X-Response-Time: 234ms
```

## Use Cases

### 1. Influencer Discovery
```javascript
// Find influencers in a niche
const influencers = await tiktokAPI.searchUsers({
  query: 'fitness coach',
  count: 50
});

// Filter by engagement
const topInfluencers = influencers.filter(user => 
  user.stats.followerCount > 10000 &&
  (user.stats.heartCount / user.stats.videoCount) > 50000
);
```

### 2. Trend Monitoring
```javascript
// Monitor trending content
const trending = await tiktokAPI.getTrendingVideos({
  region: 'US',
  count: 100
});

// Extract trending hashtags
const trendingHashtags = trending
  .flatMap(video => video.challenges)
  .reduce((acc, tag) => {
    acc[tag.title] = (acc[tag.title] || 0) + 1;
    return acc;
  }, {});
```

### 3. Competitor Analysis
```javascript
// Analyze competitor content
const competitorVideos = await tiktokAPI.getUserVideos({
  username: 'competitor',
  count: 100
});

const analytics = {
  avgViews: average(competitorVideos.map(v => v.stats.playCount)),
  avgLikes: average(competitorVideos.map(v => v.stats.diggCount)),
  bestPerforming: competitorVideos
    .sort((a, b) => b.stats.playCount - a.stats.playCount)
    .slice(0, 10)
};
```

### 4. Content Performance Tracking
```javascript
// Track brand content performance
const brandVideos = await tiktokAPI.getUserVideos({
  username: 'yourbrand',
  count: 30
});

const performance = brandVideos.map(video => ({
  id: video.id,
  posted: new Date(video.createTime * 1000),
  views: video.stats.playCount,
  engagement: (
    video.stats.diggCount + 
    video.stats.commentCount + 
    video.stats.shareCount
  ) / video.stats.playCount * 100
}));
```

## Cost Examples

### Monitoring 50 Business Accounts
```
Daily checks:
- Profile updates: 50 requests
- Recent videos (5 each): 250 requests
- Total daily: 300 requests = ~$0.30
Monthly: ~$9 (Basic plan)
```

### Trend Analysis
```
Hourly trending checks:
- Trending videos: 24 requests/day
- Hashtag monitoring (10): 240 requests/day
- Total daily: 264 requests
Monthly: ~7,920 requests (Basic plan $29)
```

### Influencer Campaign
```
Finding influencers:
- Search queries (20): 20 requests
- Profile analysis (100): 100 requests
- Content review (500 videos): 500 requests
Total: 620 requests (one-time)
```

## Best Practices

1. **Cache Responses**: TikTok data doesn't change minute-by-minute
2. **Use Cursors**: For pagination through large datasets
3. **Region-Specific**: Use region parameter for localized content
4. **Batch Requests**: Maximize data per request
5. **Handle Rate Limits**: Implement exponential backoff
6. **Video IDs**: Store video IDs for tracking performance over time

## Migration from Official API

The official TikTok API has limited access and requires approval. RapidAPI alternatives provide:
- No approval process required
- More endpoints available
- Historical data access
- No content restrictions
- Faster implementation

## Support

- RapidAPI Support: https://rapidapi.com/support
- API Status: Check provider's page on RapidAPI
- Community: RapidAPI Discord/Forums