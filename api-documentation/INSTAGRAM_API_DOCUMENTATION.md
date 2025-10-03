# Instagram Profile RapidAPI Documentation

## Overview

This documentation covers the **Instagram Looter API** available through RapidAPI. This API provides comprehensive Instagram profile data extraction including posts, images, profile information, and engagement metrics.

## API Information

- **API Name**: Instagram Looter2 API
- **Provider**: RapidAPI
- **Base URL**: `https://instagram-looter2.p.rapidapi.com`
- **Authentication**: RapidAPI Key

## Authentication

All requests require the following headers:

```javascript
{
  'x-rapidapi-key': 'YOUR_INSTAGRAM_RAPIDAPI_KEY',
  'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com'
}
```

### Environment Variable Setup

Set up your dedicated Instagram RapidAPI key as an environment variable:

```bash
INSTAGRAM_RAPIDAPI_KEY=your_actual_instagram_rapidapi_key_here
```

**Security Enhancement**: This implementation uses platform-specific API keys (`INSTAGRAM_RAPIDAPI_KEY`) instead of a generic key for better security isolation, independent rate limiting, and easier monitoring.

## Rate Limits

- **Estimated Limits**: 100 requests/minute, 1000 requests/day
- **Note**: Actual limits depend on your RapidAPI subscription plan
- **Recommendation**: Add 1-2 second delays between requests to avoid rate limiting
- **Response Times**: Expect 2-3 seconds per API call

## Main Endpoint

### Profile Data Endpoint

**Purpose**: Get comprehensive Instagram profile information including posts, images, and engagement metrics.

```
GET /profile?username={INSTAGRAM_USERNAME}
```

**Parameters**:
- `username` (required): Instagram username (without @ symbol)
  - Format: `username` (not `@username`)
  - Example: `mcdonalds`
  - **Important**: Must be a public Instagram profile

**URL Pattern Recognition**:
Instagram URLs follow the pattern:
```
https://www.instagram.com/{username}/
```

**Sample Request**:
```javascript
const response = await fetch('https://instagram-looter2.p.rapidapi.com/profile?username=mcdonalds', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.INSTAGRAM_RAPIDAPI_KEY,
    'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "profile": {
    "username": "mcdonalds",
    "full_name": "McDonald's",
    "biography": "string",
    "followers_count": number,
    "following_count": number,
    "posts_count": number,
    "profile_picture_url": "string",
    "is_verified": boolean,
    "is_private": boolean,
    "website": "string"
  },
  "posts": [
    {
      "post_id": "string",
      "post_url": "string",
      "caption": "string",
      "image_url": "string",
      "video_url": "string",
      "likes_count": number,
      "comments_count": number,
      "timestamp": number,
      "location": {
        "name": "string",
        "coordinates": {
          "lat": number,
          "lng": number
        }
      }
    }
  ],
  "images": [
    {
      "image_url": "string",
      "thumbnail_url": "string",
      "width": number,
      "height": number,
      "post_id": "string"
    }
  ],
  "videos": [
    {
      "video_url": "string",
      "thumbnail_url": "string",
      "duration": number,
      "post_id": "string"
    }
  ]
}
```

## Implementation Example

```javascript
async function getInstagramProfileData(instagramUrl) {
  // Extract username from URL
  const username = extractUsernameFromUrl(instagramUrl);
  
  const headers = {
    'x-rapidapi-key': process.env.INSTAGRAM_RAPIDAPI_KEY,
    'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com'
  };

  try {
    const response = await fetch(
      `https://instagram-looter2.p.rapidapi.com/profile?username=${username}`,
      { method: 'GET', headers }
    );
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract structured information
    return {
      profile: {
        username: data.username || username,
        name: data.full_name || '',
        bio: data.biography || '',
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        postsCount: data.posts_count || 0,
        profilePicture: data.profile_picture_url || '',
        verified: data.is_verified || false,
        private: data.is_private || false,
        website: data.website || ''
      },
      posts: data.posts || [],
      images: data.images || [],
      videos: data.videos || []
    };
  } catch (error) {
    console.error('Instagram API request failed:', error);
    throw error;
  }
}

function extractUsernameFromUrl(instagramUrl) {
  const urlMatch = instagramUrl.match(/instagram\.com\/([^\/\?]+)/);
  if (!urlMatch) {
    throw new Error('Invalid Instagram URL format');
  }
  return urlMatch[1];
}
```

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid username format
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: API key not subscribed to Instagram Looter endpoint
- **404 Not Found**: Instagram profile not found or private
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Recovery

```javascript
async function safeInstagramRequest(username, headers, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://instagram-looter2.p.rapidapi.com/profile?username=${username}`,
        { method: 'GET', headers }
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API key not subscribed to Instagram Looter endpoint');
        }
        if (response.status === 404) {
          throw new Error('Instagram profile not found or is private');
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

1. **Rate Limiting**: Add 1-2 second delays between requests
2. **Error Handling**: Implement retry logic for transient errors (429, 500)
3. **Username Extraction**: Parse usernames correctly from Instagram URLs
4. **Public Profiles Only**: API works only with public Instagram profiles
5. **API Key Security**: Use dedicated `INSTAGRAM_RAPIDAPI_KEY` environment variable
6. **Content Filtering**: Handle different post types (photos, videos, carousels)
7. **Image Optimization**: Use appropriate image sizes for your application
8. **Compliance**: Respect Instagram's terms of service and user privacy

## URL Validation

### Valid Instagram URLs
```
✅ https://www.instagram.com/mcdonalds/
✅ https://www.instagram.com/mcdonalds
✅ https://instagram.com/mcdonalds/
✅ https://www.instagram.com/business.name.123/
```

### Invalid URLs (Will be Rejected)
```
❌ https://www.instagram.com/p/ABC123/ (individual posts)
❌ https://www.instagram.com/explore/ (explore pages)
❌ https://www.instagram.com/stories/username/ (stories)
❌ https://www.instagram.com/search?q=... (search URLs)
```

## Subscription Requirements

To access all features, ensure your RapidAPI account includes:

1. **Instagram Looter2 API** - Profile endpoint access ✅ Working
2. **Adequate Rate Limits** - For commercial usage consider higher tier plans

## Data Quality Notes

- **Response Times**: Expect 2-3 seconds for profile data extraction
- **Content Availability**: Public profiles only; private profiles return errors
- **Post Coverage**: Recent posts available; historical posts may be limited
- **Image Quality**: Direct URLs to Instagram CDN images
- **Real-time Updates**: Data reflects current state of Instagram profile
- **Content Types**: Supports photos, videos, carousels, and reels

## Content Extraction Capabilities

### Profile Information
- Username, display name, biography
- Follower/following counts
- Post count and verification status
- Profile picture and website links
- Account privacy status

### Post Data
- Post captions and hashtags
- Like and comment counts
- Publication timestamps
- Location information (when available)
- Post URLs for direct access

### Media Content
- High-resolution image URLs
- Video URLs and thumbnails
- Media dimensions and metadata
- Thumbnail generations for videos

## Testing Your Implementation

Use the provided test commands to verify your API key and endpoints:

```bash
# Test Instagram profile data extraction with real profile URL
curl -X POST 'http://localhost:5000/api/tools/instagram-profile-tool/execute' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "instagramUrl": "https://www.instagram.com/mcdonalds"
    },
    "runtimeContext": {}
  }'
```

This will test the complete Instagram data extraction pipeline and provide detailed feedback on functionality.