// Check products in Shopify store
require('dotenv').config();
const fetch = require('node-fetch');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

async function checkProducts() {
    try {
        console.log('Checking products in Shopify store...');

        const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-01/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': ADMIN_TOKEN,
            }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to fetch products:', result);
            return;
        }

        console.log('✅ Products found:', result.products.length);
        
        result.products.forEach(product => {
            console.log('\n📦 Product:', product.title);
            console.log('   ID:', product.id);
            console.log('   Handle:', product.handle);
            console.log('   Status:', product.status);
            console.log('   Variants:');
            product.variants.forEach(variant => {
                console.log(`     - ${variant.title}: gid://shopify/ProductVariant/${variant.id}`);
                console.log(`       Price: $${variant.price}, SKU: ${variant.sku}`);
            });
        });

    } catch (error) {
        console.error('❌ Error checking products:', error.message);
    }
}

checkProducts();