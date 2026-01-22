const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const { getSetting } = require('./settingsManager');
const path = require('path');
const fs = require('fs');

/**
 * Unified Database Wrapper for Gembok Bill
 * Supports both SQLite (current) and MySQL (upcoming)
 */
class Database {
    constructor() {
        this.dbType = null;
        this.pool = null; // MySQL pool
        this.sqliteDb = null; // SQLite instance
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        // Force reload settings to get latest db_type
        this.dbType = getSetting('db_type', 'sqlite');

        if (this.dbType === 'mysql') {
            try {
                const config = {
                    host: getSetting('db_host', 'localhost'),
                    user: getSetting('db_user', 'root'),
                    password: getSetting('db_password', ''),
                    database: getSetting('db_name', 'gembok_bill'),
                    waitForConnections: true,
                    connectionLimit: 20,
                    queueLimit: 0,
                    enableKeepAlive: true,
                    keepAliveInitialDelay: 0
                };
                this.pool = mysql.createPool(config);
                console.log('📡 [DB] MySQL Connection Pool Initialized');
            } catch (err) {
                console.error('❌ [DB] Failed to connect to MySQL:', err.message);
                // Fallback to SQLite if MySQL fails? No, better let it throw so user knows.
                throw err;
            }
        } else {
            const dbPath = path.join(__dirname, '../data/billing.db');
            const dataDir = path.dirname(dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.sqliteDb = new sqlite3.Database(dbPath);

            // Enable foreign keys for SQLite
            this.sqliteDb.run("PRAGMA foreign_keys = ON");
            console.log('📁 [DB] SQLite Database Initialized');
        }

        this.isInitialized = true;
    }

    /**
     * Get multiple rows. Supports both Promise and Callback styles.
     */
    async query(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        await this.init();

        const promise = (async () => {
            if (this.dbType === 'mysql') {
                const [rows] = await this.pool.execute(sql, params);
                return rows;
            } else {
                return new Promise((resolve, reject) => {
                    this.sqliteDb.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
            }
        })();

        if (callback) {
            promise.then(res => callback(null, res)).catch(err => callback(err));
        }
        return promise;
    }

    /**
     * Get single row. Supports both Promise and Callback styles.
     */
    async get(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        await this.init();

        const promise = (async () => {
            if (this.dbType === 'mysql') {
                const [rows] = await this.pool.execute(sql, params);
                return rows[0] || null;
            } else {
                return new Promise((resolve, reject) => {
                    this.sqliteDb.get(sql, params, (err, row) => {
                        if (err) reject(err);
                        else resolve(row || null);
                    });
                });
            }
        })();

        if (callback) {
            promise.then(res => callback(null, res)).catch(err => callback(err));
        }
        return promise;
    }

    /**
     * Execute DML (Insert/Update/Delete). Supports both Promise and Callback styles.
     */
    async execute(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        await this.init();

        const promise = (async () => {
            if (this.dbType === 'mysql') {
                // Skip PRAGMA commands for MySQL
                if (sql.trim().toUpperCase().startsWith('PRAGMA')) {
                    return { lastID: 0, changes: 0 };
                }
                
                // Skip SQLite-specific transaction commands for MySQL
                if (sql.trim().toUpperCase().startsWith('BEGIN IMMEDIATE TRANSACTION') ||
                    sql.trim().toUpperCase().startsWith('BEGIN TRANSACTION') ||
                    sql.trim().toUpperCase().startsWith('COMMIT') ||
                    sql.trim().toUpperCase().startsWith('ROLLBACK')) {
                    return { lastID: 0, changes: 0 };
                }
                
                let finalSql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
                finalSql = finalSql.replace(/INSERT OR REPLACE/gi, 'REPLACE');
                finalSql = finalSql.replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT');
                
                // Convert SQLite date/time functions to MySQL
                finalSql = finalSql.replace(/DATE\('now'\)/gi, 'CURRENT_DATE()');
                finalSql = finalSql.replace(/DATETIME\('now'\)/gi, 'NOW()');
                finalSql = finalSql.replace(/'now'/gi, 'NOW()');
                
                // Convert SQLite string concatenation operator (||) to MySQL CONCAT function
                // This handles various patterns like:
                // - 'prefix' || column || 'suffix'
                // - column || 'suffix'
                // - 'prefix' || column
                // - column1 || column2
                const convertConcatenation = (match) => {
                    // Split by || and trim whitespace
                    const parts = match.split(/\|\|/).map(p => p.trim());
                    // Wrap in CONCAT() and join with commas
                    return `CONCAT(${parts.join(', ')})`;
                };
                
                // Match patterns with || operator
                // This regex matches: 'string' || 'string' OR 'string' || column OR column || 'string' OR column || column
                finalSql = finalSql.replace(/'[^']*'\s*\|\|\s*'[^']*'|'[^']*'\s*\|\|\s*[a-zA-Z_][a-zA-Z0-9_]*|[a-zA-Z_][a-zA-Z0-9_]*\s*\|\|\s*'|[a-zA-Z_][a-zA-Z0-9_]*\s*\|\|\s*[a-zA-Z_][a-zA-Z0-9_]*/g, convertConcatenation);

                const [result] = await this.pool.execute(finalSql, params);
                return {
                    lastID: result.insertId,
                    changes: result.affectedRows
                };
            } else {
                return new Promise((resolve, reject) => {
                    this.sqliteDb.run(sql, params, function (err) {
                        if (err) reject(err);
                        else resolve({
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    });
                });
            }
        })();

        if (callback) {
            promise.then(res => callback.call(res, null)).catch(err => callback(err));
        }
        return promise;
    }

    /**
     * Run multiple statements in a transaction
     */
    async transaction(commands) {
        await this.init();
        if (this.dbType === 'mysql') {
            const connection = await this.pool.getConnection();
            try {
                await connection.beginTransaction();
                const results = [];
                for (const cmd of commands) {
                    const [res] = await connection.execute(cmd.sql, cmd.params || []);
                    results.push(res);
                }
                await connection.commit();
                return results;
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } else {
            return new Promise((resolve, reject) => {
                this.sqliteDb.serialize(async () => {
                    try {
                        this.sqliteDb.run("BEGIN TRANSACTION");
                        const results = []; // Keep results for consistency with MySQL transaction
                        for (const cmd of commands) {
                            await new Promise((res, rej) => {
                                this.sqliteDb.run(cmd.sql, cmd.params || [], function (err) {
                                    if (err) rej(err);
                                    else res({ lastID: this.lastID, changes: this.changes });
                                });
                            });
                        }
                        this.sqliteDb.run("COMMIT", (err) => {
                            if (err) reject(err);
                            else resolve(results); // Resolve with results, though SQLite run doesn't return much
                        });
                    } catch (err) {
                        this.sqliteDb.run("ROLLBACK");
                        reject(err);
                    }
                });
            });
        }
    }

    // Standard sqlite3 alias
    run(sql, params, callback) {
        return this.execute(sql, params, callback);
    }

    // Alias for query
    all(sql, params, callback) {
        return this.query(sql, params, callback);
    }
}

module.exports = new Database();
