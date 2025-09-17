# Ecco Living - Render Deployment

This folder contains the production-ready files for deploying to Render.

## Files included:
- `index.js` - Main Express server with admin interface
- `package.json` - Dependencies 
- `netlify-admin/` - Admin interface files

## Setup on Render:

1. Create a new Web Service on Render
2. Connect this repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Update the API URL in `netlify-admin/config.js` with your Render app URL

## Usage:
- Admin interface: `https://your-app.onrender.com/`
- API endpoints: `https://your-app.onrender.com/api/*`