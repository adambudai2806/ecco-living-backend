const fetch = require('node-fetch');
const shopifyConfig = require('../config/shopify');

class ShopifyService {
    constructor() {
        this.domain = shopifyConfig.shop.domain;
        this.storefrontToken = shopifyConfig.shop.storefrontAccessToken;
        this.adminToken = shopifyConfig.shop.adminAccessToken;
        this.storefrontEndpoint = `https://${this.domain}/api/2023-10/graphql.json`;
        this.adminEndpoint = `https://${this.domain}/admin/api/2023-10`;
    }

    // GraphQL query helper for Storefront API
    async storefrontQuery(query, variables = {}) {
        try {
            const response = await fetch(this.storefrontEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontToken,
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(`Shopify API Error: ${JSON.stringify(data.errors)}`);
            }
            
            return data;
        } catch (error) {
            console.error('Shopify Storefront API Error:', error);
            throw error;
        }
    }

    // REST API helper for Admin API
    async adminRequest(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': this.adminToken,
                }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.adminEndpoint}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`Shopify Admin API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Shopify Admin API Error:', error);
            throw error;
        }
    }

    // Create a new checkout
    async createCheckout(lineItems = []) {
        const mutation = `
            mutation checkoutCreate($input: CheckoutCreateInput!) {
                checkoutCreate(input: $input) {
                    checkout {
                        id
                        webUrl
                        totalPriceV2 {
                            amount
                            currencyCode
                        }
                        lineItems(first: 250) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                    checkoutUserErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                lineItems: lineItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                }))
            }
        };

        const response = await this.storefrontQuery(mutation, variables);
        
        if (response.data.checkoutCreate.checkoutUserErrors.length > 0) {
            throw new Error(`Checkout creation failed: ${JSON.stringify(response.data.checkoutCreate.checkoutUserErrors)}`);
        }
        
        return response.data.checkoutCreate.checkout;
    }

    // Add line items to existing checkout
    async addToCheckout(checkoutId, lineItems) {
        const mutation = `
            mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
                checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
                    checkout {
                        id
                        webUrl
                        totalPriceV2 {
                            amount
                            currencyCode
                        }
                        lineItems(first: 250) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                    checkoutUserErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            checkoutId,
            lineItems: lineItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }))
        };

        const response = await this.storefrontQuery(mutation, variables);
        
        if (response.data.checkoutLineItemsAdd.checkoutUserErrors.length > 0) {
            throw new Error(`Add to checkout failed: ${JSON.stringify(response.data.checkoutLineItemsAdd.checkoutUserErrors)}`);
        }
        
        return response.data.checkoutLineItemsAdd.checkout;
    }

    // Update checkout line items
    async updateCheckoutLineItems(checkoutId, lineItems) {
        const mutation = `
            mutation checkoutLineItemsUpdate($checkoutId: ID!, $lineItems: [CheckoutLineItemUpdateInput!]!) {
                checkoutLineItemsUpdate(checkoutId: $checkoutId, lineItems: $lineItems) {
                    checkout {
                        id
                        webUrl
                        totalPriceV2 {
                            amount
                            currencyCode
                        }
                        lineItems(first: 250) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                    checkoutUserErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            checkoutId,
            lineItems: lineItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                variantId: item.variantId
            }))
        };

        const response = await this.storefrontQuery(mutation, variables);
        
        if (response.data.checkoutLineItemsUpdate.checkoutUserErrors.length > 0) {
            throw new Error(`Checkout update failed: ${JSON.stringify(response.data.checkoutLineItemsUpdate.checkoutUserErrors)}`);
        }
        
        return response.data.checkoutLineItemsUpdate.checkout;
    }

    // Get product by handle
    async getProductByHandle(handle) {
        const query = `
            query getProduct($handle: String!) {
                product(handle: $handle) {
                    id
                    title
                    handle
                    description
                    images(first: 10) {
                        edges {
                            node {
                                originalSrc
                                altText
                            }
                        }
                    }
                    variants(first: 250) {
                        edges {
                            node {
                                id
                                title
                                availableForSale
                                priceV2 {
                                    amount
                                    currencyCode
                                }
                                compareAtPriceV2 {
                                    amount
                                    currencyCode
                                }
                            }
                        }
                    }
                }
            }
        `;

        const variables = { handle };
        const response = await this.storefrontQuery(query, variables);
        return response.data.product;
    }

    // Search products
    async searchProducts(query, first = 20) {
        const searchQuery = `
            query searchProducts($query: String!, $first: Int!) {
                products(first: $first, query: $query) {
                    edges {
                        node {
                            id
                            title
                            handle
                            description
                            images(first: 1) {
                                edges {
                                    node {
                                        originalSrc
                                        altText
                                    }
                                }
                            }
                            variants(first: 1) {
                                edges {
                                    node {
                                        id
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                        compareAtPriceV2 {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const variables = { query, first };
        const response = await this.storefrontQuery(searchQuery, variables);
        return response.data.products.edges.map(edge => edge.node);
    }

    // Create product in Shopify (Admin API)
    async createProduct(productData) {
        const product = {
            title: productData.name,
            body_html: productData.long_description || productData.description,
            vendor: productData.brand || 'Ecco Living',
            product_type: productData.category || 'General',
            handle: productData.slug,
            status: productData.status === 'published' ? 'active' : 'draft',
            images: productData.images ? productData.images.map(url => ({ src: url })) : [],
            variants: [{
                price: productData.price.toString(),
                compare_at_price: productData.sale_price ? productData.price.toString() : null,
                inventory_quantity: productData.stock_quantity || 0,
                inventory_management: productData.manage_stock ? 'shopify' : null,
                sku: productData.sku,
                weight: productData.weight || 0,
                weight_unit: 'kg'
            }],
            tags: Array.isArray(productData.tags) ? productData.tags.join(',') : ''
        };

        return await this.adminRequest('/products.json', 'POST', { product });
    }

    // Update product in Shopify (Admin API)
    async updateProduct(shopifyProductId, productData) {
        const product = {
            id: shopifyProductId,
            title: productData.name,
            body_html: productData.long_description || productData.description,
            vendor: productData.brand || 'Ecco Living',
            product_type: productData.category || 'General',
            handle: productData.slug,
            status: productData.status === 'published' ? 'active' : 'draft',
            tags: Array.isArray(productData.tags) ? productData.tags.join(',') : ''
        };

        return await this.adminRequest(`/products/${shopifyProductId}.json`, 'PUT', { product });
    }

    // Sync local product to Shopify
    async syncProductToShopify(localProduct) {
        try {
            // Check if product exists in Shopify by handle
            const existingProduct = await this.getProductByHandle(localProduct.slug);
            
            if (existingProduct) {
                // Update existing product
                console.log(`Updating existing Shopify product: ${localProduct.name}`);
                return await this.updateProduct(existingProduct.id, localProduct);
            } else {
                // Create new product
                console.log(`Creating new Shopify product: ${localProduct.name}`);
                return await this.createProduct(localProduct);
            }
        } catch (error) {
            console.error(`Failed to sync product ${localProduct.name} to Shopify:`, error);
            throw error;
        }
    }

    // Test connection to Shopify
    async testConnection() {
        try {
            const query = `
                query {
                    shop {
                        name
                        url
                        currencyCode
                    }
                }
            `;
            
            const response = await this.storefrontQuery(query);
            return response.data.shop;
        } catch (error) {
            console.error('Shopify connection test failed:', error);
            throw new Error('Unable to connect to Shopify. Please check your configuration.');
        }
    }
}

module.exports = new ShopifyService();