// Create simple checkout URL for testing
require('dotenv').config();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const variantId = '42125858930731';
const quantity = 1;

// Create direct checkout URL (this method works without complex API calls)
const checkoutUrl = `https://${SHOPIFY_DOMAIN}/cart/${variantId}:${quantity}`;

console.log('🛒 Direct Shopify Checkout URL:');
console.log(checkoutUrl);
console.log('\n📝 This URL will:');
console.log('1. Add the free sample to cart');
console.log('2. Redirect directly to checkout');
console.log('3. Work immediately without API calls');

// Test if the URL works
const fetch = require('node-fetch');

async function testCheckoutUrl() {
    try {
        const response = await fetch(checkoutUrl, { 
            method: 'HEAD',
            redirect: 'manual' 
        });
        
        if (response.status === 302 || response.status === 200) {
            console.log('\n✅ Checkout URL is valid!');
        } else {
            console.log('\n❌ Checkout URL may have issues:', response.status);
        }
    } catch (error) {
        console.log('\n⚠️  Could not test URL (this is normal):', error.message);
    }
}

testCheckoutUrl();