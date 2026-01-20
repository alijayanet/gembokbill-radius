const express = require('express');
const router = express.Router();
const radius = require('../config/radius');
const logger = require('../config/logger');
const db = require('../config/database');
const { getSettingsWithCache } = require('../config/settingsManager');
const { getVersionInfo, getVersionBadge } = require('../config/version-utils');
const mikrotik = require('../config/mikrotik');

router.get('/', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.redirect('/admin/login');
        }

        const testResult = await radius.testRadiusConnection();
        const users = await radius.listRadiusUsers();
        const appSettings = getSettingsWithCache();

        res.render('admin/radius-dashboard', {
            title: 'RADIUS Management',
            testResult,
            users,
            userCount: users.length,
            appSettings,
            versionInfo: getVersionInfo(),
            versionBadge: getVersionBadge()
        });
    } catch (error) {
        logger.error(`Error loading RADIUS dashboard: ${error.message}`);
        res.status(500).render('error', { error: 'Failed to load RADIUS dashboard' });
    }
});

router.get('/test-connection', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await radius.testRadiusConnection();
        res.json(result);
    } catch (error) {
        logger.error(`Error testing RADIUS connection: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const users = await radius.listRadiusUsers();
        res.json({ success: true, users });
    } catch (error) {
        logger.error(`Error listing RADIUS users: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/users/:username', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await radius.getRadiusUser(req.params.username);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        logger.error(`Error getting RADIUS user: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/users', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { username, password, profile_id, attributes = {} } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // If profile_id is provided, fetch profile and add its attributes
        if (profile_id) {
            try {
                const profile = await new Promise((resolve, reject) => {
                    db.get('SELECT * FROM radius_profiles WHERE id = ? AND is_active = 1', [profile_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (profile) {
                    // Add profile attributes
                    attributes['Mikrotik-Rate-Limit'] = profile.rate_limit || `${profile.download_speed}/${profile.upload_speed}`;
                    if (profile.burst_limit) {
                        attributes['Mikrotik-Burst-Limit'] = profile.burst_limit;
                    }
                    logger.info(`Applied profile "${profile.name}" to user "${username}"`);
                }
            } catch (error) {
                logger.error(`Error fetching profile: ${error.message}`);
            }
        }

        const result = await radius.addRadiusUser(username, password, attributes);
        res.json(result);
    } catch (error) {
        logger.error(`Error adding RADIUS user: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/users/:username', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { password, attributes = {} } = req.body;
        const result = await radius.updateRadiusUser(req.params.username, password, attributes);
        res.json(result);
    } catch (error) {
        logger.error(`Error updating RADIUS user: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/users/:username', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await radius.deleteRadiusUser(req.params.username);
        res.json(result);
    } catch (error) {
        logger.error(`Error deleting RADIUS user: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/groups', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const pool = radius.getRadiusPool();
        const [rows] = await pool.query('SELECT DISTINCT groupname FROM radgroupreply ORDER BY groupname');
        const groups = rows.map(row => row.groupname);
        res.json({ success: true, groups });
    } catch (error) {
        logger.error(`Error listing RADIUS groups: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/groups', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { groupname, attributes = {} } = req.body;

        if (!groupname) {
            return res.status(400).json({ success: false, message: 'Group name is required' });
        }

        const result = await radius.addRadiusGroup(groupname, attributes);
        res.json(result);
    } catch (error) {
        logger.error(`Error adding RADIUS group: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/users/:username/groups', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { groupname, priority = 1 } = req.body;

        if (!groupname) {
            return res.status(400).json({ success: false, message: 'Group name is required' });
        }

        const result = await radius.addUserToGroup(req.params.username, groupname, priority);
        res.json(result);
    } catch (error) {
        logger.error(`Error adding user to group: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/accounting', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { username, limit = 100 } = req.query;
        const sessions = await radius.getRadiusAccounting(username, parseInt(limit));
        res.json({ success: true, sessions });
    } catch (error) {
        logger.error(`Error getting RADIUS accounting: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/sync-customer/:customerId', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const customerId = req.params.customerId;

        const [customers] = await db.query(
            'SELECT * FROM customers WHERE id = ?',
            [customerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const customer = customers[0];

        if (!customer.radius_enabled) {
            return res.status(400).json({ success: false, message: 'RADIUS is not enabled for this customer' });
        }

        const radiusUsername = customer.radius_username || customer.pppoe_username;
        const radiusPassword = customer.radius_password;

        if (!radiusUsername || !radiusPassword) {
            return res.status(400).json({ success: false, message: 'RADIUS username or password not set' });
        }

        let attributes = {};

        if (customer.radius_attributes) {
            try {
                attributes = JSON.parse(customer.radius_attributes);
            } catch (e) {
                logger.error(`Error parsing radius_attributes: ${e.message}`);
            }
        }

        const result = await radius.addRadiusUser(radiusUsername, radiusPassword, attributes);

        if (result.success) {
            await db.query(
                'UPDATE customers SET radius_enabled = 1 WHERE id = ?',
                [customerId]
            );
        }

        res.json(result);
    } catch (error) {
        logger.error(`Error syncing customer to RADIUS: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/sync-all-customers', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const [customers] = await db.query(
            'SELECT * FROM customers WHERE radius_enabled = 1 AND (radius_username IS NOT NULL OR pppoe_username IS NOT NULL) AND radius_password IS NOT NULL'
        );

        let successCount = 0;
        let failureCount = 0;
        const errors = [];

        for (const customer of customers) {
            try {
                const radiusUsername = customer.radius_username || customer.pppoe_username;
                const radiusPassword = customer.radius_password;

                let attributes = {};
                if (customer.radius_attributes) {
                    try {
                        attributes = JSON.parse(customer.radius_attributes);
                    } catch (e) {
                        logger.error(`Error parsing radius_attributes for ${customer.username}: ${e.message}`);
                    }
                }

                const result = await radius.addRadiusUser(radiusUsername, radiusPassword, attributes);

                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                    errors.push({ customer: customer.username, error: result.message });
                }
            } catch (error) {
                failureCount++;
                errors.push({ customer: customer.username, error: error.message });
            }
        }

        res.json({
            success: true,
            summary: {
                total: customers.length,
                success: successCount,
                failure: failureCount
            },
            errors
        });
    } catch (error) {
        logger.error(`Error syncing all customers to RADIUS: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/profiles', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profiles = await db.query(
            'SELECT * FROM radius_profiles WHERE is_active = 1 ORDER BY priority'
        );

        res.json({ success: true, profiles });
    } catch (error) {
        logger.error(`Error getting RADIUS profiles: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/profiles', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, download_speed, upload_speed, rate_limit, burst_limit, priority = 1 } = req.body;

        if (!name || !download_speed || !upload_speed) {
            return res.status(400).json({ success: false, message: 'Name, download_speed, and upload_speed are required' });
        }

        await db.query(
            'INSERT INTO radius_profiles (name, download_speed, upload_speed, rate_limit, burst_limit, priority) VALUES (?, ?, ?, ?, ?, ?)',
            [name, download_speed, upload_speed, rate_limit, burst_limit, priority]
        );

        res.json({ success: true, message: 'Profile created successfully' });
    } catch (error) {
        logger.error(`Error creating RADIUS profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/profiles/:id', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profileId = req.params.id;
        const profile = await db.query(
            'SELECT * FROM radius_profiles WHERE id = ?',
            [profileId]
        );

        if (profile.length === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        res.json({ success: true, profile: profile[0] });
    } catch (error) {
        logger.error(`Error getting RADIUS profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/profiles/:id', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profileId = req.params.id;
        const { name, download_speed, upload_speed, rate_limit, burst_limit, priority } = req.body;

        if (!name || !download_speed || !upload_speed) {
            return res.status(400).json({ success: false, message: 'Name, download_speed, and upload_speed are required' });
        }

        await db.query(
            'UPDATE radius_profiles SET name = ?, download_speed = ?, upload_speed = ?, rate_limit = ?, burst_limit = ?, priority = ? WHERE id = ?',
            [name, download_speed, upload_speed, rate_limit, burst_limit, priority, profileId]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        logger.error(`Error updating RADIUS profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/profiles/:id', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profileId = req.params.id;
        
        const result = await db.query(
            'DELETE FROM radius_profiles WHERE id = ?',
            [profileId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        res.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting RADIUS profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get RADIUS settings
router.get('/settings', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const settings = getSettingsWithCache();
        const radiusSettings = {
            radius_host: settings.radius_host || 'localhost',
            radius_user: settings.radius_user || 'radius',
            radius_password: settings.radius_password || 'radpassword',
            radius_database: settings.radius_database || 'radius',
            isolir_radius_group: settings.isolir_radius_group || 'isolir',
            suspension_bandwidth_limit: settings.suspension_bandwidth_limit || '1k/1k'
        };

        res.json({ success: true, settings: radiusSettings });
    } catch (error) {
        logger.error(`Error getting RADIUS settings: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update RADIUS settings
router.put('/settings', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { radius_host, radius_user, radius_password, radius_database, isolir_radius_group, suspension_bandwidth_limit } = req.body;

        // Update settings.json
        const fs = require('fs');
        const settingsPath = './settings.json';
        
        let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        if (radius_host !== undefined) settings.radius_host = radius_host;
        if (radius_user !== undefined) settings.radius_user = radius_user;
        if (radius_password !== undefined) settings.radius_password = radius_password;
        if (radius_database !== undefined) settings.radius_database = radius_database;
        if (isolir_radius_group !== undefined) settings.isolir_radius_group = isolir_radius_group;
        if (suspension_bandwidth_limit !== undefined) settings.suspension_bandwidth_limit = suspension_bandwidth_limit;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        // Clear cache
        const settingsManager = require('../config/settingsManager');
        if (typeof settingsManager.clearCache === 'function') {
            settingsManager.clearCache();
        }

        logger.info('RADIUS settings updated successfully');
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        logger.error(`Error updating RADIUS settings: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get active hotspot users
router.get('/hotspot-users', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await mikrotik.getActiveHotspotUsers();
        res.json(result);
    } catch (error) {
        logger.error(`Error getting hotspot users: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Disconnect hotspot user
router.post('/hotspot-users/:username/disconnect', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const username = req.params.username;
        const result = await mikrotik.disconnectHotspotUser(username);
        res.json(result);
    } catch (error) {
        logger.error(`Error disconnecting hotspot user: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get hotspot profiles
router.get('/hotspot-profiles', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profiles = await radius.getHotspotProfilesRadius();
        res.json({ success: true, profiles });
    } catch (error) {
        logger.error(`Error getting hotspot profiles: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add hotspot profile
router.post('/hotspot-profiles', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, rateLimit, sessionTimeout, idleTimeout } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Profile name is required' });
        }

        const result = await radius.addHotspotProfileRadius({ name, rateLimit, sessionTimeout, idleTimeout });
        res.json(result);
    } catch (error) {
        logger.error(`Error adding hotspot profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update hotspot profile
router.put('/hotspot-profiles/:name', async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const name = req.params.name;
        const { rateLimit, sessionTimeout, idleTimeout } = req.body;

        const result = await radius.updateHotspotProfileRadius({ name, rateLimit, sessionTimeout, idleTimeout });
        res.json(result);
    } catch (error) {
        logger.error(`Error updating hotspot profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete hotspot profile
router.delete('/hotspot-profiles/:name', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const name = req.params.name;
        const result = await radius.deleteHotspotProfileRadius(name);
        res.json(result);
    } catch (error) {
        logger.error(`Error deleting hotspot profile: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// RADIUS Clients Management
router.get('/clients', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const [clients] = await db.query(
            'SELECT * FROM radius_clients ORDER BY created_at DESC'
        );
        res.json({ success: true, clients });
    } catch (error) {
        logger.error(`Error getting RADIUS clients: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/clients', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, ipaddr, secret, shortname, nas_type } = req.body;

        if (!name || !ipaddr || !secret) {
            return res.status(400).json({ success: false, message: 'Name, IP address, and secret are required' });
        }

        // Check if IP address already exists
        try {
            const result = await db.query(
                'SELECT id, name FROM radius_clients WHERE ipaddr = ?',
                [ipaddr]
            );

            // Debug logging
            logger.info(`Checking IP ${ipaddr}, result:`, JSON.stringify(result));

            // Check if result exists and has data
            if (result && result[0] && result[0].length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `IP address ${ipaddr} already exists as client "${result[0][0].name}". Please delete the existing client first or use a different IP address.`,
                    existingClient: result[0][0]
                });
            }
        } catch (queryError) {
            logger.error(`Error checking existing client: ${queryError.message}`);
            // Continue with insert even if check fails
        }

        const [result] = await db.query(
            'INSERT INTO radius_clients (name, ipaddr, secret, shortname, nas_type) VALUES (?, ?, ?, ?, ?)',
            [name, ipaddr, secret, shortname || name, nas_type || 'other']
        );

        res.json({ success: true, message: 'RADIUS client added successfully', id: result.insertId });
    } catch (error) {
        logger.error(`Error adding RADIUS client: ${error.message}`);
        
        // Handle specific database errors
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                success: false,
                message: 'IP address already exists. Please use a different IP address or delete the existing client first.'
            });
        }
        
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/clients/:id', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const id = req.params.id;
        const { name, ipaddr, secret, shortname, nas_type, is_active } = req.body;

        const [result] = await db.query(
            'UPDATE radius_clients SET name = ?, ipaddr = ?, secret = ?, shortname = ?, nas_type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, ipaddr, secret, shortname, nas_type, is_active !== undefined ? (is_active ? 1 : 0) : 1, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        res.json({ success: true, message: 'RADIUS client updated successfully' });
    } catch (error) {
        logger.error(`Error updating RADIUS client: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/clients/:id', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const id = req.params.id;

        const [result] = await db.query('DELETE FROM radius_clients WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        res.json({ success: true, message: 'RADIUS client deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting RADIUS client: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/clients/generate-config', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const fs = require('fs');
        const path = require('path');

        // Get all active clients
        const [clients] = await db.query(
            'SELECT * FROM radius_clients WHERE is_active = 1 ORDER BY name'
        );

        // Generate clients.conf content
        let config = '# Gembok Bill RADIUS Clients\n';
        config += '# Auto-generated from database\n';
        config += '# Format: client <name> { ipaddr = <ip> secret = <secret> }\n\n';

        clients.forEach(client => {
            config += `client ${client.name} {\n`;
            config += `    ipaddr = ${client.ipaddr}\n`;
            config += `    secret = ${client.secret}\n`;
            config += `    shortname = ${client.shortname}\n`;
            config += `    nas_type = ${client.nas_type}\n`;
            config += `}\n\n`;
        });

        // Write to clients.conf
        const clientsConfPath = '/etc/freeradius/3.0/clients.conf';
        fs.writeFileSync(clientsConfPath, config, 'utf8');

        // Restart FreeRADIUS
        const { exec } = require('child_process');
        exec('systemctl restart freeradius', (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error restarting FreeRADIUS: ${error.message}`);
                return res.status(500).json({ success: false, message: 'Config generated but failed to restart FreeRADIUS' });
            }
            res.json({ success: true, message: 'RADIUS clients config generated and FreeRADIUS restarted successfully', clientsGenerated: clients.length });
        });
    } catch (error) {
        logger.error(`Error generating RADIUS clients config: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Diagnostic endpoint to check database state
router.get('/clients/diagnostic', async (req, res) => {
    try {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get all clients
        const [clients] = await db.query(
            'SELECT id, name, ipaddr, secret, shortname, nas_type, is_active, created_at FROM radius_clients ORDER BY id'
        );

        res.json({ success: true, clients, count: clients.length });
    } catch (error) {
        logger.error(`Error getting diagnostic info: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
