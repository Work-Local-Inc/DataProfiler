import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Client } from '../../models/client.model';

// Replit Auth Integration
export class ReplitAuthService {
  private static instance: ReplitAuthService;
  
  private constructor() {}
  
  static getInstance(): ReplitAuthService {
    if (!this.instance) {
      this.instance = new ReplitAuthService();
    }
    return this.instance;
  }
  
  // Replit Auth middleware
  async authenticateReplit(req: Request, res: Response, next: NextFunction) {
    try {
      // Replit automatically injects user info in headers
      const replitUser = req.headers['x-replit-user-id'];
      const replitUsername = req.headers['x-replit-user-name'];
      const replitUserRoles = req.headers['x-replit-user-roles'];
      
      if (!replitUser) {
        // Redirect to Replit Auth
        return res.redirect('/__repl_auth');
      }
      
      // Create or update user session
      req.user = {
        id: replitUser as string,
        username: replitUsername as string,
        roles: replitUserRoles ? (replitUserRoles as string).split(',') : ['user'],
        provider: 'replit'
      };
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
  
  // Generate JWT for API access
  generateApiToken(userId: string, clientId?: string): string {
    const payload = {
      userId,
      clientId,
      type: 'api',
      iat: Date.now(),
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
  }
  
  // Verify API token
  verifyApiToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// OAuth Service for Social Platforms
export class OAuthService {
  private static instance: OAuthService;
  private providers: Map<string, OAuthProvider>;
  
  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }
  
  static getInstance(): OAuthService {
    if (!this.instance) {
      this.instance = new OAuthService();
    }
    return this.instance;
  }
  
  private initializeProviders() {
    // Facebook OAuth
    this.providers.set('facebook', {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_manage_metadata',
        'pages_read_user_content',
        'pages_manage_ads',
        'pages_manage_engagement',
        'pages_show_list',
        'business_management',
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'ads_management',
        'ads_read'
      ],
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET
    });
    
    // Google OAuth (for Google My Business & Analytics)
    this.providers.set('google', {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    });
    
    // Instagram Business OAuth (via Facebook)
    this.providers.set('instagram', {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_read_engagement'
      ],
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET
    });
    
    // Twitter/X OAuth 2.0
    this.providers.set('twitter', {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'follows.read',
        'follows.write',
        'offline.access'
      ],
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });
    
    // Yelp OAuth
    this.providers.set('yelp', {
      authUrl: 'https://www.yelp.com/oauth2/authorize',
      tokenUrl: 'https://api.yelp.com/oauth2/token',
      scopes: [],
      clientId: process.env.YELP_CLIENT_ID,
      clientSecret: process.env.YELP_CLIENT_SECRET
    });
  }
  
  // Generate OAuth URL
  getAuthorizationUrl(provider: string, clientId: string, state?: string): string {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Provider ${provider} not supported`);
    
    const params = new URLSearchParams({
      client_id: config.clientId!,
      redirect_uri: this.getRedirectUri(provider),
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: state || `${provider}:${clientId}`,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent'
    });
    
    // Provider-specific params
    if (provider === 'facebook' || provider === 'instagram') {
      params.append('auth_type', 'rerequest');
    }
    
    return `${config.authUrl}?${params.toString()}`;
  }
  
  // Exchange code for tokens
  async exchangeCodeForTokens(provider: string, code: string, clientId: string) {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Provider ${provider} not supported`);
    
    try {
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: this.getRedirectUri(provider),
        grant_type: 'authorization_code'
      });
      
      const tokens = response.data;
      
      // Save tokens to database
      await this.saveTokens(clientId, provider, tokens);
      
      // Get additional permissions/pages for Facebook
      if (provider === 'facebook' || provider === 'instagram') {
        await this.getFacebookPages(tokens.access_token, clientId);
      }
      
      return tokens;
    } catch (error: any) {
      console.error(`OAuth exchange failed for ${provider}:`, error.response?.data);
      throw error;
    }
  }
  
  // Refresh access token
  async refreshAccessToken(clientId: string, provider: string) {
    const client = await Client.findOne({ clientId });
    if (!client) throw new Error('Client not found');
    
    const tokenData = client.oauthTokens.find(t => t.platform === provider);
    if (!tokenData || !tokenData.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Provider ${provider} not supported`);
    
    try {
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokenData.refreshToken,
        grant_type: 'refresh_token'
      });
      
      const newTokens = response.data;
      
      // Update tokens in database
      await Client.updateOne(
        { clientId, 'oauthTokens.platform': provider },
        {
          $set: {
            'oauthTokens.$.accessToken': newTokens.access_token,
            'oauthTokens.$.expiresAt': new Date(Date.now() + (newTokens.expires_in * 1000)),
            'oauthTokens.$.lastRefreshed': new Date()
          }
        }
      );
      
      return newTokens.access_token;
    } catch (error: any) {
      console.error(`Token refresh failed for ${provider}:`, error.response?.data);
      throw error;
    }
  }
  
  // Get Facebook Pages
  private async getFacebookPages(accessToken: string, clientId: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: { access_token: accessToken }
      });
      
      const pages = response.data.data;
      
      // Get Instagram Business accounts
      for (const page of pages) {
        const igResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${page.id}`,
          {
            params: {
              fields: 'instagram_business_account',
              access_token: page.access_token
            }
          }
        );
        
        if (igResponse.data.instagram_business_account) {
          await Client.updateOne(
            { clientId },
            {
              $set: {
                'integrations.instagram': {
                  businessAccountId: igResponse.data.instagram_business_account.id,
                  connected: true,
                  connectedAt: new Date()
                }
              }
            }
          );
        }
      }
      
      // Save page tokens
      await Client.updateOne(
        { clientId },
        {
          $set: {
            'integrations.facebook.pages': pages.map((p: any) => ({
              pageId: p.id,
              pageName: p.name,
              pageAccessToken: p.access_token,
              category: p.category
            }))
          }
        }
      );
      
      return pages;
    } catch (error) {
      console.error('Failed to get Facebook pages:', error);
      throw error;
    }
  }
  
  // Save tokens to database
  private async saveTokens(clientId: string, provider: string, tokens: any) {
    const tokenData = {
      platform: provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
      scope: tokens.scope ? tokens.scope.split(' ') : [],
      lastRefreshed: new Date()
    };
    
    await Client.updateOne(
      { clientId },
      {
        $pull: { oauthTokens: { platform: provider } }
      }
    );
    
    await Client.updateOne(
      { clientId },
      {
        $push: { oauthTokens: tokenData },
        $set: {
          [`integrations.${provider}.connected`]: true,
          [`integrations.${provider}.connectedAt`]: new Date()
        }
      }
    );
  }
  
  // Get redirect URI
  private getRedirectUri(provider: string): string {
    const baseUrl = process.env.API_URL || 'https://dataprofiler.replit.app';
    return `${baseUrl}/api/v1/auth/callback/${provider}`;
  }
  
  // Revoke access
  async revokeAccess(clientId: string, provider: string) {
    const client = await Client.findOne({ clientId });
    if (!client) throw new Error('Client not found');
    
    const tokenData = client.oauthTokens.find(t => t.platform === provider);
    if (!tokenData) throw new Error('No token found');
    
    // Provider-specific revocation
    switch (provider) {
      case 'facebook':
      case 'instagram':
        await axios.delete(
          `https://graph.facebook.com/v18.0/me/permissions`,
          { params: { access_token: tokenData.accessToken } }
        );
        break;
      case 'google':
        await axios.post(
          `https://oauth2.googleapis.com/revoke?token=${tokenData.accessToken}`
        );
        break;
    }
    
    // Remove from database
    await Client.updateOne(
      { clientId },
      {
        $pull: { oauthTokens: { platform: provider } },
        $set: {
          [`integrations.${provider}.connected`]: false
        }
      }
    );
  }
}

interface OAuthProvider {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId?: string;
  clientSecret?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roles: string[];
        provider: string;
        clientId?: string;
      };
    }
  }
}

export const replitAuth = ReplitAuthService.getInstance();
export const oauthService = OAuthService.getInstance();