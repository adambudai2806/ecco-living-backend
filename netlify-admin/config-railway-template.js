// Admin Panel Configuration - Railway HTTPS Backend
// Replace YOUR_RAILWAY_URL with your actual Railway deployment URL

// STEP 1: Deploy to Railway and get your HTTPS URL
// STEP 2: Replace the URL below with your Railway URL
// STEP 3: Rename this file to config.js
// STEP 4: Redeploy to Netlify

window.API_BASE_URL = 'https://YOUR_RAILWAY_URL.up.railway.app/api';

// Example of what your URL should look like:
// window.API_BASE_URL = 'https://ecco-living-backend-production-abc123.up.railway.app/api';

console.log('🔗 Admin panel configured for Railway backend:', window.API_BASE_URL);

// This will fix the HTTPS -> HTTP blocking issue
// ✅ Netlify (HTTPS) -> Railway (HTTPS) = No browser blocking
// ✅ Full admin functionality 
// ✅ Secure connection