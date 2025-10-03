import axios, { AxiosInstance } from 'axios';
import { Business } from '../../../models/business.model';
import { CacheService } from '../../services/cache.service';
import { apiCostTracker } from '../../services/api-cost-tracker.service';
import winston from 'winston';

const logger = winston.createLogger({
  defaultMeta: { service: 'twitter-collector' }
});

export interface TwitterConfig {
  apiKey: string;
  provider?: 'twitterapi.io' | 'rapidapi' | 'official';
  baseUrl?: string;
  rapidApiKey?: string;
  rapidApiHost?: string;
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author?: TwitterUser;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ url: string; expanded_url: string }>;
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  possibly_sensitive?: boolean;
  lang?: string;
  geo?: any;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  description?: string;
  location?: string;
  url?: string;
  verified?: boolean;
  protected?: boolean;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  profile_image_url?: string;
  pinned_tweet_id?: string;
}

export interface TwitterSearchParams {
  query: string;
  max_results?: number;
  since_id?: string;
  until_id?: string;
  start_time?: string;
  end_time?: string;
  sort_order?: 'relevancy' | 'recency';
}

export class TwitterCollector {
  private client: AxiosInstance;
  private cache: CacheService;
  private config: TwitterConfig;
  private provider: string;
  
  constructor(config: TwitterConfig) {
    this.config = config;
    this.provider = config.provider || 'twitterapi.io';
    this.cache = CacheService.getInstance();
    
    // Configure client based on provider
    switch (this.provider) {
      case 'twitterapi.io':
        this.client = axios.create({
          baseURL: config.baseUrl || 'https://api.twitterapi.io/v2',
          headers: {
            'X-API-Key': config.apiKey
          },
          timeout: 30000
        });
        break;
        
      case 'rapidapi':
        this.client = axios.create({
          baseURL: config.baseUrl || `https://${config.rapidApiHost}`,
          headers: {
            'X-RapidAPI-Key': config.rapidApiKey,
            'X-RapidAPI-Host': config.rapidApiHost
          },
          timeout: 30000
        });
        break;
        
      case 'official':
        this.client = axios.create({
          baseURL: 'https://api.twitter.com/2',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          },
          timeout: 30000
        });
        break;
    }
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Track API usage on every request
    this.client.interceptors.response.use(
      async (response) => {
        // Track successful requests
        await this.trackUsage(response.config.url!, response.data);
        return response;
      },
      async (error) => {
        // Track failed requests
        await this.trackUsage(
          error.config?.url || 'unknown',
          null,
          error.response?.status,
          false
        );
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['x-ratelimit-reset'] || 60;
          logger.warn(`Rate limited. Retrying after ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Search tweets
   */
  async searchTweets(params: TwitterSearchParams): Promise<Tweet[]> {
    const cacheKey = `twitter:search:${JSON.stringify(params)}`;
    
    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      logger.info('Twitter search cache hit');
      return cached;
    }
    
    try {
      const response = await this.client.get('/tweets/search', {
        params: {
          query: params.query,
          max_results: params.max_results || 50,
          'tweet.fields': 'created_at,author_id,public_metrics,entities,referenced_tweets,possibly_sensitive,lang,geo',
          'user.fields': 'name,username,verified,description,public_metrics,profile_image_url',
          'expansions': 'author_id,referenced_tweets.id',
          ...params
        }
      });
      
      const tweets = response.data.data || [];
      const users = response.data.includes?.users || [];
      
      // Map users to tweets
      tweets.forEach((tweet: Tweet) => {
        tweet.author = users.find((u: TwitterUser) => u.id === tweet.author_id);
      });
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, tweets, 3600);
      
      return tweets;
    } catch (error: any) {
      logger.error(`Twitter search failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<TwitterUser> {
    const cacheKey = `twitter:user:${username}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.client.get(`/users/by/username/${username}`, {
        params: {
          'user.fields': 'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified'
        }
      });
      
      const user = response.data.data;
      
      // Cache for 24 hours
      await this.cache.set(cacheKey, user, 86400);
      
      return user;
    } catch (error: any) {
      logger.error(`Failed to get user ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get user timeline
   */
  async getUserTimeline(
    userId: string,
    params?: {
      max_results?: number;
      exclude?: string;
      since_id?: string;
      until_id?: string;
    }
  ): Promise<Tweet[]> {
    try {
      const response = await this.client.get(`/users/${userId}/tweets`, {
        params: {
          max_results: params?.max_results || 20,
          exclude: params?.exclude || 'retweets,replies',
          'tweet.fields': 'created_at,author_id,public_metrics,entities,referenced_tweets',
          ...params
        }
      });
      
      return response.data.data || [];
    } catch (error: any) {
      logger.error(`Failed to get timeline for ${userId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get user followers
   */
  async getUserFollowers(
    userId: string,
    params?: {
      max_results?: number;
      pagination_token?: string;
    }
  ): Promise<{ users: TwitterUser[]; next_token?: string }> {
    try {
      const response = await this.client.get(`/users/${userId}/followers`, {
        params: {
          max_results: params?.max_results || 100,
          pagination_token: params?.pagination_token,
          'user.fields': 'public_metrics,verified,description,created_at'
        }
      });
      
      return {
        users: response.data.data || [],
        next_token: response.data.meta?.next_token
      };
    } catch (error: any) {
      logger.error(`Failed to get followers for ${userId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get tweet by ID
   */
  async getTweet(tweetId: string): Promise<Tweet> {
    const cacheKey = `twitter:tweet:${tweetId}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.client.get(`/tweets/${tweetId}`, {
        params: {
          'tweet.fields': 'created_at,author_id,public_metrics,entities,referenced_tweets,possibly_sensitive,lang,geo',
          'user.fields': 'name,username,verified,public_metrics',
          'expansions': 'author_id'
        }
      });
      
      const tweet = response.data.data;
      if (response.data.includes?.users?.[0]) {
        tweet.author = response.data.includes.users[0];
      }
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, tweet, 3600);
      
      return tweet;
    } catch (error: any) {
      logger.error(`Failed to get tweet ${tweetId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Monitor brand mentions
   */
  async monitorBrandMentions(
    brandName: string,
    params?: {
      includeRetweets?: boolean;
      minLikes?: number;
      minRetweets?: number;
      languages?: string[];
    }
  ): Promise<Tweet[]> {
    // Build search query
    let query = `"${brandName}" OR @${brandName} OR #${brandName}`;
    
    if (!params?.includeRetweets) {
      query += ' -filter:retweets';
    }
    
    if (params?.minLikes) {
      query += ` min_likes:${params.minLikes}`;
    }
    
    if (params?.minRetweets) {
      query += ` min_retweets:${params.minRetweets}`;
    }
    
    if (params?.languages?.length) {
      query += ` (${params.languages.map(lang => `lang:${lang}`).join(' OR ')})`;
    }
    
    return this.searchTweets({
      query,
      max_results: 100,
      sort_order: 'recency'
    });
  }
  
  /**
   * Analyze competitor
   */
  async analyzeCompetitor(username: string): Promise<any> {
    try {
      // Get user profile
      const user = await this.getUserByUsername(username);
      
      // Get recent tweets
      const timeline = await this.getUserTimeline(user.id, {
        max_results: 100
      });
      
      // Get sample of followers
      const followers = await this.getUserFollowers(user.id, {
        max_results: 100
      });
      
      // Analyze engagement
      const engagement = this.calculateEngagement(timeline);
      
      // Analyze posting patterns
      const postingPatterns = this.analyzePostingPatterns(timeline);
      
      // Analyze content themes
      const contentThemes = this.analyzeContentThemes(timeline);
      
      return {
        profile: user,
        metrics: {
          followers: user.public_metrics.followers_count,
          following: user.public_metrics.following_count,
          tweets: user.public_metrics.tweet_count,
          listed: user.public_metrics.listed_count,
          followerRatio: user.public_metrics.followers_count / 
                        (user.public_metrics.following_count || 1),
          verified: user.verified
        },
        engagement,
        postingPatterns,
        contentThemes,
        topTweets: timeline
          .sort((a, b) => b.public_metrics.like_count - a.public_metrics.like_count)
          .slice(0, 5),
        followerQuality: this.analyzeFollowerQuality(followers.users)
      };
    } catch (error: any) {
      logger.error(`Failed to analyze competitor ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Collect business Twitter data
   */
  async collectBusinessTwitterData(
    businessId: string,
    username: string
  ): Promise<void> {
    try {
      logger.info(`Collecting Twitter data for @${username}`);
      
      // Get user profile
      const user = await this.getUserByUsername(username);
      
      // Get recent tweets
      const timeline = await this.getUserTimeline(user.id, {
        max_results: 50
      });
      
      // Get engagement metrics
      const engagement = this.calculateEngagement(timeline);
      
      // Update business record
      await Business.findOneAndUpdate(
        { businessId },
        {
          $set: {
            'socialProfiles.twitter': {
              username: user.username,
              userId: user.id,
              followers: user.public_metrics.followers_count,
              following: user.public_metrics.following_count,
              tweets: user.public_metrics.tweet_count,
              verified: user.verified,
              description: user.description,
              engagement: engagement,
              lastPost: timeline[0]?.created_at,
              profileUrl: `https://twitter.com/${user.username}`,
              profileImage: user.profile_image_url
            }
          },
          $push: {
            'metadata.dataSources': {
              source: 'Twitter',
              lastSync: new Date(),
              status: 'active'
            }
          }
        }
      );
      
      logger.info(`Twitter data collected for @${username}`);
    } catch (error: any) {
      logger.error(`Failed to collect Twitter data for ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate engagement metrics
   */
  private calculateEngagement(tweets: Tweet[]): any {
    if (!tweets.length) return null;
    
    const totalLikes = tweets.reduce((sum, t) => sum + t.public_metrics.like_count, 0);
    const totalRetweets = tweets.reduce((sum, t) => sum + t.public_metrics.retweet_count, 0);
    const totalReplies = tweets.reduce((sum, t) => sum + t.public_metrics.reply_count, 0);
    
    return {
      avgLikes: Math.round(totalLikes / tweets.length),
      avgRetweets: Math.round(totalRetweets / tweets.length),
      avgReplies: Math.round(totalReplies / tweets.length),
      engagementRate: ((totalLikes + totalRetweets + totalReplies) / tweets.length) / 
                     tweets[0]?.author?.public_metrics.followers_count * 100,
      totalEngagement: totalLikes + totalRetweets + totalReplies
    };
  }
  
  /**
   * Analyze posting patterns
   */
  private analyzePostingPatterns(tweets: Tweet[]): any {
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    
    tweets.forEach(tweet => {
      const date = new Date(tweet.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    // Find peak hours
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    // Find peak days
    const peakDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      tweetsAnalyzed: tweets.length,
      avgTweetsPerDay: tweets.length / 30,
      peakHour: peakHour ? `${peakHour}:00` : null,
      peakDay: peakDay ? days[parseInt(peakDay)] : null,
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts
    };
  }
  
  /**
   * Analyze content themes
   */
  private analyzeContentThemes(tweets: Tweet[]): any {
    const hashtags: Record<string, number> = {};
    const mentions: Record<string, number> = {};
    const mediaCount = tweets.filter(t => t.entities?.urls?.length).length;
    
    tweets.forEach(tweet => {
      tweet.entities?.hashtags?.forEach(tag => {
        hashtags[tag.tag] = (hashtags[tag.tag] || 0) + 1;
      });
      
      tweet.entities?.mentions?.forEach(mention => {
        mentions[mention.username] = (mentions[mention.username] || 0) + 1;
      });
    });
    
    return {
      topHashtags: Object.entries(hashtags)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      topMentions: Object.entries(mentions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([username, count]) => ({ username, count })),
      mediaPercentage: (mediaCount / tweets.length) * 100,
      replyPercentage: (tweets.filter(t => 
        t.referenced_tweets?.some(rt => rt.type === 'replied_to')
      ).length / tweets.length) * 100
    };
  }
  
  /**
   * Analyze follower quality
   */
  private analyzeFollowerQuality(followers: TwitterUser[]): any {
    const verifiedCount = followers.filter(f => f.verified).length;
    const avgFollowers = followers.reduce((sum, f) => 
      sum + f.public_metrics.followers_count, 0) / followers.length;
    
    const activeFollowers = followers.filter(f => 
      f.public_metrics.tweet_count > 100 &&
      f.public_metrics.followers_count > 10
    ).length;
    
    return {
      sampleSize: followers.length,
      verifiedPercentage: (verifiedCount / followers.length) * 100,
      avgFollowerCount: Math.round(avgFollowers),
      activePercentage: (activeFollowers / followers.length) * 100,
      qualityScore: Math.min(100, 
        (verifiedCount * 2) + 
        (activeFollowers) + 
        (avgFollowers > 100 ? 20 : avgFollowers / 5)
      )
    };
  }
  
  /**
   * Track API usage for cost management
   */
  private async trackUsage(
    endpoint: string,
    data: any,
    statusCode: number = 200,
    success: boolean = true
  ): Promise<void> {
    let quantity = 1;
    let endpointName = 'unknown';
    
    // Determine endpoint and quantity
    if (endpoint.includes('/search')) {
      endpointName = 'search';
      quantity = data?.data?.length || 1;
    } else if (endpoint.includes('/users')) {
      if (endpoint.includes('/tweets')) {
        endpointName = 'timeline';
        quantity = data?.data?.length || 1;
      } else if (endpoint.includes('/followers')) {
        endpointName = 'followers';
        quantity = data?.data?.length || 1;
      } else {
        endpointName = 'user_lookup';
      }
    } else if (endpoint.includes('/tweets')) {
      endpointName = 'tweet_lookup';
    }
    
    // Track based on provider
    const provider = this.provider === 'twitterapi.io' ? 'twitterapi' : 
                    this.provider === 'rapidapi' ? 'twitter_rapidapi' : 
                    'twitter_official';
    
    await apiCostTracker.trackUsage({
      provider,
      endpoint: endpointName,
      quantity,
      statusCode,
      success,
      metadata: {
        fullEndpoint: endpoint,
        dataReturned: quantity
      }
    });
  }
}

// Export singleton for TwitterAPI.io (recommended)
export const twitterCollector = new TwitterCollector({
  apiKey: process.env.TWITTER_API_KEY || '',
  provider: 'twitterapi.io'
});