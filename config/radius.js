const mysql = require('mysql2/promise');
const { getSettingsWithCache } = require('./settingsManager');
const logger = require('./logger');

let pool = null;

function getRadiusPool() {
    if (!pool) {
        const settings = getSettingsWithCache();
        pool = mysql.createPool({
            host: settings.radius_host || 'localhost',
            user: settings.radius_user || 'radius',
            password: settings.radius_password || 'radpassword',
            database: settings.radius_database || 'radius',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

async function addRadiusUser(username, password, attributes = {}) {
    try {
        const pool = getRadiusPool();
        
        await pool.query(
            'DELETE FROM radcheck WHERE username = ?',
            [username]
        );
        
        await pool.query(
            'DELETE FROM radreply WHERE username = ?',
            [username]
        );
        
        await pool.query(
            'DELETE FROM radusergroup WHERE username = ?',
            [username]
        );
        
        await pool.query(
            'INSERT INTO radcheck (username, attribute, op, value) VALUES (?, "Cleartext-Password", ":=", ?)',
            [username, password]
        );
        
        for (const [attr, value] of Object.entries(attributes)) {
            await pool.query(
                'INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ":=", ?)',
                [username, attr, value]
            );
        }
        
        logger.info(`RADIUS user added: ${username}`);
        return { success: true, message: 'User added to RADIUS' };
    } catch (error) {
        logger.error(`Error adding RADIUS user: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function updateRadiusUser(username, password, attributes = {}) {
    try {
        const pool = getRadiusPool();
        
        if (password) {
            await pool.query(
                'UPDATE radcheck SET value = ? WHERE username = ? AND attribute = "Cleartext-Password"',
                [password, username]
            );
        }
        
        await pool.query(
            'DELETE FROM radreply WHERE username = ?',
            [username]
        );
        
        for (const [attr, value] of Object.entries(attributes)) {
            await pool.query(
                'INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ":=", ?)',
                [username, attr, value]
            );
        }
        
        logger.info(`RADIUS user updated: ${username}`);
        return { success: true, message: 'User updated in RADIUS' };
    } catch (error) {
        logger.error(`Error updating RADIUS user: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function deleteRadiusUser(username) {
    try {
        const pool = getRadiusPool();
        
        await pool.query('DELETE FROM radcheck WHERE username = ?', [username]);
        await pool.query('DELETE FROM radreply WHERE username = ?', [username]);
        await pool.query('DELETE FROM radusergroup WHERE username = ?', [username]);
        
        logger.info(`RADIUS user deleted: ${username}`);
        return { success: true, message: 'User deleted from RADIUS' };
    } catch (error) {
        logger.error(`Error deleting RADIUS user: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function getRadiusUser(username) {
    try {
        const pool = getRadiusPool();
        
        const [checkRows] = await pool.query(
            'SELECT * FROM radcheck WHERE username = ?',
            [username]
        );
        
        const [replyRows] = await pool.query(
            'SELECT * FROM radreply WHERE username = ?',
            [username]
        );
        
        const [groupRows] = await pool.query(
            'SELECT * FROM radusergroup WHERE username = ?',
            [username]
        );
        
        return {
            username,
            check: checkRows,
            reply: replyRows,
            groups: groupRows
        };
    } catch (error) {
        logger.error(`Error getting RADIUS user: ${error.message}`);
        return null;
    }
}

async function listRadiusUsers() {
    try {
        const pool = getRadiusPool();
        
        const [rows] = await pool.query(
            'SELECT DISTINCT username FROM radcheck ORDER BY username'
        );
        
        return rows.map(row => row.username);
    } catch (error) {
        logger.error(`Error listing RADIUS users: ${error.message}`);
        return [];
    }
}

async function addRadiusGroup(groupname, attributes = {}) {
    try {
        const pool = getRadiusPool();
        
        for (const [attr, value] of Object.entries(attributes)) {
            const op = attr === 'Auth-Type' ? ':=' : ':=';
            await pool.query(
                'INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (?, ?, ?, ?)',
                [groupname, attr, op, value]
            );
        }
        
        logger.info(`RADIUS group added: ${groupname}`);
        return { success: true, message: 'Group added to RADIUS' };
    } catch (error) {
        logger.error(`Error adding RADIUS group: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function addUserToGroup(username, groupname, priority = 1) {
    try {
        const pool = getRadiusPool();
        
        await pool.query(
            'INSERT INTO radusergroup (username, groupname, priority) VALUES (?, ?, ?)',
            [username, groupname, priority]
        );
        
        logger.info(`User ${username} added to group ${groupname}`);
        return { success: true, message: 'User added to group' };
    } catch (error) {
        logger.error(`Error adding user to group: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function getRadiusAccounting(username = null, limit = 100) {
    try {
        const pool = getRadiusPool();
        
        let query = 'SELECT * FROM radacct';
        let params = [];
        
        if (username) {
            query += ' WHERE username = ?';
            params.push(username);
        }
        
        query += ' ORDER BY acctstarttime DESC LIMIT ?';
        params.push(limit);
        
        const [rows] = await pool.query(query, params);
        return rows;
    } catch (error) {
        logger.error(`Error getting RADIUS accounting: ${error.message}`);
        return [];
    }
}

async function testRadiusConnection() {
    try {
        const pool = getRadiusPool();
        const [rows] = await pool.query('SELECT 1 as test');
        return { success: true, message: 'RADIUS database connection successful' };
    } catch (error) {
        logger.error(`RADIUS connection test failed: ${error.message}`);
        return { success: false, message: error.message };
    }
}

// Hotspot Profile Management with RADIUS
async function getHotspotProfilesRadius() {
    try {
        const pool = getRadiusPool();
        
        // Get all groups from radgroupreply
        const [rows] = await pool.query(`
            SELECT DISTINCT groupname,
                   GROUP_CONCAT(
                       CONCAT(attribute, ':', value) 
                       ORDER BY attribute 
                       SEPARATOR '|'
                   ) as attributes
            FROM radgroupreply 
            GROUP BY groupname
            ORDER BY groupname
        `);
        
        const profiles = rows.map(row => {
            const attributes = {};
            if (row.attributes) {
                row.attributes.split('|').forEach(attr => {
                    const [key, value] = attr.split(':');
                    attributes[key] = value;
                });
            }
            
            return {
                name: row.groupname,
                rateLimit: attributes['Mikrotik-Rate-Limit'] || null,
                sessionTimeout: attributes['Session-Timeout'] || null,
                idleTimeout: attributes['Idle-Timeout'] || null,
                attributes
            };
        });
        
        return profiles;
    } catch (error) {
        logger.error(`Error getting hotspot profiles from RADIUS: ${error.message}`);
        return [];
    }
}

async function addHotspotProfileRadius(profileData) {
    try {
        const pool = getRadiusPool();
        
        const { name, rateLimit, sessionTimeout, idleTimeout } = profileData;
        
        // Delete existing group attributes
        await pool.query('DELETE FROM radgroupreply WHERE groupname = ?', [name]);
        
        // Add new attributes
        const attributes = [];
        if (rateLimit) {
            attributes.push([name, 'Mikrotik-Rate-Limit', ':=', rateLimit]);
        }
        if (sessionTimeout) {
            attributes.push([name, 'Session-Timeout', ':=', sessionTimeout]);
        }
        if (idleTimeout) {
            attributes.push([name, 'Idle-Timeout', ':=', idleTimeout]);
        }
        
        // Add default attributes
        attributes.push([name, 'Auth-Type', ':=', 'Accept']);
        attributes.push([name, 'Service-Type', ':=', 'Framed-User']);
        
        for (const attr of attributes) {
            await pool.query(
                'INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (?, ?, ?, ?)',
                attr
            );
        }
        
        logger.info(`Hotspot profile added to RADIUS: ${name}`);
        return { success: true, message: 'Profile added to RADIUS' };
    } catch (error) {
        logger.error(`Error adding hotspot profile to RADIUS: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function updateHotspotProfileRadius(profileData) {
    try {
        const pool = getRadiusPool();
        
        const { name, rateLimit, sessionTimeout, idleTimeout } = profileData;
        
        // Delete existing group attributes
        await pool.query('DELETE FROM radgroupreply WHERE groupname = ?', [name]);
        
        // Add new attributes
        const attributes = [];
        if (rateLimit) {
            attributes.push([name, 'Mikrotik-Rate-Limit', ':=', rateLimit]);
        }
        if (sessionTimeout) {
            attributes.push([name, 'Session-Timeout', ':=', sessionTimeout]);
        }
        if (idleTimeout) {
            attributes.push([name, 'Idle-Timeout', ':=', idleTimeout]);
        }
        
        // Add default attributes
        attributes.push([name, 'Auth-Type', ':=', 'Accept']);
        attributes.push([name, 'Service-Type', ':=', 'Framed-User']);
        
        for (const attr of attributes) {
            await pool.query(
                'INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (?, ?, ?, ?)',
                attr
            );
        }
        
        logger.info(`Hotspot profile updated in RADIUS: ${name}`);
        return { success: true, message: 'Profile updated in RADIUS' };
    } catch (error) {
        logger.error(`Error updating hotspot profile in RADIUS: ${error.message}`);
        return { success: false, message: error.message };
    }
}

async function deleteHotspotProfileRadius(name) {
    try {
        const pool = getRadiusPool();
        
        await pool.query('DELETE FROM radgroupreply WHERE groupname = ?', [name]);
        await pool.query('DELETE FROM radusergroup WHERE groupname = ?', [name]);
        
        logger.info(`Hotspot profile deleted from RADIUS: ${name}`);
        return { success: true, message: 'Profile deleted from RADIUS' };
    } catch (error) {
        logger.error(`Error deleting hotspot profile from RADIUS: ${error.message}`);
        return { success: false, message: error.message };
    }
}

module.exports = {
    getRadiusPool,
    addRadiusUser,
    updateRadiusUser,
    deleteRadiusUser,
    getRadiusUser,
    listRadiusUsers,
    addRadiusGroup,
    addUserToGroup,
    getRadiusAccounting,
    testRadiusConnection,
    getHotspotProfilesRadius,
    addHotspotProfileRadius,
    updateHotspotProfileRadius,
    deleteHotspotProfileRadius
};
