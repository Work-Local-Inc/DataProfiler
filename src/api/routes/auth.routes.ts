import { Router, Request, Response } from 'express';
import { replitAuth, oauthService } from '../../services/auth.service';
import { Client } from '../../../models/client.model';
import { Business } from '../../../models/business.model';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   get:
 *     summary: Login with Replit Auth
 *     description: Redirects to Replit authentication
 *     responses:
 *       302:
 *         description: Redirect to Replit auth
 */
router.get('/login', (req: Request, res: Response) => {
  res.redirect('/__repl_auth');
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout current user
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('REPL_AUTH');
  res.json({ message: 'Logged out successfully' });
});

/**
 * @swagger
 * /api/v1/auth/session:
 *   get:
 *     summary: Get current user session
 *     responses:
 *       200:
 *         description: Current user session
 */
router.get('/session', replitAuth.authenticateReplit, (req: Request, res: Response) => {
  res.json({
    user: req.user,
    authenticated: true
  });
});

/**
 * @swagger
 * /api/v1/auth/api-token:
 *   post:
 *     summary: Generate API token for programmatic access
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *     responses:
 *       200:
 *         description: API token generated
 */
router.post('/api-token', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.body;
    
    // Verify user has access to this client
    const client = await Client.findOne({ 
      clientId,
      $or: [
        { 'relationship.accountManager': req.user?.id },
        { 'relationship.teamMembers': req.user?.id }
      ]
    });
    
    if (!client) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const token = replitAuth.generateApiToken(req.user!.id, clientId);
    
    res.json({ token, expiresIn: '30d' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/connect/{provider}:
 *   get:
 *     summary: Connect social media account
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [facebook, instagram, google, twitter, yelp]
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 */
router.get('/connect/:provider', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    // Verify user has permission to connect for this client
    const client = await Client.findOne({ 
      clientId,
      'relationship.type': 'managed',
      $or: [
        { 'relationship.accountManager': req.user?.id },
        { 'relationship.teamMembers': req.user?.id }
      ]
    });
    
    if (!client) {
      return res.status(403).json({ error: 'Access denied or client not managed' });
    }
    
    const authUrl = oauthService.getAuthorizationUrl(
      provider,
      clientId as string,
      `${req.user?.id}:${clientId}`
    );
    
    res.redirect(authUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/callback/{provider}:
 *   get:
 *     summary: OAuth callback handler
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth connection successful
 */
router.get('/callback/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).json({ 
        error: 'OAuth authorization denied',
        details: error 
      });
    }
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Invalid callback parameters' });
    }
    
    // Parse state to get userId and clientId
    const [userId, clientId] = (state as string).split(':');
    
    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(
      provider,
      code as string,
      clientId
    );
    
    // Update client status
    await Client.updateOne(
      { clientId },
      {
        $set: {
          [`integrations.${provider}.connected`]: true,
          [`integrations.${provider}.connectedAt`]: new Date(),
          'metadata.lastSync': new Date()
        }
      }
    );
    
    // Log the connection
    await Client.updateOne(
      { clientId },
      {
        $push: {
          'activity.actions': {
            timestamp: new Date(),
            action: 'oauth_connected',
            platform: provider,
            performedBy: userId
          }
        }
      }
    );
    
    // Redirect to success page
    res.redirect(`/dashboard/clients/${clientId}?connected=${provider}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/disconnect/{provider}:
 *   delete:
 *     summary: Disconnect social media account
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully disconnected
 */
router.delete('/disconnect/:provider', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    // Verify permissions
    const client = await Client.findOne({ 
      clientId,
      $or: [
        { 'relationship.accountManager': req.user?.id },
        { 'relationship.teamMembers': req.user?.id }
      ]
    });
    
    if (!client) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Revoke OAuth access
    await oauthService.revokeAccess(clientId as string, provider);
    
    // Log the disconnection
    await Client.updateOne(
      { clientId },
      {
        $push: {
          'activity.actions': {
            timestamp: new Date(),
            action: 'oauth_disconnected',
            platform: provider,
            performedBy: req.user?.id
          }
        }
      }
    );
    
    res.json({ message: `${provider} disconnected successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh/{provider}:
 *   post:
 *     summary: Refresh OAuth tokens
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 */
router.post('/refresh/:provider', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    const newToken = await oauthService.refreshAccessToken(clientId as string, provider);
    
    res.json({ 
      message: 'Token refreshed successfully',
      expiresIn: '1h'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/status:
 *   get:
 *     summary: Get OAuth connection status for a client
 *     parameters:
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection status for all platforms
 */
router.get('/status', replitAuth.authenticateReplit, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    const client = await Client.findOne(
      { clientId },
      { integrations: 1, oauthTokens: 1 }
    );
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const status = {
      facebook: {
        connected: client.integrations.facebook?.connected || false,
        connectedAt: client.integrations.facebook?.connectedAt,
        hasPages: client.integrations.facebook?.pageId ? true : false
      },
      instagram: {
        connected: client.integrations.instagram?.connected || false,
        connectedAt: client.integrations.instagram?.connectedAt,
        username: client.integrations.instagram?.username
      },
      google: {
        connected: client.integrations.google?.connected || false,
        connectedAt: client.integrations.google?.connectedAt,
        hasMyBusiness: client.integrations.google?.myBusinessAccountId ? true : false,
        hasAnalytics: client.integrations.google?.analyticsViewId ? true : false
      },
      twitter: {
        connected: client.integrations.twitter?.connected || false,
        connectedAt: client.integrations.twitter?.connectedAt,
        username: client.integrations.twitter?.username
      },
      yelp: {
        connected: client.integrations.yelp?.connected || false,
        connectedAt: client.integrations.yelp?.connectedAt
      },
      tripadvisor: {
        connected: client.integrations.tripadvisor?.connected || false,
        connectedAt: client.integrations.tripadvisor?.connectedAt
      }
    };
    
    // Check token expiration
    const tokenStatus = client.oauthTokens.map(token => ({
      platform: token.platform,
      expiresAt: token.expiresAt,
      expired: token.expiresAt < new Date(),
      needsRefresh: new Date(token.expiresAt.getTime() - 24 * 60 * 60 * 1000) < new Date()
    }));
    
    res.json({ 
      status,
      tokens: tokenStatus,
      clientId: client.clientId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;