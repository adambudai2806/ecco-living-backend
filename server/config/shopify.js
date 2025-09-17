const shop = {
    domain: process.env.SHOPIFY_DOMAIN || 'your-shop-name.myshopify.com',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET
};

const config = {
    shop,
    
    // Shopify Storefront API endpoint
    storefrontApi: {
        version: '2023-10',
        endpoint: function() {
            return `https://${shop.domain}/api/${this.version}/graphql.json`;
        }
    },
    
    // Shopify Admin API endpoint  
    adminApi: {
        version: '2023-10',
        endpoint: function() {
            return `https://${shop.domain}/admin/api/${this.version}`;
        }
    }
};

module.exports = config;