// Simple Shopify connection test
require('dotenv').config();

console.log('Testing Shopify connection...');
console.log('Domain:', process.env.SHOPIFY_DOMAIN);
console.log('Token available:', !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);

const fetch = require('node-fetch');

async function testShopifyConnection() {
    const domain = process.env.SHOPIFY_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    
    if (!domain || !token) {
        console.error('❌ Missing Shopify configuration');
        return;
    }
    
    const query = `
        query {
            shop {
                name
                description
            }
        }
    `;
    
    try {
        const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': token,
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.errors) {
            console.error('❌ Shopify API Error:', data.errors);
        } else {
            console.log('✅ Shopify connection successful!');
            console.log('Shop:', data.data.shop);
        }
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testShopifyConnection();