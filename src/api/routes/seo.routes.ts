import { Router, Request, Response } from 'express';
import { publicSEOAnalyzer } from '../../services/public-seo-analyzer.service';
import { Business } from '../../../models/business.model';
import { CacheService } from '../../services/cache.service';
import { replitAuth } from '../../services/auth.service';

const router = Router();
const cache = CacheService.getInstance();

/**
 * @swagger
 * /api/v1/seo/analyze:
 *   post:
 *     summary: Analyze domain SEO using public data
 *     description: No domain ownership required - uses only publicly available data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domain:
 *                 type: string
 *                 example: example.com
 *               skipCache:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: SEO analysis complete
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { domain, skipCache } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Check cache first
    const cacheKey = `seo:analysis:${cleanDomain}`;
    if (!skipCache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          fromCache: true
        });
      }
    }
    
    // Perform analysis
    const analysis = await publicSEOAnalyzer.analyzeDomain(cleanDomain);
    
    // Cache for 24 hours
    await cache.set(cacheKey, analysis, 86400);
    
    res.json({
      ...analysis,
      fromCache: false
    });
  } catch (error: any) {
    console.error('SEO analysis error:', error);
    res.status(500).json({ 
      error: 'SEO analysis failed',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/seo/batch:
 *   post:
 *     summary: Batch analyze multiple domains
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Batch analysis complete
 */
router.post('/batch', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains)) {
      return res.status(400).json({ error: 'Domains array is required' });
    }
    
    if (domains.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 domains per batch' });
    }
    
    const results = await Promise.allSettled(
      domains.map(domain => publicSEOAnalyzer.analyzeDomain(domain))
    );
    
    const analyses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          domain: domains[index],
          error: result.reason.message
        };
      }
    });
    
    res.json({ analyses });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Batch analysis failed',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/seo/quick-check:
 *   get:
 *     summary: Quick SEO health check
 *     parameters:
 *       - in: query
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quick SEO check complete
 */
router.get('/quick-check', async (req: Request, res: Response) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    const cleanDomain = (domain as string).replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Quick checks only - no heavy analysis
    const quickCheck = {
      domain: cleanDomain,
      checks: {
        https: false,
        www: false,
        responsive: false,
        robots: false,
        sitemap: false
      }
    };
    
    // Check HTTPS
    try {
      const httpsResponse = await fetch(`https://${cleanDomain}`, { method: 'HEAD' });
      quickCheck.checks.https = httpsResponse.ok;
    } catch (e) {}
    
    // Check WWW redirect
    try {
      const wwwResponse = await fetch(`https://www.${cleanDomain}`, { method: 'HEAD' });
      quickCheck.checks.www = wwwResponse.ok;
    } catch (e) {}
    
    // Check robots.txt
    try {
      const robotsResponse = await fetch(`https://${cleanDomain}/robots.txt`);
      quickCheck.checks.robots = robotsResponse.ok;
    } catch (e) {}
    
    // Check sitemap
    try {
      const sitemapResponse = await fetch(`https://${cleanDomain}/sitemap.xml`);
      quickCheck.checks.sitemap = sitemapResponse.ok;
    } catch (e) {}
    
    // Calculate health score
    const passedChecks = Object.values(quickCheck.checks).filter(v => v).length;
    const healthScore = Math.round((passedChecks / Object.keys(quickCheck.checks).length) * 100);
    
    res.json({
      ...quickCheck,
      healthScore,
      status: healthScore >= 80 ? 'good' : healthScore >= 60 ? 'fair' : 'poor'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Quick check failed',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/seo/monitor:
 *   post:
 *     summary: Add domain to SEO monitoring
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessId:
 *                 type: string
 *               domain:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Domain added to monitoring
 */
router.post('/monitor', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { businessId, domain, frequency = 'weekly' } = req.body;
    
    if (!businessId || !domain) {
      return res.status(400).json({ error: 'BusinessId and domain are required' });
    }
    
    // Add to monitoring queue
    await Business.findOneAndUpdate(
      { businessId },
      {
        $set: {
          'seoMonitoring': {
            enabled: true,
            domain: domain,
            frequency: frequency,
            lastCheck: new Date(),
            nextCheck: getNextCheckDate(frequency)
          }
        }
      },
      { upsert: true }
    );
    
    res.json({
      message: 'Domain added to SEO monitoring',
      businessId,
      domain,
      frequency,
      nextCheck: getNextCheckDate(frequency)
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to add monitoring',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/seo/compare:
 *   post:
 *     summary: Compare SEO metrics between domains
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: SEO comparison complete
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { domains } = req.body;
    
    if (!domains || domains.length < 2) {
      return res.status(400).json({ error: 'At least 2 domains required' });
    }
    
    if (domains.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 domains for comparison' });
    }
    
    // Analyze all domains in parallel
    const analyses = await Promise.all(
      domains.map((domain: string) => publicSEOAnalyzer.analyzeDomain(domain))
    );
    
    // Create comparison matrix
    const comparison = {
      domains: domains,
      metrics: {
        overallScore: analyses.map(a => a.scores.overall),
        technicalScore: analyses.map(a => a.scores.technical),
        onPageScore: analyses.map(a => a.scores.onPage),
        contentScore: analyses.map(a => a.scores.content),
        mobileScore: analyses.map(a => a.scores.mobile),
        
        pageSpeedMobile: analyses.map(a => a.technical.performance.pageSpeed.mobile),
        pageSpeedDesktop: analyses.map(a => a.technical.performance.pageSpeed.desktop),
        
        hasSSL: analyses.map(a => a.technical.ssl.enabled),
        domainAge: analyses.map(a => a.authority.domainAge || 0),
        
        wordCount: analyses.map(a => a.content.wordCount),
        imageCount: analyses.map(a => a.content.imageCount),
        internalLinks: analyses.map(a => a.content.links.internal),
        externalLinks: analyses.map(a => a.content.links.external)
      },
      
      winner: determineWinner(analyses, domains),
      insights: generateComparativeInsights(analyses, domains)
    };
    
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Comparison failed',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/seo/report:
 *   get:
 *     summary: Generate SEO report for business
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, html]
 *     responses:
 *       200:
 *         description: SEO report generated
 */
router.get('/report', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { businessId, format = 'json' } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ error: 'BusinessId is required' });
    }
    
    // Get business data
    const business = await Business.findOne({ businessId });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const domain = business.websites?.[0]?.url?.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain) {
      return res.status(400).json({ error: 'Business has no website' });
    }
    
    // Get fresh SEO analysis
    const analysis = await publicSEOAnalyzer.analyzeDomain(domain);
    
    // Generate report
    const report = {
      business: {
        id: business.businessId,
        name: business.name,
        domain: domain
      },
      analysis: analysis,
      generatedAt: new Date(),
      recommendations: generateDetailedRecommendations(analysis),
      competitiveInsights: await getCompetitiveInsights(business, analysis),
      estimatedImpact: calculateImprovementImpact(analysis)
    };
    
    if (format === 'json') {
      res.json(report);
    } else {
      // TODO: Implement PDF/HTML generation
      res.json({ 
        message: `${format} format not yet implemented`,
        report 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Report generation failed',
      message: error.message 
    });
  }
});

// Helper functions
function getNextCheckDate(frequency: string): Date {
  const date = new Date();
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date;
}

function determineWinner(analyses: any[], domains: string[]): string {
  const scores = analyses.map(a => a.scores.overall);
  const maxScore = Math.max(...scores);
  const winnerIndex = scores.indexOf(maxScore);
  return domains[winnerIndex];
}

function generateComparativeInsights(analyses: any[], domains: string[]): string[] {
  const insights: string[] = [];
  
  // Find strengths and weaknesses
  for (let i = 0; i < domains.length; i++) {
    const analysis = analyses[i];
    const domain = domains[i];
    
    // Check relative strengths
    const avgScore = analyses.reduce((sum, a) => sum + a.scores.overall, 0) / analyses.length;
    if (analysis.scores.overall > avgScore + 10) {
      insights.push(`${domain} outperforms competitors by ${Math.round(analysis.scores.overall - avgScore)} points`);
    }
    
    // Check specific advantages
    if (analysis.technical.ssl.enabled && !analyses.every(a => a.technical.ssl.enabled)) {
      insights.push(`${domain} has SSL while some competitors don't`);
    }
    
    if (analysis.technical.performance.pageSpeed.mobile > 80) {
      insights.push(`${domain} has excellent mobile performance`);
    }
  }
  
  return insights;
}

function generateDetailedRecommendations(analysis: any): any[] {
  const recommendations = [];
  
  // High priority recommendations
  if (!analysis.technical.ssl.enabled) {
    recommendations.push({
      priority: 'high',
      category: 'security',
      issue: 'No SSL certificate',
      impact: 'Major ranking factor and user trust',
      solution: 'Install SSL certificate',
      effort: 'low',
      potentialGain: 15
    });
  }
  
  if (analysis.technical.performance.pageSpeed.mobile < 50) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      issue: 'Poor mobile page speed',
      impact: 'High bounce rate and poor rankings',
      solution: 'Optimize images, minify code, use CDN',
      effort: 'medium',
      potentialGain: 20
    });
  }
  
  if (!analysis.onPage.metaDescription) {
    recommendations.push({
      priority: 'medium',
      category: 'on-page',
      issue: 'Missing meta description',
      impact: 'Lower click-through rates',
      solution: 'Add unique meta descriptions (120-160 chars)',
      effort: 'low',
      potentialGain: 10
    });
  }
  
  return recommendations;
}

async function getCompetitiveInsights(business: any, analysis: any): Promise<any> {
  // Get competitor data if available
  const competitors = business.communityData?.competitors || [];
  
  return {
    marketPosition: analysis.scores.overall > 70 ? 'leader' : analysis.scores.overall > 50 ? 'average' : 'laggard',
    strengths: Object.entries(analysis.scores)
      .filter(([key, value]: [string, any]) => value > 80 && key !== 'overall')
      .map(([key]) => key),
    weaknesses: Object.entries(analysis.scores)
      .filter(([key, value]: [string, any]) => value < 50 && key !== 'overall')
      .map(([key]) => key)
  };
}

function calculateImprovementImpact(analysis: any): any {
  const currentScore = analysis.scores.overall;
  const potentialScore = Math.min(100, currentScore + 30);
  
  return {
    currentScore,
    potentialScore,
    estimatedTrafficIncrease: `${Math.round((potentialScore / currentScore - 1) * 100)}%`,
    estimatedTimeToImplement: '2-4 weeks',
    roi: 'high'
  };
}

export default router;