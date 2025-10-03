#!/usr/bin/env node

/**
 * DataProfiler Setup Script
 * Automatically runs when deploying to Replit
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('🚀 DataProfiler Setup Starting...\n');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
  log('📋 Checking environment variables...', 'blue');
  
  const required = ['MONGODB_URI'];
  const optional = [
    'BUILTWITH_API_KEY',
    'DATAFORSEO_LOGIN',
    'TWITTER_API_KEY',
    'RAPIDAPI_KEY',
    'GOOGLE_PLACES_API_KEY',
    'FACEBOOK_APP_ID',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  const configured = optional.filter(key => process.env[key]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, 'red');
    log('\nPlease add them in Replit Secrets tab:', 'yellow');
    missing.forEach(key => {
      log(`  • ${key}`, 'yellow');
    });
    process.exit(1);
  }
  
  log('✅ Required environment variables configured', 'green');
  
  if (configured.length === 0) {
    log('\n⚠️  No optional APIs configured. You can add these later:', 'yellow');
    optional.forEach(key => {
      log(`  • ${key}`, 'yellow');
    });
  } else {
    log(`\n✅ Configured APIs (${configured.length}/${optional.length}):`, 'green');
    configured.forEach(key => {
      log(`  • ${key}`, 'green');
    });
  }
  
  // Set defaults if not provided
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = Math.random().toString(36).substring(2) + 
                             Math.random().toString(36).substring(2);
    log('\n⚠️  Generated temporary JWT_SECRET. Add your own for production!', 'yellow');
  }
  
  if (!process.env.PORT) {
    process.env.PORT = '3000';
  }
  
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
}

async function setupDatabase() {
  log('\n🗄️  Setting up MongoDB...', 'blue');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ MongoDB connected successfully', 'green');
    
    // Create indexes
    const db = mongoose.connection.db;
    
    // Business indexes
    const businessCollection = db.collection('businesses');
    await businessCollection.createIndex({ businessId: 1 }, { unique: true });
    await businessCollection.createIndex({ name: 'text', legalName: 'text' });
    await businessCollection.createIndex({ 'locations.coordinates': '2dsphere' });
    await businessCollection.createIndex({ 'metadata.lastUpdated': -1 });
    log('✅ Business indexes created', 'green');
    
    // Client indexes
    const clientCollection = db.collection('clients');
    await clientCollection.createIndex({ clientId: 1 }, { unique: true });
    await clientCollection.createIndex({ businessId: 1 });
    log('✅ Client indexes created', 'green');
    
    // API usage indexes for time-series data
    const usageCollection = db.collection('apiusages');
    await usageCollection.createIndex({ timestamp: -1 });
    await usageCollection.createIndex({ provider: 1, timestamp: -1 });
    log('✅ API usage indexes created', 'green');
    
    await mongoose.connection.close();
    log('✅ Database setup complete', 'green');
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, 'red');
    log('\nPlease check your MONGODB_URI in Replit Secrets', 'yellow');
    process.exit(1);
  }
}

async function createDirectories() {
  log('\n📁 Creating directories...', 'blue');
  
  const dirs = [
    'logs',
    'uploads',
    'temp',
    'cache'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`  ✅ Created ${dir}/`, 'green');
    }
  });
}

async function generateSampleData() {
  log('\n📊 Generating sample configuration...', 'blue');
  
  // Create sample budget configuration
  const budgetConfig = {
    monthly: 100,
    alerts: [
      { threshold: 50, action: 'log' },
      { threshold: 75, action: 'log' },
      { threshold: 90, action: 'log' },
      { threshold: 100, action: 'log' }
    ],
    providers: {
      builtwith: { limit: 1000, cost: 295 },
      dataforseo: { limit: 10000, cost: 0.0001 },
      twitter: { limit: 10000, cost: 0.00015 },
      tiktok: { limit: 10000, cost: 0 }
    }
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'config', 'budget.json'),
    JSON.stringify(budgetConfig, null, 2)
  );
  log('✅ Created budget configuration', 'green');
}

async function displayInfo() {
  const port = process.env.PORT || 3000;
  const isReplit = process.env.REPL_SLUG && process.env.REPL_OWNER;
  
  let baseUrl = `http://localhost:${port}`;
  if (isReplit) {
    baseUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  log('\n' + '='.repeat(50), 'bright');
  log('🎉 DataProfiler Setup Complete!', 'bright');
  log('='.repeat(50), 'bright');
  
  log('\n📍 Access Points:', 'blue');
  log(`  • API Base: ${baseUrl}/api/v1`, 'green');
  log(`  • API Docs: ${baseUrl}/docs`, 'green');
  log(`  • Health Check: ${baseUrl}/health`, 'green');
  log(`  • Cost Dashboard: ${baseUrl}/api/v1/api-management/dashboard`, 'green');
  
  log('\n🚀 Next Steps:', 'blue');
  log('  1. The server will start automatically', 'yellow');
  log('  2. Test the API with: curl ' + baseUrl + '/health', 'yellow');
  log('  3. Add API keys in Replit Secrets as needed', 'yellow');
  log('  4. Start collecting business data!', 'yellow');
  
  log('\n💡 Quick Test:', 'blue');
  log(`  curl ${baseUrl}/api/v1/seo/quick-check?domain=google.com`, 'green');
  
  if (!configured.includes('BUILTWITH_API_KEY')) {
    log('\n💰 Start with FREE APIs:', 'blue');
    log('  • SEO Analysis - No API key needed!', 'green');
    log('  • PageSpeed - Works without key (with limits)', 'green');
    log('  • SSL/DNS checks - Always free', 'green');
  }
  
  log('\n📚 Documentation:', 'blue');
  log('  • GitHub: https://github.com/yourusername/DataProfiler', 'green');
  log('  • API Docs: ' + baseUrl + '/docs', 'green');
  
  log('\n✨ Happy Data Profiling!\n', 'bright');
}

async function main() {
  try {
    await checkEnvironment();
    await setupDatabase();
    await createDirectories();
    await generateSampleData();
    await displayInfo();
    
    log('Setup completed successfully!', 'green');
    process.exit(0);
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run setup
main().catch(console.error);