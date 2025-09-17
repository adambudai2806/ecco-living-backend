const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopifyService');
const Product = require('../models/Product');

// Test Shopify connection
router.get('/test-connection', async (req, res) => {
    try {
        const shopInfo = await shopifyService.testConnection();
        res.json({
            success: true,
            message: 'Successfully connected to Shopify',
            shop: shopInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create Shopify checkout
router.post('/checkout', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items array is required'
            });
        }

        // Validate items format
        const validatedItems = items.map(item => {
            if (!item.variantId || !item.quantity) {
                throw new Error('Each item must have variantId and quantity');
            }
            return {
                variantId: item.variantId,
                quantity: parseInt(item.quantity)
            };
        });

        const checkout = await shopifyService.createCheckout(validatedItems);

        res.json({
            success: true,
            checkout: {
                id: checkout.id,
                webUrl: checkout.webUrl,
                totalPrice: checkout.totalPriceV2,
                lineItems: checkout.lineItems.edges.map(edge => edge.node)
            }
        });
    } catch (error) {
        console.error('Checkout creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add items to existing checkout
router.post('/checkout/:checkoutId/add', async (req, res) => {
    try {
        const { checkoutId } = req.params;
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items array is required'
            });
        }

        const validatedItems = items.map(item => ({
            variantId: item.variantId,
            quantity: parseInt(item.quantity)
        }));

        const checkout = await shopifyService.addToCheckout(checkoutId, validatedItems);

        res.json({
            success: true,
            checkout: {
                id: checkout.id,
                webUrl: checkout.webUrl,
                totalPrice: checkout.totalPriceV2,
                lineItems: checkout.lineItems.edges.map(edge => edge.node)
            }
        });
    } catch (error) {
        console.error('Add to checkout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Shopify product by handle
router.get('/product/:handle', async (req, res) => {
    try {
        const { handle } = req.params;
        const product = await shopifyService.getProductByHandle(handle);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found in Shopify'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get Shopify product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Sync local product to Shopify
router.post('/sync-product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Get local product
        const localProduct = await Product.findById(productId);
        if (!localProduct) {
            return res.status(404).json({
                success: false,
                error: 'Local product not found'
            });
        }

        // Sync to Shopify
        const shopifyProduct = await shopifyService.syncProductToShopify(localProduct);

        res.json({
            success: true,
            message: 'Product synced to Shopify successfully',
            shopifyProduct
        });
    } catch (error) {
        console.error('Product sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Sync all published local products to Shopify
router.post('/sync-all-products', async (req, res) => {
    try {
        // Get all published products
        const localProducts = await Product.findAll({
            where: { status: 'published' }
        });

        if (!localProducts || localProducts.length === 0) {
            return res.json({
                success: true,
                message: 'No published products to sync'
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        // Sync each product
        for (const product of localProducts) {
            try {
                const shopifyProduct = await shopifyService.syncProductToShopify(product);
                results.successful.push({
                    localId: product.id,
                    name: product.name,
                    shopifyId: shopifyProduct.product?.id
                });
            } catch (error) {
                results.failed.push({
                    localId: product.id,
                    name: product.name,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Sync completed: ${results.successful.length} successful, ${results.failed.length} failed`,
            results
        });
    } catch (error) {
        console.error('Bulk sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook handler for Shopify order events
router.post('/webhook/orders', async (req, res) => {
    try {
        // Verify webhook (in production, verify the HMAC)
        const order = req.body;

        console.log('Received Shopify order webhook:', {
            id: order.id,
            name: order.name,
            email: order.email,
            total_price: order.total_price
        });

        // Here you can:
        // 1. Update local inventory
        // 2. Send confirmation emails
        // 3. Update CRM systems
        // 4. Trigger fulfillment processes

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;