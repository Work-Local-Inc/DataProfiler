# DataProfiler - Complete Replit Deployment Plan

## Overview
Automated deployment script that builds a complete business intelligence API platform with multi-source data aggregation, tech stack detection, SEO auditing, and community relationship mapping.

## Architecture
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB Atlas (free tier)
- **Queue**: Bull + Redis (Upstash free tier)
- **Caching**: Redis
- **File Storage**: Cloudinary (for images/media)
- **Hosting**: Replit (auto-scaling)

## Quick Deploy Instructions

1. **Fork to Replit**
   - Import this repo to Replit
   - Replit will auto-detect Node.js project
   - Click "Run" - everything auto-configures

2. **Set Secrets** (Replit Secrets tab)
   ```
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=redis://...
   
   # API Keys (get from RapidAPI)
   RAPIDAPI_KEY=your_key
   GOOGLE_PLACES_API_KEY=your_key
   
   # Social APIs
   FACEBOOK_APP_ID=your_id
   FACEBOOK_APP_SECRET=your_secret
   INSTAGRAM_CLIENT_ID=your_id
   INSTAGRAM_CLIENT_SECRET=your_secret
   
   # SEO Tools
   SEMRUSH_API_KEY=your_key
   AHREFS_API_KEY=your_key
   
   # Tech Detection
   BUILTWITH_API_KEY=your_key
   WAPPALYZER_API_KEY=your_key
   
   # Storage
   CLOUDINARY_URL=cloudinary://...
   
   # Security
   JWT_SECRET=generate_random_string
   API_RATE_LIMIT=100
   ```

3. **Auto-Setup Complete**
   - Database indexes created
   - API endpoints live
   - Data collectors ready
   - Webhook listeners active

## Project Structure
```
DataProfiler/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── business.routes.ts
│   │   │   ├── search.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   └── community.routes.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── validators/
│   ├── collectors/
│   │   ├── google/
│   │   │   ├── places.collector.ts
│   │   │   └── mentions.collector.ts
│   │   ├── social/
│   │   │   ├── facebook.collector.ts
│   │   │   ├── instagram.collector.ts
│   │   │   └── tripadvisor.collector.ts
│   │   ├── reviews/
│   │   │   ├── yelp.collector.ts
│   │   │   └── ubereats.collector.ts
│   │   └── tech/
│   │       ├── techstack.detector.ts
│   │       └── seo.analyzer.ts
│   ├── models/
│   │   └── business.model.ts
│   ├── services/
│   │   ├── aggregation.service.ts
│   │   ├── audit.service.ts
│   │   ├── community.service.ts
│   │   └── cache.service.ts
│   ├── workers/
│   │   ├── data.worker.ts
│   │   └── audit.worker.ts
│   └── utils/
├── config/
├── tests/
├── .replit
├── replit.nix
├── package.json
└── server.ts
```

## Core Features

### 1. Business Data Aggregation
- Multi-source data collection
- Real-time + batch processing
- Deduplication & normalization
- Confidence scoring

### 2. Tech Stack Detection
- DNS/WHOIS analysis
- HTTP header inspection
- JavaScript fingerprinting
- Technology identification

### 3. SEO & Digital Audit
- Backlink analysis
- Keyword tracking
- Technical SEO checks
- Competitive analysis
- Improvement recommendations

### 4. Community Mapping
- Geospatial relationships
- Business networks
- Supply chain connections
- Customer overlap analysis

### 5. Review Aggregation
- Multi-platform collection
- Sentiment analysis
- Response tracking
- Trend identification

## API Endpoints

### Core Business API
```
GET    /api/v1/business/:id          - Get complete profile
POST   /api/v1/business/search       - Search businesses
PUT    /api/v1/business/:id          - Update business
POST   /api/v1/business/bulk         - Bulk import

GET    /api/v1/business/:id/reviews  - All reviews
GET    /api/v1/business/:id/tech     - Tech stack
GET    /api/v1/business/:id/seo      - SEO profile
GET    /api/v1/business/:id/audit    - Digital audit
GET    /api/v1/business/:id/community - Community connections
```

### Data Collection API
```
POST   /api/v1/collect/business      - Trigger collection
GET    /api/v1/collect/status/:jobId - Collection status
POST   /api/v1/collect/schedule      - Schedule collection
```

### Analytics API
```
GET    /api/v1/analytics/market      - Market analysis
GET    /api/v1/analytics/trends      - Trend analysis
POST   /api/v1/analytics/compare     - Competitive comparison
```

## Data Collection Schedule

### Real-time
- New business detection
- Review monitoring
- Social media posts
- Ad campaigns

### Daily
- Tech stack updates
- SEO metrics
- Operating hours
- Promotions

### Weekly
- Full profile refresh
- Community mapping
- Competitive analysis
- Digital audit

### Monthly
- Historical trending
- Market positioning
- Backlink audit
- Complete resync

## Performance Optimization

### Caching Strategy
- Redis for hot data (1hr TTL)
- CDN for static assets
- Database query caching
- API response caching

### Queue Management
- Priority queues for data types
- Rate limiting per API
- Retry with exponential backoff
- Dead letter queue handling

### Database Optimization
- Compound indexes for queries
- Aggregation pipelines
- Partial updates only
- Archive old data to cold storage

## Monitoring & Alerts

### Health Checks
- API endpoint monitoring
- Database connection
- Queue processing rate
- Memory/CPU usage

### Alerts
- Data freshness warnings
- API limit approaching
- Error rate thresholds
- Performance degradation

## Security

### API Security
- JWT authentication
- Rate limiting per key
- IP whitelisting option
- Request signing

### Data Security
- Encryption at rest
- TLS for all connections
- PII masking in logs
- GDPR compliance ready

## Scaling Plan

### Phase 1: MVP (Current)
- 10K businesses
- Daily updates
- Basic analytics

### Phase 2: Growth
- 100K businesses
- Hourly updates
- Advanced analytics
- ML recommendations

### Phase 3: Scale
- 1M+ businesses
- Real-time updates
- Predictive analytics
- White-label API

## Cost Estimates (Monthly)

### Replit Hosting
- Hacker Plan: $7/month
- Autoscale included

### Database (MongoDB Atlas)
- M0 Free: 512MB
- M10: $9/month (2GB)
- M20: $51/month (8GB)

### Redis (Upstash)
- Free: 10K commands/day
- Pay-as-you-go: $0.2/100K commands

### APIs (RapidAPI)
- Basic: $50-100/month
- Pro: $200-500/month

### Total MVP: ~$50-100/month
### Total Scale: ~$500-1000/month

## Deployment Steps (Automated)

The included `setup.js` will:
1. Check environment variables
2. Connect to MongoDB
3. Create database indexes
4. Initialize Redis queues
5. Set up cron schedules
6. Warm up cache
7. Start API server
8. Begin data collection

## Support & Monitoring

### Logging
- Winston for structured logs
- Sentry for error tracking
- DataDog for metrics (optional)

### Documentation
- Auto-generated API docs at `/docs`
- Swagger/OpenAPI spec
- Postman collection included

## Quick Test

After deployment, test with:
```bash
# Health check
curl https://your-app.replit.app/health

# Search for business
curl https://your-app.replit.app/api/v1/business/search?q=starbucks&location=NYC

# Get full profile
curl https://your-app.replit.app/api/v1/business/12345

# Trigger data collection
curl -X POST https://your-app.replit.app/api/v1/collect/business \
  -H "Content-Type: application/json" \
  -d '{"name":"Example Business","location":"New York"}'
```

## Next Steps

1. Click "Run" in Replit
2. Add API keys to Secrets
3. Access at: `https://[your-app].replit.app`
4. Check `/docs` for API documentation
5. Monitor logs for collection status

The system will automatically:
- Start collecting data
- Build business profiles
- Generate SEO audits
- Map community connections
- Update continuously