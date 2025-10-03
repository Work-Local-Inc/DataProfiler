# Google Places API - Schema Transformation Guide

## Overview

This document shows how we transform raw Google Places API responses into our structured business profiling schema. It includes location data processing, review analysis, and business verification workflows.

---

## Raw API Response Structure

### Example: McDonald's Google Places Data (API Key Required)
```json
{
  "search_response": {
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
            "width": 1920
          }
        ],
        "opening_hours": {
          "open_now": true,
          "weekday_text": [
            "Monday: 6:00 AM – 11:00 PM",
            "Tuesday: 6:00 AM – 11:00 PM"
          ]
        },
        "types": ["restaurant", "food", "point_of_interest", "establishment"],
        "business_status": "OPERATIONAL"
      }
    ],
    "status": "OK"
  },
  "details_response": {
    "result": {
      "formatted_phone_number": "(613) 555-0123",
      "website": "https://www.mcdonalds.com/ca/en-ca/location/...",
      "reviews": [
        {
          "author_name": "John Smith",
          "rating": 5,
          "relative_time_description": "2 weeks ago",
          "text": "Great service and fresh food. Always consistent quality.",
          "time": 1693449600
        }
      ]
    }
  }
}
```

### Current Response (Missing API Key)
```json
{
  "businessInfo": {
    "name": "McDonald's (Google Places data unavailable - API key required)",
    "rating": 0,
    "reviewCount": 0,
    "phone": "",
    "address": "",
    "website": ""
  },
  "hours": [],
  "reviews": [],
  "photos": []
}
```

---

## Our Structured Output Schema

### Target Business Profile Format
```json
{
  "businessInfo": {
    "name": "string",
    "place_id": "string",
    "address": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    },
    "phone": "string",
    "website": "string",
    "rating": "number",
    "reviewCount": "number",
    "priceLevel": "number",
    "businessStatus": "OPERATIONAL|CLOSED_TEMPORARILY|CLOSED_PERMANENTLY",
    "verified": "boolean",
    "categories": ["string"]
  },
  "location": {
    "formatted_address": "string",
    "address_components": [
      {
        "long_name": "string",
        "short_name": "string",
        "types": ["string"]
      }
    ],
    "plus_code": "string",
    "vicinity": "string"
  },
  "hours": [
    {
      "day": "string",
      "periods": [
        {
          "open": "string",
          "close": "string"
        }
      ],
      "isOpen": "boolean"
    }
  ],
  "reviews": [
    {
      "author": "string",
      "rating": "number",
      "text": "string",
      "date": "ISO_8601_string",
      "relative_time": "string",
      "profile_photo": "string"
    }
  ],
  "photos": [
    {
      "reference": "string",
      "url": "string",
      "width": "number",
      "height": "number",
      "attributions": ["string"]
    }
  ],
  "insights": {
    "business_verification": "verified|unverified|unknown",
    "data_quality_score": "number",
    "competitive_analysis": {
      "local_ranking": "number",
      "category_performance": "above_average|average|below_average"
    }
  }
}
```

---

## Data Transformation Rules

### 1. Business Information Processing

**Input Processing**:
```javascript
function transformBusinessInfo(searchResult, detailsResult) {
  // Handle missing API key scenario
  if (!searchResult || !searchResult.place_id) {
    return {
      name: `${businessName} (Google Places data unavailable - API key required)`,
      rating: 0,
      reviewCount: 0,
      phone: '',
      address: '',
      website: '',
      dataQuality: 'unavailable',
      errorType: 'missing_api_key',
      recommendations: [
        'Configure GOOGLE_PLACES_API_KEY environment variable',
        'Enable Places API in Google Cloud Console',
        'Verify API key has proper permissions and quotas'
      ]
    };
  }
  
  return {
    name: searchResult.name,
    place_id: searchResult.place_id,
    address: searchResult.formatted_address,
    coordinates: {
      lat: searchResult.geometry?.location?.lat || 0,
      lng: searchResult.geometry?.location?.lng || 0
    },
    phone: formatPhoneNumber(detailsResult?.formatted_phone_number),
    website: validateWebsite(detailsResult?.website),
    rating: searchResult.rating || 0,
    reviewCount: searchResult.user_ratings_total || 0,
    priceLevel: searchResult.price_level || null,
    businessStatus: searchResult.business_status || 'UNKNOWN',
    verified: assessVerificationStatus(searchResult),
    categories: classifyBusinessTypes(searchResult.types)
  };
}

function assessVerificationStatus(place) {
  // Google-verified business indicators
  if (place.business_status === 'OPERATIONAL' && 
      place.user_ratings_total > 10 && 
      place.rating > 3.0) {
    return true;
  }
  
  // Additional verification signals
  if (place.photos && place.photos.length > 0 &&
      place.opening_hours && 
      place.formatted_address) {
    return true;
  }
  
  return false;
}
```

**Data Quality Rules**:
- ✅ **Keep**: Place ID (unique Google identifier)
- ✅ **Keep**: Verified coordinates (high accuracy location data)
- ✅ **Keep**: Google-verified business status
- ✅ **Keep**: User ratings and review counts
- ✅ **Keep**: Official contact information (phone, website)
- ⚠️ **Handle Missing**: API key required for access
- 📝 **Priority**: Configure Google Places API for production use

### 2. Address and Location Processing

**Address Standardization**:
```javascript
function processAddressComponents(addressComponents) {
  const addressMap = {};
  
  addressComponents.forEach(component => {
    component.types.forEach(type => {
      switch(type) {
        case 'street_number':
          addressMap.streetNumber = component.long_name;
          break;
        case 'route':
          addressMap.streetName = component.long_name;
          break;
        case 'locality':
          addressMap.city = component.long_name;
          break;
        case 'administrative_area_level_1':
          addressMap.state = component.short_name;
          break;
        case 'country':
          addressMap.country = component.short_name;
          break;
        case 'postal_code':
          addressMap.postalCode = component.long_name;
          break;
      }
    });
  });
  
  return {
    standardized: {
      street: `${addressMap.streetNumber} ${addressMap.streetName}`.trim(),
      city: addressMap.city,
      state: addressMap.state,
      country: addressMap.country,
      postalCode: addressMap.postalCode
    },
    formatted: formatStandardAddress(addressMap),
    components: addressComponents
  };
}

function calculateLocationAccuracy(geometry) {
  // Google Places provides high-accuracy coordinates
  const accuracyScore = {
    coordinates: geometry?.location ? 100 : 0,
    address: geometry?.viewport ? 95 : 80, // Viewport indicates precise location
    geocoding: 90 // Google geocoding is highly accurate
  };
  
  return {
    overall: Math.max(...Object.values(accuracyScore)),
    details: accuracyScore,
    confidence: 'high' // Google Places data is authoritative
  };
}
```

### 3. Operating Hours Processing

**Hours Normalization**:
```javascript
function transformOperatingHours(openingHours) {
  if (!openingHours) {
    return {
      hours: [],
      currentStatus: 'unknown',
      dataAvailable: false
    };
  }
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const processedHours = [];
  
  // Process periods data (more structured)
  if (openingHours.periods) {
    const daySchedules = {};
    
    openingHours.periods.forEach(period => {
      const dayIndex = period.open.day;
      const dayName = daysOfWeek[dayIndex];
      
      if (!daySchedules[dayName]) {
        daySchedules[dayName] = [];
      }
      
      daySchedules[dayName].push({
        open: formatTime(period.open.time),
        close: period.close ? formatTime(period.close.time) : '24:00'
      });
    });
    
    // Convert to array format
    daysOfWeek.forEach(day => {
      processedHours.push({
        day: day,
        periods: daySchedules[day] || [],
        isOpen: (daySchedules[day] && daySchedules[day].length > 0),
        displayText: formatHoursDisplay(daySchedules[day])
      });
    });
  }
  
  // Fallback to weekday_text (human-readable format)
  else if (openingHours.weekday_text) {
    openingHours.weekday_text.forEach((dayText, index) => {
      const dayName = daysOfWeek[(index + 1) % 7]; // weekday_text starts with Monday
      processedHours.push({
        day: dayName,
        periods: parseHoursText(dayText),
        isOpen: !dayText.includes('Closed'),
        displayText: dayText.split(': ')[1] || 'Closed'
      });
    });
  }
  
  return {
    hours: processedHours,
    currentStatus: openingHours.open_now ? 'open' : 'closed',
    dataAvailable: true,
    lastUpdated: new Date().toISOString()
  };
}

function formatTime(timeString) {
  // Convert HHMM format to HH:MM AM/PM
  const hour = parseInt(timeString.substring(0, 2));
  const minute = timeString.substring(2, 4);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minute} ${ampm}`;
}
```

### 4. Review Analysis and Processing

**Review Quality Assessment**:
```javascript
function processReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      reviews: [],
      analysis: {
        averageRating: 0,
        totalReviews: 0,
        sentiment: 'unknown',
        recentActivity: 'none'
      }
    };
  }
  
  const processedReviews = reviews.map(review => ({
    author: review.author_name,
    rating: review.rating,
    text: cleanReviewText(review.text),
    date: convertUnixToISO(review.time),
    relative_time: review.relative_time_description,
    profile_photo: review.profile_photo_url,
    helpfulness: assessReviewHelpfulness(review),
    sentiment: analyzeReviewSentiment(review.text)
  }));
  
  const analysis = {
    averageRating: calculateAverageRating(processedReviews),
    totalReviews: processedReviews.length,
    sentiment: calculateOverallSentiment(processedReviews),
    recentActivity: assessReviewActivity(processedReviews),
    distribution: calculateRatingDistribution(processedReviews),
    topKeywords: extractKeywords(processedReviews)
  };
  
  return {
    reviews: processedReviews.slice(0, 10), // Keep top 10 reviews
    analysis: analysis
  };
}

function analyzeReviewSentiment(text) {
  if (!text) return 'neutral';
  
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'wonderful'];
  const negativeWords = ['terrible', 'awful', 'worst', 'horrible', 'disgusting', 'slow', 'rude'];
  
  const textLower = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
```

### 5. Photo Processing and Prioritization

**Photo Enhancement**:
```javascript
function processGooglePhotos(photos) {
  if (!photos || photos.length === 0) {
    return {
      photos: [],
      photoAnalysis: {
        totalPhotos: 0,
        qualityScore: 0,
        coverage: 'none'
      }
    };
  }
  
  const processedPhotos = photos.map((photo, index) => {
    const photoUrl = constructPhotoUrl(photo.photo_reference);
    
    return {
      reference: photo.photo_reference,
      url: photoUrl,
      thumbnail: constructPhotoUrl(photo.photo_reference, 400), // Smaller version
      width: photo.width,
      height: photo.height,
      attributions: photo.html_attributions || [],
      priority: calculatePhotoPriority(photo, index),
      source: 'google_places',
      quality_score: assessPhotoQuality(photo)
    };
  });
  
  return {
    photos: processedPhotos,
    photoAnalysis: {
      totalPhotos: processedPhotos.length,
      qualityScore: calculateAverageQuality(processedPhotos),
      coverage: assessPhotoCoverage(processedPhotos)
    }
  };
}

function calculatePhotoPriority(photo, index) {
  // First few photos are typically highest quality
  if (index < 3) return 'high';
  
  // High resolution photos get priority
  if (photo.width >= 1200 && photo.height >= 800) return 'high';
  
  // Medium quality photos
  if (photo.width >= 800) return 'medium';
  
  return 'low';
}

function constructPhotoUrl(photoReference, maxWidth = 1600) {
  // Note: Requires GOOGLE_PLACES_API_KEY
  return `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photoReference}&maxwidth=${maxWidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}
```

### 6. Business Category and Type Classification

**Category Processing**:
```javascript
function classifyBusinessTypes(googleTypes) {
  const categoryMapping = {
    // Food & Dining
    'restaurant': 'Restaurant',
    'food': 'Food Service',
    'meal_takeaway': 'Takeaway',
    'meal_delivery': 'Delivery',
    'bakery': 'Bakery',
    'cafe': 'Cafe',
    'bar': 'Bar',
    
    // Retail
    'store': 'Retail Store',
    'shopping_mall': 'Shopping Center',
    'clothing_store': 'Clothing',
    'grocery_or_supermarket': 'Grocery',
    
    // Services
    'gas_station': 'Gas Station',
    'bank': 'Financial Services',
    'atm': 'ATM',
    'hospital': 'Healthcare',
    'pharmacy': 'Pharmacy',
    
    // Entertainment
    'movie_theater': 'Entertainment',
    'amusement_park': 'Recreation',
    'gym': 'Fitness',
    
    // Default
    'establishment': 'Business',
    'point_of_interest': 'Point of Interest'
  };
  
  const categories = googleTypes
    .map(type => categoryMapping[type])
    .filter(Boolean)
    .filter((category, index, arr) => arr.indexOf(category) === index); // Remove duplicates
  
  return {
    primary: categories[0] || 'Business',
    secondary: categories.slice(1, 3),
    all: categories,
    google_types: googleTypes
  };
}
```

---

## Data Quality Guidelines

### Essential Data (Must Have)
- Place ID (for consistent identification)
- Business name and basic contact information
- Coordinates and formatted address
- Business operational status

### Important Data (Should Have)
- Customer ratings and review count
- Operating hours and current status
- Phone number and website
- Business categories and types

### Optional Data (Nice to Have)
- Customer reviews with sentiment analysis
- High-quality photos with proper attributions
- Price level and competitive positioning
- Detailed address components

### API Key Management
```javascript
function validateGooglePlacesSetup() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'error',
      message: 'GOOGLE_PLACES_API_KEY environment variable not configured',
      recommendations: [
        'Create Google Cloud Project',
        'Enable Places API',
        'Generate API key with Places API permissions',
        'Add GOOGLE_PLACES_API_KEY to environment variables'
      ]
    };
  }
  
  // Test API key with a simple request
  return testApiKey(apiKey);
}

async function testApiKey(apiKey) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return { status: 'success', message: 'Google Places API key is valid' };
    } else {
      return { 
        status: 'error', 
        message: `API key error: ${data.status}`,
        details: data.error_message 
      };
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: 'Failed to validate API key',
      error: error.message 
    };
  }
}
```

### Data Validation Rules
```javascript
function validateGooglePlacesProfile(profile) {
  const errors = [];
  const warnings = [];
  
  // Critical validations
  if (!profile.businessInfo?.place_id) {
    errors.push('Missing Google Place ID - cannot perform follow-up queries');
  }
  
  if (!profile.businessInfo?.name) {
    errors.push('Missing business name - profile cannot be identified');
  }
  
  if (!profile.businessInfo?.coordinates?.lat || !profile.businessInfo?.coordinates?.lng) {
    errors.push('Missing coordinates - location-based analysis not possible');
  }
  
  // Quality validations
  if (profile.businessInfo?.rating === 0) {
    warnings.push('No rating data - may indicate new or unverified business');
  }
  
  if (profile.businessInfo?.reviewCount < 5) {
    warnings.push('Few reviews - limited customer feedback available');
  }
  
  if (!profile.businessInfo?.phone && !profile.businessInfo?.website) {
    warnings.push('No contact information - may affect customer reach analysis');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    quality_score: calculateGooglePlacesQuality(profile),
    api_status: profile.businessInfo?.errorType ? 'configuration_required' : 'operational'
  };
}

function calculateGooglePlacesQuality(profile) {
  let score = 0;
  
  // Basic presence (0-30 points)
  if (profile.businessInfo?.place_id) score += 15;
  if (profile.businessInfo?.name) score += 15;
  
  // Contact information (0-25 points)
  if (profile.businessInfo?.phone) score += 10;
  if (profile.businessInfo?.website) score += 10;
  if (profile.businessInfo?.address) score += 5;
  
  // Customer feedback (0-25 points)
  if (profile.businessInfo?.rating > 0) score += 10;
  if (profile.businessInfo?.reviewCount >= 10) score += 15;
  
  // Additional data (0-20 points)
  if (profile.hours?.length > 0) score += 10;
  if (profile.photos?.length > 0) score += 10;
  
  return Math.min(score, 100);
}
```

---

## Storage Schema Mapping

### Database Table Mapping
```sql
-- Business profile with Google verification
INSERT INTO business_profiles (name, primary_address, google_place_id, verified_location)
VALUES (businessInfo.name, location.formatted_address, businessInfo.place_id, true);

-- Precise coordinates
INSERT INTO business_locations (business_id, latitude, longitude, accuracy, source)
VALUES (business_id, coordinates.lat, coordinates.lng, 'high', 'google_places');

-- Operating hours with structured data
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, source)
VALUES (business_id, day.day, day.periods[0].open, day.periods[0].close, 'google_places');

-- Reviews with sentiment analysis
INSERT INTO business_reviews (business_id, platform, reviewer_name, rating, review_text, sentiment)
VALUES (business_id, 'google', review.author, review.rating, review.text, review.sentiment);
```

### Raw Data Archive
```javascript
const rawDataRecord = {
  business_id: businessId,
  source_type: 'api_response',
  source_name: 'google_places',
  search_query: `${businessName} ${location}`,
  raw_response_json: {
    search_response: searchData,
    details_response: detailsData,
    extraction_timestamp: new Date().toISOString(),
    api_version: 'google_places_v1',
    api_key_configured: !!process.env.GOOGLE_PLACES_API_KEY,
    coordinates_accuracy: 'high'
  },
  response_status: searchData?.status === 'OK' ? 200 : 400,
  processing_status: searchData?.status === 'OK' ? 'processed' : 'failed_api_configuration'
};
```

This schema transformation provides the framework for extracting authoritative location and business data from Google Places API, with proper handling of API key requirements and comprehensive business intelligence extraction.