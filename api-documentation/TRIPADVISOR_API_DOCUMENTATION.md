# TripAdvisor RapidAPI Documentation

## Overview

This documentation covers the **TripAdvisor Restaurant API** available through RapidAPI. This API provides comprehensive restaurant data extraction from TripAdvisor, including business details, reviews, ratings, and photos.

## API Information

- **API Name**: TripAdvisor Restaurant API  
- **Provider**: RapidAPI
- **Base URL**: `https://tripadvisor16.p.rapidapi.com`
- **Authentication**: RapidAPI Key

## Authentication

All requests require the following headers:

```javascript
{
  'x-rapidapi-key': 'YOUR_TRIPADVISOR_RAPIDAPI_KEY',
  'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
}
```

### Environment Variable Setup

Set up your dedicated TripAdvisor RapidAPI key as an environment variable:

```bash
TRIPADVISOR_RAPIDAPI_KEY=your_actual_tripadvisor_rapidapi_key_here
```

**Security Enhancement**: This implementation uses platform-specific API keys (`TRIPADVISOR_RAPIDAPI_KEY`) instead of a generic key for better security isolation, independent rate limiting, and easier monitoring.

## Rate Limits

- **Estimated Limits**: 60 requests/minute, 1000 requests/day
- **Note**: Actual limits depend on your RapidAPI subscription plan
- **Recommendation**: Add 2-3 second delays between requests to avoid rate limiting

## Main Endpoint

### Restaurant Details Endpoint

**Purpose**: Get comprehensive restaurant information including basic details, hours, photos, and reviews.

```
GET /api/v1/restaurant/getRestaurantDetails?restaurantsId={RESTAURANT_ID}&currencyCode=USD
```

**Parameters**:
- `restaurantsId` (required): TripAdvisor restaurant ID extracted from URL
  - Format: `g{locationId}-d{restaurantId}` 
  - Example: `g155004-d1751525` (from URL path `-g155004-d1751525-`)
- `currencyCode` (optional): Currency for pricing information (default: USD)

**URL Pattern Recognition**:
TripAdvisor URLs follow the pattern:
```
https://www.tripadvisor.com/Restaurant_Review-g{locationId}-d{restaurantId}-Reviews-{restaurant-name}-{location}.html
```

**Sample Request**:
```javascript
const response = await fetch('https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails?restaurantsId=g155004-d1751525&currencyCode=USD', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.TRIPADVISOR_RAPIDAPI_KEY,
    'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "status": true,
  "message": "Success", 
  "timestamp": 1758499005749,
  "data": {
    "about": {
      "content": [
        {
          "title": { "text": "Cuisines" },
          "list": [{ "text": "French" }]
        },
        {
          "title": { "text": "Serving" },
          "list": [
            { "text": "After-hours" },
            { "text": "Drinks" }
          ]
        }
      ]
    },
    "openHours": {
      "content": [
        {
          "dayOfWeek": { "text": "Monday" },
          "hours": [
            {
              "openTime": { "text": "12:00 PM" },
              "closeTime": { "text": "3:00 PM" }
            },
            {
              "openTime": { "text": "7:00 PM" },
              "closeTime": { "text": "11:00 PM" }
            }
          ]
        }
      ]
    },
    "overview": {
      "name": { "text": "Restaurant Name" },
      "rating": 1.8,
      "contact": {
        "phone": { "text": "+33 1 45 51 45 41" },
        "website": { "url": "http://www.facebook.com/..." }
      }
    },
    "heroMedia": {
      "photos": [
        {
          "url": "https://media-cdn.tripadvisor.com/media/photo-o/12/dd/0e/92/inside-seating-area.jpg",
          "width": 2000,
          "height": 1500
        }
      ]
    },
    "reviews": {
      "content": [
        {
          "count": 1305,
          "ratingValue": 1.8,
          "sections": [
            {
              "reviews": [
                {
                  "text": "Review text content...",
                  "rating": 4,
                  "publishedDate": "2025-08-22",
                  "userProfile": {
                    "displayName": "Reviewer Name"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

## Multi-Strategy Review Extraction

Our implementation uses a robust 3-strategy approach for review extraction:

### Strategy 1: Dedicated Reviews Endpoint (Currently Unavailable)
```
GET /api/v1/restaurant/getRestaurantReviews?restaurantsId={ID}&limit=20
```
**Status**: Returns 404 - Endpoint does not exist

### Strategy 2: TripAdvisor Scraper API (Requires Additional Subscription)
```
POST https://tripadvisor-scraper.p.rapidapi.com/reviews
```
**Status**: Returns 403 - Requires separate API subscription

### Strategy 3: Enhanced Main Data Extraction (✅ Currently Working)
Extracts review data from the main restaurant details response using intelligent parsing of nested data structures.

## Implementation Example

```javascript
async function getTripAdvisorRestaurant(tripAdvisorUrl) {
  // Extract restaurant ID from URL
  const urlMatch = tripAdvisorUrl.match(/-g(\d+)-d(\d+)-/);
  if (!urlMatch) {
    throw new Error('Invalid TripAdvisor URL format');
  }
  
  const locationId = urlMatch[1];
  const restaurantId = urlMatch[2];
  const restaurantsId = `g${locationId}-d${restaurantId}`;
  
  const headers = {
    'x-rapidapi-key': process.env.TRIPADVISOR_RAPIDAPI_KEY,
    'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
  };

  const response = await fetch(
    `https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails?restaurantsId=${restaurantsId}&currencyCode=USD`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`TripAdvisor API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Extract structured information
  return {
    name: data.data?.overview?.name?.text || '',
    rating: data.data?.overview?.rating || 0,
    phone: data.data?.overview?.contact?.phone?.text || '',
    website: data.data?.overview?.contact?.website?.url || '',
    cuisine: extractCuisineTypes(data.data?.about?.content),
    hours: extractOperatingHours(data.data?.openHours?.content),
    features: extractRestaurantFeatures(data.data?.about?.content),
    photos: extractPhotos(data.data?.heroMedia?.photos),
    reviews: extractReviews(data.data?.reviews)
  };
}
```

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid restaurant ID format
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: API key not subscribed to TripAdvisor endpoint
- **404 Not Found**: Restaurant not found or endpoint doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Recovery

```javascript
async function safeTripAdvisorRequest(url, headers) {
  try {
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('API key not subscribed to TripAdvisor endpoint');
        return { error: 'API subscription required' };
      }
      if (response.status === 404) {
        console.warn('Restaurant not found or endpoint unavailable');
        return { error: 'Restaurant not found' };
      }
      if (response.status === 429) {
        console.warn('Rate limit exceeded, waiting before retry');
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Implement retry logic here
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TripAdvisor API request failed:', error);
    return { error: error.message };
  }
}
```

## Best Practices

1. **Rate Limiting**: Add delays between requests (2-3 seconds recommended)
2. **Error Handling**: Implement retry logic for transient errors (429, 500)
3. **URL Validation**: Extract and validate restaurant IDs before API calls
4. **Multi-Strategy**: Use fallback approaches for review extraction
5. **API Key Security**: Use dedicated `TRIPADVISOR_RAPIDAPI_KEY` environment variable
6. **Subscription Management**: Ensure your RapidAPI account is subscribed to TripAdvisor16 API
7. **Data Parsing**: Handle complex nested JSON structures gracefully
8. **Graceful Degradation**: Return partial data when some endpoints fail

## URL Validation

### Valid TripAdvisor URLs
```
✅ https://www.tripadvisor.com/Restaurant_Review-g155004-d1751525-Reviews-Pub_Italia-Ottawa_Ontario.html
✅ https://www.tripadvisor.com/Restaurant_Review-g60763-d456789-Reviews-Pizza_Place-New_York_City.html
```

### Invalid URLs (Will be Rejected)
```
❌ https://www.tripadvisor.com/search?q=restaurants+ottawa
❌ https://www.tripadvisor.com/Restaurants-g155004-Ottawa_Ontario.html
❌ https://www.tripadvisor.com/FindRestaurants?geo=155004
```

## Subscription Requirements

To access all features, ensure your RapidAPI account includes:

1. **TripAdvisor16 API** - Main restaurant details endpoint ✅ Working
2. **TripAdvisor Scraper API** - Enhanced review extraction (optional)

## Data Quality Notes

- **Response Times**: Expect 2-3 seconds for restaurant details
- **Review Coverage**: Variable based on restaurant popularity
- **Photo Quality**: High-resolution images available via CDN URLs
- **Hours Accuracy**: Real-time operating hours when available
- **Multi-language**: Supports multiple languages via `lang` parameter

## Testing Your Implementation

Use the provided test commands to verify your API key and endpoints:

```bash
# Test restaurant details with real TripAdvisor URL
curl -X POST 'http://localhost:5000/api/tools/tripadvisor-restaurant-tool/execute' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "tripadvisorUrl": "https://www.tripadvisor.com/Restaurant_Review-g155004-d1751525-Reviews-Pub_Italia-Ottawa_Ontario.html"
    },
    "runtimeContext": {}
  }'
```

This will test the complete data extraction pipeline and provide detailed feedback on functionality.