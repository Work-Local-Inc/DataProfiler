# 🚀 Deploy DataProfiler to Replit - Complete Guide

## Option 1: GitHub Import (BEST METHOD) ⭐

### Step 1: Push to GitHub
```bash
# In your DataProfiler folder
git init
git add .
git commit -m "Initial commit - DataProfiler platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/DataProfiler.git
git push -u origin main
```

### Step 2: Import to Replit
1. Go to [Replit.com](https://replit.com)
2. Click **"+ Create"**
3. Click **"Import from GitHub"**
4. Paste: `https://github.com/YOUR_USERNAME/DataProfiler`
5. Replit auto-detects Node.js
6. Click **"Import"**

### Step 3: Configure Secrets
1. Click the 🔒 **Secrets** tab
2. Add your MongoDB URI (required):
   ```
   Key: MONGODB_URI
   Value: mongodb+srv://user:pass@cluster.mongodb.net/dataprofiler
   ```
3. Add API keys as needed (optional)

### Step 4: Run
Click **"Run"** - Everything auto-configures! ✨

---

## Option 2: Direct ZIP Upload 📦

### Step 1: Create ZIP
```bash
# Exclude node_modules and .git
zip -r DataProfiler.zip . -x "node_modules/*" -x ".git/*" -x "dist/*"
```

### Step 2: Upload to Replit
1. Go to [Replit.com](https://replit.com)
2. Create new **Node.js** repl
3. Upload the ZIP file
4. Extract files

### Step 3: Configure & Run
Same as Option 1 - add secrets and click Run!

---

## Option 3: Manual Copy-Paste 📄

### For Quick Testing
1. Create new Node.js repl
2. Copy these essential files:
   - `package.json`
   - `tsconfig.json`
   - `.replit`
   - `replit.toml`
   - `src/server.ts`
3. Run `npm install`
4. Add MongoDB URI in Secrets
5. Click Run

---

## 🔑 Required Secrets (Replit Secrets Tab)

### Minimum to Start (FREE Testing)
```env
# Only this is required to start
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dataprofiler
```

### Recommended for Full Features
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# For Technology Detection ($295/mo)
BUILTWITH_API_KEY=your_builtwith_key

# For SEO Data ($10-100/mo)
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# For Social Media ($0-50/mo)
TWITTER_API_KEY=your_twitter_key
RAPIDAPI_KEY=your_rapidapi_key
```

---

## 🎯 Quick Start Commands

### After Deploy, Test Your API:

```bash
# 1. Health Check
curl https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/health

# 2. Free SEO Test (no API key needed!)
curl "https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/api/v1/seo/quick-check?domain=google.com"

# 3. View API Docs
open https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/docs

# 4. Cost Dashboard
open https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/api/v1/api-management/dashboard
```

---

## ⚡ Replit-Specific Features

### Auto-Configuration
The `.replit` and `replit.toml` files configure:
- ✅ Node.js 20
- ✅ TypeScript compilation
- ✅ Auto-install packages
- ✅ Port forwarding
- ✅ Environment detection
- ✅ Prettier formatting

### Always-On (Paid Replit Feature)
```javascript
// Your API stays running 24/7
// Perfect for scheduled data collection
// Worth it for production use
```

### Replit DB (Optional)
```javascript
// Use Replit's built-in database for caching
const Database = require("@replit/database");
const db = new Database();
```

---

## 📊 Progressive Deployment Strategy

### Phase 1: Test for FREE ✅
```javascript
// These work without any API keys:
- SEO Analysis (PageSpeed, SSL, meta tags)
- DNS/WHOIS lookups
- HTML scraping
- Cost tracking dashboard
```

### Phase 2: Add One API ($10/mo)
```javascript
// Start with DataForSEO:
- Keywords: $0.75/1000
- Backlinks: $0.02/1000  
- Traffic: $0.0006/request
// Total: ~$10/month for 100 businesses
```

### Phase 3: Scale Up ($50-500/mo)
```javascript
// Add as you grow:
- BuiltWith: $295/mo (technology detection)
- Twitter: $19/mo (social monitoring)
- TikTok: $29/mo (trending content)
```

---

## 🐛 Troubleshooting

### "MongoDB Connection Failed"
```bash
# Check your MONGODB_URI format:
mongodb+srv://username:password@cluster.mongodb.net/dataprofiler
# Don't forget to whitelist Replit's IP (0.0.0.0/0) in MongoDB Atlas
```

### "Module Not Found"
```bash
# In Shell tab:
npm install
npm run build
```

### "Port Already in Use"
```bash
# Replit handles ports automatically
# Use process.env.PORT or 3000
```

### "API Rate Limited"
```javascript
// Check dashboard for usage:
/api/v1/api-management/dashboard
// Caching reduces API calls by 70%
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] ✅ `/health` returns `{"status":"healthy"}`
- [ ] ✅ MongoDB shows as `connected`
- [ ] ✅ `/docs` shows API documentation
- [ ] ✅ SEO analyzer works (free test)
- [ ] ✅ Cost tracker initialized
- [ ] ✅ No errors in console

---

## 📈 What's Next?

1. **Test Free Features**
   ```bash
   curl "https://YOUR-APP.repl.co/api/v1/seo/analyze" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"domain":"tesla.com"}'
   ```

2. **Import Your First Business**
   ```javascript
   POST /api/v1/business
   {
     "name": "Example Business",
     "domain": "example.com"
   }
   ```

3. **Monitor Costs**
   ```
   GET /api/v1/api-management/dashboard
   ```

4. **Set Budget Alerts**
   ```javascript
   POST /api/v1/api-management/budget
   {
     "monthly": 100,
     "alerts": [{"threshold": 80, "action": "log"}]
   }
   ```

---

## 🔗 Quick Links

- **Live Demo**: `https://dataprofiler.YOUR-USERNAME.repl.co`
- **API Docs**: `https://dataprofiler.YOUR-USERNAME.repl.co/docs`
- **Health**: `https://dataprofiler.YOUR-USERNAME.repl.co/health`
- **Dashboard**: `https://dataprofiler.YOUR-USERNAME.repl.co/api/v1/api-management/dashboard`

---

## 💪 Pro Tips

1. **Start Small**: Test with 10 businesses first
2. **Use Caching**: Reduces costs by 70%
3. **Monitor Daily**: Check dashboard for usage
4. **Batch Requests**: Process multiple at once
5. **Schedule Wisely**: Update data during off-peak

---

## Need Help?

- 📚 Check `/docs` for API reference
- 💬 Replit Discord for deployment help
- 📧 Create issue on GitHub for bugs

---

**Ready to Deploy?** Choose Option 1 (GitHub) for the smoothest experience! 🚀