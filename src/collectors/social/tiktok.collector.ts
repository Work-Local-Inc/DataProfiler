import axios, { AxiosInstance } from 'axios';
import { Business } from '../../../models/business.model';
import { CacheService } from '../../services/cache.service';
import { apiCostTracker } from '../../services/api-cost-tracker.service';
import winston from 'winston';

const logger = winston.createLogger({
  defaultMeta: { service: 'tiktok-collector' }
});

export interface TikTokConfig {
  rapidApiKey: string;
  rapidApiHost?: string;
  baseUrl?: string;
}

export interface TikTokUser {
  id: string;
  uniqueId: string;
  nickname: string;
  avatarLarger?: string;
  signature?: string;
  verified: boolean;
  privateAccount: boolean;
  region?: string;
  language?: string;
  stats: {
    followerCount: number;
    followingCount: number;
    videoCount: number;
    heartCount: number;
    diggCount?: number;
  };
  bioLink?: {
    link: string;
    risk: number;
  };
  commerce?: {
    commerceUser: boolean;
    category?: string;
  };
}

export interface TikTokVideo {
  id: string;
  desc: string;
  createTime: number;
  duration: number;
  video: {
    height: number;
    width: number;
    duration: number;
    ratio: string;
    cover: string;
    playAddr: string;
    downloadAddr?: string;
  };
  author: {
    id: string;
    uniqueId: string;
    nickname: string;
    verified: boolean;
    signature?: string;
    avatar?: string;
  };
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
    collectCount?: number;
  };
  music?: {
    id: string;
    title: string;
    authorName: string;
    duration: number;
    original: boolean;
    playUrl?: string;
  };
  challenges?: Array<{
    id: string;
    title: string;
    desc?: string;
  }>;
  duetEnabled?: boolean;
  stitchEnabled?: boolean;
  shareEnabled?: boolean;
  isAd?: boolean;
}

export interface TikTokComment {
  cid: string;
  text: string;
  createTime: number;
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatar?: string;
  };
  diggCount: number;
  replyCount: number;
  isAuthorDigged?: boolean;
}

export class TikTokCollector {
  private client: AxiosInstance;
  private cache: CacheService;
  private config: TikTokConfig;
  
  constructor(config: TikTokConfig) {
    this.config = {
      rapidApiHost: 'tiktok-api23.p.rapidapi.com',
      ...config
    };
    
    this.client = axios.create({
      baseURL: config.baseUrl || `https://${this.config.rapidApiHost}/api`,
      headers: {
        'X-RapidAPI-Key': config.rapidApiKey,
        'X-RapidAPI-Host': this.config.rapidApiHost
      },
      timeout: 30000
    });
    
    this.cache = CacheService.getInstance();
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Track API usage
    this.client.interceptors.response.use(
      async (response) => {
        await this.trackUsage(response.config.url!, response.data);
        return response;
      },
      async (error) => {
        await this.trackUsage(
          error.config?.url || 'unknown',
          null,
          error.response?.status,
          false
        );
        
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          logger.warn(`Rate limited. Retrying after ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<TikTokUser> {
    const cacheKey = `tiktok:user:${username}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      logger.info(`TikTok user cache hit for ${username}`);
      return cached;
    }
    
    try {
      const response = await this.client.get('/user/info', {
        params: { username }
      });
      
      const user = response.data.user;
      
      // Cache for 24 hours
      await this.cache.set(cacheKey, user, 86400);
      
      return user;
    } catch (error: any) {
      logger.error(`Failed to get TikTok user ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get user videos
   */
  async getUserVideos(
    username: string,
    params?: {
      count?: number;
      cursor?: string;
    }
  ): Promise<{ videos: TikTokVideo[]; cursor?: string; hasMore: boolean }> {
    try {
      const response = await this.client.get('/user/videos', {
        params: {
          username,
          count: params?.count || 30,
          cursor: params?.cursor
        }
      });
      
      return {
        videos: response.data.videos || [],
        cursor: response.data.cursor,
        hasMore: response.data.hasMore || false
      };
    } catch (error: any) {
      logger.error(`Failed to get videos for ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get video details
   */
  async getVideoDetails(videoId: string): Promise<TikTokVideo> {
    const cacheKey = `tiktok:video:${videoId}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.client.get('/video/info', {
        params: { video_id: videoId }
      });
      
      const video = response.data.video;
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, video, 3600);
      
      return video;
    } catch (error: any) {
      logger.error(`Failed to get video ${videoId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get video comments
   */
  async getVideoComments(
    videoId: string,
    params?: {
      count?: number;
      cursor?: string;
    }
  ): Promise<{ comments: TikTokComment[]; cursor?: string; hasMore: boolean; total: number }> {
    try {
      const response = await this.client.get('/video/comments', {
        params: {
          video_id: videoId,
          count: params?.count || 20,
          cursor: params?.cursor
        }
      });
      
      return {
        comments: response.data.comments || [],
        cursor: response.data.cursor,
        hasMore: response.data.hasMore || false,
        total: response.data.total || 0
      };
    } catch (error: any) {
      logger.error(`Failed to get comments for video ${videoId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Search videos
   */
  async searchVideos(
    query: string,
    params?: {
      count?: number;
      cursor?: string;
      region?: string;
    }
  ): Promise<{ videos: TikTokVideo[]; cursor?: string; hasMore: boolean }> {
    const cacheKey = `tiktok:search:${query}:${JSON.stringify(params)}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.client.get('/search/video', {
        params: {
          query,
          count: params?.count || 30,
          cursor: params?.cursor,
          region: params?.region || 'US'
        }
      });
      
      const result = {
        videos: response.data.videos || [],
        cursor: response.data.cursor,
        hasMore: response.data.hasMore || false
      };
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, result, 3600);
      
      return result;
    } catch (error: any) {
      logger.error(`Failed to search videos for "${query}": ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get trending videos
   */
  async getTrendingVideos(
    params?: {
      region?: string;
      count?: number;
    }
  ): Promise<TikTokVideo[]> {
    const cacheKey = `tiktok:trending:${params?.region || 'US'}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.client.get('/trending/videos', {
        params: {
          region: params?.region || 'US',
          count: params?.count || 50
        }
      });
      
      const videos = response.data.videos || [];
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, videos, 3600);
      
      return videos;
    } catch (error: any) {
      logger.error(`Failed to get trending videos: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get hashtag details and videos
   */
  async getHashtagData(
    hashtag: string,
    params?: {
      count?: number;
      cursor?: string;
    }
  ): Promise<any> {
    try {
      // Get hashtag info
      const infoResponse = await this.client.get('/hashtag/info', {
        params: { hashtag }
      });
      
      // Get hashtag videos
      const videosResponse = await this.client.get('/hashtag/videos', {
        params: {
          hashtag,
          count: params?.count || 30,
          cursor: params?.cursor
        }
      });
      
      return {
        hashtag: infoResponse.data.hashtag,
        videos: videosResponse.data.videos || [],
        cursor: videosResponse.data.cursor,
        hasMore: videosResponse.data.hasMore || false
      };
    } catch (error: any) {
      logger.error(`Failed to get hashtag data for #${hashtag}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze user engagement
   */
  async analyzeUserEngagement(username: string): Promise<any> {
    try {
      // Get user profile
      const user = await this.getUserProfile(username);
      
      // Get recent videos
      const { videos } = await this.getUserVideos(username, { count: 30 });
      
      if (videos.length === 0) {
        return {
          user,
          engagement: null,
          message: 'No videos available for analysis'
        };
      }
      
      // Calculate engagement metrics
      const totalViews = videos.reduce((sum, v) => sum + v.stats.playCount, 0);
      const totalLikes = videos.reduce((sum, v) => sum + v.stats.diggCount, 0);
      const totalComments = videos.reduce((sum, v) => sum + v.stats.commentCount, 0);
      const totalShares = videos.reduce((sum, v) => sum + v.stats.shareCount, 0);
      
      const avgViews = Math.round(totalViews / videos.length);
      const avgLikes = Math.round(totalLikes / videos.length);
      const avgComments = Math.round(totalComments / videos.length);
      const avgShares = Math.round(totalShares / videos.length);
      
      const engagementRate = user.stats.followerCount > 0 
        ? ((totalLikes + totalComments + totalShares) / (videos.length * user.stats.followerCount)) * 100
        : 0;
      
      // Analyze posting patterns
      const postingPatterns = this.analyzePostingPatterns(videos);
      
      // Analyze content performance
      const topVideos = videos
        .sort((a, b) => b.stats.playCount - a.stats.playCount)
        .slice(0, 5);
      
      // Extract popular hashtags
      const hashtags: Record<string, number> = {};
      videos.forEach(video => {
        video.challenges?.forEach(challenge => {
          hashtags[challenge.title] = (hashtags[challenge.title] || 0) + 1;
        });
      });
      
      const topHashtags = Object.entries(hashtags)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count, usage: (count / videos.length) * 100 }));
      
      return {
        user: {
          username: user.uniqueId,
          followers: user.stats.followerCount,
          following: user.stats.followingCount,
          videos: user.stats.videoCount,
          likes: user.stats.heartCount,
          verified: user.verified
        },
        engagement: {
          rate: engagementRate.toFixed(2) + '%',
          avgViews,
          avgLikes,
          avgComments,
          avgShares,
          likesToViewsRatio: ((avgLikes / avgViews) * 100).toFixed(2) + '%',
          commentsToViewsRatio: ((avgComments / avgViews) * 100).toFixed(2) + '%'
        },
        content: {
          videosAnalyzed: videos.length,
          totalViews: totalViews,
          totalEngagement: totalLikes + totalComments + totalShares,
          topHashtags,
          postingPatterns
        },
        topPerformers: topVideos.map(v => ({
          id: v.id,
          desc: v.desc.substring(0, 50) + '...',
          views: v.stats.playCount,
          likes: v.stats.diggCount,
          engagement: ((v.stats.diggCount + v.stats.commentCount + v.stats.shareCount) / v.stats.playCount * 100).toFixed(2) + '%'
        }))
      };
    } catch (error: any) {
      logger.error(`Failed to analyze user ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Monitor brand mentions
   */
  async monitorBrandMentions(
    brandName: string,
    params?: {
      region?: string;
      count?: number;
    }
  ): Promise<any> {
    try {
      // Search for brand mentions
      const { videos } = await this.searchVideos(brandName, {
        count: params?.count || 50,
        region: params?.region || 'US'
      });
      
      // Analyze sentiment and engagement
      const mentions = videos.map(video => ({
        id: video.id,
        author: video.author.uniqueId,
        text: video.desc,
        created: new Date(video.createTime * 1000),
        views: video.stats.playCount,
        likes: video.stats.diggCount,
        comments: video.stats.commentCount,
        shares: video.stats.shareCount,
        engagement: (
          (video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / 
          video.stats.playCount * 100
        ).toFixed(2) + '%',
        url: `https://www.tiktok.com/@${video.author.uniqueId}/video/${video.id}`
      }));
      
      // Calculate aggregate metrics
      const totalReach = mentions.reduce((sum, m) => sum + m.views, 0);
      const totalEngagement = mentions.reduce((sum, m) => sum + m.likes + m.comments + m.shares, 0);
      const avgEngagementRate = mentions.length > 0
        ? mentions.reduce((sum, m) => sum + parseFloat(m.engagement), 0) / mentions.length
        : 0;
      
      return {
        brand: brandName,
        mentionsFound: mentions.length,
        totalReach,
        totalEngagement,
        avgEngagementRate: avgEngagementRate.toFixed(2) + '%',
        mentions: mentions.slice(0, 20), // Top 20 mentions
        topMentions: mentions
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)
      };
    } catch (error: any) {
      logger.error(`Failed to monitor brand ${brandName}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Collect business TikTok data
   */
  async collectBusinessTikTokData(
    businessId: string,
    username: string
  ): Promise<void> {
    try {
      logger.info(`Collecting TikTok data for @${username}`);
      
      // Get user profile
      const user = await this.getUserProfile(username);
      
      // Get recent videos
      const { videos } = await this.getUserVideos(username, { count: 20 });
      
      // Calculate engagement
      const engagement = await this.analyzeUserEngagement(username);
      
      // Update business record
      await Business.findOneAndUpdate(
        { businessId },
        {
          $set: {
            'socialProfiles.tiktok': {
              username: user.uniqueId,
              userId: user.id,
              followers: user.stats.followerCount,
              following: user.stats.followingCount,
              videos: user.stats.videoCount,
              likes: user.stats.heartCount,
              verified: user.verified,
              bio: user.signature,
              engagement: engagement.engagement,
              lastPost: videos[0] ? new Date(videos[0].createTime * 1000) : null,
              profileUrl: `https://www.tiktok.com/@${user.uniqueId}`,
              profileImage: user.avatarLarger,
              topHashtags: engagement.content.topHashtags
            }
          },
          $push: {
            'metadata.dataSources': {
              source: 'TikTok',
              lastSync: new Date(),
              status: 'active'
            }
          }
        }
      );
      
      logger.info(`TikTok data collected for @${username}`);
    } catch (error: any) {
      logger.error(`Failed to collect TikTok data for ${username}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find trending content in niche
   */
  async findTrendingInNiche(
    niche: string,
    params?: {
      region?: string;
      count?: number;
    }
  ): Promise<any> {
    try {
      // Search for niche content
      const { videos } = await this.searchVideos(niche, {
        count: params?.count || 100,
        region: params?.region || 'US'
      });
      
      // Extract trending elements
      const hashtags: Record<string, number> = {};
      const sounds: Record<string, number> = {};
      const creators: Record<string, number> = {};
      
      videos.forEach(video => {
        // Count hashtags
        video.challenges?.forEach(challenge => {
          hashtags[challenge.title] = (hashtags[challenge.title] || 0) + 1;
        });
        
        // Count sounds
        if (video.music) {
          const soundKey = `${video.music.title} - ${video.music.authorName}`;
          sounds[soundKey] = (sounds[soundKey] || 0) + 1;
        }
        
        // Count creators
        creators[video.author.uniqueId] = (creators[video.author.uniqueId] || 0) + 1;
      });
      
      return {
        niche,
        videosAnalyzed: videos.length,
        trendingHashtags: Object.entries(hashtags)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([tag, count]) => ({ 
            tag, 
            count, 
            percentage: ((count / videos.length) * 100).toFixed(1) + '%' 
          })),
        trendingSounds: Object.entries(sounds)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([sound, count]) => ({ 
            sound, 
            count, 
            percentage: ((count / videos.length) * 100).toFixed(1) + '%' 
          })),
        topCreators: Object.entries(creators)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([creator, count]) => ({ creator, videos: count })),
        avgMetrics: {
          views: Math.round(videos.reduce((sum, v) => sum + v.stats.playCount, 0) / videos.length),
          likes: Math.round(videos.reduce((sum, v) => sum + v.stats.diggCount, 0) / videos.length),
          comments: Math.round(videos.reduce((sum, v) => sum + v.stats.commentCount, 0) / videos.length),
          shares: Math.round(videos.reduce((sum, v) => sum + v.stats.shareCount, 0) / videos.length)
        }
      };
    } catch (error: any) {
      logger.error(`Failed to find trending content for ${niche}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze posting patterns
   */
  private analyzePostingPatterns(videos: TikTokVideo[]): any {
    if (videos.length === 0) return null;
    
    const dates = videos.map(v => new Date(v.createTime * 1000));
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    
    dates.forEach(date => {
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Find peak times
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];
    const peakDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Calculate posting frequency
    const oldestPost = Math.min(...dates.map(d => d.getTime()));
    const newestPost = Math.max(...dates.map(d => d.getTime()));
    const daySpan = (newestPost - oldestPost) / (1000 * 60 * 60 * 24);
    const postsPerDay = videos.length / (daySpan || 1);
    
    return {
      postsPerDay: postsPerDay.toFixed(1),
      peakHour: peakHour ? `${peakHour[0]}:00` : null,
      peakDay: peakDay ? days[parseInt(peakDay[0])] : null,
      consistency: daySpan > 0 ? 'active' : 'new'
    };
  }
  
  /**
   * Track API usage
   */
  private async trackUsage(
    endpoint: string,
    data: any,
    statusCode: number = 200,
    success: boolean = true
  ): Promise<void> {
    let quantity = 1;
    let endpointName = 'unknown';
    
    // Determine endpoint type
    if (endpoint.includes('/user')) {
      if (endpoint.includes('/videos')) {
        endpointName = 'user_videos';
        quantity = data?.videos?.length || 1;
      } else {
        endpointName = 'user_profile';
      }
    } else if (endpoint.includes('/video')) {
      if (endpoint.includes('/comments')) {
        endpointName = 'video_comments';
        quantity = data?.comments?.length || 1;
      } else {
        endpointName = 'video_info';
      }
    } else if (endpoint.includes('/search')) {
      endpointName = 'search';
      quantity = data?.videos?.length || 1;
    } else if (endpoint.includes('/trending')) {
      endpointName = 'trending';
      quantity = data?.videos?.length || 1;
    } else if (endpoint.includes('/hashtag')) {
      endpointName = 'hashtag';
      quantity = data?.videos?.length || 1;
    }
    
    await apiCostTracker.trackUsage({
      provider: 'tiktok_rapidapi',
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

// Export singleton instance
export const tiktokCollector = new TikTokCollector({
  rapidApiKey: process.env.RAPIDAPI_KEY || ''
});