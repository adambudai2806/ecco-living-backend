# Shopify Integration Setup Guide

## 🛒 Complete Shopify Integration for Ecco Living

This guide will help you set up the Shopify integration for your Ecco Living website.

## 📋 Prerequisites

1. **Shopify Store** - You'll need a Shopify store (you can start with a free trial)
2. **Shopify App** - Create a private app or use the Storefront API
3. **API Access** - Get your Storefront Access Token and Admin API credentials

## 🚀 Setup Steps

### Step 1: Create Shopify Store
1. Go to [Shopify.com](https://shopify.com) and create a free trial store
2. Set up your store name (e.g., `ecco-living-au.myshopify.com`)
3. Complete the basic store setup

### Step 2: Enable Storefront API
1. In your Shopify admin, go to **Apps** → **Manage private apps**
2. Click **Create private app**
3. Fill in the app details:
   - **App name**: "Ecco Living Website Integration"
   - **Emergency developer email**: Your email
4. In the **Admin API** section, enable these permissions:
   - Products: Read and write
   - Orders: Read and write
   - Customers: Read and write
5. In the **Storefront API** section:
   - Check **Allow this app to access your storefront data**
   - Enable these permissions:
     - Read products, variants, and collections
     - Read and modify checkouts
     - Read customer tags
6. Click **Save**

### Step 3: Get API Credentials
After creating the app, you'll see:
- **API Key** (for Admin API)
- **API Secret** (for Admin API) 
- **Storefront access token** (for Storefront API)

### Step 4: Configure Environment Variables
Create/update your `.env` file:

```env
# Shopify Configuration
SHOPIFY_DOMAIN=your-store-name.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_api_key_here
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 5: Test Connection
1. Start your server: `npm run dev`
2. Visit: http://localhost:3000/api/shopify/test-connection
3. You should see a successful connection message

### Step 6: Sync Products to Shopify
1. Visit your admin panel: http://localhost:3000/admin
2. Go to **Products** section
3. Use the sync functionality to push your products to Shopify

## 🔧 Integration Features

### Frontend Integration
Your website now includes:
- **Shopping Cart** - Add products to cart locally
- **Shopify Checkout** - Redirect to Shopify for secure payment
- **Real-time Inventory** - Sync with Shopify stock levels
- **Order Management** - Orders handled by Shopify

### Backend API Endpoints
- `POST /api/shopify/checkout` - Create Shopify checkout
- `GET /api/shopify/product/:handle` - Get Shopify product
- `POST /api/shopify/sync-product/:id` - Sync local product to Shopify
- `POST /api/shopify/sync-all-products` - Sync all products
- `GET /api/shopify/test-connection` - Test Shopify connection

## 🧪 Testing with Free Product

Your free test product is already configured:
- **Product**: Free Sample - Premium Glass Cleaner
- **Price**: $0.00
- **Perfect for testing**: Cart → Checkout → Order flow

## 💡 How It Works

1. **Product Management**: You manage products in your admin panel
2. **Product Sync**: Products sync to Shopify automatically or manually
3. **Shopping Cart**: Users add items to cart on your website
4. **Checkout**: Cart redirects to Shopify's secure checkout
5. **Payment**: Shopify handles all payment processing
6. **Order Fulfillment**: Shopify manages orders and inventory

## 🎨 Customization

### Frontend Integration
Add to any product page:
```html
<!-- Include cart styles and scripts -->
<link rel="stylesheet" href="/assets/css/cart-modal.css">
<script src="/assets/js/shopify-cart.js"></script>

<!-- Add to cart button -->
<button class="add-to-cart-btn" 
        data-product-id="123"
        data-variant-id="shopify-variant-id"
        data-product-name="Product Name"
        data-price="29.99"
        data-image="/path/to/image.jpg">
    Add to Cart
</button>
```

### Cart Integration
The cart automatically handles:
- Local storage for cart persistence
- Add/remove/update quantities
- Checkout redirect to Shopify
- Mobile-responsive design

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS**: Always use HTTPS in production
3. **Webhook Verification**: Verify Shopify webhook signatures
4. **API Rate Limits**: Respect Shopify's API rate limits

## 🐛 Troubleshooting

### Common Issues:

**"Unable to connect to Shopify"**
- Check your SHOPIFY_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN
- Ensure Storefront API is enabled in your private app

**"Checkout creation failed"**
- Verify product exists in Shopify
- Check variant IDs are correct
- Ensure products are published and available

**"Product not found in Shopify"**
- Run product sync: POST /api/shopify/sync-product/:id
- Check product handle matches between systems

### Debugging:
- Check server logs for detailed error messages
- Use browser dev tools to inspect API responses
- Test API endpoints directly with curl or Postman

## 📈 Next Steps

1. **Set up webhooks** for real-time order notifications
2. **Customize checkout** with your branding
3. **Set up shipping** rates and zones in Shopify
4. **Configure payment** methods (Stripe, PayPal, etc.)
5. **Set up taxes** for Australian sales
6. **Add analytics** tracking (Google Analytics, Facebook Pixel)

## 🆘 Support

- **Shopify Documentation**: https://shopify.dev/
- **Storefront API**: https://shopify.dev/docs/storefront-api
- **Admin API**: https://shopify.dev/docs/admin-api

---

**You now have a complete e-commerce integration!** 🎉

Your custom website with Shopify's powerful checkout and order management system.