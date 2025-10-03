# Twitter/X API Documentation

## Overview
Since Elon Musk's acquisition, Twitter (now X) API pricing has increased dramatically. We recommend using alternative APIs through RapidAPI or TwitterAPI.io for cost-effective access to Twitter data.

## API Options Comparison

### Official X API (Expensive)
| Tier | Monthly Cost | Tweet Search | Rate Limits | Archive Access |
|------|-------------|--------------|-------------|----------------|
| Free | $0 | ❌ Discontinued | - | - |
| Basic | $100 | 10,000 tweets/mo | 500/15min | 7 days |
| Pro | $5,000 | 1M tweets/mo | 1500/15min | Full archive |
| Enterprise | $42,000+ | Unlimited | Custom | Full archive |

### Recommended: TwitterAPI.io (96% Cheaper)
| Feature | Cost | Rate Limits | Archive Access |
|---------|------|-------------|----------------|
| Tweet Search | $0.15/1000 | 10,000+/day | 7+ years |
| User Profiles | $0.18/1000 | 10,000+/day | Full |
| Post Actions | $0.20/action | 5000/day | - |
| No Monthly Fee | Pay-per-use | No approval needed | Immediate |

### RapidAPI Options
Multiple Twitter APIs available with various pricing tiers starting at $0-29/month.

## TwitterAPI.io Endpoints (Recommended)

### Base URL
```
https://api.twitterapi.io/v2/
```

### Authentication
```http
X-API-Key: YOUR_API_KEY
```

## 1. Search & Discovery

### Search Tweets
```http
GET /tweets/search
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (supports Twitter operators) |
| max_results | int | No | 10-100 tweets per request (default: 10) |
| since_id | string | No | Returns tweets after this ID |
| until_id | string | No | Returns tweets before this ID |
| start_time | datetime | No | ISO 8601 date (YYYY-MM-DDTHH:mm:ssZ) |
| end_time | datetime | No | ISO 8601 date |
| sort_order | string | No | relevancy or recency |

**Query Operators:**
```
from:username         - Tweets from specific user
to:username           - Replies to user
#hashtag             - Contains hashtag
"exact phrase"       - Exact phrase match
filter:verified      - From verified accounts
filter:media         - Contains media
filter:links         - Contains links
min_retweets:100    - Minimum retweets
min_likes:500       - Minimum likes
lang:en             - Language filter
-filter:retweets    - Exclude retweets
```

**Example Request:**
```bash
GET /tweets/search?query=from:elonmusk filter:verified min_likes:1000&max_results=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "1234567890",
      "text": "Tweet content here",
      "created_at": "2024-01-15T10:30:00Z",
      "author_id": "44196397",
      "public_metrics": {
        "retweet_count": 5234,
        "reply_count": 892,
        "like_count": 15234,
        "quote_count": 234,
        "bookmark_count": 567,
        "impression_count": 234567
      },
      "entities": {
        "hashtags": [{"start": 10, "end": 20, "tag": "Tesla"}],
        "mentions": [{"start": 0, "end": 10, "username": "tesla"}],
        "urls": [{"url": "https://t.co/...", "expanded_url": "https://..."}]
      },
      "referenced_tweets": [
        {"type": "retweeted", "id": "1234567889"}
      ],
      "context_annotations": [
        {"domain": {"id": "46", "name": "Brand"}, "entity": {"id": "10", "name": "Tesla"}}
      ],
      "geo": {
        "place_id": "01a9a39529b27f36"
      }
    }
  ],
  "includes": {
    "users": [
      {
        "id": "44196397",
        "name": "Elon Musk",
        "username": "elonmusk",
        "verified": true,
        "description": "Profile bio",
        "public_metrics": {
          "followers_count": 175234567,
          "following_count": 456,
          "tweet_count": 28934,
          "listed_count": 123456
        }
      }
    ]
  },
  "meta": {
    "result_count": 50,
    "next_token": "eyJ..."
  }
}
```

### Search Users
```http
GET /users/search
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| max_results | int | No | 10-1000 (default: 100) |

### Trending Topics
```http
GET /trends/place
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | WOEID (Where On Earth ID) |

## 2. User Data

### Get User by Username
```http
GET /users/by/username/{username}
```

**Response:**
```json
{
  "data": {
    "id": "44196397",
    "name": "Elon Musk",
    "username": "elonmusk",
    "created_at": "2009-06-02T20:12:29.000Z",
    "description": "Profile description",
    "location": "Texas",
    "url": "https://tesla.com",
    "verified": true,
    "protected": false,
    "public_metrics": {
      "followers_count": 175234567,
      "following_count": 456,
      "tweet_count": 28934,
      "listed_count": 123456
    },
    "profile_image_url": "https://pbs.twimg.com/...",
    "pinned_tweet_id": "1234567890"
  }
}
```

### Get User Timeline
```http
GET /users/{user_id}/tweets
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | User ID |
| max_results | int | No | 5-100 (default: 10) |
| exclude | string | No | replies, retweets |
| since_id | string | No | Returns tweets after this ID |
| until_id | string | No | Returns tweets before this ID |

### Get User Followers
```http
GET /users/{user_id}/followers
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | User ID |
| max_results | int | No | 1-1000 (default: 100) |
| pagination_token | string | No | Next page token |

### Get User Following
```http
GET /users/{user_id}/following
```

### Get User Likes
```http
GET /users/{user_id}/liked_tweets
```

### Get User Mentions
```http
GET /users/{user_id}/mentions
```

## 3. Tweet Data

### Get Tweet by ID
```http
GET /tweets/{tweet_id}
```

**Response Fields:**
- `id` - Tweet ID
- `text` - Tweet content
- `created_at` - Creation timestamp
- `author_id` - Author's user ID
- `conversation_id` - Original tweet ID in thread
- `in_reply_to_user_id` - User being replied to
- `referenced_tweets` - Retweets, quotes, replies
- `public_metrics` - Engagement metrics
- `possibly_sensitive` - Content warning flag
- `lang` - Language code
- `source` - Tweet source (app/web)

### Get Tweet Replies
```http
GET /tweets/{tweet_id}/replies
```

### Get Quote Tweets
```http
GET /tweets/{tweet_id}/quote_tweets
```

### Get Retweeters
```http
GET /tweets/{tweet_id}/retweeted_by
```

### Get Likers
```http
GET /tweets/{tweet_id}/liking_users
```

## 4. Streaming (Real-time)

### Filtered Stream
```http
POST /tweets/stream/rules
GET /tweets/stream
```

**Add Stream Rules:**
```json
{
  "add": [
    {"value": "from:elonmusk", "tag": "elon tweets"},
    {"value": "#AI OR #MachineLearning", "tag": "ai content"},
    {"value": "@OpenAI", "tag": "openai mentions"}
  ]
}
```

## 5. Write Actions

### Post Tweet
```http
POST /tweets
```

**Request Body:**
```json
{
  "text": "Hello Twitter!",
  "reply": {
    "in_reply_to_tweet_id": "1234567890"
  },
  "media": {
    "media_ids": ["1234567890"]
  }
}
```

### Delete Tweet
```http
DELETE /tweets/{tweet_id}
```

### Like Tweet
```http
POST /users/{user_id}/likes
```

**Request Body:**
```json
{
  "tweet_id": "1234567890"
}
```

### Retweet
```http
POST /users/{user_id}/retweets
```

### Follow User
```http
POST /users/{user_id}/following
```

**Request Body:**
```json
{
  "target_user_id": "44196397"
}
```

## 6. Analytics & Insights

### Get Tweet Analytics
```http
GET /tweets/{tweet_id}/insights
```

**Response:**
```json
{
  "data": {
    "tweet_id": "1234567890",
    "impressions": {
      "organic": 234567,
      "promoted": 0,
      "total": 234567
    },
    "engagements": {
      "likes": 15234,
      "retweets": 5234,
      "replies": 892,
      "link_clicks": 234,
      "profile_clicks": 567,
      "detail_expands": 123
    },
    "video_views": {
      "25_percent": 12345,
      "50_percent": 8934,
      "75_percent": 5678,
      "100_percent": 2345
    }
  }
}
```

## Rate Limits

### TwitterAPI.io Limits
| Endpoint | Requests/Day | Requests/Minute |
|----------|-------------|-----------------|
| Search | 10,000 | 60 |
| User Lookup | 10,000 | 60 |
| Timeline | 5,000 | 30 |
| Streaming | Unlimited* | - |
| Write Actions | 5,000 | 10 |

*Streaming counts as 1 request regardless of duration

### Response Headers
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9876
X-RateLimit-Reset: 1642234567
X-Credits-Used: 150
X-Credits-Cost: 0.15
```

## Cost Calculation Examples

### Monitoring 100 Business Accounts
```
Daily monitoring:
- Timeline (20 tweets each): 100 × 20 = 2,000 tweets = $0.30
- Mentions check: 100 × 10 = 1,000 tweets = $0.15
- Analytics: 100 profiles = $0.18
Total daily: $0.63
Monthly: ~$19
```

### Competitor Analysis (10 competitors)
```
Weekly analysis:
- Timeline (100 tweets each): 10 × 100 = 1,000 tweets = $0.15
- Followers sample (100 each): 10 × 100 = 1,000 profiles = $0.18
- Engagement analysis: 500 tweets = $0.08
Weekly total: $0.41
Monthly: ~$1.64
```

### Brand Monitoring
```
Hourly searches (24/7):
- 10 keywords × 50 tweets × 24 hours = 12,000 tweets/day = $1.80/day
Monthly: ~$54
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Access denied |
| 404 | Not found |
| 429 | Too many requests - Rate limited |
| 500 | Internal server error |
| 503 | Service unavailable |

## Best Practices

1. **Use Search Operators**: Leverage Twitter's advanced search operators for precise results
2. **Batch Requests**: Get maximum results per request to minimize API calls
3. **Cache Results**: Store tweets for at least 24 hours
4. **Handle Rate Limits**: Implement exponential backoff
5. **Stream vs Poll**: Use streaming for real-time needs, polling for periodic updates
6. **Pagination**: Always check for `next_token` to get complete results

## Migration from Official API

### Endpoint Mapping
| Official X API | TwitterAPI.io |
|----------------|---------------|
| /2/tweets/search/recent | /tweets/search |
| /2/users/by/username/{username} | /users/by/username/{username} |
| /2/users/{id}/tweets | /users/{id}/tweets |
| /2/tweets | /tweets |
| /2/tweets/{id} | /tweets/{id} |

### Code Migration Example
```javascript
// Official X API
const client = new TwitterApi(bearerToken);
const tweets = await client.v2.search('from:elonmusk');

// TwitterAPI.io (96% cheaper)
const response = await fetch('https://api.twitterapi.io/v2/tweets/search?query=from:elonmusk', {
  headers: { 'X-API-Key': apiKey }
});
const tweets = await response.json();
```

## Support

- TwitterAPI.io Docs: https://twitterapi.io/docs
- RapidAPI Support: https://rapidapi.com/support
- Status Page: https://status.twitterapi.io