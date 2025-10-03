# DataProfiler - 100K Business Scaling Architecture

## Overview
Architecture optimized for 100,000+ businesses with millions of data points per business.

## Database Architecture

### MongoDB Sharding Strategy
```javascript
// Shard by business location (geographic distribution)
sh.shardCollection("dataprofiler.businesses", {
  "locations.coordinates": "hashed",
  "businessId": 1
})

// Shard reviews by time (hot/cold data separation)
sh.shardCollection("dataprofiler.reviews", {
  "date": 1,
  "businessId": "hashed"
})
```

### Indexing Strategy
```javascript
// Compound indexes for common queries
businesses.createIndex({ "name": "text", "locations.city": 1, "operations.categories": 1 })
businesses.createIndex({ "locations.coordinates": "2dsphere" })
businesses.createIndex({ "reviews.aggregate.averageRating": -1, "reviews.aggregate.totalReviews": -1 })
businesses.createIndex({ "metadata.lastUpdated": -1 })
businesses.createIndex({ "techStack.hosting.provider": 1 })

// Partial indexes for filtered queries
businesses.createIndex(
  { "seoProfile.domainAuthority": -1 },
  { partialFilterExpression: { "seoProfile.domainAuthority": { $exists: true } } }
)
```

## Caching Architecture

### Multi-Layer Cache Strategy

#### L1 Cache - In-Memory (Node.js)
- 100 most accessed businesses
- 5-minute TTL
- LRU eviction policy

#### L2 Cache - Redis Cluster
- 10,000 hot businesses
- 1-hour TTL
- Separate caches for different data types

#### L3 Cache - CDN (Cloudflare)
- Static assets (images, logos)
- Public API responses
- 24-hour TTL

### Redis Data Structure
```javascript
// Business summary cache
HSET business:12345 {
  basic: JSON.stringify(basicInfo),
  reviews: JSON.stringify(reviewSummary),
  tech: JSON.stringify(techStack),
  ttl: 3600
}

// Search results cache
ZADD search:restaurant:nyc score businessId

// Real-time metrics
HINCRBY metrics:api:2025:01 endpoint:business:get 1
```

## Queue Architecture

### Priority Queue System
```javascript
// Critical queues (real-time)
- oauth-refresh (P0) - Token refresh
- review-alerts (P0) - New review notifications
- managed-updates (P0) - Client business updates

// Standard queues (near real-time)
- data-collection (P1) - API data fetching
- tech-detection (P1) - Tech stack analysis
- seo-analysis (P1) - SEO metrics

// Batch queues (scheduled)
- bulk-updates (P2) - Mass data refresh
- report-generation (P2) - Analytics reports
- audit-computation (P2) - Digital audits
```

### Worker Scaling
```javascript
// Dynamic worker allocation based on queue depth
const workerConfig = {
  'oauth-refresh': { min: 2, max: 10, concurrency: 5 },
  'data-collection': { min: 5, max: 50, concurrency: 10 },
  'tech-detection': { min: 3, max: 20, concurrency: 5 },
  'bulk-updates': { min: 1, max: 10, concurrency: 20 }
}
```

## API Architecture

### Rate Limiting Tiers
```javascript
const rateLimits = {
  free: { 
    requests: 100, 
    window: '1h',
    burst: 10
  },
  pro: { 
    requests: 1000, 
    window: '1h',
    burst: 50
  },
  enterprise: { 
    requests: 10000, 
    window: '1h',
    burst: 200
  }
}
```

### Pagination Strategy
```javascript
// Cursor-based pagination for large datasets
GET /api/v1/businesses?cursor=eyJsYXN0SWQiOiIxMjM0NSJ9&limit=50

// Response
{
  data: [...],
  pagination: {
    cursor: "eyJsYXN0SWQiOiIxMjM5NSJ9",
    hasMore: true,
    total: 100000
  }
}
```

### GraphQL for Complex Queries
```graphql
query GetBusiness($id: ID!, $fields: BusinessFields) {
  business(id: $id) {
    ...on Business @include(if: $fields.basic) {
      name
      locations
    }
    ...on Business @include(if: $fields.reviews) {
      reviews(limit: 10, sortBy: DATE_DESC)
    }
    ...on Business @include(if: $fields.tech) {
      techStack
    }
  }
}
```

## Data Collection Optimization

### Batch Processing
```javascript
// Process businesses in chunks
const BATCH_SIZE = 100;
const PARALLEL_BATCHES = 10;

async function batchUpdate() {
  const cursor = db.businesses.find().batchSize(BATCH_SIZE);
  const promises = [];
  
  while (await cursor.hasNext()) {
    const batch = await cursor.next(BATCH_SIZE);
    promises.push(processBatch(batch));
    
    if (promises.length >= PARALLEL_BATCHES) {
      await Promise.race(promises);
    }
  }
}
```

### API Call Optimization
```javascript
// Deduplicate and batch API calls
const apiCallManager = {
  queue: new Map(),
  
  async fetch(endpoint, params) {
    const key = `${endpoint}:${JSON.stringify(params)}`;
    
    if (this.queue.has(key)) {
      return this.queue.get(key);
    }
    
    const promise = this.executeBatch(endpoint, params);
    this.queue.set(key, promise);
    
    setTimeout(() => this.queue.delete(key), 5000);
    return promise;
  }
}
```

## Storage Optimization

### Data Tiering
```javascript
// Hot data (frequently accessed) - MongoDB
{
  businessId: "12345",
  name: "Example Business",
  recentReviews: [...], // Last 30 days
  currentMetrics: {...}
}

// Warm data (occasional access) - MongoDB with compression
{
  historicalReviews: [...], // 30-365 days
  monthlyMetrics: [...]
}

// Cold data (rare access) - S3/Cloud Storage
{
  archivedReviews: "s3://bucket/business/12345/reviews-2023.json.gz",
  historicalSnapshots: "s3://bucket/business/12345/snapshots/"
}
```

### Image Optimization
```javascript
// Cloudinary transformations
const imageUrls = {
  thumbnail: 'w_150,h_150,c_thumb,f_auto,q_auto',
  card: 'w_400,h_300,c_fill,f_auto,q_auto',
  full: 'w_1200,h_900,c_limit,f_auto,q_85',
  webp: 'f_webp,q_auto' // Auto WebP conversion
}
```

## Monitoring & Performance

### Key Metrics
```javascript
const metrics = {
  // System metrics
  'api.latency.p95': 200, // ms
  'api.latency.p99': 500, // ms
  'database.query.time': 50, // ms
  'cache.hit.rate': 0.85, // 85%
  
  // Business metrics
  'businesses.total': 100000,
  'businesses.updated.daily': 10000,
  'api.calls.daily': 1000000,
  'data.freshness': 24 // hours
}
```

### Auto-Scaling Rules
```yaml
# Horizontal scaling based on metrics
rules:
  - metric: cpu_utilization
    threshold: 70
    scale_up: 2
    scale_down: 1
    
  - metric: queue_depth
    threshold: 1000
    scale_up: 5
    max_instances: 50
    
  - metric: response_time_p95
    threshold: 500ms
    scale_up: 3
```

## Cost Optimization

### Monthly Cost Breakdown (100K businesses)
```
Infrastructure:
- MongoDB Atlas M30: $500 (50GB storage, 8GB RAM)
- Redis Cluster: $200 (10GB, 3 nodes)
- Compute (Replit/Cloud Run): $300 (auto-scaling)
- CDN (Cloudflare): $20
- Storage (S3): $50 (1TB archived data)

APIs (at scale pricing):
- Google Places: $500 (100k lookups)
- Social APIs: $300 (combined)
- SEO Tools: $400 (bulk rates)
- Tech Detection: $200

Total: ~$2,470/month ($0.025 per business)
```

### Cost Optimization Strategies
1. **Intelligent Caching**: Reduce API calls by 70%
2. **Batch Processing**: Bulk API discounts
3. **Data Tiering**: 80% cost reduction for cold storage
4. **Smart Scheduling**: Update based on business activity
5. **Deduplication**: Prevent redundant API calls

## Deployment Strategy

### Progressive Rollout
```javascript
// Feature flags for gradual deployment
const features = {
  'tech-detection': { enabled: true, rollout: 100 },
  'ai-recommendations': { enabled: true, rollout: 25 },
  'real-time-updates': { enabled: true, rollout: 10 },
  'graphql-api': { enabled: false, rollout: 0 }
}
```

### Zero-Downtime Deployment
1. Blue-green deployment
2. Database migrations with backward compatibility
3. Cache warming before switchover
4. Gradual traffic shifting
5. Automatic rollback on errors

## Security at Scale

### Data Protection
```javascript
// Field-level encryption for sensitive data
{
  ein: encrypt(ein, businessKey),
  ownerSSN: encrypt(ssn, ownerKey),
  apiKeys: encrypt(keys, masterKey)
}
```

### Access Control
```javascript
// Row-level security
const accessControl = {
  read: {
    own: true,
    managed: true,
    public: ['name', 'location', 'reviews']
  },
  write: {
    own: ['hours', 'description'],
    managed: ['posts', 'responses'],
    admin: ['*']
  }
}
```

## Machine Learning Integration

### Predictive Analytics
- Business success prediction
- Review sentiment trending
- Optimal posting times
- Competitor movement alerts

### Data Pipeline
```javascript
// Stream processing for ML
const pipeline = {
  ingestion: 'Kafka/PubSub',
  processing: 'Apache Beam',
  storage: 'BigQuery',
  training: 'Vertex AI',
  serving: 'Cloud Run'
}
```

This architecture ensures:
- Sub-second response times for 95% of requests
- 99.9% uptime SLA
- Linear scaling to 1M+ businesses
- Cost-effective at $0.025 per business/month
- Real-time updates for managed clients
- Batch processing for monitored businesses