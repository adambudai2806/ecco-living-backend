const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { logger } = require('./server/utils/logger');
const { connectDatabase } = require('./server/config/database');
const { initializeRedis } = require('./server/config/redis');
const errorHandler = require('./server/middleware/errorHandler');
const notFound = require('./server/middleware/notFound');
const auth = require('./server/middleware/auth');

// Import routes
const productRoutes = require('./server/routes/products');
const categoryRoutes = require('./server/routes/categories');
const orderRoutes = require('./server/routes/orders');
const userRoutes = require('./server/routes/users');
const adminRoutes = require('./server/routes/admin');
const newsletterRoutes = require('./server/routes/newsletter');
const uploadRoutes = require('./server/routes/upload');
const shopifyRoutes = require('./server/routes/shopify');
const scrapingRoutes = require('./server/routes/scraping');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com", "https://sdks.shopifycdn.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.stripe.com", "https://cdnjs.cloudflare.com"]
        }
    },
    hsts: process.env.NODE_ENV === 'production'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limiting for sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts, please try again later.'
    }
});

// Basic middleware
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://eccoliving.com.au', 'https://www.eccoliving.com.au', /\.netlify\.app$/]
        : [
            'http://localhost:1000', 
            'http://localhost:8080', 
            'http://127.0.0.1:5500',
            /\.netlify\.app$/,  // Allow all Netlify domains
            /localhost:\d+$/    // Allow all localhost ports
        ],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve main application routes BEFORE static middleware
app.get('/', (req, res) => {
    // Add cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '../coming-soon.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Static files (excluding HTML files to prevent conflicts with our routes)
app.use(express.static(path.join(__dirname, '../'), {
    index: false, // Disable directory index serving
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Specifically serve assets directory
app.use('/assets', express.static(path.join(__dirname, '../assets'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api', scrapingRoutes);

// Admin routes with stricter rate limiting
app.use('/api/admin', adminRoutes);

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API documentation (only in development)
if (process.env.NODE_ENV !== 'production') {
    const swaggerJsdoc = require('swagger-jsdoc');
    const swaggerUi = require('swagger-ui-express');
    
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Ecco Living API',
                version: '1.0.0',
                description: 'E-commerce API for luxury home solutions',
            },
            servers: [
                {
                    url: `http://localhost:${PORT}/api`,
                    description: 'Development server',
                },
            ],
        },
        apis: ['./server/routes/*.js'],
    };
    
    const specs = swaggerJsdoc(options);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
}


// Catch-all handler for SPA routes
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});

// Initialize services and start server
async function startServer() {
    try {
        // Initialize database
        await connectDatabase();
        logger.info('Database connected successfully');

        // Initialize Redis
        await initializeRedis();
        logger.info('Redis connected successfully');

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
                logger.info(`Admin Panel: http://localhost:${PORT}/admin`);
            }
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    logger.error(`Port ${PORT} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(`Port ${PORT} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

module.exports = app;
