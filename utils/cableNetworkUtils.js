const geolib = require('geolib');

/**
 * Utility functions untuk Cable Network Management
 */
class CableNetworkUtils {
    
    /**
     * Hitung jarak kabel antara dua titik
     * @param {Object} point1 - {latitude, longitude}
     * @param {Object} point2 - {latitude, longitude}
     * @returns {number} Jarak dalam meter
     */
    static calculateCableDistance(point1, point2) {
        try {
            return geolib.getDistance(point1, point2);
        } catch (error) {
            console.error('Error calculating cable distance:', error);
            return 0;
        }
    }
    
    /**
     * Generate warna kabel berdasarkan status
     * @param {string} status - Status kabel (connected, disconnected, maintenance, damaged)
     * @returns {string} Hex color code
     */
    static getCableColor(status) {
        const colors = {
            'connected': '#28a745',      // Hijau
            'disconnected': '#dc3545',   // Merah
            'maintenance': '#ffc107',    // Kuning
            'damaged': '#6f42c1'         // Ungu
        };
        return colors[status] || '#6c757d'; // Default abu-abu
    }
    
    /**
     * Generate warna ODP berdasarkan kapasitas
     * @param {number} usedPorts - Port yang digunakan
     * @param {number} capacity - Kapasitas total ODP
     * @returns {string} Hex color code
     */
    static getODPColor(usedPorts, capacity) {
        const percentage = (usedPorts / capacity) * 100;
        
        if (percentage >= 90) return '#dc3545';      // Merah - hampir penuh
        if (percentage >= 70) return '#fd7e14';      // Orange - cukup penuh
        if (percentage >= 50) return '#ffc107';      // Kuning - setengah penuh
        return '#28a745';                            // Hijau - masih banyak
    }
    
    /**
     * Generate ikon ODP berdasarkan status
     * @param {string} status - Status ODP
     * @returns {string} Icon class
     */
    static getODPIcon(status) {
        const icons = {
            'active': 'bi-broadcast',
            'maintenance': 'bi-tools',
            'inactive': 'bi-power'
        };
        return icons[status] || 'bi-question-circle';
    }
    
    /**
     * Generate ikon kabel berdasarkan status
     * @param {string} status - Status kabel
     * @returns {string} Icon class
     */
    static getCableIcon(status) {
        const icons = {
            'connected': 'bi-wifi',
            'disconnected': 'bi-wifi-off',
            'maintenance': 'bi-tools',
            'damaged': 'bi-exclamation-triangle'
        };
        return icons[status] || 'bi-question-circle';
    }
    
    /**
     * Buat polyline untuk jalur kabel
     * @param {Array} coordinates - Array koordinat {latitude, longitude}
     * @param {string} status - Status kabel
     * @returns {Object} Leaflet polyline options
     */
    static createCablePolyline(coordinates, status) {
        const color = this.getCableColor(status);
        const weight = status === 'backbone' ? 4 : 2;
        const opacity = status === 'disconnected' ? 0.5 : 0.8;
        
        return {
            color: color,
            weight: weight,
            opacity: opacity,
            dashArray: status === 'maintenance' ? '10, 10' : null,
            className: `cable-route cable-${status}`
        };
    }
    
    /**
     * Buat marker untuk ODP
     * @param {Object} odp - Data ODP
     * @returns {Object} Leaflet marker options
     */
    static createODPMarker(odp) {
        const color = this.getODPColor(odp.used_ports, odp.capacity);
        const icon = this.getODPIcon(odp.status);
        
        return {
            color: color,
            icon: icon,
            radius: 8 + (odp.used_ports / odp.capacity) * 4, // Ukuran berdasarkan penggunaan
            className: `odp-marker odp-${odp.status}`
        };
    }
    
    /**
     * Hitung total panjang kabel dalam area
     * @param {Array} cableRoutes - Array cable routes
     * @returns {number} Total panjang dalam meter
     */
    static calculateTotalCableLength(cableRoutes) {
        try {
            return cableRoutes.reduce((total, route) => {
                return total + (parseFloat(route.cable_length) || 0);
            }, 0);
        } catch (error) {
            console.error('Error calculating total cable length:', error);
            return 0;
        }
    }
    
    /**
     * Analisis kapasitas ODP
     * @param {Array} odps - Array ODP data
     * @returns {Object} Analisis kapasitas
     */
    static analyzeODPCapacity(odps) {
        const analysis = {
            total: odps.length,
            totalCapacity: 0,
            totalUsed: 0,
            utilization: 0,
            critical: [], // ODP dengan kapasitas > 90%
            warning: [],  // ODP dengan kapasitas > 70%
            healthy: []   // ODP dengan kapasitas < 70%
        };
        
        odps.forEach(odp => {
            analysis.totalCapacity += odp.capacity;
            analysis.totalUsed += odp.used_ports;
            
            const percentage = (odp.used_ports / odp.capacity) * 100;
            
            if (percentage >= 90) {
                analysis.critical.push(odp);
            } else if (percentage >= 70) {
                analysis.warning.push(odp);
            } else {
                analysis.healthy.push(odp);
            }
        });
        
        analysis.utilization = analysis.totalCapacity > 0 ? 
            (analysis.totalUsed / analysis.totalCapacity) * 100 : 0;
            
        return analysis;
    }
    
    /**
     * Analisis status kabel
     * @param {Array} cableRoutes - Array cable routes
     * @returns {Object} Analisis status kabel
     */
    static analyzeCableStatus(cableRoutes) {
        const analysis = {
            total: cableRoutes.length,
            connected: 0,
            disconnected: 0,
            maintenance: 0,
            damaged: 0,
            healthPercentage: 0
        };
        
        cableRoutes.forEach(route => {
            switch (route.status) {
                case 'connected':
                    analysis.connected++;
                    break;
                case 'disconnected':
                    analysis.disconnected++;
                    break;
                case 'maintenance':
                    analysis.maintenance++;
                    break;
                case 'damaged':
                    analysis.damaged++;
                    break;
            }
        });
        
        analysis.healthPercentage = analysis.total > 0 ? 
            (analysis.connected / analysis.total) * 100 : 0;
            
        return analysis;
    }
    
    /**
     * Generate cluster untuk kabel yang berdekatan
     * @param {Array} cableRoutes - Array cable routes
     * @param {number} maxDistance - Jarak maksimal untuk clustering (meter)
     * @returns {Array} Array clusters
     */
    static createCableClusters(cableRoutes, maxDistance = 1000) {
        try {
            if (!cableRoutes || cableRoutes.length === 0) {
                return [];
            }
            
            const clusters = [];
            const processed = new Set();
            
            cableRoutes.forEach((route, index) => {
                if (processed.has(index)) return;
                
                const cluster = [route];
                processed.add(index);
                
                // Cari kabel lain yang berdekatan
                cableRoutes.forEach((otherRoute, otherIndex) => {
                    if (index === otherIndex || processed.has(otherIndex)) return;
                    
                    const distance = this.calculateCableDistance(
                        { latitude: route.customer_latitude, longitude: route.customer_longitude },
                        { latitude: otherRoute.customer_latitude, longitude: otherRoute.customer_longitude }
                    );
                    
                    if (distance <= maxDistance) {
                        cluster.push(otherRoute);
                        processed.add(otherIndex);
                    }
                });
                
                clusters.push({
                    center: this.getClusterCenter(cluster),
                    routes: cluster,
                    count: cluster.length,
                    radius: maxDistance / 2
                });
            });
            
            return clusters;
        } catch (error) {
            console.error('Error creating cable clusters:', error);
            return [];
        }
    }
    
    /**
     * Hitung center dari cluster kabel
     * @param {Array} routes - Array routes dalam cluster
     * @returns {Object} Koordinat center
     */
    static getClusterCenter(routes) {
        try {
            const coordinates = routes.map(route => ({
                latitude: route.customer_latitude,
                longitude: route.customer_longitude
            }));
            
            return geolib.getCenter(coordinates);
        } catch (error) {
            console.error('Error getting cluster center:', error);
            return { latitude: 0, longitude: 0 };
        }
    }
    
    /**
     * Format panjang kabel untuk display
     * @param {number} length - Panjang dalam meter
     * @returns {string} Formatted string
     */
    static formatCableLength(length) {
        if (length >= 1000) {
            return `${(length / 1000).toFixed(2)} km`;
        }
        return `${length.toFixed(0)} m`;
    }
    
    /**
     * Validasi koordinat ODP
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {boolean} True jika valid
     */
    static validateODPCoordinates(latitude, longitude) {
        try {
            return geolib.isValidCoordinate({ latitude, longitude });
        } catch (error) {
            return false;
        }
    }
}

module.exports = CableNetworkUtils;
