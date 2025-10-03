
# Yelp RapidAPI Documentation

## Overview

This documentation covers the **Yelp Business API** available through RapidAPI. This API provides comprehensive business data extraction from Yelp, including business details, reviews, and menu information.

## API Information

- **API Name**: Yelp Business API
- **Provider**: RapidAPI
- **Base URL**: `https://yelp-business-api.p.rapidapi.com`
- **Authentication**: RapidAPI Key

## Authentication

All requests require the following headers:

```javascript
{
  'x-rapidapi-key': 'YOUR_YELP_RAPIDAPI_KEY',
  'x-rapidapi-host': 'yelp-business-api.p.rapidapi.com'
}
```

### Environment Variable Setup

Set up your dedicated Yelp RapidAPI key as an environment variable:

```bash
YELP_RAPIDAPI_KEY=your_actual_yelp_rapidapi_key_here
```

**Security Enhancement**: This implementation uses platform-specific API keys (`YELP_RAPIDAPI_KEY`) instead of a generic key for better security isolation, independent rate limiting, and easier monitoring.

## Rate Limits

- **Estimated Limits**: 60 requests/minute, 1000 requests/day
- **Note**: Actual limits depend on your RapidAPI subscription plan
- **Recommendation**: Add 1-2 second delays between requests to avoid rate limiting

## Endpoints

### 1. Business Details Endpoint

**Purpose**: Get comprehensive business information including basic details, hours, photos, and initial reviews.

```
GET /each?business_url={YELP_BUSINESS_URL}
```

**Parameters**:
- `business_url` (required): Full Yelp business URL
  - Format: `https://www.yelp.com/biz/business-name-city`
  - Example: `https://www.yelp.com/biz/house-of-lasagna-ottawa`
  - **Important**: Must be a direct business page URL, not a search URL
  - **Invalid**: URLs containing `/search`, `/find`, or search parameters will be rejected

**Sample Request**:
```javascript
const response = await fetch('https://yelp-business-api.p.rapidapi.com/each?business_url=https%3A%2F%2Fwww.yelp.com%2Fbiz%2Fhouse-of-lasagna-ottawa', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.YELP_RAPIDAPI_KEY,
    'x-rapidapi-host': 'yelp-business-api.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "business_details": {
    "id": "string",              // Business ID for other endpoints
    "name": "string",
    "rating": number,
    "review_count": number,
    "phone": "string",
    "display_phone": "string",
    "address1": "string",
    "city": "string",
    "zip": "string",
    "display_address": ["string"],
    "website": "string",
    "hours": [{
      "day": "string",
      "start": "string",
      "end": "string"
    }],
    "photos": ["string"]         // Photo URLs
  },
  "menu": {
    "sections": [{
      "name": "string",
      "items": [{
        "name": "string",
        "price": "string",
        "description": "string"
      }]
    }]
  },
  "reviews": [{                  // Limited initial reviews
    "text": "string",
    "rating": number,
    "date": "string",
    "user": {
      "name": "string",
      "profile_image_url": "string"
    }
  }]
}
```

### 2. Business Reviews Endpoint (Paginated)

**Purpose**: Get detailed reviews for a business with pagination support.

```
GET /reviews?business_id={BUSINESS_ID}&reviews_per_page={COUNT}&offset={OFFSET}&sort_by={SORT}
```

**Parameters**:
- `business_id` (required): Business ID from business details endpoint
- `reviews_per_page` (optional): Number of reviews per page (default: 45, max: 45)
- `offset` (optional): Pagination offset (default: 0)
- `sort_by` (optional): Sort order
  - Options: `Yelp_sort`, `Date_desc`, `Date_asc`, `Rating_desc`, `Rating_asc`
  - Default: `Yelp_sort`

**Sample Request**:
```javascript
const response = await fetch('https://yelp-business-api.p.rapidapi.com/reviews?business_id=BUSINESS_ID&reviews_per_page=20&offset=0&sort_by=Yelp_sort', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.YELP_RAPIDAPI_KEY,
    'x-rapidapi-host': 'yelp-business-api.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "reviews": [{
    "id": "string",
    "text": "string",
    "rating": number,
    "date": "string",
    "user": {
      "id": "string",
      "name": "string",
      "profile_image_url": "string"
    },
    "photos": ["string"]
  }],
  "total_reviews": number,
  "has_more": boolean
}
```

### 3. Business Menu Endpoint

**Purpose**: Get detailed menu information including categories, items, prices, and descriptions.

```
GET /get_menus?business_id={BUSINESS_ID}
```

**Parameters**:
- `business_id` (required): Business ID from business details endpoint

**Sample Request**:
```javascript
const response = await fetch('https://yelp-business-api.p.rapidapi.com/get_menus?business_id=BUSINESS_ID', {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.YELP_RAPIDAPI_KEY,
    'x-rapidapi-host': 'yelp-business-api.p.rapidapi.com'
  }
});
```

**Response Schema**:
```javascript
{
  "sections": [{
    "name": "string",           // Menu category name
    "items": [{
      "name": "string",         // Item name
      "price": "string",        // Price (e.g., "$12.99")
      "description": "string"   // Item description
    }]
  }]
}
```

## Usage Workflow

The recommended workflow for comprehensive data extraction:

1. **Get Business Details**: Use `/each` endpoint to get basic info and `business_id`
2. **Extract Reviews**: Use `/reviews` endpoint with pagination to get all reviews
3. **Get Menu**: Use `/get_menus` endpoint for detailed menu information

## Implementation Example

```javascript
async function getCompleteBusinessData(businessUrl) {
  const headers = {
    'x-rapidapi-key': process.env.YELP_RAPIDAPI_KEY,
    'x-rapidapi-host': 'yelp-business-api.p.rapidapi.com'
  };

  // Step 1: Get business details
  const detailsResponse = await fetch(
    `https://yelp-business-api.p.rapidapi.com/each?business_url=${encodeURIComponent(businessUrl)}`,
    { method: 'GET', headers }
  );
  const businessData = await detailsResponse.json();
  const businessId = businessData.business_details?.id;

  if (!businessId) throw new Error('Business ID not found');

  // Step 2: Get paginated reviews
  const allReviews = [];
  let offset = 0;
  const reviewsPerPage = 45;
  
  while (true) {
    const reviewsResponse = await fetch(
      `https://yelp-business-api.p.rapidapi.com/reviews?business_id=${businessId}&reviews_per_page=${reviewsPerPage}&offset=${offset}&sort_by=Yelp_sort`,
      { method: 'GET', headers }
    );
    const reviewsData = await reviewsResponse.json();
    
    if (!reviewsData.reviews || reviewsData.reviews.length === 0) break;
    
    allReviews.push(...reviewsData.reviews);
    offset += reviewsPerPage;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 3: Get menu
  const menuResponse = await fetch(
    `https://yelp-business-api.p.rapidapi.com/get_menus?business_id=${businessId}`,
    { method: 'GET', headers }
  );
  const menuData = await menuResponse.json();

  return {
    business: businessData.business_details,
    reviews: allReviews,
    menu: menuData.sections || []
  };
}
```

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid parameters or malformed business URL
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: API key not subscribed to this endpoint - check your RapidAPI subscription
- **404 Not Found**: Business not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Recovery

```javascript
async function safeYelpRequest(url, headers) {
  try {
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('API key not subscribed to Yelp endpoint');
        return { error: 'API subscription required' };
      }
      if (response.status === 429) {
        console.warn('Rate limit exceeded, waiting before retry');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Implement retry logic here
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Yelp API request failed:', error);
    return { error: error.message };
  }
}
```

## Best Practices

1. **Rate Limiting**: Add delays between requests (1-2 seconds)
2. **Error Handling**: Implement retry logic for transient errors (429, 500)
3. **Pagination**: Use pagination for reviews to get complete data
4. **Caching**: Cache business details to avoid repeated calls
5. **URL Validation**: Validate business URLs before API calls
   - Reject search URLs (`/search`, `/find`)
   - Ensure format matches: `https://www.yelp.com/biz/business-name-city`
6. **API Key Security**: Use dedicated `YELP_RAPIDAPI_KEY` environment variable
7. **Subscription Management**: Ensure your RapidAPI account is subscribed to the Yelp Business API endpoint
8. **Graceful Degradation**: Return safe defaults when API calls fail

## Testing Your Implementation

Use the provided test script to verify your API key and endpoints:

```bash
node test-yelp-api.js
```

This will test all endpoints and provide detailed feedback on their functionality.
