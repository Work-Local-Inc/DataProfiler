import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import * as dotenv from 'dotenv';
import winston from 'winston';

import businessRoutes from './api/routes/business.routes';
import searchRoutes from './api/routes/search.routes';
import auditRoutes from './api/routes/audit.routes';
import communityRoutes from './api/routes/community.routes';
import collectorRoutes from './api/routes/collector.routes';
import { errorHandler } from './api/middleware/error.middleware';
import { setupWorkers } from './workers/setup.worker';
import { initializeCache } from './services/cache.service';
import { startScheduledJobs } from './services/scheduler.service';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSwagger();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);
    
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    this.app.use('/api/v1/business', businessRoutes);
    this.app.use('/api/v1/search', searchRoutes);
    this.app.use('/api/v1/audit', auditRoutes);
    this.app.use('/api/v1/community', communityRoutes);
    this.app.use('/api/v1/collect', collectorRoutes);

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    
    this.app.use('/admin/queues', serverAdapter.getRouter());

    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'DataProfiler API',
        version: '1.0.0',
        status: 'running',
        documentation: '/docs',
        endpoints: {
          business: '/api/v1/business',
          search: '/api/v1/search',
          audit: '/api/v1/audit',
          community: '/api/v1/community',
          collect: '/api/v1/collect'
        }
      });
    });
  }

  private initializeSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'DataProfiler API',
          version: '1.0.0',
          description: 'Business Intelligence API Platform with Multi-Source Data Aggregation',
          contact: {
            name: 'DataProfiler Team',
            email: 'support@dataprofiler.com'
          }
        },
        servers: [
          {
            url: process.env.API_URL || `http://localhost:${this.port}`,
            description: 'API Server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      },
      apis: ['./src/api/routes/*.ts', './src/models/*.ts']
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
    
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  private async connectDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dataprofiler';
      await mongoose.connect(mongoUri);
      logger.info('✅ MongoDB connected successfully');
      
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      await initializeCache();
      logger.info('✅ Cache initialized');
      
      await setupWorkers();
      logger.info('✅ Workers initialized');
      
      await startScheduledJobs();
      logger.info('✅ Scheduled jobs started');
    } catch (error) {
      logger.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.connectDatabase();
      await this.initializeServices();
      
      this.app.listen(this.port, '0.0.0.0', () => {
        logger.info(`
🚀 DataProfiler API Server Started
📍 Port: ${this.port}
📚 Documentation: http://localhost:${this.port}/docs
🔧 Admin: http://localhost:${this.port}/admin/queues
🌍 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}
        `);
      });
    } catch (error) {
      logger.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default server;