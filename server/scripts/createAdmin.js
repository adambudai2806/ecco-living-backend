const bcrypt = require('bcryptjs');
const { connectDatabase, getDatabase } = require('../config/database');

async function createAdmin() {
    try {
        console.log('🔗 Connecting to database...');
        await connectDatabase();
        const knex = getDatabase();
        
        // Admin user details
        const adminEmail = 'adam@eccoliving.com.au';
        const adminPassword = 'Gabbie1512';
        const adminName = 'Adam - Ecco Living';
        
        // Check if admin already exists
        console.log('🔍 Checking if admin exists...');
        const existingAdmin = await knex('users').where({ email: adminEmail.toLowerCase() }).first();
        if (existingAdmin) {
            console.log('✅ Admin user already exists:', adminEmail);
            return existingAdmin;
        }
        
        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        // Create admin user
        console.log('👤 Creating admin user...');
        const [adminUser] = await knex('users').insert({
            name: adminName,
            email: adminEmail.toLowerCase(),
            password_hash: hashedPassword,
            role: 'admin',
            is_active: true,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date()
        }).returning('*');
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('👑 Role: admin');
        console.log('🆔 User ID:', adminUser.id);
        
        return adminUser;
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createAdmin()
        .then(() => {
            console.log('🎉 Admin creation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Admin creation failed:', error);
            process.exit(1);
        });
}

module.exports = createAdmin;