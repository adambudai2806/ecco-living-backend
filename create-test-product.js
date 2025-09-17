c// Create test product in Shopify using Admin API
require('dotenv').config();
const fetch = require('node-fetch');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

async function createTestProduct() {
    try {
        console.log('Creating test product in Shopify...');
        console.log('Domain:', SHOPIFY_DOMAIN);
        console.log('Token available:', !!ADMIN_TOKEN);

        const productData = {
            product: {
                title: "Free Sample - Premium Glass Cleaner",
                body_html: "<p>Professional-grade glass cleaner sample - perfect for testing our shop integration.</p><ul><li>Streak-free formula</li><li>Safe for all glass surfaces</li><li>Professional strength</li><li>Australian-made</li></ul>",
                vendor: "Ecco Living",
                product_type: "Glass Solutions",
                handle: "free-sample-glass-cleaner",
                status: "active",
                // images: [], // Skip images for trial account
                variants: [
                    {
                        title: "50ml Sample",
                        price: "0.00",
                        compare_at_price: "5.99",
                        inventory_quantity: 100,
                        inventory_management: "shopify",
                        sku: "FREE-SAMPLE-001",
                        weight: 0.05,
                        weight_unit: "kg"
                    }
                ],
                tags: "free,sample,glass-cleaner,test,shop-testing"
            }
        };

        const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-01/products.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': ADMIN_TOKEN,
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to create product:', result);
            return;
        }

        console.log('✅ Product created successfully!');
        console.log('Product ID:', result.product.id);
        console.log('Product Handle:', result.product.handle);
        console.log('Variant ID:', result.product.variants[0].id);
        console.log('Product URL:', `https://${SHOPIFY_DOMAIN}/products/${result.product.handle}`);
        
        // Save variant ID for cart integration
        console.log('\n🔗 Use this Variant ID in your cart:');
        console.log(`data-variant-id="gid://shopify/ProductVariant/${result.product.variants[0].id}"`);

        return result.product;

    } catch (error) {
        console.error('❌ Error creating product:', error.message);
    }
}

createTestProduct();