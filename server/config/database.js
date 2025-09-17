const knex = require('knex');
const knexConfig = require('../database/knexfile');

let db = null;

// Mock database for when no real database is configured
const mockDb = {
    async raw(query) {
        return { rows: [] };
    }
};

const connectDatabase = async () => {
    // If DATABASE_URL is provided, use real PostgreSQL database
    if (process.env.DATABASE_URL) {
        try {
            console.log('🔗 Connecting to Neon PostgreSQL database...');
            
            const config = knexConfig[process.env.NODE_ENV || 'development'];
            db = knex(config);
            
            // Test the connection
            await db.raw('SELECT 1');
            console.log('✅ Connected to Neon PostgreSQL database successfully');
            
            return db;
        } catch (error) {
            console.error('❌ Failed to connect to Neon PostgreSQL:', error.message);
            console.log('🔄 Falling back to mock database for development');
            db = mockDb;
            return mockDb;
        }
    } else {
        console.log('Using mock database for development');
        db = mockDb;
        return mockDb;
    }
};

const getDatabase = () => {
    return db || mockDb;
};

const closeDatabase = async () => {
    if (db && typeof db.destroy === 'function') {
        await db.destroy();
        console.log('✅ PostgreSQL database connection closed');
    } else {
        console.log('Mock database closed');
    }
};

const checkDatabaseHealth = async () => {
    try {
        if (db && typeof db.raw === 'function') {
            await db.raw('SELECT 1');
            return true;
        }
        return true; // Mock database is always "healthy"
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};

const transaction = async (callback) => {
    if (db && typeof db.transaction === 'function') {
        return await db.transaction(callback);
    } else {
        return await callback(mockDb);
    }
};

module.exports = {
    connectDatabase,
    getDatabase,
    closeDatabase,
    checkDatabaseHealth,
    transaction
};