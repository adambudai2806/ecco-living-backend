// Admin Panel Configuration
// Modify this file to point to your backend API

// Option 1: Use your local network IP (for Netlify to access your local backend)
window.API_BASE_URL = 'http://172.19.232.45:3000/api'; // Your computer's local network IP

// Option 2: For local development, use localhost
// window.API_BASE_URL = 'http://localhost:3000/api';

// Option 3: For production with deployed backend
// window.API_BASE_URL = 'https://your-ecco-living-backend.railway.app/api';

console.log('🔗 Admin panel configured to use API:', window.API_BASE_URL);