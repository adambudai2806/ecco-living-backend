const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    hsts: process.env.NODE_ENV === 'production'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Basic middleware
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [/\.netlify\.app$/, /\.onrender\.com$/]
        : [/\.netlify\.app$/, /localhost:\d+$/],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve admin static files
app.use(express.static('netlify-admin'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// User routes (simplified for Render)
app.post('/api/users/login', (req, res) => {
    if (req.body.email === 'adam@eccoliving.com.au' && req.body.password === 'Gabbie1512') {
        res.json({
            success: true,
            token: 'mock_jwt_token_adam',
            user: {
                id: '1',
                email: 'adam@eccoliving.com.au',
                first_name: 'Adam',
                last_name: 'Budai',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});

// Mock Products API
const mockProducts = [
    {
        id: 1,
        name: '316 Curved Wall Spout',
        slug: '316-curved-wall-spout',
        sku: 'EL-28749449',
        price: '98.10',
        brand: 'Abey',
        status: 'published',
        image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png'
    },
    {
        id: 2,
        name: 'Piazza 3 Piece Basin Mixer – Round',
        slug: 'piazza-3-piece-basin-mixer-round',
        sku: 'EL-72428511',
        price: '425.59',
        brand: 'Abey',
        status: 'published',
        image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/04/500519.png'
    }
];

app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: mockProducts,
        total: mockProducts.length
    });
});

// Categories API
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: '100', name: 'Bathrooms', slug: 'bathrooms' },
            { id: '200', name: 'Glass Fencing', slug: 'glass-fencing' },
            { id: '300', name: 'Flooring', slug: 'flooring' }
        ]
    });
});

// Admin routes (simplified)
app.get('/api/admin/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalProducts: mockProducts.length,
            totalUsers: 1,
            totalOrders: 0
        }
    });
});

// Catch all API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check available at /health`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

module.exports = app;