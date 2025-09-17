// Test admin login with common development credentials
require('dotenv').config();

const commonCredentials = [
    { email: 'admin@eccoliving.com.au', password: 'admin123' },
    { email: 'admin@eccoliving.com.au', password: 'password' },
    { email: 'admin@eccoliving.com.au', password: 'admin' },
    { email: 'admin@localhost', password: 'admin' },
    { email: 'admin@admin.com', password: 'admin' }
];

console.log('🔐 Common development admin credentials to try:');
console.log('');
console.log('Admin Panel URL: http://localhost:3000/admin');
console.log('');

commonCredentials.forEach((cred, index) => {
    console.log(`${index + 1}. Email: ${cred.email}`);
    console.log(`   Password: ${cred.password}`);
    console.log('');
});

console.log('💡 If none work, the admin system may need initialization.');
console.log('   Check if your main server (port 3000) is running first.');

// Check what's in the environment
console.log('📋 Environment admin email:', process.env.ADMIN_EMAIL || 'Not set');
console.log('📋 App URL:', process.env.APP_URL || 'Not set');