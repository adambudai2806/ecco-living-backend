const express = require('express');
const router = express.Router();

// In-memory storage for development mode
let developmentProducts = [];

// Function to add product to development storage
function addDevelopmentProduct(productData) {
    const product = {
        ...productData,
        id: productData.id || Date.now().toString(),
        created_at: productData.created_at || new Date().toISOString(),
        updated_at: productData.updated_at || new Date().toISOString()
    };
    
    developmentProducts.push(product);
    console.log(`📦 Added product to development storage: ${product.name} (${product.sku})`);
    console.log(`📦 Total products in storage: ${developmentProducts.length}`);
    return product;
}

// Mock Products including Free Test Product
const mockProducts = [
    // Free Test Product for Shop Integration Testing
    {
        id: 'free-test-001',
        name: 'Free Sample - Premium Glass Cleaner',
        slug: 'free-sample-glass-cleaner',
        price: 0, // FREE for testing
        sale_price: null,
        image: 'https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        short_description: 'Professional-grade glass cleaner sample - perfect for testing our shop integration',
        description: 'Get a free sample of our professional-grade glass cleaner used by professionals across Australia. This sample is perfect for testing the quality of our products and shop functionality. Features: Streak-free formula, Safe for all glass surfaces, Professional strength, Australian-made. Perfect for testing: Add to cart functionality, Checkout process, Order management, Email notifications.',
        category: 'glass-solutions',
        subcategory: 'cleaning-products',
        status: 'published',
        brand: 'Ecco Living',
        sku: 'FREE-SAMPLE-001',
        stock_quantity: 100,
        in_stock: true,
        is_featured: true,
        features: ['Streak-free formula', 'Safe for all glass surfaces', 'Professional strength', 'Australian-made', 'Perfect for shop testing'],
        sizes: [
            {
                name: '50ml Sample',
                code: 'SAMPLE-50',
                price_modifier: 0
            },
            {
                name: '100ml Travel Size',
                code: 'TRAVEL-100', 
                price_modifier: 0
            }
        ],
        specifications: {
            'Volume': '50ml',
            'Type': 'Liquid',
            'Formulation': 'Streak-free',
            'Country of Origin': 'Australia',
            'Suitable For': 'All glass surfaces',
            'Purpose': 'Shop Integration Testing'
        },
        tags: ['free', 'sample', 'glass-cleaner', 'test', 'shop-testing'],
        average_rating: 5.0,
        review_count: 12,
        warranty_period: null
    },
    // Paco Jaanson Products
    {
        id: 'pj-toledo-001',
        name: 'Toledo Basin Mixer',
        slug: 'toledo-basin-mixer',
        price: 405, // 10% discount applied (est. retail $450)
        image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/als-tosm2-2-650x620.jpg',
        images: [
            'https://pacojaanson.com.au/wp-content/uploads/2016/09/als-tosm2-2-650x620.jpg'
        ],
        description: 'Premium Toledo basin mixer featuring 6-star WELS rating with exceptional 4.5L/min water efficiency and contemporary European design',
        category: 'tapware',
        subcategory: 'basin-mixers',
        status: 'published',
        brand: 'Paco Jaanson',
        supplier_code: 'ALS-TOB',
        supplier_url: 'https://pacojaanson.com.au/product/toledo-basin-mixer/',
        features: ['6 Star WELS Rating', '4.5L/min water efficiency', 'Contemporary European design', 'Premium chrome finish', 'Ceramic disc technology'],
        sizes: [
            {
                name: 'Standard',
                height: '180mm',
                code: 'ALS-TOB',
                price_modifier: 0
            },
            {
                name: 'Tall',
                height: '280mm', 
                code: 'ALS-TOTB',
                price_modifier: 50
            }
        ],
        colors: [
            {
                name: 'Polished Chrome',
                code: '#C0C0C0',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/als-tosm2-2-650x620.jpg',
                price: 405, // 10% discount applied
                sku: 'ALS-TOB-CHR'
            },
            {
                name: 'Brushed Nickel',
                code: '#A0A0A0',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/als-tosm2-2-650x620.jpg',
                price: 428, // 10% discount applied
                sku: 'ALS-TOB-BN'
            },
            {
                name: 'Matte Black',
                code: '#1a1a1a',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/als-tosm2-2-650x620.jpg',
                price: 446, // 10% discount applied
                sku: 'ALS-TOB-MB'
            }
        ],
        specifications: {
            'Brand': 'Paco Jaanson',
            'Product Code': 'ALS-TOB',
            'Series': 'Toledo Collection',
            'Finish': 'Chrome',
            'WELS Rating': '6 Star',
            'Flow Rate': '4.5L/min',
            'Material': 'Premium Brass Construction',
            'Cartridge': 'Ceramic Disc Technology',
            'Installation': 'Basin Mixer',
            'Standards': 'Australian Water Efficiency Standards',
            'Warranty': 'Manufacturer Warranty'
        },
        downloads: {
            'Technical Specifications': 'PDF available from supplier',
            'Installation Instructions': 'ZIP file available',
            'Product Brochure': 'PDF available',
            'CAD Files': 'ZIP file available'
        },
        notes: 'Specifications to be confirmed with supplier. Contact for detailed technical information.'
    },
    {
        id: 'pj-tweet-001',
        name: 'Tweet Basin Mixer',
        slug: 'tweet-basin-mixer',
        price: 342, // 10% discount applied (est. retail $380)
        image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/tw2001.jpg',
        images: [
            'https://pacojaanson.com.au/wp-content/uploads/2016/09/tw2001.jpg'
        ],
        description: 'Modern Tweet basin mixer featuring 5-star WELS rating with 5L/min flow rate and sleek contemporary styling for modern bathrooms',
        category: 'tapware',
        subcategory: 'basin-mixers',
        status: 'published',
        brand: 'Paco Jaanson',
        supplier_code: 'TW200',
        supplier_url: 'https://pacojaanson.com.au/product/tweet-basin-mixer/',
        features: ['5 Star WELS Rating', '5L/min flow rate', 'Contemporary styling', 'Chrome finish', 'Standard basin mixer design'],
        sizes: [
            {
                name: 'Standard',
                height: '180mm',
                code: 'TW200',
                price_modifier: 0
            },
            {
                name: 'Tall',
                height: '280mm',
                code: 'TW200T',
                price_modifier: 45
            }
        ],
        colors: [
            {
                name: 'Polished Chrome',
                code: '#C0C0C0',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/tw3991-1-650x620.jpg',
                price: 342, // 10% discount applied
                sku: 'TW200-CHR'
            },
            {
                name: 'Brushed Nickel',
                code: '#A0A0A0',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/tw3991-1-650x620.jpg',
                price: 405,
                sku: 'PJ-TWE-BN'
            },
            {
                name: 'Matte Black',
                code: '#1a1a1a',
                image: 'https://pacojaanson.com.au/wp-content/uploads/2016/09/tw3991-1-650x620.jpg',
                price: 425,
                sku: 'PJ-TWE-MB'
            }
        ],
        specifications: {
            'Brand': 'Paco Jaanson',
            'Product Code': 'TW200',
            'Series': 'Tweet Collection',
            'Finish': 'Chrome',
            'WELS Rating': '5 Star',
            'Flow Rate': '5L/min',
            'Material': 'Premium Brass Construction',
            'Installation': 'Standard Basin Mixer',
            'Standards': 'Australian Water Efficiency Standards',
            'Warranty': 'Manufacturer Warranty'
        },
        downloads: {
            'Technical Specifications': 'PDF available from supplier',
            'Installation Instructions': 'PDF available',
            'Product Brochure': 'PDF available',
            'CAD Files': 'DWG available'
        },
        notes: 'Specifications to be confirmed with supplier. Contact for detailed technical information.'
    }
];

// Get all products with filtering
router.get('/', async (req, res) => {
    const { category, subcategory, status } = req.query;
    
    try {
        let filteredProducts = [];
        
        // If we have a real database connection, read from it
        if (process.env.DATABASE_URL) {
            console.log('📖 Reading products from Neon PostgreSQL database...');
            const { getDatabase } = require('../config/database');
            const db = getDatabase();
            
            // Read all products from database
            const products = await db('products').select('*').orderBy('created_at', 'desc');
            
            // Helper function to safely parse JSON
            const safeJsonParse = (value, defaultValue = null) => {
                if (!value) return defaultValue;
                if (typeof value === 'object') return value; // Already parsed
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch (e) {
                        console.warn('Failed to parse JSON:', value);
                        return defaultValue;
                    }
                }
                return defaultValue;
            };
            
            // Parse JSON fields back to objects
            filteredProducts = products.map(product => {
                const parsedImages = safeJsonParse(product.images, []);
                return {
                    ...product,
                    specifications: safeJsonParse(product.specifications, {}),
                    images: parsedImages,
                    colors: safeJsonParse(product.colors, []),
                    color_variants: safeJsonParse(product.color_variants, []),
                    documents: safeJsonParse(product.documents, []),
                    categories: safeJsonParse(product.categories, []),
                    tags: safeJsonParse(product.tags, []),
                    // Set main_image for compatibility
                    main_image: Array.isArray(parsedImages) ? parsedImages[0] : null,
                    image: Array.isArray(parsedImages) ? parsedImages[0] : null
                };
            });
            
            console.log(`📖 Loaded ${filteredProducts.length} products from database`);
        } else {
            // Fallback to development products (in-memory)
            filteredProducts = [...developmentProducts.reverse()];
        }
    
    // Filter by category
    if (category) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === category
        );
    }
    
    // Filter by subcategory
    if (subcategory) {
        filteredProducts = filteredProducts.filter(product => 
            product.subcategory === subcategory
        );
    }
    
    // Filter by status
    if (status) {
        filteredProducts = filteredProducts.filter(product => 
            product.status === status
        );
    }
    
        res.json({
            success: true,
            data: filteredProducts,
            total: filteredProducts.length
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load products',
            data: []
        });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // If we have a real database connection, read from it
        if (process.env.DATABASE_URL) {
            console.log('📖 Reading individual product from database:', id);
            const { getDatabase } = require('../config/database');
            const db = getDatabase();
            
            const product = await db('products').where('id', id).first();
            
            if (product) {
                // Parse JSON fields
                const safeJsonParse = (value, defaultValue = null) => {
                    if (!value) return defaultValue;
                    if (typeof value === 'object') return value;
                    if (typeof value === 'string') {
                        try { return JSON.parse(value); } catch (e) { return defaultValue; }
                    }
                    return defaultValue;
                };
                
                const enhancedProduct = {
                    ...product,
                    specifications: safeJsonParse(product.specifications, {}),
                    images: safeJsonParse(product.images, []),
                    colors: safeJsonParse(product.colors, []),
                    color_variants: safeJsonParse(product.color_variants, []),
                    documents: safeJsonParse(product.documents, []),
                    categories: safeJsonParse(product.categories, []),
                    tags: safeJsonParse(product.tags, []),
                    main_image: safeJsonParse(product.images, [])[0] || null
                };
                
                return res.json({
                    success: true,
                    data: enhancedProduct
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
        }
    } catch (error) {
        console.error('Error loading individual product:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to load product'
        });
    }
    
    // Fallback to mock product data for testing
    const mockDetailedProduct = {
        id: id,
        name: '316 Curved Wall Spout',
        slug: '316-curved-wall-spout',
        sku: 'EL-01015178', // Sequential EL- SKU
        originalSku: '316-CURVED-WALL-SPOUT', // Original manufacturer SKU
        brand: 'Abey',
        manufacturer: 'Abey Australia',
        price: 899.00,
        cost_price: 999.00,
        sale_price: null,
        short_description: 'Transform your bathroom or kitchen space with this elegantly designed 316 Curved Wall Spout from Abey Australia.',
        long_description: `
            <h3>Premium Australian Tapware Excellence</h3>
            <p>Transform your bathroom or kitchen space with the elegantly designed 316 Curved Wall Spout from Abey Australia's premium tapware collection. This luxury wall-mounted spout combines sophisticated aesthetics with superior functionality.</p>
            
            <h4>Key Features:</h4>
            <ul>
                <li>Crafted from high-grade 316 marine-grade stainless steel</li>
                <li>Curved design for elegant water flow</li>
                <li>Wall-mounted installation for space efficiency</li>
                <li>Australian designed and engineered for local conditions</li>
                <li>Suitable for bathroom and kitchen applications</li>
                <li>Easy maintenance and cleaning</li>
                <li>Corrosion resistant marine-grade construction</li>
            </ul>
            
            <h4>Applications:</h4>
            <p>Perfect for modern bathrooms, luxury powder rooms, and contemporary kitchen designs. The curved spout design adds a sophisticated touch while providing practical functionality for both residential and commercial applications.</p>
        `,
        images: [
            'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png',
            'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-1024x1024.png',
            'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-300x300.png'
        ],
        main_image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png',
        colors: ['Chrome'],
        colorVariants: [
            {
                name: 'Chrome',
                finish: 'Chrome',
                sku: 'EL-01015179',
                originalSku: '316-CURVED-WALL-SPOUT.00',
                price: 899.00,
                cost_price: 999.00,
                hex: '#C8C8C8',
                image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png'
            }
        ],
        specifications: {
            'Material': '316 Marine Grade Stainless Steel',
            'Type': 'Wall Mounted Spout',
            'Finish': 'Chrome',
            'Origin': 'Australia',
            'Warranty': '10 Years',
            'Installation Guide': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ii/Installation-Instructions_WSS001-316.pdf',
            'Technical Specification': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ts/WSS001-316.pdf',
            'Product Brochure': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_b/ABEY0478_Alfresco_Brochure_2025.pdf'
        },
        documents: [
            {
                name: 'Installation Guide',
                url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ii/Installation-Instructions_WSS001-316.pdf',
                type: 'installation guide',
                extension: 'pdf'
            },
            {
                name: 'Technical Specification',
                url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ts/WSS001-316.pdf',
                type: 'technical specification',
                extension: 'pdf'
            },
            {
                name: 'Product Brochure',
                url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_b/ABEY0478_Alfresco_Brochure_2025.pdf',
                type: 'brochure',
                extension: 'pdf'
            }
        ],
        categories: ['100', '140', '144'], // Auto-detected: Bathrooms -> Tapware -> Bath Spout & Wall Mixers
        autoCategories: ['100', '140', '144'], // Show auto-detected categories
        category: 'bathrooms',
        subcategory: 'tapware',
        status: 'published',
        in_stock: true,
        stock_quantity: 50,
        weight: 2.5,
        dimensions: {
            length: 25,
            width: 8,
            height: 15
        },
        meta_title: '316 Curved Wall Spout - Premium Tapware | Ecco Living',
        meta_description: 'Premium 316 marine-grade stainless steel curved wall spout from Abey Australia. Perfect for modern bathrooms and kitchens. Australian designed and engineered.',
        tags: ['tapware', 'wall-spout', 'stainless-steel', 'abey', 'chrome', 'bathroom', 'kitchen'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    res.json({
        success: true,
        data: mockDetailedProduct
    });
});

module.exports = router;
module.exports.addDevelopmentProduct = addDevelopmentProduct;