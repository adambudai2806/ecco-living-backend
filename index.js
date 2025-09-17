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
        image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png',
        categories: ['102'], // Tapware
        variations: [
            { name: 'Finish', options: ['Chrome', 'Brushed Nickel', 'Matte Black'] },
            { name: 'Size', options: ['Standard', 'Extended'] }
        ],
        description: 'Premium 316 curved wall spout with modern design',
        weight: '0.5kg',
        dimensions: '150mm x 80mm x 120mm'
    },
    {
        id: 2,
        name: 'Piazza 3 Piece Basin Mixer – Round',
        slug: 'piazza-3-piece-basin-mixer-round',
        sku: 'EL-72428511',
        price: '425.59',
        brand: 'Abey',
        status: 'published',
        image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/04/500519.png',
        categories: ['101', '102'], // Basins and Tapware
        variations: [
            { name: 'Finish', options: ['Chrome', 'Brushed Gold', 'Matte Black'] },
            { name: 'Handle Type', options: ['Lever', 'Cross'] }
        ],
        description: 'Elegant 3-piece basin mixer with round design',
        weight: '1.2kg',
        dimensions: '200mm x 150mm x 180mm'
    }
];

app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: mockProducts,
        total: mockProducts.length
    });
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = mockProducts.find(p => p.id === productId);
    
    if (product) {
        res.json({
            success: true,
            data: product
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
});

// Categories API - All pages and categories from the site
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        data: [
            // Main Categories
            { id: '100', name: 'Bathrooms', slug: 'bathrooms', type: 'main' },
            { id: '200', name: 'Glass Fencing', slug: 'glass-fencing', type: 'main' },
            { id: '300', name: 'Flooring', slug: 'flooring', type: 'main' },
            { id: '400', name: 'Claddings', slug: 'claddings', type: 'main' },
            
            // Bathroom Sub-categories
            { id: '101', name: 'Basins', slug: 'basins', parent_id: '100', type: 'subcategory' },
            { id: '102', name: 'Tapware', slug: 'tapware', parent_id: '100', type: 'subcategory' },
            { id: '103', name: 'Showerware', slug: 'showerware', parent_id: '100', type: 'subcategory' },
            { id: '104', name: 'Toilets & Bidets', slug: 'toilets-bidets', parent_id: '100', type: 'subcategory' },
            { id: '105', name: 'Vanities', slug: 'vanities', parent_id: '100', type: 'subcategory' },
            { id: '106', name: 'Bathroom Accessories', slug: 'bathroom-accessories', parent_id: '100', type: 'subcategory' },
            { id: '107', name: 'Cabinet Handles', slug: 'cabinet-handles', parent_id: '100', type: 'subcategory' },
            { id: '108', name: 'Waste, Traps & Grates', slug: 'waste-traps-grates', parent_id: '100', type: 'subcategory' },
            { id: '109', name: 'Shower Screens', slug: 'shower-screens', parent_id: '100', type: 'subcategory' },
            { id: '110', name: 'Bathroom Packages', slug: 'bathroom-packages', parent_id: '100', type: 'subcategory' },
            
            // Glass Fencing Sub-categories
            { id: '201', name: 'Frameless Glass Pool Fencing', slug: 'frameless-glass-pool-fencing', parent_id: '200', type: 'subcategory' },
            { id: '202', name: 'Frameless Glass Balustrades', slug: 'frameless-glass-balustrades', parent_id: '200', type: 'subcategory' },
            { id: '203', name: 'Frameless Glass Shower Screens', slug: 'frameless-glass-shower-screens', parent_id: '200', type: 'subcategory' },
            { id: '204', name: 'Aluminium Pool Fencing', slug: 'aluminium-pool-fencing', parent_id: '200', type: 'subcategory' },
            { id: '205', name: 'Aluminium Balustrades', slug: 'aluminium-balustrades', parent_id: '200', type: 'subcategory' },
            
            // Flooring Sub-categories
            { id: '301', name: 'Tiles', slug: 'tiles', parent_id: '300', type: 'subcategory' },
            { id: '302', name: 'Composite Decking', slug: 'composite-decking', parent_id: '300', type: 'subcategory' },
            
            // Cladding Sub-categories
            { id: '401', name: 'Composite Cladding', slug: 'composite-cladding', parent_id: '400', type: 'subcategory' },
            { id: '402', name: 'Aluminium Battens Cladding', slug: 'aluminium-battens-cladding', parent_id: '400', type: 'subcategory' },
            { id: '403', name: 'Composite Screening', slug: 'composite-screening', parent_id: '400', type: 'subcategory' },
            { id: '404', name: 'Aluminium Solutions', slug: 'aluminium-solutions', parent_id: '400', type: 'subcategory' }
        ]
    });
});

// Update product by ID
app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
    
    // Update the product with new data
    const updatedProduct = {
        ...mockProducts[productIndex],
        ...req.body,
        id: productId // Ensure ID doesn't change
    };
    
    mockProducts[productIndex] = updatedProduct;
    
    res.json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
    });
});

// Create new product
app.post('/api/products', (req, res) => {
    const newId = Math.max(...mockProducts.map(p => p.id)) + 1;
    const newProduct = {
        id: newId,
        ...req.body
    };
    
    mockProducts.push(newProduct);
    
    res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Product created successfully'
    });
});

// Product scraping endpoints
app.post('/api/scrape-product', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        });
    }
    
    // Mock scraper response - in reality this would scrape the URL
    const mockScrapedData = {
        name: 'Scraped Product Name',
        description: 'This is a mock description from the scraped product page.',
        price: '299.99',
        images: [
            'https://via.placeholder.com/400x400?text=Scraped+Image+1',
            'https://via.placeholder.com/400x400?text=Scraped+Image+2'
        ],
        specifications: {
            'Material': 'Stainless Steel',
            'Finish': 'Chrome',
            'Warranty': '10 Years'
        },
        brand: 'Extracted Brand',
        sku: 'SCRAPED-' + Date.now(),
        categories: ['102'], // Auto-detected as Tapware
        variations: [
            { name: 'Finish', options: ['Chrome', 'Brushed'] }
        ]
    };
    
    res.json({
        success: true,
        data: mockScrapedData,
        message: 'Product data extracted successfully'
    });
});

app.post('/api/scrape-product-dynamic', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        });
    }
    
    // Mock dynamic pricing data
    const mockDynamicData = {
        currentPrice: '289.99',
        originalPrice: '349.99',
        discount: '17%',
        availability: 'In Stock',
        lastUpdated: new Date().toISOString()
    };
    
    res.json({
        success: true,
        data: mockDynamicData,
        message: 'Dynamic pricing data extracted successfully'
    });
});

app.post('/api/scrape-pdf', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'PDF URL is required'
        });
    }
    
    // Mock PDF extraction data
    const mockPdfData = {
        text: 'Extracted text content from PDF specification sheet...',
        specifications: {
            'Dimensions': '200mm x 150mm x 100mm',
            'Weight': '2.5kg',
            'Installation': 'Wall mounted',
            'Compliance': 'WELS 5 Star'
        },
        tables: [
            {
                headers: ['Size', 'Price', 'SKU'],
                rows: [
                    ['Small', '$199', 'SKU-001'],
                    ['Medium', '$299', 'SKU-002'],
                    ['Large', '$399', 'SKU-003']
                ]
            }
        ]
    };
    
    res.json({
        success: true,
        data: mockPdfData,
        message: 'PDF data extracted successfully'
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