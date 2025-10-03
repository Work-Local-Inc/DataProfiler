# Google Places API - Complete Endpoints Documentation

## Overview

This is the **complete reference** for all available endpoints in the Google Places API. This includes endpoints we currently use and those available for future enhancement.

**Base URL**: `https://maps.googleapis.com/maps/api/place`

## Authentication Headers
```javascript
{
  'X-Goog-Api-Key': 'YOUR_GOOGLE_PLACES_API_KEY'
}
```

---

## Search and Discovery Endpoints

### 1. Text Search (Place Search)
**Endpoint**: `/textsearch/json`  
**Method**: `GET`  
**Purpose**: Search for places using text queries  
**Status**: ✅ Currently Used

**Parameters**:
- `query` (required): Search query (business name + location)
- `key` (required): Google Places API key
- `fields` (optional): Comma-separated list of fields to return
- `location` (optional): Lat/lng coordinates for proximity bias
- `radius` (optional): Search radius in meters (max: 50000)
- `type` (optional): Place type filter (e.g., 'restaurant', 'store')
- `minprice` (optional): Price level filter (0-4)
- `maxprice` (optional): Price level filter (0-4)
- `opennow` (optional): Return only currently open places
- `pagetoken` (optional): Token for next page of results

**Example**:
```
GET /textsearch/json?query=McDonald's+Ottawa+Ontario&key=YOUR_API_KEY&fields=place_id,name,formatted_address,rating,user_ratings_total,price_level,photos,opening_hours,geometry
```

**Response**:
```json
{
  "results": [
    {
      "place_id": "ChIJ123456789abcdef",
      "name": "McDonald's",
      "formatted_address": "123 Main St, Ottawa, ON K1A 0A6, Canada",
      "rating": 4.1,
      "user_ratings_total": 250,
      "price_level": 1,
      "geometry": {
        "location": {
          "lat": 45.4215,
          "lng": -75.6972
        }
      },
      "photos": [
        {
          "photo_reference": "CmRaAAAA...",
          "height": 1080,
          "width": 1920,
          "html_attributions": ["<a href=\"...\">User Name</a>"]
        }
      ],
      "opening_hours": {
        "open_now": true,
        "weekday_text": [
          "Monday: 6:00 AM – 11:00 PM",
          "Tuesday: 6:00 AM – 11:00 PM"
        ]
      },
      "types": ["restaurant", "food", "point_of_interest", "establishment"]
    }
  ],
  "status": "OK",
  "next_page_token": "CpQB6AAAA..."
}
```

### 2. Nearby Search
**Endpoint**: `/nearbysearch/json`  
**Method**: `GET`  
**Purpose**: Search for places within a specified area  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `location` (required): Lat/lng coordinates
- `radius` (required): Search radius in meters (max: 50000)
- `key` (required): Google Places API key
- `keyword` (optional): Search keyword
- `name` (optional): Place name to search for
- `type` (optional): Place type (e.g., 'restaurant')
- `minprice` (optional): Price level filter (0-4)
- `maxprice` (optional): Price level filter (0-4)
- `opennow` (optional): Return only currently open places

**Example**:
```
GET /nearbysearch/json?location=45.4215,-75.6972&radius=5000&type=restaurant&keyword=McDonald's&key=YOUR_API_KEY
```

**Expected Response**:
```json
{
  "results": [
    {
      "place_id": "ChIJ123456789abcdef",
      "name": "McDonald's",
      "vicinity": "123 Main St, Ottawa",
      "rating": 4.1,
      "user_ratings_total": 250,
      "price_level": 1,
      "geometry": {
        "location": {
          "lat": 45.4215,
          "lng": -75.6972
        }
      },
      "business_status": "OPERATIONAL",
      "types": ["restaurant", "food", "point_of_interest"]
    }
  ],
  "status": "OK"
}
```

### 3. Find Place
**Endpoint**: `/findplacefromtext/json`  
**Method**: `GET`  
**Purpose**: Find a specific place from text input  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `input` (required): Text input (phone number, address, or name)
- `inputtype` (required): 'textquery' or 'phonenumber'
- `key` (required): Google Places API key
- `fields` (required): Comma-separated list of fields to return
- `locationbias` (optional): Prefer results in specified area

**Example**:
```
GET /findplacefromtext/json?input=McDonald's+Ottawa&inputtype=textquery&fields=place_id,name,formatted_address&key=YOUR_API_KEY
```

---

## Place Details Endpoints

### 4. Place Details
**Endpoint**: `/details/json`  
**Method**: `GET`  
**Purpose**: Get detailed information about a specific place  
**Status**: ✅ Currently Used (via place_id from search)

**Parameters**:
- `place_id` (required): Place ID from search results
- `key` (required): Google Places API key
- `fields` (optional): Comma-separated list of fields to return
- `language` (optional): Language code for results
- `region` (optional): Region code for results

**Available Fields**:
- **Basic**: `place_id`, `name`, `formatted_address`, `geometry`
- **Contact**: `formatted_phone_number`, `international_phone_number`, `website`
- **Atmosphere**: `rating`, `user_ratings_total`, `price_level`, `types`
- **Details**: `opening_hours`, `business_status`, `plus_code`
- **Reviews**: `reviews`
- **Photos**: `photos`
- **Address**: `address_components`, `vicinity`

**Example**:
```
GET /details/json?place_id=ChIJ123456789abcdef&fields=name,formatted_address,rating,user_ratings_total,formatted_phone_number,website,opening_hours,reviews,photos&key=YOUR_API_KEY
```

**Response**:
```json
{
  "result": {
    "name": "McDonald's",
    "formatted_address": "123 Main St, Ottawa, ON K1A 0A6, Canada",
    "rating": 4.1,
    "user_ratings_total": 250,
    "formatted_phone_number": "(613) 555-0123",
    "website": "https://www.mcdonalds.com/ca/en-ca/location/...",
    "opening_hours": {
      "open_now": true,
      "periods": [
        {
          "close": {
            "day": 0,
            "time": "2300"
          },
          "open": {
            "day": 0,
            "time": "0600"
          }
        }
      ],
      "weekday_text": [
        "Monday: 6:00 AM – 11:00 PM",
        "Tuesday: 6:00 AM – 11:00 PM",
        "Wednesday: 6:00 AM – 11:00 PM",
        "Thursday: 6:00 AM – 11:00 PM",
        "Friday: 6:00 AM – 12:00 AM",
        "Saturday: 6:00 AM – 12:00 AM",
        "Sunday: 6:00 AM – 11:00 PM"
      ]
    },
    "reviews": [
      {
        "author_name": "John Smith",
        "author_url": "https://www.google.com/maps/contrib/...",
        "profile_photo_url": "https://lh3.googleusercontent.com/...",
        "rating": 5,
        "relative_time_description": "2 weeks ago",
        "text": "Great service and fresh food. Always consistent quality.",
        "time": 1693449600,
        "translated": false
      }
    ],
    "photos": [
      {
        "photo_reference": "CmRaAAAA...",
        "height": 1080,
        "width": 1920,
        "html_attributions": ["<a href=\"...\">Restaurant Owner</a>"]
      }
    ]
  },
  "status": "OK"
}
```

---

## Photo and Media Endpoints

### 5. Place Photos
**Endpoint**: `/photo`  
**Method**: `GET`  
**Purpose**: Retrieve place photos using photo reference  
**Status**: ✅ Currently Used (via photo_reference)

**Parameters**:
- `photo_reference` (required): Photo reference from place details
- `key` (required): Google Places API key
- `maxwidth` (optional): Maximum width in pixels (1-1600)
- `maxheight` (optional): Maximum height in pixels (1-1600)

**Example**:
```
GET /photo?photo_reference=CmRaAAAA...&maxwidth=1600&key=YOUR_API_KEY
```

**Response**: Direct image binary data (JPEG/PNG)

---

## Autocomplete and Predictions Endpoints

### 6. Place Autocomplete
**Endpoint**: `/autocomplete/json`  
**Method**: `GET`  
**Purpose**: Get place predictions for autocomplete functionality  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `input` (required): Search input text
- `key` (required): Google Places API key
- `types` (optional): Restrict results to place types
- `location` (optional): Lat/lng for proximity bias
- `radius` (optional): Distance for proximity bias
- `components` (optional): Country restriction
- `strictbounds` (optional): Restrict to location bounds

**Example**:
```
GET /autocomplete/json?input=McDonald's&types=establishment&location=45.4215,-75.6972&radius=10000&key=YOUR_API_KEY
```

**Expected Response**:
```json
{
  "predictions": [
    {
      "description": "McDonald's, Main Street, Ottawa, ON, Canada",
      "place_id": "ChIJ123456789abcdef",
      "reference": "reference_token",
      "structured_formatting": {
        "main_text": "McDonald's",
        "main_text_matched_substrings": [
          {
            "length": 10,
            "offset": 0
          }
        ],
        "secondary_text": "Main Street, Ottawa, ON, Canada"
      },
      "types": ["restaurant", "food", "point_of_interest", "establishment"]
    }
  ],
  "status": "OK"
}
```

### 7. Query Autocomplete
**Endpoint**: `/queryautocomplete/json`  
**Method**: `GET`  
**Purpose**: Get query predictions for search functionality  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `input` (required): Search query text
- `key` (required): Google Places API key
- `location` (optional): Lat/lng for proximity bias
- `radius` (optional): Distance for proximity bias

---

## Advanced Features Endpoints

### 8. Distance Matrix
**Endpoint**: `/distancematrix/json` (in Maps API)  
**Method**: `GET`  
**Purpose**: Calculate distances between multiple origins and destinations  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `origins` (required): Starting points (addresses or lat/lng)
- `destinations` (required): End points (addresses or lat/lng)
- `key` (required): Google Places API key
- `mode` (optional): Travel mode ('driving', 'walking', 'bicycling', 'transit')
- `units` (optional): 'metric' or 'imperial'

### 9. Geocoding
**Endpoint**: `/geocode/json` (in Geocoding API)  
**Method**: `GET`  
**Purpose**: Convert addresses to coordinates and vice versa  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `address` (optional): Address to geocode
- `latlng` (optional): Coordinates to reverse geocode
- `key` (required): Google Places API key
- `components` (optional): Geographic restrictions

---

## Rate Limits and Usage

### Current Usage Pattern
- **Text Search**: 1 call per business search
- **Place Details**: 1 call per business (when place_id found)
- **Photos**: Multiple calls for image retrieval
- **Total**: 2-5 calls per business profile

### Pricing and Quotas
- **Text Search**: $32 per 1000 requests
- **Place Details**: $17 per 1000 requests (Basic Data)
- **Place Details**: $32 per 1000 requests (Contact Data)
- **Place Details**: $32 per 1000 requests (Atmosphere Data)
- **Place Photos**: $7 per 1000 requests
- **Daily Quota**: 100,000 requests per day (default)

### Future Enhancement Opportunities
- **Nearby Search**: Competitor analysis in geographic areas
- **Autocomplete**: Enhanced search user experience
- **Distance Matrix**: Service area analysis and logistics
- **Multiple Photos**: Comprehensive visual business profiles
- **Review Analysis**: Detailed customer sentiment tracking

### Recommended Implementation Priority
1. **High Priority**: Nearby Search, Place Photos (competitive analysis)
2. **Medium Priority**: Autocomplete, Distance Matrix (user experience)
3. **Low Priority**: Geocoding, Query Autocomplete (advanced features)

---

## Technical Considerations

### Response Times
- **Text Search**: 200-500ms
- **Place Details**: 300-600ms
- **Place Photos**: 100-300ms per image
- **Nearby Search**: 200-400ms

### Error Handling
Common status codes:
- **OK**: Successful request
- **ZERO_RESULTS**: No results found
- **OVER_QUERY_LIMIT**: Quota exceeded
- **REQUEST_DENIED**: API key invalid or restricted
- **INVALID_REQUEST**: Missing required parameters
- **NOT_FOUND**: Place ID not found

### Field Selection Strategy
```javascript
// Essential fields for business profiling
const essentialFields = [
  'place_id', 'name', 'formatted_address', 'geometry',
  'rating', 'user_ratings_total', 'business_status'
];

// Contact fields (higher cost)
const contactFields = [
  'formatted_phone_number', 'website'
];

// Atmosphere fields (higher cost)
const atmosphereFields = [
  'price_level', 'opening_hours', 'types'
];

// Photos and reviews (separate costs)
const mediaFields = [
  'photos', 'reviews'
];
```

### Optimization Strategies
1. **Field Selection**: Only request needed fields to minimize costs
2. **Caching**: Store place_id results to avoid repeated searches
3. **Batch Processing**: Group multiple location searches efficiently
4. **Fallback Handling**: Graceful degradation when quota exceeded
5. **Photo Optimization**: Resize images appropriately for storage/display

This complete reference enables comprehensive location-based business intelligence and geographic analysis through Google Places API.