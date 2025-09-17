const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Balance braces { { { {

// Initialize OpenRouter AI (you'll need to add OPENROUTER_API_KEY to your .env file)
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || 'demo-key' // Add your OpenRouter API key to .env
});

// Basic middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname)));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Simple login endpoint
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password });
    
    // Mock admin login for development
    if (email === 'adam@eccoliving.com.au' && password === 'Gabbie1512!') {
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

// Mock categories data based on exact main site structure
let categories = [
    // Glass Fencing (Main Category)
    { id: '1', name: 'Glass Fencing', slug: 'glass-fencing', parent_id: null },
    
    // Frameless Glass Pool Fencing (Sub Category)
    { id: '2', name: 'Frameless Glass Pool Fencing', slug: 'frameless-glass-pool-fencing', parent_id: '1' },
    { id: '3', name: 'Build Your Pool Fence', slug: 'build-your-pool-fence', parent_id: '2' },
    { id: '4', name: '2205 Duplex Spigots', slug: '2205-duplex-spigots', parent_id: '2' },
    { id: '5', name: 'Non Conductive Spigots', slug: 'non-conductive-spigots', parent_id: '2' },
    { id: '6', name: 'Soft Close Hinges', slug: 'soft-close-hinges', parent_id: '2' },
    { id: '7', name: 'Latch', slug: 'latch', parent_id: '2' },
    { id: '8', name: 'Support Clamps', slug: 'support-clamps', parent_id: '2' },
    { id: '9', name: 'Pool Fence Glass Panels', slug: 'pool-fence-glass-panels', parent_id: '2' },
    { id: '10', name: 'Pool Fence Hinge Panels', slug: 'pool-fence-hinge-panels', parent_id: '2' },
    { id: '11', name: 'Pool Fence Gates', slug: 'pool-fence-gates', parent_id: '2' },
    { id: '12', name: 'Pool Fence Transition Panels', slug: 'pool-fence-transition-panels', parent_id: '2' },
    { id: '13', name: 'Grout Pool Fence', slug: 'grout-pool-fence', parent_id: '2' },
    { id: '144', name: 'Custom Glass Pool Fence', slug: 'custom-glass-pool-fence', parent_id: '2' },
    
    // Frameless Glass Balustrades (Sub Category)
    { id: '14', name: 'Frameless Glass Balustrades', slug: 'frameless-glass-balustrades', parent_id: '1' },
    { id: '15', name: 'Build Your Balustrade', slug: 'build-your-balustrade', parent_id: '14' },
    { id: '16', name: '2205 Duplex Spigots Balustrade', slug: '2205-duplex-spigots-balustrade', parent_id: '14' },
    { id: '17', name: 'Support and Glass Clamps', slug: 'support-glass-clamps', parent_id: '14' },
    { id: '18', name: 'Mini Top Rail', slug: 'mini-top-rail', parent_id: '14' },
    { id: '19', name: 'Mini Top Rail Connectors', slug: 'mini-top-rail-connectors', parent_id: '14' },
    { id: '20', name: 'Deluxe Top Rail', slug: 'deluxe-top-rail', parent_id: '14' },
    { id: '21', name: 'Standoffs', slug: 'standoffs', parent_id: '14' },
    { id: '145', name: 'Tilt Lock Channel', slug: 'tilt-lock-channel', parent_id: '14' },
    { id: '146', name: 'Deluxe Top Rail Connectors', slug: 'deluxe-top-rail-connectors', parent_id: '14' },
    { id: '147', name: 'Balustrade Glass Panels', slug: 'balustrade-glass-panels', parent_id: '14' },
    { id: '148', name: 'Grout Balustrade', slug: 'grout-balustrade', parent_id: '14' },
    { id: '149', name: 'Chemical Anchoring', slug: 'chemical-anchoring', parent_id: '14' },
    { id: '150', name: 'Custom Glass Balustrade', slug: 'custom-glass-balustrade', parent_id: '14' },
    
    // Frameless Glass Shower Screens (Sub Category)
    { id: '151', name: 'Frameless Glass Shower Screens', slug: 'frameless-glass-shower-screens', parent_id: '1' },
    { id: '152', name: 'Build Your Shower Screen', slug: 'build-your-shower-screen', parent_id: '151' },
    { id: '153', name: 'Shower Screen Hinges', slug: 'shower-screen-hinges', parent_id: '151' },
    { id: '154', name: 'Shower Screen Clamps', slug: 'shower-screen-clamps', parent_id: '151' },
    { id: '155', name: 'Door Knobs', slug: 'door-knobs', parent_id: '151' },
    { id: '156', name: 'Luxe Hardware Range', slug: 'luxe-hardware-range', parent_id: '151' },
    { id: '157', name: 'Water Bar', slug: 'water-bar', parent_id: '151' },
    { id: '158', name: 'PVC Water Seal', slug: 'pvc-water-seal', parent_id: '151' },
    { id: '159', name: 'Shower Fixed Glass', slug: 'shower-fixed-glass', parent_id: '151' },
    { id: '160', name: 'Shower Hinge Glass', slug: 'shower-hinge-glass', parent_id: '151' },
    { id: '161', name: 'Shower Glass Doors', slug: 'shower-glass-doors', parent_id: '151' },
    { id: '162', name: 'Shower Fixed with radius corner', slug: 'shower-fixed-radius-corner', parent_id: '151' },
    { id: '163', name: 'Shower Fixed Low iron fluted with radius corners', slug: 'shower-fixed-low-iron-fluted-radius', parent_id: '151' },
    { id: '164', name: 'Silicon', slug: 'silicon', parent_id: '151' },
    
    // Composite Screening (Sub Category)
    { id: '22', name: 'Composite Screening', slug: 'composite-screening', parent_id: '1' },
    { id: '23', name: 'Cladding System', slug: 'cladding-system', parent_id: '22' },
    { id: '24', name: 'Cladding Board', slug: 'cladding-board', parent_id: '22' },
    { id: '25', name: 'Cladding Accessories', slug: 'cladding-accessories', parent_id: '22' },
    { id: '26', name: 'Screening Board', slug: 'screening-board', parent_id: '22' },
    { id: '27', name: 'Screening Batten', slug: 'screening-batten', parent_id: '22' },
    { id: '28', name: 'Screening Accessories', slug: 'screening-accessories', parent_id: '22' },
    { id: '29', name: 'Gate Hardware', slug: 'gate-hardware', parent_id: '22' },
    
    // Bathrooms (Main Category)
    { id: '30', name: 'Bathrooms', slug: 'bathrooms', parent_id: null },
    
    // Tapware (Sub Category)
    { id: '31', name: 'Tapware', slug: 'tapware', parent_id: '30' },
    { id: '32', name: 'Bathroom Basin Mixers', slug: 'bathroom-basin-mixers', parent_id: '31' },
    { id: '33', name: 'Shower Mixers', slug: 'shower-mixers', parent_id: '31' },
    { id: '34', name: 'Bath Mixers', slug: 'bath-mixers', parent_id: '31' },
    { id: '35', name: 'Laundry Taps', slug: 'laundry-taps', parent_id: '31' },
    { id: '36', name: 'Wall Mixers', slug: 'wall-mixers', parent_id: '31' },
    { id: '37', name: 'Kitchen Mixers', slug: 'kitchen-mixers', parent_id: '31' },
    
    // Sinks & Basins (Sub Category)
    { id: '38', name: 'Sinks & Basins', slug: 'sinks-basins', parent_id: '30' },
    { id: '39', name: 'Bathroom Basins', slug: 'bathroom-basins', parent_id: '38' },
    { id: '40', name: 'Kitchen Sinks', slug: 'kitchen-sinks', parent_id: '38' },
    { id: '41', name: 'Laundry Sinks', slug: 'laundry-sinks', parent_id: '38' },
    
    // Bathroom Accessories (Sub Category)
    { id: '42', name: 'Bathroom Accessories', slug: 'bathroom-accessories', parent_id: '30' },
    { id: '81', name: 'Towel Rails', slug: 'towel-rails', parent_id: '42' },
    { id: '82', name: 'Heated Towel Rails', slug: 'heated-towel-rails', parent_id: '42' },
    { id: '83', name: 'Robe Hooks', slug: 'robe-hooks', parent_id: '42' },
    { id: '84', name: 'Toilet Accessories', slug: 'toilet-accessories', parent_id: '42' },
    { id: '85', name: 'Soap Dish Holders and Shelves', slug: 'soap-dish-holders-shelves', parent_id: '42' },
    
    // Showerware (Sub Category)
    { id: '86', name: 'Showerware', slug: 'showerware', parent_id: '30' },
    { id: '87', name: 'Shower on Rails', slug: 'shower-on-rails', parent_id: '86' },
    { id: '88', name: 'Hand Held Showers', slug: 'hand-held-showers', parent_id: '86' },
    { id: '89', name: 'Shower Systems', slug: 'shower-systems', parent_id: '86' },
    { id: '90', name: 'Outdoor Showers', slug: 'outdoor-showers', parent_id: '86' },
    { id: '91', name: 'Rain Shower & Arms', slug: 'rain-shower-arms', parent_id: '86' },
    { id: '92', name: 'Shower Mixer Showerware', slug: 'shower-mixer-showerware', parent_id: '86' },
    { id: '93', name: 'Wall Top Assemblies', slug: 'wall-top-assemblies', parent_id: '86' },
    
    // Waste, Traps & Grates (Sub Category)
    { id: '94', name: 'Waste, Traps & Grates', slug: 'waste-traps-grates', parent_id: '30' },
    { id: '95', name: 'Basin Wastes', slug: 'basin-wastes', parent_id: '94' },
    { id: '96', name: 'Bath Wastes', slug: 'bath-wastes', parent_id: '94' },
    { id: '97', name: 'Floor Strip Drains', slug: 'floor-strip-drains', parent_id: '94' },
    { id: '98', name: 'Custom Strip Drains', slug: 'custom-strip-drains', parent_id: '94' },
    { id: '99', name: 'Bottle Traps', slug: 'bottle-traps', parent_id: '94' },
    
    // Vanities (Sub Category)
    { id: '100', name: 'Vanities', slug: 'vanities', parent_id: '30' },
    { id: '101', name: 'Wall Hung Vanities', slug: 'wall-hung-vanities', parent_id: '100' },
    { id: '102', name: 'Floor Standing Vanities', slug: 'floor-standing-vanities', parent_id: '100' },
    { id: '103', name: 'Space Saving Vanities', slug: 'space-saving-vanities', parent_id: '100' },
    { id: '104', name: 'Mirrored Shaving Cabinets', slug: 'mirrored-shaving-cabinets', parent_id: '100' },
    { id: '105', name: 'Tall Boys', slug: 'tall-boys', parent_id: '100' },
    { id: '106', name: 'Vanity Tops', slug: 'vanity-tops', parent_id: '100' },
    
    // Basins (Update existing)
    { id: '107', name: 'Above Counter Basins', slug: 'above-counter-basins', parent_id: '38' },
    { id: '108', name: 'Under Counter Basins', slug: 'under-counter-basins', parent_id: '38' },
    { id: '109', name: 'Wall Hung Basins', slug: 'wall-hung-basins', parent_id: '38' },
    { id: '110', name: 'Semi Recessed Basins', slug: 'semi-recessed-basins', parent_id: '38' },
    { id: '111', name: 'Freestanding Basins', slug: 'freestanding-basins', parent_id: '38' },
    
    // Cabinet Handles (Sub Category)
    { id: '112', name: 'Cabinet Handles', slug: 'cabinet-handles', parent_id: '30' },
    { id: '113', name: 'Knobs', slug: 'knobs', parent_id: '112' },
    { id: '114', name: 'Pull Handles', slug: 'pull-handles', parent_id: '112' },
    
    // Toilets & Bidets (Sub Category)
    { id: '115', name: 'Toilets & Bidets', slug: 'toilets-bidets', parent_id: '30' },
    { id: '116', name: 'Smart Toilets', slug: 'smart-toilets', parent_id: '115' },
    { id: '117', name: 'Toilet Suites', slug: 'toilet-suites', parent_id: '115' },
    { id: '118', name: 'Wall Faced Pans', slug: 'wall-faced-pans', parent_id: '115' },
    { id: '119', name: 'Wall Hung Pans', slug: 'wall-hung-pans', parent_id: '115' },
    { id: '120', name: 'Bidet', slug: 'bidet', parent_id: '115' },
    { id: '121', name: 'Inwall Cisterns', slug: 'inwall-cisterns', parent_id: '115' },
    { id: '122', name: 'Push Buttons', slug: 'push-buttons', parent_id: '115' },
    
    // Bathtubs (Sub Category)
    { id: '123', name: 'Bathtubs', slug: 'bathtubs', parent_id: '30' },
    { id: '124', name: 'Drop in PVC Bath', slug: 'drop-in-pvc-bath', parent_id: '123' },
    { id: '125', name: 'Drop in Steel Baths', slug: 'drop-in-steel-baths', parent_id: '123' },
    { id: '126', name: 'Freestanding PVC Baths', slug: 'freestanding-pvc-baths', parent_id: '123' },
    { id: '127', name: 'Freestanding Stone Baths', slug: 'freestanding-stone-baths', parent_id: '123' },
    
    // Mirrored Shaving Cabinets (Sub Category)
    { id: '128', name: 'Mirrored Shaving Cabinets Detail', slug: 'mirrored-shaving-cabinets-detail', parent_id: '30' },
    { id: '129', name: 'Rectangular Shaving Cabinet', slug: 'rectangular-shaving-cabinet', parent_id: '128' },
    { id: '130', name: 'Round Shaving Cabinet', slug: 'round-shaving-cabinet', parent_id: '128' },
    { id: '131', name: 'Single Arch Shaving Cabinet', slug: 'single-arch-shaving-cabinet', parent_id: '128' },
    { id: '132', name: 'Double Arch Shaving Cabinet', slug: 'double-arch-shaving-cabinet', parent_id: '128' },
    
    // Care and Disability (Sub Category)
    { id: '133', name: 'Care and Disability', slug: 'care-disability', parent_id: '30' },
    { id: '134', name: 'Wall Hung Basins Care', slug: 'wall-hung-basins-care', parent_id: '133' },
    { id: '135', name: 'Care Tapware', slug: 'care-tapware', parent_id: '133' },
    { id: '136', name: 'Robust Tapware', slug: 'robust-tapware', parent_id: '133' },
    { id: '137', name: 'Care Toilets', slug: 'care-toilets', parent_id: '133' },
    { id: '138', name: 'Ambulant Toilet', slug: 'ambulant-toilet', parent_id: '133' },
    { id: '139', name: 'Pneumatics In-Wall Cisterns', slug: 'pneumatics-inwall-cisterns', parent_id: '133' },
    { id: '140', name: 'Care Compliant Rails', slug: 'care-compliant-rails', parent_id: '133' },
    { id: '141', name: 'Ambulant Grab Rails', slug: 'ambulant-grab-rails', parent_id: '133' },
    
    // Bathroom Packages (Sub Category)
    { id: '142', name: 'Bathroom Packages', slug: 'bathroom-packages', parent_id: '30' },
    { id: '143', name: 'Build your Bathroom', slug: 'build-your-bathroom', parent_id: '142' },
    
    // Flooring (Main Category)
    { id: '43', name: 'Flooring', slug: 'flooring', parent_id: null },
    
    // Composite Decking (Sub Category)
    { id: '44', name: 'Composite Decking', slug: 'composite-decking', parent_id: '43' },
    { id: '179', name: 'Milboard Decking', slug: 'milboard-decking', parent_id: '44' },
    { id: '180', name: 'Milboard Flexible Square Edging', slug: 'milboard-flexible-square-edging', parent_id: '44' },
    { id: '181', name: 'Milboard Bullnose Edging', slug: 'milboard-bullnose-edging', parent_id: '44' },
    { id: '182', name: 'Milboard Fascia Board', slug: 'milboard-fascia-board', parent_id: '44' },
    { id: '183', name: 'Milboard Weathered Decking', slug: 'milboard-weathered-decking', parent_id: '44' },
    { id: '184', name: 'Woodevo HomeAdvanced Decking', slug: 'woodevo-homeadvanced-decking', parent_id: '44' },
    
    // Tiles (Sub Category)
    { id: '50', name: 'Tiles', slug: 'tiles', parent_id: '43' },
    { id: '173', name: 'Bathroom Tiles', slug: 'bathroom-tiles', parent_id: '50' },
    { id: '174', name: 'Kitchen / Laundry Tiles', slug: 'kitchen-laundry-tiles', parent_id: '50' },
    { id: '175', name: 'Splashback / Feature Tiles', slug: 'splashback-feature-tiles', parent_id: '50' },
    { id: '176', name: 'Living Tiles', slug: 'living-tiles', parent_id: '50' },
    { id: '177', name: 'Outdoor Tiles', slug: 'outdoor-tiles', parent_id: '50' },
    { id: '178', name: 'Pool Tiles', slug: 'pool-tiles', parent_id: '50' },
    
    // Aluminium Solutions (Main Category)
    { id: '57', name: 'Aluminium Solutions', slug: 'aluminium-solutions', parent_id: null },
    
    // Aluminium Pool Fencing (Sub Category)
    { id: '58', name: 'Aluminium Pool Fencing', slug: 'aluminium-pool-fencing', parent_id: '57' },
    { id: '165', name: 'Vista Aluminium Pool Fence', slug: 'vista-aluminium-pool-fence', parent_id: '58' },
    { id: '166', name: 'Ray Pool Fencing', slug: 'ray-pool-fencing', parent_id: '58' },
    { id: '167', name: 'Batten Pool Fencing', slug: 'batten-pool-fencing', parent_id: '58' },
    { id: '168', name: 'Arc Aluminium Pool Fence', slug: 'arc-aluminium-pool-fence', parent_id: '58' },
    
    
    // Aluminium Balustrades (Sub Category)
    { id: '68', name: 'Aluminium Balustrades', slug: 'aluminium-balustrades', parent_id: '57' },
    { id: '169', name: 'Blade Aluminium Balustrade', slug: 'blade-aluminium-balustrade', parent_id: '68' },
    { id: '170', name: 'Ray Aluminium Balustrade', slug: 'ray-aluminium-balustrade', parent_id: '68' },
    { id: '171', name: 'View Aluminium Balustrade', slug: 'view-aluminium-balustrade', parent_id: '68' },
    { id: '172', name: 'Skye Aluminium Balustrade', slug: 'skye-aluminium-balustrade', parent_id: '68' },
    
    // Claddings (Main Category)
    { id: '72', name: 'Claddings', slug: 'claddings', parent_id: null },
    
    // Composite Cladding (Sub Category)
    { id: '73', name: 'Composite Cladding', slug: 'composite-cladding', parent_id: '72' },
    { id: '185', name: 'Milboard Envello Shadowline', slug: 'milboard-envello-shadowline', parent_id: '73' },
    { id: '186', name: 'Milboard Envello Board & Batten', slug: 'milboard-envello-board-batten', parent_id: '73' },
    { id: '187', name: 'Woodevo Castellated Cladding', slug: 'woodevo-castellated-cladding', parent_id: '73' },
    
    // Shower Screens (Main Category)
    { id: '76', name: 'Shower Screens', slug: 'shower-screens', parent_id: null },
    { id: '77', name: 'Frameless Shower Screens', slug: 'frameless-shower-screens', parent_id: '76' },
    { id: '78', name: 'Semi-Frameless Shower Screens', slug: 'semi-frameless-shower-screens', parent_id: '76' },
    { id: '79', name: 'Shower Screen Hardware', slug: 'shower-screen-hardware', parent_id: '76' },
    { id: '80', name: 'Shower Screen Glass', slug: 'shower-screen-glass', parent_id: '76' }
];

// Mock products data
let products = [
    {
        id: '1',
        name: 'Premium Bathroom Suite',
        sku: 'PBS-001',
        price: 2500.00,
        short_description: 'Luxury bathroom suite with modern fixtures',
        long_description: 'Complete bathroom suite featuring premium materials and contemporary design.',
        status: 'published',
        stock_quantity: 10,
        manage_stock: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Product endpoints
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: products,
        pagination: {
            page: 1,
            perPage: 20,
            total: products.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
        }
    });
});

app.post('/api/products', (req, res) => {
    const productData = req.body;
    
    // Generate new product
    const newProduct = {
        id: Date.now().toString(),
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    console.log('Created product:', newProduct);
    
    res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Product created successfully'
    });
});

app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const productData = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
    
    products[productIndex] = {
        ...products[productIndex],
        ...productData,
        updated_at: new Date().toISOString()
    };
    
    console.log('Updated product:', products[productIndex]);
    
    res.json({
        success: true,
        data: products[productIndex],
        message: 'Product updated successfully'
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
    
    products.splice(productIndex, 1);
    
    console.log('Deleted product with id:', id);
    
    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

// Admin stats endpoint
app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalOrders: 0,
            totalRevenue: 0.00,
            totalProducts: products.length,
            totalCustomers: 0,
            publishedProducts: products.filter(p => p.status === 'published').length,
            monthlySales: [0, 0, 0, 0, 0, 0]
        }
    });
});

// Recent orders endpoint
app.get('/api/admin/orders/recent', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        data: categories
    });
});

// Smart product scraping endpoint
app.post('/api/scrape-product', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        });
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (urlError) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        });
    }
    
    console.log('Scraping product from URL:', url);
    
    try {
        // Fetch the webpage with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            },
            signal: controller.signal,
            timeout: 15000
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Extract product information using basic regex patterns
        const productData = await extractProductData(html, url);
        
        console.log('Extracted product data:', productData);
        
        res.json({
            success: true,
            data: productData
        });
        
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape product data',
            details: error.message
        });
    }
});

// Extract product data from HTML
async function extractProductData(html, sourceUrl) {
    const $ = cheerio.load(html);
    
    // Focused product data - only essential fields that map to form
    const data = {
        // Basic Information (Required)
        name: '',
        sku: '',
        short_description: '',
        long_description: '',
        
        // Pricing (Essential)
        price: 0,
        cost_price: 0, // Will be the scraped price
        
        // Product Details (Important)
        brand: '',
        manufacturer: '',
        model: '',
        warranty_period: '',
        
        // Inventory (Essential)
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        
        // Images (Product only)
        main_image: null,
        gallery_images: [], // Max 5 product images only
        
        // Variations (Product-specific)
        colors: [], // Only actual product color options
        
        // Technical Specifications (Relevant only)
        specifications: {}, // Only key technical specs
        
        // Documents (Product-related only)
        documents: [], // Only datasheets, installation guides
        
        // Meta
        category: '',
        sourceUrl
    };
    
    // Extract product name (enhanced for WooCommerce and other platforms)
    const titleSelectors = [
        'h1.product_title',  // WooCommerce specific
        'h1.entry-title',    // Common WordPress theme
        '.product-title h1',
        '.product-name h1',
        'h1',
        '.product-title',
        '.product-name',
        'title',
        '[data-product-title]',
        'meta[property="og:title"]'
    ];
    
    let productTitle = '';
    for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length) {
            productTitle = selector === 'title' ? element.text() : 
                          selector.startsWith('meta') ? element.attr('content') : 
                          element.text();
            if (productTitle && productTitle.trim()) {
                // Clean up title (remove site name, etc.)
                productTitle = productTitle.split(' | ')[0].split(' - ')[0].trim();
                break;
            }
        }
    }
    
    if (productTitle) {
        data.name = cleanText(productTitle);
    }
    
    // Extract descriptions (focused)
    const shortDesc = $('.product-summary, .product-excerpt, .short-description').first().text() ||
                     $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content');
    if (shortDesc) {
        data.short_description = cleanText(shortDesc).substring(0, 300); // Limit length
    }
    
    const longDesc = $('.product-description, .full-description, .product-details').first().text();
    if (longDesc && longDesc.length > (data.short_description || '').length) {
        data.long_description = cleanText(longDesc).substring(0, 1000); // Limit length
    }
    
    // Enhanced price extraction for WooCommerce and other platforms
    let extractedPrice = 0;
    
    const priceSelectors = [
        '.price .amount',                    // WooCommerce default
        '.woocommerce-Price-amount',         // WooCommerce current
        '.price',
        '.product-price',
        '.current-price',
        '.regular-price', 
        '.sale-price',
        '[data-price]',
        '.price-current',
        '.product_price',
        'meta[property="product:price:amount"]'
    ];
    
    for (const selector of priceSelectors) {
        const priceElement = $(selector).first();
        if (priceElement.length) {
            const priceText = selector.startsWith('meta') ? 
                            priceElement.attr('content') : 
                            priceElement.text();
            
            if (priceText) {
                // More robust price extraction
                const cleanPrice = priceText.replace(/[^\d,.\s]/g, '').trim();
                const priceMatch = cleanPrice.match(/[\d,]+\.?\d*/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[0].replace(/,/g, ''));
                    if (!isNaN(price) && price > 0 && price < 100000) {
                        extractedPrice = price;
                        break;
                    }
                }
            }
        }
    }
    
    if (extractedPrice > 0) {
        data.cost_price = extractedPrice; // Scraped price becomes cost price
        data.price = (extractedPrice * 0.9).toFixed(2); // 10% discount for regular price
    }
    
    // FOCUSED Product Image Extraction - Only main product photos
    const productImages = extractProductImages($, sourceUrl);
    
    if (productImages.length > 0) {
        data.main_image = productImages[0]; // Best image as main
        data.gallery_images = productImages.slice(1, 4); // Up to 3 additional images
    }
    
    console.log('Product images found:', productImages.length);
    
    // Enhanced SKU/Product Code extraction for WooCommerce and other platforms
    let extractedSku = '';
    
    // First try structured selectors (most reliable)
    const skuSelectors = [
        '.sku',                          // WooCommerce default
        '.product-sku',
        '.product_meta .sku',           // WooCommerce product meta
        '[data-sku]',
        '.product-code',
        '.item-code',
        '.part-number',
        '.model-number'
    ];
    
    for (const selector of skuSelectors) {
        const skuElement = $(selector).first();
        if (skuElement.length) {
            extractedSku = cleanText(skuElement.text() || skuElement.attr('data-sku') || '');
            if (extractedSku && extractedSku.length > 1) break;
        }
    }
    
    // If no structured SKU found, try regex patterns
    if (!extractedSku) {
        const skuPatterns = [
            /sku["\']?\s*:\s*["\']?([^"',\s\}]+)/gi,
            /product[_-]?code["\']?\s*:\s*["\']?([^"',\s\}]+)/gi,
            /model[_-]?number["\']?\s*:\s*["\']?([^"',\s\}]+)/gi,
            /<span[^>]*class=[^>]*sku[^>]*>([^<]+)</gi,
            /item[_-]?code["\']?\s*:\s*["\']?([^"',\s\}]+)/gi,
            /part[_-]?number["\']?\s*:\s*["\']?([^"',\s\}]+)/gi,
            /code:\s*([A-Z0-9.-]+)/gi  // For Astrawalker format "Code: A68.07.V9.KN"
        ];
    
    for (const pattern of skuPatterns) {
        const skuMatch = html.match(pattern);
        if (skuMatch && skuMatch[1]) {
            let extractedSku = cleanText(skuMatch[1]);
            
            // Clean up the SKU
            extractedSku = extractedSku
                .replace(/['"{}]/g, '') // Remove quotes and braces
                .replace(/sku[:\s]*['"]*/, '') // Remove 'sku:' prefix
                .replace(/^[:\s-]+|[:\s-]+$/g, '') // Remove leading/trailing colons, spaces, dashes
                .trim();
            
            // Only use if it looks like a valid SKU (alphanumeric, dashes, underscores)
            if (extractedSku && /^[A-Za-z0-9\-_]{2,20}$/.test(extractedSku)) {
                // Add EL- prefix if not already present
                if (!extractedSku.toUpperCase().startsWith('EL-')) {
                    data.sku = 'EL-' + extractedSku.toUpperCase();
                } else {
                    data.sku = extractedSku.toUpperCase();
                }
                break;
            }
        }
    }
    
    // Check if we found SKU in long_description (like "Code: A68.07.V9.KN")
    if (!extractedSku && data.long_description) {
        const codeMatch = data.long_description.match(/code:\s*([A-Z0-9.-]+)/i);
        if (codeMatch && codeMatch[1]) {
            extractedSku = codeMatch[1];
        }
    }
    
    // Clean up and format the SKU
    if (extractedSku) {
        extractedSku = extractedSku
            .replace(/['"{}]/g, '') // Remove quotes and braces
            .replace(/sku[:\s]*['"]*/, '') // Remove 'sku:' prefix
            .replace(/^[:\s-]+|[:\s-]+$/g, '') // Remove leading/trailing colons, spaces, dashes
            .trim();
        
        // Only use if it looks like a valid SKU (alphanumeric, dashes, underscores)
        if (extractedSku && /^[A-Za-z0-9\-_.]{2,20}$/.test(extractedSku)) {
            // For Astrawalker format, keep the original format but add EL- prefix if needed
            if (extractedSku.match(/^[A-Z]\d+\.\d+\./)) {
                data.sku = extractedSku; // Keep original format for manufacturer codes
            } else if (!extractedSku.toUpperCase().startsWith('EL-')) {
                data.sku = 'EL-' + extractedSku.toUpperCase();
            } else {
                data.sku = extractedSku.toUpperCase();
            }
        }
    }
    
    // If still no SKU found, generate one from product name
    if (!data.sku && data.name) {
        const generatedSku = data.name
            .replace(/[^A-Za-z0-9\s-]/g, '') // Remove special characters except spaces and dashes
            .split(/\s+/) // Split by spaces
            .slice(0, 3) // Take first 3 words
            .join('-') // Join with dashes
            .toUpperCase()
            .substring(0, 15); // Limit length
        
        if (generatedSku && generatedSku.length >= 3) {
            data.sku = 'EL-' + generatedSku;
        }
    }
    
    
    
    // Enhanced brand extraction for WooCommerce and other platforms
    let brandName = '';
    
    // First try structured selectors
    const brandSelectors = [
        '.brand',
        '.product-brand',
        '.manufacturer',
        '.product_meta .brand',
        '[data-brand]',
        '.woocommerce-product-attributes .brand td',
        'meta[property="product:brand"]'
    ];
    
    for (const selector of brandSelectors) {
        const brandElement = $(selector).first();
        if (brandElement.length) {
            brandName = selector.startsWith('meta') ? 
                       brandElement.attr('content') : 
                       cleanText(brandElement.text());
            if (brandName && brandName.length > 1 && brandName.length < 50) break;
        }
    }
    
    // If no structured brand found, try patterns
    if (!brandName) {
        const brandPatterns = [
            /brand["\']?\s*:\s*["\']?([^"',\n\r]+)/gi,
            /<span[^>]*class=[^>]*brand[^>]*>([^<]+)</gi,
            /manufacturer["\']?\s*:\s*["\']?([^"',\n\r]+)/gi,
            /<div[^>]*class=[^>]*brand[^>]*>.*?([A-Z][a-zA-Z\s&]+)</gi
        ];
    
        for (const pattern of brandPatterns) {
            const brandMatch = html.match(pattern);
            if (brandMatch && brandMatch[1]) {
                const brand = cleanText(brandMatch[1]);
                if (brand && brand.length < 50) {
                    brandName = brand;
                    break;
                }
            }
        }
    } // Close if (!brandName)
    
    // If no brand found in content, try to extract from domain (for brand-specific sites)  
    if (!brandName && sourceUrl) {
        const domainMatch = sourceUrl.match(/https?:\/\/(?:www\.)?([^.]+)/);
        if (domainMatch) {
            const domain = domainMatch[1];
            const brandMappings = {
                'astrawalker': 'Astra Walker',
                'abey': 'Abey',
                'milboard': 'Milboard',
                'woodevo': 'Woodevo',
                'caroma': 'Caroma',
                'dorf': 'Dorf',
                'phoenixtapware': 'Phoenix Tapware'
            };
            
            if (brandMappings[domain.toLowerCase()]) {
                brandName = brandMappings[domain.toLowerCase()];
            }
        }
    }
    
    if (brandName) {
        data.brand = brandName;
        data.manufacturer = brandName; // Often the same
    }
    
    // Extract model number
    const modelPatterns = [
        /model[_-]?number["\']?\s*:\s*["\']?([^"',\s]+)/gi,
        /model["\']?\s*:\s*["\']?([^"',\n\r]+)/gi,
        /<span[^>]*class=[^>]*model[^>]*>([^<]+)</gi
    ];
    
    for (const pattern of modelPatterns) {
        const modelMatch = html.match(pattern);
        if (modelMatch && modelMatch[1]) {
            const model = cleanText(modelMatch[1]);
            if (model && model.length < 50) {
                data.model = model;
                break;
            }
        }
    }
    
    // Extract warranty information
    const warrantyPatterns = [
        /warranty["\']?\s*:\s*["\']?([^"',\n\r]+)/gi,
        /(\d+\s*(?:year|yr|month|mth)s?\s*warranty)/gi,
        /<span[^>]*class=[^>]*warranty[^>]*>([^<]+)</gi
    ];
    
    for (const pattern of warrantyPatterns) {
        const warrantyMatch = html.match(pattern);
        if (warrantyMatch && warrantyMatch[1]) {
            const warranty = cleanText(warrantyMatch[1]);
            if (warranty && warranty.length < 50) {
                data.warranty_period = warranty;
                break;
            }
        }
    }
    
    // Extract weight
    const weightPatterns = [
        /weight["\']?\s*:\s*["\']?([\d.]+)\s*(?:kg|g|pounds?|lbs?)/gi,
        /([\d.]+)\s*(?:kg|g)\s*weight/gi
    ];
    
    for (const pattern of weightPatterns) {
        const weightMatch = html.match(pattern);
        if (weightMatch && weightMatch[1]) {
            let weight = parseFloat(weightMatch[1]);
            // Convert grams to kg if needed
            if (html.toLowerCase().includes('g') && !html.toLowerCase().includes('kg') && weight > 100) {
                weight = weight / 1000;
            }
            if (weight > 0 && weight < 1000) { // Reasonable weight range
                data.weight = weight;
                break;
            }
        }
    }
    
    // Extract dimensions
    const dimensionPatterns = [
        /dimensions?["\']?\s*:\s*["\']?([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)/gi,
        /(\d+\.?\d*)\s*(?:cm|mm)\s*(?:x|×)\s*(\d+\.?\d*)\s*(?:cm|mm)\s*(?:x|×)\s*(\d+\.?\d*)\s*(?:cm|mm)/gi,
        /length["\']?\s*:\s*["\']?([\d.]+)/gi
    ];
    
    for (const pattern of dimensionPatterns) {
        const dimMatch = html.match(pattern);
        if (dimMatch) {
            if (dimMatch[3]) { // 3D dimensions
                data.dimensions.length = parseFloat(dimMatch[1]) || 0;
                data.dimensions.width = parseFloat(dimMatch[2]) || 0;
                data.dimensions.height = parseFloat(dimMatch[3]) || 0;
                break;
            } else if (dimMatch[1]) { // Single dimension (length)
                data.dimensions.length = parseFloat(dimMatch[1]) || 0;
            }
        }
    }
    
    // Extract category from URL or breadcrumbs
    const categoryPatterns = [
        /category["\']?\s*:\s*["\']?([^"',\n\r]+)/gi,
        /<nav[^>]*breadcrumb[^>]*>.*?<a[^>]*>([^<]+)</gi,
        /\/category\/([^\/]+)/gi,
        /\/([^\/]+)\/[^\/]*$/g // Last part of URL path
    ];
    
    for (const pattern of categoryPatterns) {
        const catMatch = sourceUrl.match(pattern) || html.match(pattern);
        if (catMatch && catMatch[1]) {
            const category = cleanText(catMatch[1])
                .replace(/-/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2'); // camelCase to words
            if (category && category.length < 50 && !category.includes('product')) {
                data.category = category;
                break;
            }
        }
    }
    
    // Enhanced variation extraction for finishes, colors, and pricing
    const variations = extractVariationsWithPricing($, html, sourceUrl);
    if (variations.length > 0) {
        data.variations = variations;
        // Use the first variation as the default pricing
        if (variations[0] && variations[0].price > 0) {
            data.cost_price = variations[0].price;
            data.price = (variations[0].price * 0.9).toFixed(2);
        }
        // Extract color names from variations
        data.colors = variations.map(v => v.name || v.finish || v.color).filter(Boolean);
    } else {
        // Fallback to simple color extraction if no structured variations found
        const colorPattern = /(?:color|colour)[^<>]*(?::|>)[^<>]*([a-zA-Z\s]+)(?:<|,)/gi;
        let colorMatch;
        while ((colorMatch = colorPattern.exec(html)) !== null) {
            const color = cleanText(colorMatch[1]);
            if (color && color.length < 20 && !data.colors.includes(color)) {
                data.colors.push(color);
            }
        }
    }
    
    // Extract specifications (simple approach that was working)
    const specPatterns = [
        /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/gi,
        /<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)<\/td>/gi,
        /<span[^>]*class=[^>]*spec[^>]*>([^<]+)<\/span>[^<]*<span[^>]*>([^<]+)<\/span>/gi
    ];
    
    for (const pattern of specPatterns) {
        let specMatch;
        while ((specMatch = pattern.exec(html)) !== null) {
            const key = cleanText(specMatch[1]);
            const value = cleanText(specMatch[2]);
            if (key && value && key.length < 50 && value.length < 100) {
                data.specifications[key] = value;
            }
        }
    }
    
    // Final improvements and fixes
    // Extract proper SKU from long_description if found there
    if (!data.sku || data.sku.startsWith('EL-7249')) {
        const codeMatch = (data.long_description || '').match(/code:\s*([A-Z0-9.-]+)/i);
        if (codeMatch && codeMatch[1]) {
            data.sku = codeMatch[1];
        }
    }
    
    // Extract brand from domain if not found
    if (!data.brand && sourceUrl) {
        const domainMatch = sourceUrl.match(/https?:\/\/(?:www\.)?([^.]+)/);
        if (domainMatch) {
            const domain = domainMatch[1];
            const brandMappings = {
                'astrawalker': 'Astra Walker',
                'abey': 'Abey',
                'milboard': 'Milboard',
                'woodevo': 'Woodevo',
                'caroma': 'Caroma',
                'dorf': 'Dorf',
                'phoenixtapware': 'Phoenix Tapware'
            };
            
            if (brandMappings[domain.toLowerCase()]) {
                data.brand = brandMappings[domain.toLowerCase()];
                data.manufacturer = data.brand;
            }
        }
    }
    
    return data;
}

// Clean extracted text
function cleanText(text) {
    return text.replace(/<[^>]*>/g, '')
               .replace(/&[^;]+;/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
}

// Extract enhanced color variants with codes and images
function extractColorVariants($, data) {
    const colorVariants = [];
    
    // Look for color swatches with data attributes
    $('[data-color], .color-swatch, .variant-color, .product-color').each((i, element) => {
        const $el = $(element);
        const colorName = $el.attr('data-color-name') || $el.attr('title') || $el.text().trim();
        const colorCode = $el.attr('data-color-code') || $el.attr('data-color') || $el.attr('data-variant');
        const colorImage = $el.attr('data-image') || $el.find('img').attr('src');
        
        if (colorName || colorCode) {
            colorVariants.push({
                name: cleanText(colorName || ''),
                code: cleanText(colorCode || ''),
                image: colorImage ? makeAbsoluteUrl(colorImage, data.sourceUrl) : null,
                hex: extractHexColor($el)
            });
        }
    });
    
    // Look for color options in select dropdowns
    $('select[name*="color"], select[id*="color"], .color-selector option').each((i, element) => {
        const $el = $(element);
        const colorName = $el.text().trim();
        const colorCode = $el.attr('value');
        
        if (colorName && colorName !== 'Select Color' && colorCode) {
            colorVariants.push({
                name: cleanText(colorName),
                code: cleanText(colorCode),
                image: null,
                hex: null
            });
        }
    });
    
    // Look for JavaScript color data
    const scriptTags = $('script').toArray();
    for (const script of scriptTags) {
        const scriptContent = $(script).html() || '';
        
        // Look for color arrays or objects in JavaScript
        const colorArrayMatch = scriptContent.match(/colors?\s*[:=]\s*\[([^\]]+)\]/gi);
        if (colorArrayMatch) {
            try {
                const colorsText = colorArrayMatch[0];
                const colorMatches = colorsText.match(/"([^"]+)"/g);
                if (colorMatches) {
                    colorMatches.forEach(match => {
                        const colorName = match.replace(/"/g, '');
                        if (colorName.length > 2 && colorName.length < 30) {
                            colorVariants.push({
                                name: colorName,
                                code: colorName.toLowerCase().replace(/\s+/g, '-'),
                                image: null,
                                hex: null
                            });
                        }
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }
    
    // Remove duplicates and assign to data
    const uniqueVariants = colorVariants.filter((variant, index, self) => 
        index === self.findIndex(v => v.name === variant.name || v.code === variant.code)
    );
    
    data.colorVariants = uniqueVariants;
    
    // Also populate the simple colors array for backward compatibility
    data.colors = uniqueVariants.map(v => v.name).filter(name => name);
}

// Extract downloadable documents
function extractDocuments($, data, sourceUrl) {
    const documents = [];
    
    // Look for PDF links
    $('a[href$=".pdf"], a[href*=".pdf"], .download-link, .document-link').each((i, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const text = $el.text().trim();
        
        if (href && text) {
            documents.push({
                name: cleanText(text),
                url: makeAbsoluteUrl(href, sourceUrl),
                type: 'pdf'
            });
        }
    });
    
    // Look for other document types
    $('a[href$=".doc"], a[href$=".docx"], a[href$=".zip"], a[href*="download"]').each((i, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const text = $el.text().trim();
        
        if (href && text && !text.toLowerCase().includes('cart') && !text.toLowerCase().includes('buy')) {
            const fileType = href.split('.').pop().toLowerCase();
            documents.push({
                name: cleanText(text),
                url: makeAbsoluteUrl(href, sourceUrl),
                type: fileType
            });
        }
    });
    
    data.documents = documents;
}

// Extract hex color from element styles
function extractHexColor($el) {
    const style = $el.attr('style') || '';
    const bgColor = $el.css('background-color') || '';
    
    // Look for hex colors in style attributes
    const hexMatch = style.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/);
    if (hexMatch) {
        return hexMatch[0];
    }
    
    // Convert RGB to hex if available
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    return null;
}

// Make URL absolute
function makeAbsoluteUrl(url, baseUrl) {
    if (url.startsWith('//')) {
        return 'https:' + url;
    } else if (url.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return urlObj.origin + url;
    } else if (!url.startsWith('http')) {
        const urlObj = new URL(baseUrl);
        return urlObj.origin + '/' + url;
    }
    return url;
}

// Enhanced variation extraction with pricing for different finishes/colors
function extractVariationsWithPricing($, html, sourceUrl) {
    const variations = [];
    
    // Method 1: WooCommerce/eCommerce variation data in JSON-LD or data attributes
    try {
        // Look for structured data (JSON-LD)
        $('script[type="application/ld+json"]').each((i, script) => {
            const scriptContent = $(script).html();
            if (scriptContent) {
                try {
                    const data = JSON.parse(scriptContent);
                    if (data.offers && Array.isArray(data.offers)) {
                        data.offers.forEach(offer => {
                            if (offer.name && offer.price) {
                                variations.push({
                                    name: offer.name,
                                    sku: offer.sku || '',
                                    price: parseFloat(offer.price) || 0,
                                    currency: offer.priceCurrency || 'AUD',
                                    finish: offer.color || offer.finish || '',
                                    availability: offer.availability || ''
                                });
                            }
                        });
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        });
    } catch (e) {
        // Continue if JSON-LD parsing fails
    }
    
    // Method 2: WooCommerce variation forms and select dropdowns
    if (variations.length === 0) {
        // Look for variation dropdowns with prices
        $('.variations select option, .product-variants option').each((i, option) => {
            const $option = $(option);
            const text = $option.text() || '';
            const value = $option.attr('value') || '';
            
            if (text && text !== 'Choose an option' && value) {
                // Try to extract price from option text (e.g., "Chrome (.00)" or "Matt Black (+$50)")
                const priceMatch = text.match(/\(([+\-]?[\$£€]?[\d,.]+)\)/);
                let price = 0;
                let finishName = text.replace(/\([^)]*\)/, '').trim();
                
                if (priceMatch) {
                    const priceStr = priceMatch[1].replace(/[\$£€+,]/g, '');
                    price = parseFloat(priceStr) || 0;
                }
                
                // Generate SKU variation (for Astrawalker: A68.07.V9.KN + finish code)
                let variantSku = value;
                if (sourceUrl.includes('astrawalker') && finishName) {
                    // Extract base SKU from page content
                    const baseSkuMatch = html.match(/code:\s*([A-Z0-9.-]+)/i);
                    if (baseSkuMatch) {
                        variantSku = baseSkuMatch[1] + '.' + value.padStart(2, '0');
                    }
                }
                
                variations.push({
                    name: finishName,
                    finish: finishName,
                    sku: variantSku,
                    price: price,
                    code: value,
                    currency: 'AUD'
                });
            }
        });
    }
    
    // Method 3: Look for variation tables or lists
    if (variations.length === 0) {
        // Look for finish/color tables with prices
        $('.variations-table tr, .finish-options tr, .color-options li').each((i, row) => {
            const $row = $(row);
            const finishName = $row.find('.finish-name, .color-name, td:first').text().trim();
            const priceText = $row.find('.price, .cost, td:last').text().trim();
            
            if (finishName && priceText) {
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
                    variations.push({
                        name: finishName,
                        finish: finishName,
                        price: price,
                        sku: '', // Will be generated later
                        currency: 'AUD'
                    });
                }
            }
        });
    }
    
    // Method 4: Extract from JavaScript variables (for sites that load variations via JS)
    if (variations.length === 0) {
        const scriptTags = $('script').toArray();
        for (const script of scriptTags) {
            const scriptContent = $(script).html() || '';
            
            // Look for variation data in JS variables
            const variationMatches = scriptContent.match(/variations?\s*[:=]\s*\[([^\]]+)\]/gi);
            if (variationMatches) {
                variationMatches.forEach(match => {
                    try {
                        // Extract variation objects from JS
                        const jsonMatch = match.match(/\[([^\]]+)\]/);
                        if (jsonMatch) {
                            const variationData = jsonMatch[1];
                            // Simple parsing for common patterns like {name: "Chrome", price: 772}
                            const nameMatches = variationData.match(/name\s*:\s*["']([^"']+)["']/gi);
                            const priceMatches = variationData.match(/price\s*:\s*([\d.]+)/gi);
                            
                            if (nameMatches && priceMatches && nameMatches.length === priceMatches.length) {
                                nameMatches.forEach((nameMatch, index) => {
                                    const name = nameMatch.match(/["']([^"']+)["']/)[1];
                                    const priceMatch = priceMatches[index].match(/([\d.]+)/);
                                    if (name && priceMatch) {
                                        variations.push({
                                            name: name,
                                            finish: name,
                                            price: parseFloat(priceMatch[1]) || 0,
                                            sku: '',
                                            currency: 'AUD'
                                        });
                                    }
                                });
                            }
                        }
                    } catch (e) {
                        // Continue if parsing fails
                    }
                });
            }
        }
    }
    
    // Clean up and deduplicate variations
    const cleanVariations = [];
    const seenNames = new Set();
    
    variations.forEach(variation => {
        if (variation.name && !seenNames.has(variation.name.toLowerCase())) {
            seenNames.add(variation.name.toLowerCase());
            cleanVariations.push({
                name: variation.name,
                finish: variation.finish || variation.name,
                sku: variation.sku || `VAR-${variation.name.replace(/[^A-Z0-9]/gi, '-').toUpperCase()}`,
                price: variation.price || 0,
                currency: variation.currency || 'AUD',
                code: variation.code || ''
            });
        }
    });
    
    return cleanVariations;
}

// FOCUSED Product Image Extraction - Only actual product photos
function extractProductImages($, sourceUrl) {
    const productImages = [];
    
    // Enhanced selectors for WooCommerce and other platforms
    const productSelectors = [
        '.woocommerce-product-gallery img',  // WooCommerce default
        '.product-gallery img',
        '.product-images img',
        '.product-image img', 
        '.main-product-image img',
        '.product-photo img',
        '.product-slider img',
        '.wp-post-image',                    // WordPress featured image
        'img.attachment-woocommerce_single', // WooCommerce single product image
        '.product_images img',               // Alternative WooCommerce
        '.images img',                       // Simple images container
        '[data-product-image] img'
    ];
    
    // Try structured product image areas first
    for (const selector of productSelectors) {
        $(selector).each((i, img) => {
            const src = $(img).attr('src');
            if (src && isValidProductImage(src, sourceUrl)) {
                const absoluteUrl = makeAbsoluteUrl(src, sourceUrl);
                if (!productImages.includes(absoluteUrl)) {
                    productImages.push(absoluteUrl);
                }
            }
        });
        
        if (productImages.length >= 4) break; // Found enough in structured areas
    }
    
    // If not enough found, be more permissive but still focused
    if (productImages.length < 1) {
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            
            if (src && isValidProductImage(src, sourceUrl)) {
                const absoluteUrl = makeAbsoluteUrl(src, sourceUrl);
                if (!productImages.includes(absoluteUrl)) {
                    productImages.push(absoluteUrl);
                }
            }
            
            if (productImages.length >= 3) return false; // jQuery each break
        });
    }
    
    return productImages;
}

// Validate if image is a product image (not logo, clip art, etc.)
function isValidProductImage(src, sourceUrl) {
    const srcLower = src.toLowerCase();
    
    // Must have valid image extension
    if (!srcLower.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/)) {
        return false;
    }
    
    // EXCLUDE: Logos, branding, UI elements
    const excludePatterns = [
        'logo', 'brand', 'icon', 'favicon', 'header', 'footer', 'nav',
        'menu', 'button', 'arrow', 'chevron', 'close', 'search',
        'social', 'facebook', 'instagram', 'twitter', 'youtube',
        'cart', 'wishlist', 'share', 'print', 'email',
        'rating', 'star', 'review', 'testimonial',
        'badge', 'seal', 'award', 'certificate', 'guarantee',
        'payment', 'security', 'ssl', 'visa', 'mastercard',
        'shipping', 'delivery', 'truck', 'box', 'package',
        'background', 'pattern', 'texture', 'gradient',
        'placeholder', 'loading', 'spinner', 'ajax',
        'thumbnail', 'thumb', 'mini', 'small', '_s', '-s',
        'avatar', 'profile', 'team', 'staff', 'about',
        'blog', 'news', 'article', 'post',
        'banner', 'ad', 'advertisement', 'promo', 'sale',
        'related', 'similar', 'recommended', 'might-like',
        'clipart', 'graphics', 'illustration', 'drawing'
    ];
    
    if (excludePatterns.some(pattern => srcLower.includes(pattern))) {
        return false;
    }
    
    // EXCLUDE: Common non-product file patterns
    if (srcLower.includes('/wp-content/themes/') || 
        srcLower.includes('/assets/') || 
        srcLower.includes('/images/ui/') ||
        srcLower.includes('/graphics/')) {
        return false;
    }
    
    return true;
}

// FOCUSED Color Extraction - Only product color options
function extractProductColors($) {
    const colors = [];
    
    // Look for structured color selectors
    $('.color-option, .product-color, .variant-color, [data-color]').each((i, element) => {
        const $el = $(element);
        const colorName = $el.attr('data-color') || $el.attr('title') || $el.text().trim();
        
        if (colorName && colorName.length > 2 && colorName.length < 30) {
            const cleanColor = cleanText(colorName);
            if (!colors.includes(cleanColor)) {
                colors.push(cleanColor);
            }
        }
    });
    
    // Look for color dropdowns
    $('select[name*="color"] option, select[id*="color"] option').each((i, option) => {
        const colorName = $(option).text().trim();
        const value = $(option).attr('value');
        
        if (colorName && colorName !== 'Select Color' && value && colorName.length < 30) {
            const cleanColor = cleanText(colorName);
            if (!colors.includes(cleanColor)) {
                colors.push(cleanColor);
            }
        }
    });
    
    return colors.slice(0, 10); // Max 10 colors
}

// FOCUSED Specification Extraction - Only relevant technical specs
function extractRelevantSpecs($, html) {
    const specs = {};
    
    // Define what specifications are actually useful for products
    const relevantSpecKeys = [
        'material', 'finish', 'size', 'dimensions', 'weight', 'capacity',
        'pressure', 'flow', 'rating', 'certification', 'standard',
        'warranty', 'installation', 'mounting', 'connection',
        'diameter', 'height', 'width', 'length', 'depth',
        'color', 'style', 'type', 'model', 'series', 'collection'
    ];
    
    // Look for structured specification tables
    $('table tr, .specs tr, .specifications tr, .product-specs tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td, th');
        
        if (cells.length >= 2) {
            const key = cleanText($(cells[0]).text());
            const value = cleanText($(cells[1]).text());
            
            if (isRelevantSpec(key, value, relevantSpecKeys)) {
                specs[key] = value;
            }
        }
    });
    
    // Look for definition lists
    $('dl dt').each((i, dt) => {
        const $dt = $(dt);
        const $dd = $dt.next('dd');
        
        if ($dd.length) {
            const key = cleanText($dt.text());
            const value = cleanText($dd.text());
            
            if (isRelevantSpec(key, value, relevantSpecKeys)) {
                specs[key] = value;
            }
        }
    });
    
    return specs;
}

// Check if a specification is relevant and useful
function isRelevantSpec(key, value, relevantKeys) {
    if (!key || !value || key.length > 50 || value.length > 200) {
        return false;
    }
    
    const keyLower = key.toLowerCase();
    
    // Must contain at least one relevant keyword
    const isRelevant = relevantKeys.some(relevantKey => 
        keyLower.includes(relevantKey)
    );
    
    // Exclude useless information
    const excludeKeys = [
        'copyright', 'terms', 'conditions', 'privacy', 'policy',
        'shipping', 'delivery', 'payment', 'order', 'return',
        'contact', 'phone', 'email', 'address', 'website',
        'page', 'url', 'link', 'click', 'view', 'more',
        'related', 'similar', 'recommended', 'other'
    ];
    
    if (excludeKeys.some(excludeKey => keyLower.includes(excludeKey))) {
        return false;
    }
    
    return isRelevant;
}

// Determine if we should automatically scrape PDFs
function shouldScrapePDFs(data) {
    // Only scrape PDFs if ALL of these conditions are met:
    // 1. No price found anywhere
    // 2. Very limited description (less than 30 chars)
    // 3. Almost no specifications found
    // 4. Has valid PDF documents available
    
    const noPricing = (data.price === 0 && data.cost_price === 0);
    const noDescription = (data.short_description || '').length < 30;
    const noSpecs = Object.keys(data.specifications || {}).length < 2;
    const hasValidPDFs = (data.documents || []).some(doc => 
        doc && doc.type === 'pdf' && doc.url && doc.url.startsWith('http')
    );
    
    // Only scrape PDFs if page is really lacking in information
    return noPricing && noDescription && noSpecs && hasValidPDFs;
}

// Automatically scrape document data
async function scrapeDocumentData($, data) {
    const pdfDocuments = data.documents.filter(doc => doc && doc.type === 'pdf' && doc.url && doc.url.startsWith('http'));
    
    if (pdfDocuments.length === 0) {
        console.log('No valid PDF documents found');
        return;
    }
    
    for (const doc of pdfDocuments.slice(0, 2)) { // Limit to first 2 PDFs to avoid timeout
        try {
            console.log(`Attempting PDF: ${doc.name} - ${doc.url}`);
            
            // Download and parse PDF with strict timeout
            const response = await axios.get(doc.url, {
                responseType: 'arraybuffer',
                timeout: 8000, // 8 second timeout per PDF
                maxContentLength: 10 * 1024 * 1024, // 10MB max
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.data || response.data.length === 0) {
                console.log(`PDF ${doc.name} is empty or invalid`);
                continue;
            }
            
            const pdfData = await pdfParse(response.data);
            const pdfContent = extractPDFData(pdfData.text, doc.url);
            
            // Merge PDF data with existing data (PDF data takes priority for missing info)
            if (!data.price && pdfContent.price > 0) {
                data.price = pdfContent.price;
                console.log(`Found price in PDF: $${data.price}`);
            }
            
            if (!data.sku && pdfContent.sku) {
                data.sku = pdfContent.sku;
                console.log(`Found SKU in PDF: ${data.sku}`);
            }
            
            if ((data.short_description || '').length < 100 && pdfContent.description) {
                data.short_description = pdfContent.description;
                console.log(`Enhanced description from PDF`);
            }
            
            // Merge specifications (safely)
            if (pdfContent.specifications && typeof pdfContent.specifications === 'object') {
                Object.assign(data.specifications, pdfContent.specifications);
            }
            
            // Merge dimensions if not found (safely)
            if (data.dimensions && data.dimensions.width === 0 && data.dimensions.height === 0 && pdfContent.dimensions) {
                data.dimensions = pdfContent.dimensions;
            }
            
            // Add PDF source info
            data.specifications[`${doc.name} Source`] = doc.url;
            
        } catch (error) {
            console.error(`Failed to scrape PDF ${doc.name}:`, error.message);
            // Continue with other PDFs if one fails
        }
    }
}

// PDF scraping endpoint for documents with pricing
app.post('/api/scrape-pdf', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'PDF URL is required'
        });
    }
    
    console.log('Scraping PDF from URL:', url);
    
    try {
        // Download PDF
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.data) {
            throw new Error('Failed to download PDF');
        }
        
        // Parse PDF content
        const pdfData = await pdfParse(response.data);
        const text = pdfData.text;
        
        // Extract data from PDF text
        const productData = extractPDFData(text, url);
        
        console.log('Extracted PDF data:', productData);
        
        res.json({
            success: true,
            data: productData
        });
        
    } catch (error) {
        console.error('PDF scraping error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape PDF data',
            details: error.message
        });
    }
});

// Extract data from PDF text
function extractPDFData(text, sourceUrl) {
    const data = {
        name: '',
        description: '',
        price: 0,
        specifications: {},
        sku: '',
        brand: '',
        model: '',
        dimensions: { length: 0, width: 0, height: 0 },
        sourceUrl
    };
    
    // Extract product name (usually in first few lines)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length > 0) {
        // Look for product names in first 5 lines
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            if (line.length > 5 && line.length < 100 && !line.includes('page') && !line.includes('Page')) {
                data.name = line;
                break;
            }
        }
    }
    
    // Extract pricing with enhanced patterns
    const pricePatterns = [
        /\$\s*([\d,]+\.?\d*)/g,
        /([\d,]+\.?\d*)\s*AUD/g,
        /Price[:\s]+([\d,]+\.?\d*)/gi,
        /Cost[:\s]+([\d,]+\.?\d*)/gi,
        /RRP[:\s]+([\d,]+\.?\d*)/gi
    ];
    
    for (const pattern of pricePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const priceStr = match.replace(/[^\d.]/g, '');
                const price = parseFloat(priceStr);
                if (price > 0 && price < 100000) { // Reasonable price range
                    data.price = price;
                    break;
                }
            }
            if (data.price > 0) break;
        }
    }
    
    // Extract SKU/Code
    const skuPatterns = [
        /Code[:\s]+([A-Z0-9\-]+)/gi,
        /SKU[:\s]+([A-Z0-9\-]+)/gi,
        /Model[:\s]+([A-Z0-9\-]+)/gi,
        /Part[:\s]+([A-Z0-9\-]+)/gi
    ];
    
    for (const pattern of skuPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            data.sku = 'EL-' + match[1].toUpperCase();
            break;
        }
    }
    
    // Extract specifications (key-value pairs)
    const specPatterns = [
        /([A-Za-z\s]+):\s*([A-Za-z0-9\s\.]+)/g,
        /([A-Za-z\s]+)\s+([A-Za-z0-9]+(?:\s*[A-Za-z0-9]+)*)/g
    ];
    
    for (const pattern of specPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const key = match[1].trim();
            const value = match[2].trim();
            
            if (key.length > 2 && key.length < 50 && value.length > 1 && value.length < 100) {
                // Skip common non-specification text
                if (!key.toLowerCase().includes('page') && !key.toLowerCase().includes('copyright')) {
                    data.specifications[key] = value;
                }
            }
        }
    }
    
    // Extract dimensions
    const dimPattern = /(\d+\.?\d*)\s*(?:mm|cm)\s*x\s*(\d+\.?\d*)\s*(?:mm|cm)\s*x\s*(\d+\.?\d*)\s*(?:mm|cm)/gi;
    const dimMatch = text.match(dimPattern);
    if (dimMatch && dimMatch[0]) {
        const numbers = dimMatch[0].match(/\d+\.?\d*/g);
        if (numbers && numbers.length >= 3) {
            data.dimensions = {
                length: parseFloat(numbers[0]) || 0,
                width: parseFloat(numbers[1]) || 0,
                height: parseFloat(numbers[2]) || 0
            };
        }
    }
    
    return data;
}

// AI description enhancement endpoint
app.post('/api/enhance-description', async (req, res) => {
    const { text, type, productName, productCategory } = req.body;
    
    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'Text is required'
        });
    }
    
    console.log('Enhancing description:', { type, productName });
    
    try {
        const enhancedText = await enhanceTextWithAI(text, type, productName, productCategory);
        
        res.json({
            success: true,
            data: {
                original: text,
                enhanced: enhancedText,
                type: type
            }
        });
        
    } catch (error) {
        console.error('AI enhancement error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enhance description',
            details: error.message
        });
    }
});

// Enhance text with Claude Sonnet via OpenRouter
async function enhanceTextWithAI(text, type, productName, productCategory) {
    const cleanText = text.trim();
    
    // If no API key, fall back to rule-based enhancement
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'demo-key') {
        console.log('Using fallback enhancement (no OpenRouter API key)');
        return fallbackEnhancement(cleanText, type, productName, productCategory);
    }
    
    try {
        const prompt = createEnhancementPrompt(cleanText, type, productName, productCategory);
        
        const completion = await openai.chat.completions.create({
            model: "anthropic/claude-3.5-sonnet",
            messages: [{
                role: "user",
                content: prompt
            }],
            max_tokens: 300,
            temperature: 0.7
        });
        
        return completion.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('OpenRouter API error:', error);
        // Fall back to rule-based enhancement if API fails
        return fallbackEnhancement(cleanText, type, productName, productCategory);
    }
}

// Create enhancement prompt for Claude
function createEnhancementPrompt(text, type, productName, productCategory) {
    const baseContext = `You are helping to enhance product descriptions for Ecco Living, a premium Australian home solutions company specializing in luxury bathrooms, glass fencing, aluminium solutions, and flooring.

Product Name: ${productName || 'Not specified'}
Category: ${productCategory || 'Not specified'}
Original Description: "${text}"

`;

    const typeInstructions = {
        enhance: `Please enhance this product description to be more compelling and premium while keeping the core information. Make it sound luxurious and suitable for high-end Australian homes. Keep it factual but more engaging. IMPORTANT: Optimize for SEO by naturally incorporating relevant keywords like "premium", "luxury", "Australian", category-specific terms, and location-based terms without keyword stuffing.`,
        
        shorten: `Please shorten this description to be more concise while keeping the most important information. Make it punchy and to-the-point for product listings. IMPORTANT: Include key SEO terms like "premium", "luxury", product category, and "Australian" naturally in the shortened version.`,
        
        paraphrase: `Please paraphrase this description using different words while keeping the same meaning and length. Make it sound fresh and unique. IMPORTANT: Incorporate SEO-friendly terms like "premium", "luxury", "contemporary", "Australian homes", and category-specific keywords naturally.`,
        
        rewrite: `Please completely rewrite this description from scratch, using the key information but creating compelling new copy that highlights the premium nature and Australian suitability of this product. IMPORTANT: Write with SEO in mind - include relevant keywords naturally: "premium [category]", "luxury", "Australian homes", "contemporary design", location terms like "Melbourne", "Sydney", and category-specific terms.`
    };

    return baseContext + typeInstructions[type] + `

Requirements:
- Keep it professional and premium
- Mention Australian suitability if relevant
- Focus on quality and design
- Keep technical details accurate
- Make it compelling for luxury home market
- OPTIMIZE FOR SEO: Include relevant keywords naturally
- Target Australian searches: "Melbourne", "Sydney", "Australian homes"
- Include category keywords: "bathroom", "tapware", "basin mixer", etc.
- Use premium positioning terms: "luxury", "premium", "contemporary"
- Avoid keyword stuffing - make it natural and readable
- Return only the enhanced description, no explanations

Enhanced Description:`;
}

// Fallback enhancement when Claude API is not available
function fallbackEnhancement(text, type, productName, productCategory) {
    switch (type) {
        case 'enhance':
            return enhanceDescription(text, productName, productCategory);
        case 'shorten':
            return shortenDescription(text);
        case 'paraphrase':
            return paraphraseDescription(text, productName);
        case 'rewrite':
            return rewriteDescription(text, productName, productCategory);
        default:
            return enhanceDescription(text, productName, productCategory);
    }
}

// Enhancement functions
function enhanceDescription(text, productName, category) {
    let enhanced = text;
    
    // Add compelling adjectives if missing
    const luxuryTerms = ['premium', 'luxury', 'sophisticated', 'elegant', 'contemporary', 'modern'];
    if (!luxuryTerms.some(term => enhanced.toLowerCase().includes(term))) {
        enhanced = `Premium ${enhanced}`;
    }
    
    // Add category-specific enhancements
    if (category && category.toLowerCase().includes('bathroom')) {
        enhanced += ' Perfect for creating a spa-like bathroom experience with lasting durability and style.';
    } else if (category && category.toLowerCase().includes('pool')) {
        enhanced += ' Designed for Australian conditions with superior weather resistance and safety compliance.';
    } else if (category && category.toLowerCase().includes('kitchen')) {
        enhanced += ' Engineered for daily use with easy maintenance and contemporary design.';
    }
    
    // Add Australian focus
    if (!enhanced.toLowerCase().includes('australia')) {
        enhanced += ' Suitable for Australian homes and commercial spaces.';
    }
    
    return enhanced;
}

function shortenDescription(text) {
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    
    // Keep only the most important sentences (first 2)
    const shortened = sentences.slice(0, 2).join('. ');
    
    // Add ellipsis if we shortened it
    return sentences.length > 2 ? shortened + '...' : shortened;
}

function paraphraseDescription(text, productName) {
    // Simple paraphrasing rules
    let paraphrased = text
        .replace(/manufactured/gi, 'crafted')
        .replace(/designed/gi, 'engineered')
        .replace(/features/gi, 'offers')
        .replace(/provides/gi, 'delivers')
        .replace(/excellent/gi, 'outstanding')
        .replace(/high quality/gi, 'premium grade')
        .replace(/durable/gi, 'long-lasting');
    
    return paraphrased;
}

function rewriteDescription(text, productName, category) {
    // Create a completely new description based on key elements
    const keywords = extractKeywords(text);
    
    let rewritten = `Discover the ${productName || 'exceptional'} - `;
    
    if (category && category.toLowerCase().includes('bathroom')) {
        rewritten += 'a sophisticated bathroom solution that combines ';
    } else if (category && category.toLowerCase().includes('pool')) {
        rewritten += 'an innovative pool solution that delivers ';
    } else {
        rewritten += 'a premium product that provides ';
    }
    
    // Add key features
    if (keywords.includes('steel') || keywords.includes('stainless')) {
        rewritten += 'superior durability with stainless steel construction, ';
    }
    if (keywords.includes('modern') || keywords.includes('contemporary')) {
        rewritten += 'contemporary design appeal, ';
    }
    
    rewritten += 'exceptional quality and lasting performance for discerning Australian homeowners.';
    
    return rewritten;
}

function extractKeywords(text) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'];
    return text.toLowerCase()
               .replace(/[^\w\s]/g, ' ')
               .split(/\s+/)
               .filter(word => word.length > 3 && !commonWords.includes(word));
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', server: 'Simple server running' });
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server  
app.listen(PORT, () => {
    console.log(`✅ Simple server running on http://localhost:${PORT}`);
    console.log(`📋 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🔐 Login credentials: adam@eccoliving.com.au / Gabbie1512!`);
});

// Close balance braces } } } }