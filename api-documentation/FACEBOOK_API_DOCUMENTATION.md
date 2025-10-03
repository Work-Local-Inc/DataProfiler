# Facebook Pages RapidAPI Documentation

## Overview

This documentation covers the **Facebook Pages Scraper API** available through RapidAPI. This API provides comprehensive Facebook page data extraction including posts, photos, reviews, and basic page information.

## API Information

- **API Name**: Facebook Scraper API
- **Provider**: RapidAPI
- **Base URL**: `https://facebook-scraper3.p.rapidapi.com`
- **Authentication**: RapidAPI Key

## Authentication

All requests require the following headers:

```javascript
{
  'x-rapidapi-key': 'YOUR_FACEBOOK_RAPIDAPI_KEY',
  'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com'
}
```

### Environment Variable Setup

Set up your dedicated Facebook RapidAPI key as an environment variable:

```bash
FACEBOOK_RAPIDAPI_KEY=your_actual_facebook_rapidapi_key_here
```

**Security Enhancement**: This implementation uses platform-specific API keys (`FACEBOOK_RAPIDAPI_KEY`) instead of a generic key for better security isolation, independent rate limiting, and easier monitoring.

## Rate Limits

- **Estimated Limits**: 50 requests/minute, 500 requests/day
- **Note**: Actual limits depend on your RapidAPI subscription plan
- **Recommendation**: Add 500ms delays between requests to avoid rate limiting
- **Response Times**: Expect 3-4 seconds per API call

## Multi-Step Data Extraction Process

Our implementation uses a 4-step process for comprehensive data extraction:

### Step 1: Page ID Extraction

**Purpose**: Get the Facebook page ID from the page URL.

```
GET /page/page_id?url={FACEBOOK_PAGE_URL}
```

**Parameters**:
- `url` (required): Full Facebook page URL
  - Format: `https://www.facebook.com/page-name`
  - Example: `https://www.facebook.com/mcdonalds`

**Sample Request**:
```javascript
const response = await fetch('https://facebook-scraper3.p.rapidapi.com/page/page_id?url=https%3A%2F%2Fwww.facebook.com%2Fmcdonalds', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.FACEBOOK_RAPIDAPI_KEY,
    'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "page_id": "100064458773195"
}
```

### Step 2: Photos Extraction

**Purpose**: Get page photos and visual content.

```
GET /page/photos?page_id={PAGE_ID}
```

**Response Schema**:
```javascript
{
  "results": [
    {
      "photo_id": "string",
      "url": "string",
      "timestamp": number,
      "description": "string"
    }
  ],
  "cursor": "string"
}
```

### Step 3: Posts Extraction

**Purpose**: Get recent posts from the Facebook page.

```
GET /page/posts?page_id={PAGE_ID}
```

**Response Schema**:
```javascript
{
  "results": [
    {
      "post_id": "1218248533667094",
      "type": "post",
      "url": "https://www.facebook.com/McDonalds/posts/...",
      "message": "M0N0pOLY OCTOBER!!! 1-844-GT-URBAG... YOU MIGHT WANNA DOWNLOAD MCD APP",
      "timestamp": 1758227256,
      "comments_count": number,
      "reactions_count": number,
      "shares_count": number
    }
  ],
  "cursor": "string"
}
```

### Step 4: Reviews Extraction

**Purpose**: Get customer reviews and ratings.

```
GET /page/reviews?page_id={PAGE_ID}
```

**Response Schema**:
```javascript
{
  "results": [
    {
      "review_id": "string",
      "reviewer_name": "string",
      "rating": number,
      "review_text": "string",
      "timestamp": number
    }
  ],
  "cursor": "string"
}
```

## Implementation Example

```javascript
async function getFacebookPageData(facebookUrl) {
  const headers = {
    'x-rapidapi-key': process.env.FACEBOOK_RAPIDAPI_KEY,
    'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com'
  };

  // Step 1: Get Page ID
  const pageIdResponse = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/page_id?url=${encodeURIComponent(facebookUrl)}`,
    { method: 'GET', headers }
  );
  const pageIdData = await pageIdResponse.json();
  const pageId = pageIdData.page_id;

  // Step 2: Get Photos (with rate limiting)
  await new Promise(resolve => setTimeout(resolve, 500));
  const photosResponse = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/photos?page_id=${pageId}`,
    { method: 'GET', headers }
  );
  const photosData = await photosResponse.json();

  // Step 3: Get Posts (with rate limiting)
  await new Promise(resolve => setTimeout(resolve, 500));
  const postsResponse = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/posts?page_id=${pageId}`,
    { method: 'GET', headers }
  );
  const postsData = await postsResponse.json();

  // Step 4: Get Reviews (with rate limiting)
  await new Promise(resolve => setTimeout(resolve, 500));
  const reviewsResponse = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/reviews?page_id=${pageId}`,
    { method: 'GET', headers }
  );
  const reviewsData = await reviewsResponse.json();

  return {
    pageId,
    photos: photosData.results || [],
    posts: postsData.results || [],
    reviews: reviewsData.results || []
  };
}
```

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid page URL or page ID format
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: API key not subscribed to Facebook Scraper endpoint
- **404 Not Found**: Facebook page not found or private
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Recovery

```javascript
async function safeFacebookRequest(url, headers, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { method: 'GET', headers });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API key not subscribed to Facebook Scraper endpoint');
        }
        if (response.status === 404) {
          throw new Error('Facebook page not found or is private');
        }
        if (response.status === 429) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`Rate limit hit, waiting ${backoffTime}ms before retry ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      
      const backoffTime = Math.pow(2, attempt) * 1000;
      console.warn(`Attempt ${attempt} failed, retrying in ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}
```

## Best Practices

1. **Rate Limiting**: Add 500ms delays between API calls
2. **Sequential Processing**: Execute steps in order (page ID → photos → posts → reviews)
3. **Error Handling**: Implement retry logic for transient errors (429, 500)
4. **URL Validation**: Ensure Facebook URLs are properly formatted
5. **API Key Security**: Use dedicated `FACEBOOK_RAPIDAPI_KEY` environment variable
6. **Response Validation**: Check for `results` arrays in responses
7. **Pagination**: Use `cursor` values for paginated results
8. **Content Filtering**: Handle various post types (text, photo, video, link)

## URL Validation

### Valid Facebook URLs
```
✅ https://www.facebook.com/mcdonalds
✅ https://www.facebook.com/pages/Business-Name/123456789
✅ https://www.facebook.com/business.name.123
```

### Invalid URLs (Will be Rejected)
```
❌ https://www.facebook.com/profile.php?id=123456789 (personal profiles)
❌ https://www.facebook.com/search/... (search URLs)
❌ https://www.facebook.com/events/... (event pages)
```

## Subscription Requirements

To access all features, ensure your RapidAPI account includes:

1. **Facebook Scraper3 API** - All endpoints (page_id, photos, posts, reviews) ✅ Working
2. **Adequate Rate Limits** - For commercial usage consider higher tier plans

## Data Quality Notes

- **Response Times**: Expect 3-4 seconds per endpoint call
- **Content Availability**: Public pages only; private/restricted pages return errors
- **Post Coverage**: Recent posts available; historical posts may be limited
- **Image Quality**: Direct URLs to Facebook CDN images
- **Real-time Updates**: Data reflects current state of Facebook page
- **Content Types**: Supports text posts, photos, videos, links, and events

## Performance Metrics

### Response Times (Actual Measurements)
- **Page ID Extraction**: 4261ms
- **Photos Extraction**: 4174ms  
- **Posts Extraction**: 3616ms
- **Reviews Extraction**: 3431ms
- **Total Process Time**: ~15-16 seconds for complete data extraction

### Data Volume (Typical Results)
- **Photos Retrieved**: 10-50 photos per page
- **Posts Extracted**: 3-20 recent posts
- **Reviews Available**: Varies by page type and settings
- **Post Content**: Full text, engagement metrics, timestamps

## Testing Your Implementation

Use the provided test commands to verify your API key and endpoints:

```bash
# Test Facebook page data extraction with real page URL
curl -X POST 'http://localhost:5000/api/tools/facebook-page-tool/execute' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "facebookUrl": "https://www.facebook.com/mcdonalds"
    },
    "runtimeContext": {}
  }'
```

This will test the complete 4-step data extraction pipeline and provide detailed feedback on functionality.