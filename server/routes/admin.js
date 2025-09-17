const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect: auth, requireAdmin } = require('../middleware/auth');
const { addDevelopmentProduct } = require('./products');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        try {
            await fs.access(uploadPath);
        } catch {
            await fs.mkdir(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Apply auth middleware to all admin routes (bypass in development)
router.use((req, res, next) => {
    // Skip auth in development mode for now until auth is fully working
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ DEVELOPMENT MODE: Bypassing admin authentication');
        req.user = { id: 'dev-admin', role: 'admin', email: 'adam@eccoliving.com.au' };
        return next();
    }
    
    // Use normal auth for production
    return requireAdmin(req, res, next);
});

// Dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await Product.getStatistics();
        
        res.json({
            success: true,
            data: {
                totalOrders: 0,
                totalRevenue: 0.00,
                totalProducts: stats.totalProducts || 0,
                totalCustomers: 0,
                publishedProducts: stats.publishedProducts || 0,
                monthlySales: [0, 0, 0, 0, 0, 0]
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard statistics'
        });
    }
});

// Recent orders
router.get('/orders/recent', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// Product validation rules
const productValidation = [
    body('name').notEmpty().trim().withMessage('Product name is required'),
    body('sku').notEmpty().trim().withMessage('SKU is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('short_description').optional().trim(),
    body('long_description').optional().trim(),
    body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
    body('manage_stock').optional().isBoolean(),
    body('is_featured').optional().isBoolean(),
];

// Create product
router.post('/products', productValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const productData = req.body;
        
        // In development mode with mock database, simulate product creation
        if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
            console.log('📦 DEVELOPMENT MODE: Simulating product creation');
            console.log('Product data received:', {
                name: productData.name,
                sku: productData.sku,
                originalSku: productData.originalSku,
                categories: productData.categories,
                specifications: Object.keys(productData.specifications || {}).length
            });
            
            // Save to development storage so it appears in products list
            const savedProduct = addDevelopmentProduct(productData);
            
            console.log('✅ Product saved to development storage:', savedProduct.name, 'SKU:', savedProduct.sku);
            
            return res.status(201).json({
                success: true,
                data: savedProduct,
                message: 'Product created successfully (development mode)'
            });
        }
        
        // Production mode - use real database
        try {
            // Skip SKU validation for now since models aren't fully connected
            console.log('💾 Creating product in real database...');
            console.log('📊 Product data categories:', productData.categories);
            console.log('📊 Product data autoCategories:', productData.autoCategories);
            // const existingSku = await Product.findBySku(productData.sku);
            // if (existingSku) {
            //     return res.status(400).json({
            //         success: false,
            //         error: 'SKU already exists'
            //     });
            // }

            // Convert categories array to proper format if needed
            if (productData.categories && Array.isArray(productData.categories)) {
                productData.categoryIds = productData.categories;
                delete productData.categories;
            }

            // Create the product directly in database
            const { getDatabase } = require('../config/database');
            const db = getDatabase();
            
            // Helper function to clean numeric values
            const cleanNumeric = (value) => {
                if (value === '' || value === null || value === undefined || isNaN(value)) {
                    return null;
                }
                return parseFloat(value);
            };
            
            // Insert product directly into database
            const productToInsert = {
                name: productData.name,
                slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
                sku: productData.sku,
                original_sku: productData.originalSku,
                short_description: productData.short_description,
                long_description: productData.long_description,
                brand: productData.brand,
                manufacturer: productData.manufacturer,
                price: cleanNumeric(productData.price),
                cost_price: cleanNumeric(productData.cost_price),
                sale_price: cleanNumeric(productData.sale_price),
                specifications: JSON.stringify(productData.specifications || {}),
                images: JSON.stringify(productData.images || []),
                colors: JSON.stringify(productData.colors || []),
                color_variants: JSON.stringify(productData.colorVariants || []),
                documents: JSON.stringify(productData.documents || []),
                categories: JSON.stringify(productData.categories || []),
                category: productData.category || 'uncategorized',
                subcategory: productData.subcategory,
                status: productData.status || 'published',
                in_stock: productData.in_stock !== false,
                stock_quantity: parseInt(productData.stock_quantity) || 10,
                weight: cleanNumeric(productData.weight),
                meta_title: productData.meta_title,
                meta_description: productData.meta_description,
                tags: JSON.stringify(productData.tags || [])
            };
            
            const [product] = await db('products').insert(productToInsert).returning('*');

            // Categories are stored as JSON in the products table, no need for junction table for now
            console.log('✅ Product saved to database:', product.name, 'SKU:', product.sku);

            res.status(201).json({
                success: true,
                data: product,
                message: 'Product created successfully'
            });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create product'
            });
        }
        
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
});

// Delete product endpoint
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting product with ID:', id);
        
        // Delete from database
        const { getDatabase } = require('../config/database');
        const db = getDatabase();
        
        const deletedRows = await db('products').where('id', id).del();
        
        if (deletedRows > 0) {
            console.log('✅ Product deleted successfully:', id);
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
});

// Upload image endpoint
router.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            error: 'File upload failed'
        });
    }
});

// Update product
router.put('/products/:id', productValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const productData = req.body;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Validate SKU if changed
        if (productData.sku && productData.sku !== existingProduct.sku) {
            const skuExists = await Product.findBySku(productData.sku);
            if (skuExists) {
                return res.status(400).json({
                    success: false,
                    error: 'SKU already exists'
                });
            }
        }

        // Update the product
        const updatedProduct = await Product.updateById(id, productData);

        // Update categories if provided
        if (productData.categoryIds) {
            // Remove existing category associations
            await Product.db('product_categories').where('product_id', id).del();
            
            // Add new category associations
            for (const categoryId of productData.categoryIds) {
                await Product.db('product_categories').insert({
                    product_id: id,
                    category_id: categoryId
                });
            }
        }

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Remove category associations
        await Product.db('product_categories').where('product_id', id).del();
        
        // Delete the product
        await Product.deleteById(id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
});

module.exports = router;