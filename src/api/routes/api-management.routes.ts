import { Router, Request, Response } from 'express';
import { apiCostTracker } from '../../services/api-cost-tracker.service';
import { Subscription } from '../../services/api-cost-tracker.service';
import { replitAuth } from '../../services/auth.service';

const router = Router();

/**
 * @swagger
 * /api/v1/api-management/usage/current:
 *   get:
 *     summary: Get current month's API usage and costs
 *     responses:
 *       200:
 *         description: Current usage summary
 */
router.get('/usage/current', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const usage = await apiCostTracker.getMonthlyUsage();
    res.json(usage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/usage/history:
 *   get:
 *     summary: Get historical usage data
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: number
 *           default: 6
 *     responses:
 *       200:
 *         description: Historical usage data
 */
router.get('/usage/history', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const history = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const usage = await apiCostTracker.getMonthlyUsage(date);
      history.push(usage);
    }
    
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/breakdown:
 *   get:
 *     summary: Get detailed cost breakdown
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Detailed cost breakdown
 */
router.get('/breakdown', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider, groupBy, days } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(days as string) || 30));
    
    const breakdown = await apiCostTracker.getCostBreakdown({
      provider: provider as string,
      startDate,
      endDate: new Date(),
      groupBy: groupBy as any || 'day'
    });
    
    res.json(breakdown);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/health:
 *   get:
 *     summary: Get API health status
 *     responses:
 *       200:
 *         description: API health metrics
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await apiCostTracker.getAPIHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/optimize:
 *   get:
 *     summary: Get optimization suggestions
 *     responses:
 *       200:
 *         description: Cost optimization suggestions
 */
router.get('/optimize', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const suggestions = await apiCostTracker.getOptimizationSuggestions();
    res.json(suggestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/budget:
 *   post:
 *     summary: Set monthly budget and alerts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthly:
 *                 type: number
 *               alerts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     threshold:
 *                       type: number
 *                     action:
 *                       type: string
 *                       enum: [email, webhook, log]
 *                     target:
 *                       type: string
 *     responses:
 *       200:
 *         description: Budget set successfully
 */
router.post('/budget', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { monthly, alerts } = req.body;
    
    if (!monthly || monthly <= 0) {
      return res.status(400).json({ error: 'Invalid monthly budget' });
    }
    
    await apiCostTracker.setBudget(monthly, alerts);
    
    res.json({
      message: 'Budget set successfully',
      monthly,
      alerts: alerts?.length || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/subscriptions:
 *   get:
 *     summary: Get all active subscriptions
 *     responses:
 *       200:
 *         description: List of active subscriptions
 */
router.get('/subscriptions', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const subscriptions = await Subscription.find({ 'plan.status': 'active' });
    
    const summary = subscriptions.map(sub => ({
      provider: sub.provider,
      plan: sub.plan.name,
      cost: sub.plan.cost,
      period: sub.plan.billingPeriod,
      renewalDate: sub.plan.renewalDate,
      usage: sub.usage,
      creditsRemaining: sub.usage?.credits ? 
        sub.usage.credits.total - sub.usage.credits.used : null,
      daysUntilRenewal: Math.floor(
        (new Date(sub.plan.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    }));
    
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/subscriptions:
 *   post:
 *     summary: Add or update subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               plan:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription updated
 */
router.post('/subscriptions', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider, plan } = req.body;
    
    if (!provider || !plan) {
      return res.status(400).json({ error: 'Provider and plan required' });
    }
    
    const subscription = await Subscription.findOneAndUpdate(
      { provider },
      {
        provider,
        plan: {
          ...plan,
          status: 'active',
          startDate: plan.startDate || new Date(),
          renewalDate: plan.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        usage: {
          credits: { used: 0, total: plan.credits || 0 },
          requests: { used: 0, total: plan.requests || 0 }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json(subscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/report:
 *   get:
 *     summary: Export usage report
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Usage report
 */
router.get('/report', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { format, startDate, endDate, providers } = req.query;
    
    const report = await apiCostTracker.exportReport(
      format as any || 'json',
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        providers: providers ? (providers as string).split(',') : undefined
      }
    );
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="api-usage-report.csv"');
      res.send(report);
    } else {
      res.json(report);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/dashboard:
 *   get:
 *     summary: Get complete dashboard data
 *     responses:
 *       200:
 *         description: Complete dashboard metrics
 */
router.get('/dashboard', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const [currentUsage, health, subscriptions, suggestions] = await Promise.all([
      apiCostTracker.getMonthlyUsage(),
      apiCostTracker.getAPIHealth(),
      Subscription.find({ 'plan.status': 'active' }),
      apiCostTracker.getOptimizationSuggestions()
    ]);
    
    // Calculate key metrics
    const totalMonthlyCommitment = subscriptions.reduce((sum, sub) => {
      if (sub.plan.billingPeriod === 'monthly') {
        return sum + sub.plan.cost;
      } else if (sub.plan.billingPeriod === 'yearly') {
        return sum + (sub.plan.cost / 12);
      }
      return sum;
    }, 0);
    
    const projectedMonthlyTotal = currentUsage.costs.total + 
      (currentUsage.costs.total / new Date().getDate()) * 
      (30 - new Date().getDate());
    
    const dashboard = {
      summary: {
        currentSpend: currentUsage.costs.total,
        projectedSpend: projectedMonthlyTotal,
        subscriptions: totalMonthlyCommitment,
        budget: currentUsage.budget.allocated,
        budgetUsed: currentUsage.budget.percentage,
        daysRemaining: 30 - new Date().getDate()
      },
      
      providers: currentUsage.providers.map((p: any) => ({
        name: p._id,
        cost: p.totalCost,
        requests: p.totalRequests,
        status: health.find((h: any) => h.provider === p._id)?.status || 'unknown'
      })),
      
      topEndpoints: currentUsage.providers
        .flatMap((p: any) => p.endpoints.map((e: any) => ({ 
          ...e, 
          provider: p._id 
        })))
        .sort((a: any, b: any) => b.cost - a.cost)
        .slice(0, 10),
      
      alerts: [],
      
      recommendations: suggestions.suggestions.slice(0, 5),
      
      health: health.map((h: any) => ({
        provider: h.provider,
        status: h.status,
        uptime: h.successRate,
        avgLatency: h.avgResponseTime
      })),
      
      subscriptions: subscriptions.map(sub => ({
        provider: sub.provider,
        plan: sub.plan.name,
        renewsIn: Math.floor(
          (new Date(sub.plan.renewalDate).getTime() - Date.now()) / 
          (1000 * 60 * 60 * 24)
        ),
        creditsUsed: sub.usage?.credits ? 
          (sub.usage.credits.used / sub.usage.credits.total) * 100 : 0
      }))
    };
    
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/api-management/test-tracking:
 *   post:
 *     summary: Test API usage tracking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Test tracking recorded
 */
router.post('/test-tracking', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider, endpoint, quantity } = req.body;
    
    await apiCostTracker.trackUsage({
      provider: provider || 'dataforseo',
      endpoint: endpoint || 'keywords_volume',
      quantity: quantity || 1,
      success: true,
      responseTime: Math.random() * 1000,
      statusCode: 200,
      metadata: { test: true }
    });
    
    res.json({ message: 'Test usage tracked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;