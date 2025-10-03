# Uber Eats5 API - Complete Endpoints Documentation

## Overview

This is the **complete reference** for all available endpoints in the Uber Eats5 RapidAPI. This includes endpoints we currently use and those available for future enhancement.

**Base URL**: `https://uber-eats5.p.rapidapi.com`

## Authentication Headers
```javascript
{
  'x-rapidapi-key': 'YOUR_UBEREATS_RAPIDAPI_KEY',
  'x-rapidapi-host': 'uber-eats5.p.rapidapi.com'
}
```

---

## Restaurant Information Endpoints

### 1. Get Restaurant Menu
**Endpoint**: `/menu`  
**Method**: `GET`  
**Purpose**: Extract menu items, prices, and restaurant details  
**Status**: ✅ Currently Used

**Parameters**:
- `url` (required): Full Uber Eats restaurant URL

**Example**:
```
GET /menu?url=https%3A%2F%2Fwww.ubereats.com%2Fstore%2Fmcdonalds%2Fabc123
```

**Response**:
```json
{
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
      "tuesday": "6:00 AM - 11:00 PM",
      "wednesday": "6:00 AM - 11:00 PM",
      "thursday": "6:00 AM - 11:00 PM",
      "friday": "6:00 AM - 12:00 AM",
      "saturday": "6:00 AM - 12:00 AM",
      "sunday": "6:00 AM - 11:00 PM"
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
            "customizations": [
              {
                "name": "Extra Pickles",
                "price": 0.50
              },
              {
                "name": "No Onions",
                "price": 0.00
              }
            ],
            "availability": true
          }
        ]
      }
    ]
  }
}
```

### 2. Get Restaurant Details
**Endpoint**: `/restaurant`  
**Method**: `GET`  
**Purpose**: Get detailed restaurant information without menu  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `include_reviews` (optional): Include customer reviews (default: false)

**Example**:
```
GET /restaurant?url=https%3A%2F%2Fwww.ubereats.com%2Fstore%2Fmcdonalds%2Fabc123&include_reviews=true
```

**Expected Response**:
```json
{
  "restaurant": {
    "name": "McDonald's",
    "store_id": "abc123",
    "description": "Fast food restaurant serving burgers, fries, and more",
    "rating": 4.2,
    "review_count": 1520,
    "price_range": "$",
    "delivery_info": {
      "delivery_time": "15-30 min",
      "delivery_fee": "$1.99",
      "minimum_order": "$12.00",
      "service_areas": ["Downtown", "Midtown", "Upper West Side"]
    },
    "contact_info": {
      "phone": "+1-555-123-4567",
      "website": "https://www.mcdonalds.com",
      "address": "123 Main St, City, State 12345"
    },
    "features": [
      "No-contact delivery",
      "Group ordering", 
      "Accepts vouchers",
      "Eco-friendly packaging"
    ],
    "photos": [
      {
        "url": "https://d1ralsognjng37.cloudfront.net/...",
        "caption": "Restaurant exterior",
        "type": "storefront"
      }
    ]
  },
  "reviews": [
    {
      "review_id": "review_123",
      "reviewer_name": "John D.",
      "rating": 5,
      "review_text": "Fast delivery and food was hot!",
      "date": "2025-09-15",
      "order_items": ["Big Mac", "Large Fries"]
    }
  ]
}
```

---

## Menu Analysis Endpoints

### 3. Get Menu by Category
**Endpoint**: `/menu/category`  
**Method**: `GET`  
**Purpose**: Get menu items filtered by specific category  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `category` (required): Menu category name
- `include_nutrition` (optional): Include nutritional information (default: false)

**Example**:
```
GET /menu/category?url=https%3A%2F%2Fwww.ubereats.com%2Fstore%2Fmcdonalds%2Fabc123&category=Burgers&include_nutrition=true
```

**Expected Response**:
```json
{
  "category": {
    "name": "Burgers",
    "description": "Our signature burgers made with 100% fresh beef",
    "item_count": 8
  },
  "items": [
    {
      "item_id": "big_mac_456",
      "name": "Big Mac",
      "description": "Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun",
      "price": 5.99,
      "image_url": "https://d1ralsognjng37.cloudfront.net/...",
      "nutrition": {
        "calories": 550,
        "protein": "25g",
        "carbs": "45g",
        "fat": "33g",
        "sodium": "1040mg"
      },
      "allergens": ["Wheat", "Soy", "Sesame", "Egg"],
      "dietary_labels": ["Contains Gluten"],
      "popularity_rank": 1,
      "preparation_time": "5-8 min"
    }
  ]
}
```

### 4. Get Popular Items
**Endpoint**: `/menu/popular`  
**Method**: `GET`  
**Purpose**: Get most popular/bestselling menu items  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `limit` (optional): Number of popular items to retrieve (default: 10, max: 20)

**Example**:
```
GET /menu/popular?url=https%3A%2F%2Fwww.ubereats.com%2Fstore%2Fmcdonalds%2Fabc123&limit=5
```

**Expected Response**:
```json
{
  "popular_items": [
    {
      "item_id": "big_mac_456",
      "name": "Big Mac",
      "price": 5.99,
      "image_url": "https://d1ralsognjng37.cloudfront.net/...",
      "popularity_score": 95,
      "order_frequency": "Very High",
      "customer_rating": 4.6,
      "review_count": 245
    }
  ]
}
```

### 5. Get Promotional Items
**Endpoint**: `/menu/promotions`  
**Method**: `GET`  
**Purpose**: Get current deals, discounts, and promotional items  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `active_only` (optional): Only active promotions (default: true)

**Example**:
```
GET /menu/promotions?url=https%3A%2F%2Fwww.ubereats.com%2Fstore%2Fmcdonalds%2Fabc123
```

**Expected Response**:
```json
{
  "promotions": [
    {
      "promo_id": "promo_123",
      "title": "Buy One Get One Free",
      "description": "Buy any Big Mac and get a second one free",
      "discount_type": "BOGO",
      "applicable_items": ["big_mac_456"],
      "minimum_order": 15.00,
      "valid_until": "2025-10-31T23:59:59Z",
      "terms": "Valid for first-time customers only"
    }
  ]
}
```

---

## Search and Discovery Endpoints

### 6. Search Restaurants
**Endpoint**: `/search`  
**Method**: `GET`  
**Purpose**: Search for restaurants by name, cuisine, or location  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `query` (required): Search term (restaurant name, cuisine type)
- `location` (required): City, address, or coordinates
- `limit` (optional): Number of results (default: 20, max: 50)
- `sort_by` (optional): 'relevance', 'rating', 'delivery_time', 'delivery_fee'

**Example**:
```
GET /search?query=McDonald's&location=New York, NY&limit=10&sort_by=rating
```

**Expected Response**:
```json
{
  "results": [
    {
      "restaurant_id": "abc123",
      "name": "McDonald's",
      "rating": 4.2,
      "review_count": 1520,
      "delivery_time": "15-30 min",
      "delivery_fee": "$1.99",
      "cuisine_types": ["Fast Food", "American"],
      "distance": "0.8 miles",
      "url": "https://www.ubereats.com/store/mcdonalds/abc123",
      "thumbnail": "https://d1ralsognjng37.cloudfront.net/..."
    }
  ],
  "total_results": 15,
  "search_location": "New York, NY"
}
```

### 7. Get Similar Restaurants
**Endpoint**: `/restaurant/similar`  
**Method**: `GET`  
**Purpose**: Find restaurants similar to given restaurant  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Reference Uber Eats restaurant URL
- `limit` (optional): Number of similar restaurants (default: 10, max: 20)

---

## Analytics and Insights Endpoints

### 8. Get Restaurant Analytics
**Endpoint**: `/restaurant/analytics`  
**Method**: `GET`  
**Purpose**: Get performance metrics and analytics data  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `period` (optional): 'week', 'month', 'quarter' (default: 'month')

**Expected Response**:
```json
{
  "analytics": {
    "performance_metrics": {
      "average_rating": 4.2,
      "total_reviews": 1520,
      "order_volume": "High",
      "delivery_efficiency": 92
    },
    "popular_times": {
      "lunch": "11:30 AM - 2:00 PM",
      "dinner": "6:00 PM - 9:00 PM",
      "peak_day": "Friday"
    },
    "menu_performance": {
      "top_selling_category": "Burgers",
      "average_order_value": "$18.50",
      "most_customized_item": "Big Mac"
    },
    "customer_insights": {
      "repeat_customer_rate": 68,
      "average_delivery_rating": 4.3,
      "most_common_complaints": ["Cold food", "Long wait times"]
    }
  }
}
```

### 9. Get Price Comparison
**Endpoint**: `/restaurant/pricing`  
**Method**: `GET`  
**Purpose**: Compare menu prices with similar restaurants  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `compare_with` (optional): Competitor restaurant URLs (comma-separated)

---

## Delivery and Logistics Endpoints

### 10. Get Delivery Areas
**Endpoint**: `/restaurant/delivery-areas`  
**Method**: `GET`  
**Purpose**: Get detailed delivery zone information  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `include_fees` (optional): Include delivery fees by area (default: false)

**Expected Response**:
```json
{
  "delivery_areas": [
    {
      "area_name": "Downtown",
      "delivery_time": "15-25 min",
      "delivery_fee": "$1.99",
      "minimum_order": "$12.00",
      "boundaries": {
        "north": 40.7589,
        "south": 40.7489,
        "east": -73.9751,
        "west": -73.9951
      }
    }
  ]
}
```

### 11. Get Real-time Availability
**Endpoint**: `/restaurant/availability`  
**Method**: `GET`  
**Purpose**: Check current restaurant and menu item availability  
**Status**: 🔄 Available for Future Use

**Parameters**:
- `url` (required): Uber Eats restaurant URL
- `check_items` (optional): Specific item IDs to check (comma-separated)

---

## Rate Limits and Usage

### Current Usage Pattern
- **Menu Data**: 1 call per business
- **Total**: 1 call per business profile

### Future Enhancement Opportunities
- **Restaurant Reviews**: Customer sentiment analysis
- **Popular Items**: Menu optimization insights
- **Promotions**: Competitive pricing analysis
- **Analytics**: Performance benchmarking
- **Similar Restaurants**: Market competition mapping
- **Delivery Areas**: Geographic service analysis

### Recommended Implementation Priority
1. **High Priority**: Restaurant Details, Popular Items, Promotions (business intelligence)
2. **Medium Priority**: Analytics, Price Comparison (competitive analysis)
3. **Low Priority**: Search, Similar Restaurants (market research)

---

## Technical Considerations

### Response Times
- **Menu Data**: 1-2 seconds
- **Restaurant Details**: 2-3 seconds
- **Analytics/Insights**: 3-5 seconds
- **Search Operations**: 2-4 seconds

### Error Handling
All endpoints follow the same error patterns:
- **401**: Invalid API key
- **403**: Subscription required or restaurant access denied
- **404**: Restaurant not found or not available on Uber Eats
- **429**: Rate limit exceeded
- **500**: Server error

### Content Limitations
- **Public Data Only**: API accesses publicly available restaurant information
- **Regional Restrictions**: Some restaurants may not be available in all regions
- **Real-time Updates**: Menu prices and availability may change frequently

### URL Format Requirements
Uber Eats URLs must follow the pattern:
```
https://www.ubereats.com/store/{restaurant-name}/{store-id}
```

This complete reference enables comprehensive restaurant business intelligence, menu analysis, and competitive benchmarking through Uber Eats data.