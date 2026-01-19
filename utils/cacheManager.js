const logger = require('../config/logger');

/**
 * Simple in-memory cache manager for improving performance
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, {
            value,
            expiry
        });
        
        // Log cache set operation
        logger.info(`[CACHE] Set key: ${key}, TTL: ${ttl}ms`);
        
        // Auto-cleanup expired entries periodically
        if (this.cache.size % 100 === 0) {
            this.cleanup();
        }
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            logger.debug(`[CACHE] Miss for key: ${key}`);
            return null;
        }
        
        if (Date.now() > entry.expiry) {
            logger.debug(`[CACHE] Expired for key: ${key}`);
            this.cache.delete(key);
            return null;
        }
        
        logger.debug(`[CACHE] Hit for key: ${key}`);
        return entry.value;
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        logger.info(`[CACHE] Deleted key: ${key}`);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info(`[CACHE] Cleared all entries (${size} items)`);
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        let expired = 0;
        const now = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                expired++;
            }
        }
        
        return {
            total: this.cache.size,
            expired,
            active: this.cache.size - expired
        };
    }

    /**
     * Cleanup expired cache entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            logger.info(`[CACHE] Cleanup removed ${cleaned} expired entries`);
        }
    }

    /**
     * Get cache keys
     * @returns {Array} Array of cache keys
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;