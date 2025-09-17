// Simple Shopify integration server
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const { createStorefrontApiClient } = require('@shopify/storefront-api-client');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Shopify configuration
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// Create Shopify client
const client = createStorefrontApiClient({
    storeDomain: `https://${SHOPIFY_DOMAIN}`,
    apiVersion: '2024-10',
    publicAccessToken: STOREFRONT_TOKEN
});

// GraphQL helper
async function shopifyQuery(query, variables = {}) {
    try {
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(`Shopify API Error: ${JSON.stringify(data.errors)}`);
        }
        
        return data;
    } catch (error) {
        console.error('Shopify API Error:', error);
        throw error;
    }
}

// Test connection endpoint
app.get('/api/shopify/test-connection', async (req, res) => {
    try {
        const query = `
            query {
                shop {
                    name
                    description
                }
            }
        `;
        
        const response = await client.request(query);
        
        res.json({
            success: true,
            message: 'Successfully connected to Shopify',
            shop: response.data.shop
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create checkout endpoint
app.post('/api/shopify/checkout', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items array is required'
            });
        }

        const mutation = `
            mutation cartCreate($input: CartInput!) {
                cartCreate(input: $input) {
                    cart {
                        id
                        checkoutUrl
                        totalQuantity
                        cost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        lines(first: 250) {
                            edges {
                                node {
                                    id
                                    quantity
                                    merchandise {
                                        ... on ProductVariant {
                                            id
                                            title
                                            product {
                                                title
                                            }
                                            price {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        // Create cart with the actual items from cart
        const validatedItems = items.map(item => ({
            merchandiseId: item.variantId,
            quantity: parseInt(item.quantity)
        }));

        const variables = {
            input: {
                lines: validatedItems
            }
        };

        const response = await client.request(mutation, { variables });
        
        console.log('Shopify checkout response:', JSON.stringify(response, null, 2));
        
        if (response.data?.cartCreate?.userErrors?.length > 0) {
            throw new Error(`Cart creation failed: ${JSON.stringify(response.data.cartCreate.userErrors)}`);
        }
        
        const cart = response.data?.cartCreate?.cart;

        res.json({
            success: true,
            checkout: {
                id: cart.id,
                webUrl: cart.checkoutUrl,
                totalPrice: cart.cost?.totalAmount,
                lineItems: cart.lines?.edges?.map(edge => edge.node) || []
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', shopify: 'Ready' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🛒 Shopify server running on http://localhost:${PORT}`);
    console.log(`📋 Test connection: http://localhost:${PORT}/api/shopify/test-connection`);
    console.log(`🏪 Shop: ${SHOPIFY_DOMAIN}`);
});