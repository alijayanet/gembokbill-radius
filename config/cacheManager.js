const logger = require('./logger');

/**
 * Simple in-memory cache manager for API responses
 * Provides TTL (Time To Live) functionality and automatic cleanup
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
        this.cleanupInterval = 60 * 1000; // 1 minute cleanup interval
        
        // Start cleanup interval
        this.startCleanup();
        
        logger.info('🚀 CacheManager initialized with default TTL: 5 minutes');
    }

    /**
     * Set cache entry with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, {
            value,
            expiresAt,
            createdAt: Date.now()
        });
        
        logger.debug(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`);
    }

    /**
     * Get cache entry
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            logger.debug(`❌ Cache MISS: ${key}`);
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            logger.debug(`⏰ Cache EXPIRED: ${key}`);
            return null;
        }

        logger.debug(`✅ Cache HIT: ${key} (age: ${Date.now() - entry.createdAt}ms)`);
        return entry.value;
    }

    /**
     * Check if cache entry exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean} - True if exists and not expired
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Delete cache entry
     * @param {string} key - Cache key
     * @returns {boolean} - True if deleted
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug(`🗑️ Cache DELETE: ${key}`);
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info(`🧹 Cache CLEARED: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     * @returns {object} - Cache statistics
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        let totalAge = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredEntries++;
            } else {
                validEntries++;
                totalAge += now - entry.createdAt;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            averageAge: validEntries > 0 ? Math.round(totalAge / validEntries) : 0,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Get memory usage estimate
     * @returns {string} - Memory usage in MB
     */
    getMemoryUsage() {
        const used = process.memoryUsage();
        return `${Math.round(used.heapUsed / 1024 / 1024)}MB`;
    }

    /**
     * Start automatic cleanup of expired entries
     */
    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.debug(`🧹 Cache CLEANUP: ${cleanedCount} expired entries removed`);
        }
    }

    /**
     * Generate cache key for API calls
     * @param {string} service - Service name (genieacs, mikrotik, etc.)
     * @param {string} endpoint - API endpoint
     * @param {object} params - Request parameters
     * @returns {string} - Generated cache key
     */
    generateKey(service, endpoint, params = {}) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        return `${service}:${endpoint}${paramString ? `:${paramString}` : ''}`;
    }

    /**
     * Cache API response with automatic key generation
     * @param {string} service - Service name
     * @param {string} endpoint - API endpoint
     * @param {object} params - Request parameters
     * @param {any} response - API response
     * @param {number} ttl - Time to live in milliseconds
     */
    cacheApiResponse(service, endpoint, params, response, ttl = this.defaultTTL) {
        const key = this.generateKey(service, endpoint, params);
        this.set(key, response, ttl);
        return key;
    }

    /**
     * Get cached API response
     * @param {string} service - Service name
     * @param {string} endpoint - API endpoint
     * @param {object} params - Request parameters
     * @returns {any|null} - Cached response or null
     */
    getCachedApiResponse(service, endpoint, params) {
        const key = this.generateKey(service, endpoint, params);
        return this.get(key);
    }

    /**
     * Invalidate cache entries by pattern
     * @param {string} pattern - Pattern to match (supports wildcards)
     */
    invalidatePattern(pattern) {
        let invalidatedCount = 0;
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }

        if (invalidatedCount > 0) {
            logger.info(`🔄 Cache INVALIDATED: ${invalidatedCount} entries matching pattern: ${pattern}`);
        }
    }

    /**
     * Get cache entries by pattern
     * @param {string} pattern - Pattern to match
     * @returns {Array} - Array of matching cache entries
     */
    getEntriesByPattern(pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const entries = [];

        for (const [key, entry] of this.cache.entries()) {
            if (regex.test(key)) {
                entries.push({ key, ...entry });
            }
        }

        return entries;
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
