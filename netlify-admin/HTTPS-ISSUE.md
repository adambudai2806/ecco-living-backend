# HTTPS to HTTP Connection Issue

## The Problem
Netlify serves your admin panel over HTTPS, but your local backend runs on HTTP. Modern browsers block HTTPS sites from making requests to HTTP backends for security reasons.

## Quick Solution: Use Localhost Admin
Instead of deploying to Netlify, open the admin panel locally:

1. **Open locally**: `http://localhost:3000/admin`
2. **Login with**: 
   - Email: `adam@eccoliving.com.au`
   - Password: `Gabbie1512`

This bypasses the HTTPS/HTTP issue since both are on localhost.

## Proper Solution: Deploy Backend to Cloud

### Option 1: Railway (Recommended)
1. Go to https://railway.app
2. Connect your GitHub repo
3. Deploy the backend
4. Update `config.js` with the HTTPS Railway URL
5. Redeploy to Netlify

### Option 2: Render
1. Go to https://render.com  
2. Connect your GitHub repo
3. Deploy the backend
4. Update `config.js` with the HTTPS Render URL
5. Redeploy to Netlify

## Current Workaround
Your backend is running persistently on your local machine. Your client can:

1. **Use local admin**: `http://localhost:3000/admin` (if on same network)
2. **Or wait for cloud deployment** (recommended for production)

## Login Credentials
- **Email**: `adam@eccoliving.com.au`
- **Password**: `Gabbie1512`