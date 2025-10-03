# DataProfiler - Business Intelligence Platform

Comprehensive business data aggregation platform with 100K+ business capacity, featuring technology detection, SEO analysis, social media monitoring, and cost-optimized API management.

## 🚀 Quick Deploy to Replit

### Method 1: Import from GitHub (Recommended)

1. **Fork this repository** to your GitHub account
2. Go to [Replit](https://replit.com)
3. Click **"+ Create"** → **"Import from GitHub"**
4. Paste your forked repository URL
5. Replit will auto-detect Node.js and configure everything
6. Click **"Run"** to start!

### Method 2: Direct Import

1. Go to [Replit](https://replit.com)
2. Click **"+ Create"** → **"Node.js"**
3. Upload the DataProfiler folder
4. Click **"Run"**

## ⚙️ Configuration

### Required API Keys (Add in Replit Secrets)

```env
# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dataprofiler

# SEO & Technology
BUILTWITH_API_KEY=your_builtwith_key
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Social Media
TWITTER_API_KEY=your_twitter_key
RAPIDAPI_KEY=your_rapidapi_key

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_key
GOOGLE_PAGESPEED_API_KEY=your_pagespeed_key  # Optional (works without)

# OAuth (for managed clients)
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_secret
INSTAGRAM_CLIENT_ID=your_ig_id
INSTAGRAM_CLIENT_SECRET=your_ig_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Security
JWT_SECRET=generate_random_32_char_string
```

### Free Tier Options

You can start with these FREE APIs:
- ✅ Google PageSpeed API (25,000 requests/day)
- ✅ Public SEO Analyzer (unlimited)
- ✅ SSL/DNS checking (unlimited)
- ✅ Meta tag scraping (unlimited)
- ✅ Facebook/Instagram (OAuth - free with permission)

## 📊 Features

### Business Intelligence
- 🏢 **100,000+ Business Capacity** - Scalable architecture
- 🔍 **Multi-Source Data Aggregation** - 15+ data sources
- 📈 **Real-Time Analytics** - Live dashboards
- 🤖 **AI-Powered Insights** - Smart recommendations

### Data Collection
- **Technology Stack** - BuiltWith integration (68k+ technologies)
- **SEO Analysis** - Backlinks, keywords, traffic (DataForSEO)
- **Social Media** - Twitter, TikTok, Facebook, Instagram
- **Local Data** - Google Places, Yelp, TripAdvisor
- **Review Aggregation** - All platforms consolidated

### Cost Management
- 💰 **96% Cheaper** than official APIs
- 📊 **Real-Time Cost Tracking** - Know your spend
- 🎯 **Budget Alerts** - Never exceed limits
- 💡 **Optimization Suggestions** - Reduce costs

### For Managed Clients
- 🔐 **OAuth Integration** - Secure account access
- 📝 **Content Management** - Post on their behalf
- 💬 **Review Response** - Manage reputation
- 📈 **Custom Reports** - White-label analytics

## 🏗️ Architecture

```
DataProfiler/
├── src/
│   ├── api/              # REST API endpoints
│   ├── collectors/        # Data collection services
│   ├── models/           # Database schemas
│   ├── services/         # Business logic
│   └── workers/          # Background jobs
├── api-documentation/    # API docs for each service
└── tests/               # Integration tests
```

## 🚦 Getting Started

### 1. Database Setup
1. Create free MongoDB Atlas cluster at [mongodb.com](https://mongodb.com)
2. Get connection string
3. Add to Replit Secrets as `MONGODB_URI`

### 2. Start with Free APIs
```javascript
// These work immediately without API keys:
const seo = await publicSEOAnalyzer.analyzeDomain('example.com');
console.log('SEO Score:', seo.scores.overall);  // Works FREE!
```

### 3. Add Paid APIs Gradually
Start with one, scale as needed:
- **DataForSEO** - $10/month for 1000 businesses
- **TwitterAPI.io** - $19/month monitoring
- **BuiltWith** - $295/month (optional)

## 📈 API Costs at Scale

| Businesses | Monthly Cost | Per Business |
|------------|-------------|--------------|
| 100 | $50 | $0.50 |
| 1,000 | $96 | $0.10 |
| 10,000 | $960 | $0.10 |
| 100,000 | $9,600 | $0.10 |

## 🧪 Testing

```bash
# Run integration tests
npm test

# Test specific API
npm test -- --grep "SEO"
npm test -- --grep "Twitter"
npm test -- --grep "TikTok"
```

## 📚 API Documentation

Comprehensive docs for each integration:
- [BuiltWith API](./api-documentation/BUILTWITH_API_DOCUMENTATION.md)
- [DataForSEO API](./api-documentation/DATAFORSEO_API_DOCUMENTATION.md)
- [Twitter API](./api-documentation/TWITTER_API_DOCUMENTATION.md)
- [TikTok API](./api-documentation/TIKTOK_API_DOCUMENTATION.md)
- [Facebook API](./api-documentation/FACEBOOK_API_DOCUMENTATION.md)
- [Instagram API](./api-documentation/INSTAGRAM_API_DOCUMENTATION.md)
- [Google Places API](./api-documentation/GOOGLE_PLACES_COMPLETE_ENDPOINTS.md)
- [Yelp API](./api-documentation/YELP_API_DOCUMENTATION.md)

## 🔧 Environment Variables

All sensitive data goes in Replit Secrets (not .env file):
1. Click the 🔒 **Secrets** tab in Replit
2. Add each key-value pair
3. They're automatically available as `process.env.KEY_NAME`

## 🚀 Deployment

### Automatic Setup on Replit
When you click "Run", the system will:
1. Install all dependencies
2. Build TypeScript files
3. Connect to MongoDB
4. Start the API server
5. Initialize background workers
6. Begin data collection

### Access Points
- **API**: `https://your-app.replit.app/api/v1/`
- **Docs**: `https://your-app.replit.app/docs`
- **Health**: `https://your-app.replit.app/health`
- **Dashboard**: `https://your-app.replit.app/api/v1/api-management/dashboard`

## 💡 Tips for Replit

1. **Use Secrets for API Keys** - Never commit them to code
2. **Enable Always On** - Keeps your API running 24/7
3. **Monitor Usage** - Check the dashboard daily
4. **Start Small** - Begin with 100 businesses, scale up
5. **Cache Everything** - Reduces API calls by 70%

## 🆘 Support

- **Replit Issues**: Check Replit status page
- **MongoDB Issues**: Verify connection string
- **API Issues**: Check rate limits and credits
- **Cost Issues**: Review optimization suggestions

## 📄 License

MIT License - Use freely for commercial projects

## 🎯 Next Steps

1. **Fork & Deploy** to Replit
2. **Add MongoDB** connection string
3. **Start with FREE** APIs (SEO, PageSpeed)
4. **Add one paid API** (recommend DataForSEO)
5. **Import first 100 businesses**
6. **Monitor costs** via dashboard
7. **Scale gradually** as you grow

---

Built with ❤️ for scalable business intelligence