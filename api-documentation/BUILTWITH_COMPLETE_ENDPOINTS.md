# BuiltWith API - Complete Endpoints Reference

## Authentication
All endpoints require API key authentication:
```
?KEY=[YOUR_API_KEY]
```

## 1. Domain Lookup Endpoints

### Get Full Technology Profile
```http
GET https://api.builtwith.com/v20/api.json?KEY={key}&LOOKUP={domain}
```
Returns complete technology stack for a domain.

### Get Technology Profile (XML)
```http
GET https://api.builtwith.com/v20/api.xml?KEY={key}&LOOKUP={domain}
```

### Get Technology Profile (CSV)
```http
GET https://api.builtwith.com/v20/api.csv?KEY={key}&LOOKUP={domain}
```

### Get Technology Profile with Options
```http
GET https://api.builtwith.com/v20/api.json
  ?KEY={key}
  &LOOKUP={domain}
  &hideAll=true                    # Hide all optional fields
  &hideDescriptionAndLinks=true    # Hide descriptions and links only
  &onlyLiveTechnologies=true       # Only current technologies
  &noMetaData=true                 # Exclude company metadata
  &noAttributeData=true            # Exclude domain attributes
```

## 2. Lists & Lead Generation Endpoints

### Get Sites Using Technology
```http
GET https://api.builtwith.com/v20/lists.json
  ?KEY={key}
  &TECH={technology}      # e.g., "shopify", "wordpress"
  &OFFSET={start}         # Starting position (default: 0)
  &LIMIT={count}          # Results per page (max: 1000)
  &META=true              # Include company metadata
```

### Get Sites by Multiple Technologies
```http
GET https://api.builtwith.com/v20/lists.json
  ?KEY={key}
  &TECH={tech1},{tech2}   # Comma-separated technologies
  &OPERATOR=AND           # AND/OR operator
```

### Get Sites by Technology Category
```http
GET https://api.builtwith.com/v20/lists.json
  ?KEY={key}
  &CATEGORY={category}    # e.g., "analytics", "ecommerce"
  &LIMIT={count}
```

### Get Sites with Spending Filters
```http
GET https://api.builtwith.com/v20/lists.json
  ?KEY={key}
  &TECH={technology}
  &SPEND_MIN={amount}     # Minimum monthly spend
  &SPEND_MAX={amount}     # Maximum monthly spend
```

### Get Recently Added Sites
```http
GET https://api.builtwith.com/v20/lists.json
  ?KEY={key}
  &TECH={technology}
  &SINCE={date}           # YYYY-MM-DD format
```

## 3. Relationship Discovery Endpoints

### Find Technology Combinations
```http
GET https://api.builtwith.com/v20/relationships.json
  ?KEY={key}
  &TECH1={technology1}
  &TECH2={technology2}
  &LIMIT={count}
```

### Find Technology Migrations
```http
GET https://api.builtwith.com/v20/migrations.json
  ?KEY={key}
  &FROM={old_technology}
  &TO={new_technology}
  &PERIOD={days}          # Last N days
```

### Find Competitor Technologies
```http
GET https://api.builtwith.com/v20/competitors.json
  ?KEY={key}
  &LOOKUP={domain}
  &CATEGORY={category}    # Technology category to compare
```

## 4. Trends & Analytics Endpoints

### Get Technology Trends
```http
GET https://api.builtwith.com/v20/trends.json
  ?KEY={key}
  &TECH={technology}
  &RANGE={period}         # 1m, 3m, 6m, 1y, 5y
```

### Get Market Share Data
```http
GET https://api.builtwith.com/v20/marketshare.json
  ?KEY={key}
  &CATEGORY={category}
  &COUNTRY={country_code} # Optional: US, UK, etc.
```

### Get Technology Adoption Rate
```http
GET https://api.builtwith.com/v20/adoption.json
  ?KEY={key}
  &TECH={technology}
  &GRANULARITY={level}    # daily, weekly, monthly
```

## 5. Historical Data Endpoints

### Get Historical Technology Profile
```http
GET https://api.builtwith.com/v20/history.json
  ?KEY={key}
  &LOOKUP={domain}
  &DATE={date}            # YYYY-MM-DD
```

### Get Technology Timeline
```http
GET https://api.builtwith.com/v20/timeline.json
  ?KEY={key}
  &LOOKUP={domain}
  &START={start_date}     # YYYY-MM-DD
  &END={end_date}         # YYYY-MM-DD
```

### Get Technology Changes
```http
GET https://api.builtwith.com/v20/changes.json
  ?KEY={key}
  &LOOKUP={domain}
  &PERIOD={days}          # Changes in last N days
```

## 6. Trust & Verification Endpoints

### Get Trust Score
```http
GET https://api.builtwith.com/v20/trust.json
  ?KEY={key}
  &LOOKUP={domain}
```

### Verify Technology
```http
GET https://api.builtwith.com/v20/verify.json
  ?KEY={key}
  &LOOKUP={domain}
  &TECH={technology}
```

## 7. Batch Processing Endpoints

### Bulk Domain Lookup
```http
POST https://api.builtwith.com/v20/bulk.json
Content-Type: application/json

{
  "key": "{key}",
  "domains": [
    "example1.com",
    "example2.com",
    "example3.com"
  ],
  "options": {
    "onlyLiveTechnologies": true,
    "noMetaData": false
  }
}
```

### Bulk Technology Check
```http
POST https://api.builtwith.com/v20/bulkcheck.json
Content-Type: application/json

{
  "key": "{key}",
  "domains": ["domain1.com", "domain2.com"],
  "technologies": ["shopify", "google-analytics"]
}
```

## 8. Export Endpoints

### Export to CSV
```http
GET https://api.builtwith.com/v20/export.csv
  ?KEY={key}
  &TECH={technology}
  &LIMIT={count}
  &FORMAT=csv
```

### Export to Excel
```http
GET https://api.builtwith.com/v20/export.xlsx
  ?KEY={key}
  &TECH={technology}
  &LIMIT={count}
  &FORMAT=xlsx
```

## 9. Free API Endpoints

### Basic Technology Lookup (Free)
```http
GET https://api.builtwith.com/free1/api.json
  ?KEY={free_key}
  &LOOKUP={domain}
```
Rate limit: 1 request per second

### Category Count (Free)
```http
GET https://api.builtwith.com/free1/count.json
  ?KEY={free_key}
  &TECH={technology}
```

## 10. Specialized Endpoints

### E-commerce Intelligence
```http
GET https://api.builtwith.com/v20/ecommerce.json
  ?KEY={key}
  &LOOKUP={domain}
  &DETAILS=full           # Include product counts, categories
```

### SaaS Discovery
```http
GET https://api.builtwith.com/v20/saas.json
  ?KEY={key}
  &PRODUCT={saas_name}   # e.g., "salesforce", "hubspot"
  &TIER={tier}            # enterprise, business, starter
```

### Agency & Provider Detection
```http
GET https://api.builtwith.com/v20/agency.json
  ?KEY={key}
  &LOOKUP={domain}
```

### Technology Spend Estimation
```http
GET https://api.builtwith.com/v20/spend.json
  ?KEY={key}
  &LOOKUP={domain}
  &BREAKDOWN=true         # Itemized spend by category
```

## Query Parameters Reference

### Common Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| KEY | string | API key (required) | - |
| FORMAT | string | Response format (json/xml/csv) | json |
| CALLBACK | string | JSONP callback function | - |

### Filtering Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| COUNTRY | string | ISO country code | US, UK, CA |
| STATE | string | State/Province | CA, NY, TX |
| CITY | string | City name | "New York" |
| VERTICAL | string | Industry vertical | "retail", "finance" |
| TRAFFIC_MIN | integer | Minimum traffic rank | 1000 |
| TRAFFIC_MAX | integer | Maximum traffic rank | 100000 |
| EMPLOYEES_MIN | integer | Minimum employees | 10 |
| EMPLOYEES_MAX | integer | Maximum employees | 500 |
| REVENUE_MIN | integer | Minimum revenue | 1000000 |
| REVENUE_MAX | integer | Maximum revenue | 10000000 |

### Sorting Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| SORT | traffic_asc | Sort by traffic (ascending) |
| SORT | traffic_desc | Sort by traffic (descending) |
| SORT | spend_asc | Sort by spend (ascending) |
| SORT | spend_desc | Sort by spend (descending) |
| SORT | detected_asc | Sort by detection date (oldest first) |
| SORT | detected_desc | Sort by detection date (newest first) |

## Response Formats

### JSON Response
```json
{
  "Results": [...],
  "Total": 12345,
  "Errors": [],
  "Meta": {
    "Request": {...},
    "Credits": 95,
    "Timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### CSV Response
```csv
Domain,Technology,Category,FirstDetected,LastDetected
example.com,Shopify,Ecommerce,2020-01-15,2024-01-15
```

### XML Response
```xml
<Response>
  <Results>
    <Result>
      <Domain>example.com</Domain>
      <Technologies>...</Technologies>
    </Result>
  </Results>
  <Errors/>
</Response>
```

## WebSocket Endpoints (Real-time)

### Real-time Technology Changes
```javascript
wss://stream.builtwith.com/v1/changes
{
  "action": "subscribe",
  "key": "{key}",
  "filters": {
    "technologies": ["shopify"],
    "events": ["added", "removed"]
  }
}
```

### Real-time Lead Alerts
```javascript
wss://stream.builtwith.com/v1/leads
{
  "action": "subscribe",
  "key": "{key}",
  "criteria": {
    "technology": "shopify",
    "country": "US",
    "spend_min": 1000
  }
}
```

## Rate Limiting Headers

All responses include rate limiting information:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642234567
X-Credits-Remaining: 4500
X-Credits-Reset: 2024-02-01
```

## Best Practices

1. **Use appropriate endpoints**: Choose bulk endpoints for multiple lookups
2. **Cache responses**: Store results for 24-48 hours minimum
3. **Handle rate limits**: Implement exponential backoff
4. **Optimize queries**: Use filters to reduce response size
5. **Monitor credits**: Track X-Credits-Remaining header