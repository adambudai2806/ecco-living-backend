// Mock Redis for development
const mockRedis = {
    isReady: true
};

const initializeRedis = async () => {
    console.log('Using mock Redis for development');
    return mockRedis;
};

const getRedisClient = () => {
    return mockRedis;
};

const isRedisConnected = () => {
    return false; // Disabled for development
};

const closeRedis = async () => {
    console.log('Mock Redis closed');
};

const cache = {
    set: async (key, value, expireInSeconds = 3600) => {
        return true;
    },
    get: async (key) => {
        return null;
    },
    delete: async (key) => {
        return true;
    },
    deletePattern: async (pattern) => {
        return true;
    },
    exists: async (key) => {
        return false;
    },
    expire: async (key, expireInSeconds) => {
        return true;
    }
};

const session = {
    set: async (sessionId, sessionData, expireInSeconds = 86400) => {
        return true;
    },
    get: async (sessionId) => {
        return null;
    },
    delete: async (sessionId) => {
        return true;
    },
    extend: async (sessionId, expireInSeconds = 86400) => {
        return true;
    }
};

const rateLimiter = {
    checkLimit: async (identifier, limit, windowSeconds) => {
        return { allowed: true, remaining: limit };
    }
};

module.exports = {
    initializeRedis,
    getRedisClient,
    isRedisConnected,
    closeRedis,
    cache,
    session,
    rateLimiter
};