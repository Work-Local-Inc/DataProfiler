# Uber Eats API - Schema Transformation Guide

## Overview

This document shows how we transform raw Uber Eats API responses into our structured business profiling schema. It includes menu analysis, pricing insights, and delivery logistics transformation.

---

## Raw API Response Structure

### Example: McDonald's Uber Eats Data (Empty Response)
```json
{
  "menu_response": {
    "restaurant": {
      "name": "",
      "rating": 0,
      "reviewCount": 0,
      "deliveryTime": "",
      "deliveryFee": ""
    },
    "menu": []
  }
}
```

### Expected Full Response Structure (When Working)
```json
{
  "menu_response": {
    "restaurant": {
      "name": "McDonald's",
      "description": "Fast food restaurant serving burgers, fries, and more",
      "rating": 4.2,
      "review_count": 1520,
      "price_range": "$",
      "delivery_time": "15-30 min",
      "delivery_fee": "$1.99",
      "minimum_order": "$12.00",
      "location": {
        "address": "123 Main St, City, State 12345",
        "coordinates": {
          "lat": 40.7589,
          "lng": -73.9851
        }
      },
      "cuisine_types": ["Fast Food", "American", "Burgers"],
      "hours": {
        "monday": "6:00 AM - 11:00 PM",
        "tuesday": "6:00 AM - 11:00 PM"
      }
    },
    "menu": {
      "sections": [
        {
          "section_name": "Burgers",
          "section_id": "burgers_123",
          "items": [
            {
              "item_id": "big_mac_456",
              "name": "Big Mac",
              "description": "Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun",
              "price": 5.99,
              "calories": 550,
              "image_url": "https://d1ralsognjng37.cloudfront.net/...",
              "dietary_info": ["Contains: Wheat, Soy, Sesame"],
              "availability": true
            }
          ]
        }
      ]
    }
  }
}
```

---

## Our Structured Output Schema

### Target Business Profile Format
```json
{
  "restaurantInfo": {
    "name": "string",
    "description": "string",
    "rating": "number",
    "reviewCount": "number",
    "priceRange": "string",
    "cuisineTypes": ["string"],
    "location": {
      "address": "string",
      "coordinates": {
        "lat": "number",
        "lng": "number"
      }
    }
  },
  "deliveryInfo": {
    "deliveryTime": "string",
    "deliveryFee": "string",
    "minimumOrder": "string",
    "serviceAreas": ["string"]
  },
  "menu": [
    {
      "section": "string",
      "items": [
        {
          "name": "string",
          "description": "string",
          "price": "number",
          "calories": "number",
          "image": "string",
          "category": "appetizer|main|side|dessert|beverage",
          "priority": "high|medium|low",
          "dietary": ["string"],
          "popularity": "number"
        }
      ]
    }
  ],
  "businessMetrics": {
    "averageOrderValue": "number",
    "popularItems": ["string"],
    "peakHours": ["string"],
    "competitiveAnalysis": {
      "pricePosition": "budget|mid-range|premium",
      "menuDiversity": "number",
      "deliveryCompetitiveness": "number"
    }
  },
  "hours": [
    {
      "day": "string",
      "hours": "string",
      "isOpen": "boolean"
    }
  ]
}
```

---

## Data Transformation Rules

### 1. Restaurant Information Processing

**Input Processing**:
```javascript
function transformRestaurantInfo(rawRestaurant) {
  // Handle empty response scenario
  if (!rawRestaurant.name) {
    return {
      name: '',
      description: '',
      rating: 0,
      reviewCount: 0,
      priceRange: '',
      cuisineTypes: [],
      location: null,
      dataQuality: 'missing',
      errorReason: 'Restaurant data not available - may require different URL format or subscription'
    };
  }
  
  return {
    name: rawRestaurant.name,
    description: cleanDescription(rawRestaurant.description),
    rating: rawRestaurant.rating || 0,
    reviewCount: rawRestaurant.review_count || 0,
    priceRange: normalizePriceRange(rawRestaurant.price_range),
    cuisineTypes: rawRestaurant.cuisine_types || [],
    location: transformLocation(rawRestaurant.location),
    dataQuality: assessDataQuality(rawRestaurant)
  };
}

function normalizePriceRange(priceRange) {
  const priceMap = {
    '$': 'budget',
    '$$': 'mid-range', 
    '$$$': 'premium',
    '$$$$': 'luxury'
  };
  return priceMap[priceRange] || 'unknown';
}
```

**Data Quality Rules**:
- ✅ **Keep**: Restaurant name (essential identifier)
- ✅ **Keep**: Rating and review count (credibility indicators)
- ✅ **Keep**: Price range (positioning information)
- ✅ **Keep**: Cuisine types (category classification)
- ✅ **Keep**: Location data (geographic analysis)
- ⚠️ **Handle Empty**: Current API responses are empty - requires investigation

### 2. Menu Analysis and Classification

**Menu Item Classification**:
```javascript
function classifyMenuItem(item, sectionName) {
  const name = item.name?.toLowerCase() || '';
  const description = item.description?.toLowerCase() || '';
  const section = sectionName?.toLowerCase() || '';
  
  // Category classification
  let category = 'main';
  if (section.includes('appetizer|starter|side')) category = 'appetizer';
  if (section.includes('dessert|sweet|ice cream')) category = 'dessert';
  if (section.includes('drink|beverage|coffee|soda')) category = 'beverage';
  if (section.includes('side|fries|salad') && !name.includes('burger|sandwich')) category = 'side';
  
  // Priority classification
  let priority = 'medium';
  if (item.popularity_rank <= 3) priority = 'high';
  if (item.price > calculateAveragePrice() * 1.5) priority = 'high'; // Premium items
  if (item.calories && item.calories > 800) priority = 'medium'; // High-calorie signature items
  if (item.availability === false) priority = 'low';
  
  return { category, priority };
}

function calculateMenuDiversity(menuSections) {
  const categories = new Set();
  const priceRanges = [];
  const dietaryOptions = new Set();
  
  menuSections.forEach(section => {
    section.items.forEach(item => {
      categories.add(classifyMenuItem(item, section.section_name).category);
      priceRanges.push(item.price);
      (item.dietary_info || []).forEach(diet => dietaryOptions.add(diet));
    });
  });
  
  return {
    categoryCount: categories.size,
    priceVariance: calculateVariance(priceRanges),
    dietaryOptionsCount: dietaryOptions.size,
    diversityScore: (categories.size * 20) + (dietaryOptions.size * 10) + Math.min(priceRanges.length, 50)
  };
}
```

**Menu Processing Rules**:
- ✅ **Include**: All menu items with prices
- ✅ **Prioritize**: Popular items (top 3 in each category)
- ✅ **Prioritize**: Premium items (>150% of average price)
- ✅ **Prioritize**: Signature items (high calories, complex descriptions)
- ⚠️ **Flag**: Items without prices (may be unavailable)
- ❌ **Exclude**: Items marked as unavailable
- 📊 **Analyze**: Category distribution and price ranges

### 3. Pricing and Competitive Analysis

**Price Analysis**:
```javascript
function analyzePricing(menuItems, restaurantInfo) {
  const prices = menuItems.map(item => item.price).filter(price => price > 0);
  
  if (prices.length === 0) {
    return {
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      pricePosition: 'unknown',
      competitiveScore: 0
    };
  }
  
  const analysis = {
    averagePrice: calculateMean(prices),
    medianPrice: calculateMedian(prices),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    priceDistribution: calculateDistribution(prices),
    itemsByPriceCategory: categorizeByPrice(menuItems)
  };
  
  // Competitive positioning
  analysis.pricePosition = determinePricePosition(analysis.averagePrice, restaurantInfo.cuisineTypes);
  analysis.competitiveScore = calculateCompetitiveScore(analysis, restaurantInfo);
  
  return analysis;
}

function determinePricePosition(avgPrice, cuisineTypes) {
  // Fast food price benchmarks
  if (cuisineTypes.includes('Fast Food')) {
    if (avgPrice < 8) return 'budget';
    if (avgPrice < 15) return 'mid-range';
    return 'premium';
  }
  
  // General restaurant benchmarks
  if (avgPrice < 12) return 'budget';
  if (avgPrice < 25) return 'mid-range';
  if (avgPrice < 40) return 'premium';
  return 'luxury';
}
```

### 4. Delivery Logistics Processing

**Delivery Analysis**:
```javascript
function transformDeliveryInfo(rawDelivery) {
  return {
    deliveryTime: parseDeliveryTime(rawDelivery.delivery_time),
    deliveryFee: parsePrice(rawDelivery.delivery_fee),
    minimumOrder: parsePrice(rawDelivery.minimum_order),
    serviceAreas: rawDelivery.service_areas || [],
    deliveryEfficiency: calculateDeliveryScore(rawDelivery)
  };
}

function parseDeliveryTime(timeString) {
  // Convert "15-30 min" to structured format
  const match = timeString?.match(/(\d+)-(\d+)\s*min/);
  if (match) {
    return {
      min: parseInt(match[1]),
      max: parseInt(match[2]),
      average: (parseInt(match[1]) + parseInt(match[2])) / 2,
      displayText: timeString
    };
  }
  return null;
}

function calculateDeliveryScore(deliveryInfo) {
  let score = 50; // Base score
  
  // Time efficiency (faster = better)
  const avgTime = deliveryInfo.deliveryTime?.average || 30;
  if (avgTime <= 20) score += 20;
  else if (avgTime <= 30) score += 10;
  else if (avgTime > 45) score -= 10;
  
  // Fee competitiveness (lower = better)
  const fee = parseFloat(deliveryInfo.deliveryFee?.replace('$', '')) || 3;
  if (fee <= 1.50) score += 15;
  else if (fee <= 2.50) score += 5;
  else if (fee > 4.00) score -= 10;
  
  // Minimum order (lower = better)
  const minOrder = parseFloat(deliveryInfo.minimumOrder?.replace('$', '')) || 15;
  if (minOrder <= 10) score += 10;
  else if (minOrder > 20) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}
```

### 5. Operating Hours Processing

**Hours Transformation**:
```javascript
function transformOperatingHours(rawHours) {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return daysOfWeek.map(day => {
    const hoursString = rawHours[day];
    const isOpen = hoursString && hoursString !== 'Closed';
    
    return {
      day: capitalize(day),
      hours: hoursString || 'Closed',
      isOpen: isOpen,
      openTime: isOpen ? parseOpenTime(hoursString) : null,
      closeTime: isOpen ? parseCloseTime(hoursString) : null,
      duration: isOpen ? calculateDuration(hoursString) : 0
    };
  });
}

function analyzeOperatingPatterns(hoursArray) {
  const openDays = hoursArray.filter(day => day.isOpen);
  const totalHours = openDays.reduce((sum, day) => sum + day.duration, 0);
  
  return {
    daysOpen: openDays.length,
    averageHoursPerDay: totalHours / openDays.length,
    lateNightService: openDays.some(day => day.closeTime && day.closeTime.hour >= 23),
    earlyMorningService: openDays.some(day => day.openTime && day.openTime.hour <= 7),
    weekendAvailability: hoursArray.slice(5, 7).every(day => day.isOpen), // Sat & Sun
    operationalScore: calculateOperationalScore(openDays, totalHours)
  };
}
```

---

## Data Quality Guidelines

### Essential Data (Must Have)
- Restaurant name and basic information
- At least partial menu data with prices
- Delivery information (time, fee, minimum order)
- Operating hours for current day

### Important Data (Should Have)
- Complete menu with multiple categories
- Pricing for majority of items
- Restaurant rating and review count
- Cuisine type classification

### Optional Data (Nice to Have)
- Detailed item descriptions and images
- Nutritional information
- Customer reviews and feedback
- Promotional offers and deals

### Error Handling for Empty Responses
```javascript
function handleEmptyUberEatsResponse(originalUrl) {
  return {
    restaurantInfo: {
      name: '',
      dataQuality: 'unavailable',
      errorType: 'empty_response',
      possibleCauses: [
        'Invalid restaurant URL format',
        'Restaurant not available in API region',
        'API subscription limitations',
        'Restaurant temporarily unavailable on Uber Eats'
      ],
      recommendations: [
        'Verify URL format: https://www.ubereats.com/store/{name}/{id}',
        'Check if restaurant is active on Uber Eats platform',
        'Try alternative delivery platform APIs',
        'Consider manual data collection for critical restaurants'
      ]
    },
    menu: [],
    deliveryInfo: {
      available: false,
      reason: 'No data available'
    },
    lastAttempted: new Date().toISOString(),
    sourceUrl: originalUrl
  };
}
```

### Data Validation Rules
```javascript
function validateUberEatsProfile(profile) {
  const errors = [];
  const warnings = [];
  
  // Critical validations
  if (!profile.restaurantInfo?.name) {
    errors.push('Missing restaurant name - profile cannot be identified');
  }
  
  if (!profile.menu || profile.menu.length === 0) {
    errors.push('No menu data available - core business information missing');
  }
  
  if (!profile.deliveryInfo?.deliveryTime) {
    warnings.push('Missing delivery information - service details unavailable');
  }
  
  // Business intelligence validations
  if (profile.menu && profile.menu.length > 0) {
    const totalItems = profile.menu.reduce((sum, section) => sum + section.items.length, 0);
    if (totalItems < 5) {
      warnings.push('Limited menu data - may not represent full offerings');
    }
  }
  
  const avgPrice = calculateAverageMenuPrice(profile.menu);
  if (avgPrice === 0) {
    warnings.push('No pricing information - economic analysis not possible');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    quality_score: calculateQualityScore(profile),
    completeness: calculateCompleteness(profile)
  };
}

function calculateQualityScore(profile) {
  let score = 0;
  
  // Basic information (0-30 points)
  if (profile.restaurantInfo?.name) score += 10;
  if (profile.restaurantInfo?.rating > 0) score += 10;
  if (profile.restaurantInfo?.cuisineTypes?.length > 0) score += 10;
  
  // Menu completeness (0-40 points)
  const menuSections = profile.menu?.length || 0;
  const totalItems = profile.menu?.reduce((sum, section) => sum + section.items.length, 0) || 0;
  score += Math.min(menuSections * 5, 20); // Max 20 for sections
  score += Math.min(totalItems * 2, 20);   // Max 20 for items
  
  // Service information (0-30 points)
  if (profile.deliveryInfo?.deliveryTime) score += 10;
  if (profile.deliveryInfo?.deliveryFee) score += 10;
  if (profile.hours?.some(day => day.isOpen)) score += 10;
  
  return Math.min(score, 100);
}
```

---

## Storage Schema Mapping

### Database Table Mapping
```sql
-- Business profile main record
INSERT INTO business_profiles (name, business_type, primary_address)
VALUES (restaurantInfo.name, 'Restaurant', location.address);

-- Delivery service record
INSERT INTO business_delivery (business_id, platform, delivery_time, delivery_fee, minimum_order)
VALUES (business_id, 'ubereats', deliveryInfo.deliveryTime, deliveryInfo.deliveryFee, deliveryInfo.minimumOrder);

-- Menu items storage
INSERT INTO business_menu_items (business_id, platform, item_name, price, category, description)
VALUES (business_id, 'ubereats', item.name, item.price, item.category, item.description);

-- Operating hours
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_open)
VALUES (business_id, day.day, day.openTime, day.closeTime, day.isOpen);
```

### Raw Data Archive
```javascript
const rawDataRecord = {
  business_id: businessId,
  source_type: 'api_response',
  source_name: 'uber_eats5',
  search_query: originalUrl,
  raw_response_json: {
    menu_response: menuData,
    extraction_timestamp: new Date().toISOString(),
    api_version: 'uber_eats5_v1',
    response_empty: menuData.restaurant?.name ? false : true,
    processing_notes: 'Empty response may indicate URL format issue or API limitations'
  },
  response_status: 200,
  processing_status: menuData.restaurant?.name ? 'processed' : 'failed_empty_response'
};
```

This schema transformation provides a framework for extracting maximum business intelligence from Uber Eats data when available, while gracefully handling current API limitations and empty responses.