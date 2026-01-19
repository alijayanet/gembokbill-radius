// ========================================
// GENIEACS CONFIGURATION FIX
// ========================================

// ✅ FIXED: GenieACS Configuration untuk mengatasi TR-069 session error

// 1. Session Timeout Configuration
const sessionConfig = {
    // Increase session timeout
    sessionTimeout: 300000, // 5 minutes (default: 60000)
    
    // Connection timeout
    connectionTimeout: 60000, // 1 minute
    
    // Keep alive interval
    keepAliveInterval: 30000, // 30 seconds
    
    // Max retry attempts
    maxRetries: 3,
    
    // Retry delay
    retryDelay: 5000 // 5 seconds
};

// 2. Device-specific timeout settings
const deviceTimeouts = {
    // Huawei devices
    huawei: {
        sessionTimeout: 600000, // 10 minutes
        connectionTimeout: 120000, // 2 minutes
        keepAliveInterval: 60000 // 1 minute
    },
    
    // ZTE devices
    zte: {
        sessionTimeout: 480000, // 8 minutes
        connectionTimeout: 90000, // 1.5 minutes
        keepAliveInterval: 45000 // 45 seconds
    },
    
    // FiberHome devices
    fiberhome: {
        sessionTimeout: 360000, // 6 minutes
        connectionTimeout: 60000, // 1 minute
        keepAliveInterval: 30000 // 30 seconds
    },
    
    // Default for other devices
    default: {
        sessionTimeout: 300000, // 5 minutes
        connectionTimeout: 60000, // 1 minute
        keepAliveInterval: 30000 // 30 seconds
    }
};

// 3. Error handling configuration
const errorHandling = {
    // Retry on session termination
    retryOnTermination: true,
    
    // Max retry attempts
    maxRetryAttempts: 3,
    
    // Retry delay (exponential backoff)
    retryDelay: [5000, 10000, 20000], // 5s, 10s, 20s
    
    // Log level for debugging
    logLevel: 'debug',
    
    // Enable session monitoring
    enableSessionMonitoring: true
};

// 4. Network optimization
const networkConfig = {
    // TCP keep alive
    tcpKeepAlive: true,
    tcpKeepAliveInterval: 30000,
    tcpKeepAliveProbes: 3,
    
    // Socket options
    socketTimeout: 120000, // 2 minutes
    socketBufferSize: 65536, // 64KB
    
    // Connection pooling
    maxConnections: 100,
    connectionPoolSize: 10
};

// 5. Provision script optimization
const provisionConfig = {
    // Batch size for parameter updates
    batchSize: 50,
    
    // Delay between batches
    batchDelay: 1000, // 1 second
    
    // Parameter grouping
    groupParameters: true,
    
    // Skip invalid parameters
    skipInvalidParams: true,
    
    // Validate parameters before sending
    validateParams: true
};

// Export configuration
module.exports = {
    sessionConfig,
    deviceTimeouts,
    errorHandling,
    networkConfig,
    provisionConfig
};
