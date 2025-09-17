# Ecco Living Admin Panel - Netlify Deployment

This is a standalone admin panel for Ecco Living that can be deployed to Netlify.

## Quick Setup Options

### Option 1: Quick Test (Using your local backend)
1. Deploy this folder to Netlify
2. Keep your local dev server running (`npm run dev`)
3. Update `config.js` to point to your local machine's IP:
   ```javascript
   window.API_BASE_URL = 'http://YOUR-LOCAL-IP:3000/api';
   ```
4. Your client can access the admin panel via the Netlify URL

### Option 2: Production Setup (Recommended)
1. First deploy your backend to Railway/Render/Heroku
2. Update `config.js` with your backend URL:
   ```javascript
   window.API_BASE_URL = 'https://your-backend-url.com/api';
   ```
3. Deploy this folder to Netlify

## Files Included
- `index.html` - Main admin dashboard
- `add-product.html` - Product creation interface
- `js/` - All JavaScript functionality
- `config.js` - API configuration (MODIFY THIS)

## Configuration
Edit `config.js` and change the API_BASE_URL to point to your backend.

## Features
- ✅ Product Management (Add, Edit, Delete)
- ✅ Category Management
- ✅ File Upload (Images)
- ✅ Dashboard Analytics
- ✅ Responsive Design
- ✅ Authentication (bypassed in dev mode)

## Current Status
- Authentication is bypassed in development mode
- Ready for immediate use
- All CRUD operations functional
- Connects to your PostgreSQL database via API

## Deployment Steps
1. Zip this entire `netlify-admin` folder
2. Drag and drop to Netlify
3. Update `config.js` with your backend URL
4. Share the URL with your client

Your client can immediately start adding products!