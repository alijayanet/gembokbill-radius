const geolib = require('geolib');
const turf = require('turf');

/**
 * Utility functions untuk Network Mapping
 */
class MappingUtils {
    
    /**
     * Hitung jarak antara dua koordinat (dalam meter)
     * @param {Object} coord1 - {latitude, longitude}
     * @param {Object} coord2 - {latitude, longitude}
     * @returns {number} Jarak dalam meter
     */
    static calculateDistance(coord1, coord2) {
        try {
            return geolib.getDistance(coord1, coord2);
        } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
        }
    }
    
    /**
     * Hitung jarak dalam kilometer
     * @param {Object} coord1 - {latitude, longitude}
     * @param {Object} coord2 - {latitude, longitude}
     * @returns {number} Jarak dalam kilometer
     */
    static calculateDistanceKm(coord1, coord2) {
        const distanceM = this.calculateDistance(coord1, coord2);
        return (distanceM / 1000).toFixed(2);
    }
    
    /**
     * Cek apakah koordinat valid
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {boolean} True jika valid
     */
    static isValidCoordinate(latitude, longitude) {
        try {
            return geolib.isValidCoordinate({ latitude, longitude });
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Dapatkan koordinat tengah dari array koordinat
     * @param {Array} coordinates - Array of {latitude, longitude}
     * @returns {Object} Koordinat tengah
     */
    static getCenterCoordinate(coordinates) {
        try {
            if (!coordinates || coordinates.length === 0) {
                return { latitude: -6.2088, longitude: 106.8456 }; // Default Jakarta
            }
            
            return geolib.getCenter(coordinates);
        } catch (error) {
            console.error('Error getting center coordinate:', error);
            return { latitude: -6.2088, longitude: 106.8456 };
        }
    }
    
    /**
     * Hitung bounding box dari array koordinat
     * @param {Array} coordinates - Array of {latitude, longitude}
     * @returns {Object} Bounding box {north, south, east, west}
     */
    static getBoundingBox(coordinates) {
        try {
            if (!coordinates || coordinates.length === 0) {
                return {
                    north: -6.2088,
                    south: -6.2088,
                    east: 106.8456,
                    west: 106.8456
                };
            }
            
            return geolib.getBounds(coordinates);
        } catch (error) {
            console.error('Error getting bounding box:', error);
            return {
                north: -6.2088,
                south: -6.2088,
                east: 106.8456,
                west: 106.8456
            };
        }
    }
    
    /**
     * Cari koordinat terdekat dari titik referensi
     * @param {Object} referencePoint - {latitude, longitude}
     * @param {Array} coordinates - Array of {latitude, longitude}
     * @returns {Object} Koordinat terdekat dan jarak
     */
    static findNearestCoordinate(referencePoint, coordinates) {
        try {
            if (!coordinates || coordinates.length === 0) {
                return null;
            }
            
            const nearest = geolib.findNearest(referencePoint, coordinates);
            const distance = this.calculateDistance(referencePoint, nearest);
            
            return {
                coordinate: nearest,
                distance: distance,
                distanceKm: (distance / 1000).toFixed(2)
            };
        } catch (error) {
            console.error('Error finding nearest coordinate:', error);
            return null;
        }
    }
    
    /**
     * Buat cluster dari koordinat berdasarkan jarak
     * @param {Array} coordinates - Array of {latitude, longitude}
     * @param {number} maxDistance - Jarak maksimal dalam meter untuk clustering
     * @returns {Array} Array of clusters
     */
    static createClusters(coordinates, maxDistance = 1000) {
        try {
            if (!coordinates || coordinates.length === 0) {
                return [];
            }
            
            const clusters = [];
            const processed = new Set();
            
            coordinates.forEach((coord, index) => {
                if (processed.has(index)) return;
                
                const cluster = [coord];
                processed.add(index);
                
                coordinates.forEach((otherCoord, otherIndex) => {
                    if (index === otherIndex || processed.has(otherIndex)) return;
                    
                    const distance = this.calculateDistance(coord, otherCoord);
                    if (distance <= maxDistance) {
                        cluster.push(otherCoord);
                        processed.add(otherIndex);
                    }
                });
                
                if (cluster.length > 1) {
                    const center = this.getCenterCoordinate(cluster);
                    clusters.push({
                        center: center,
                        coordinates: cluster,
                        count: cluster.length,
                        radius: maxDistance / 2
                    });
                } else {
                    clusters.push({
                        center: coord,
                        coordinates: [coord],
                        count: 1,
                        radius: 0
                    });
                }
            });
            
            return clusters;
        } catch (error) {
            console.error('Error creating clusters:', error);
            return [];
        }
    }
    
    /**
     * Hitung area coverage dari koordinat (dalam km²)
     * @param {Array} coordinates - Array of {latitude, longitude}
     * @returns {number} Area dalam km²
     */
    static calculateCoverageArea(coordinates) {
        try {
            if (!coordinates || coordinates.length < 3) {
                return 0;
            }
            
            // Buat polygon dari koordinat
            const polygon = turf.polygon([coordinates.map(coord => [coord.longitude, coord.latitude])]);
            const area = turf.area(polygon);
            
            // Convert dari m² ke km²
            return (area / 1000000).toFixed(2);
        } catch (error) {
            console.error('Error calculating coverage area:', error);
            return 0;
        }
    }
    
    /**
     * Generate heatmap data dari koordinat
     * @param {Array} coordinates - Array of {latitude, longitude, weight}
     * @returns {Array} Heatmap data untuk Leaflet
     */
    static generateHeatmapData(coordinates) {
        try {
            if (!coordinates || coordinates.length === 0) {
                return [];
            }
            
            return coordinates.map(coord => {
                return {
                    lat: coord.latitude,
                    lng: coord.longitude,
                    value: coord.weight || 1
                };
            });
        } catch (error) {
            console.error('Error generating heatmap data:', error);
            return [];
        }
    }
    
    /**
     * Validasi dan normalisasi koordinat customer
     * @param {Object} customer - Customer object dengan latitude/longitude
     * @returns {Object} Customer dengan koordinat yang valid
     */
    static validateCustomerCoordinates(customer) {
        try {
            if (!customer.latitude || !customer.longitude) {
                // Gunakan koordinat default Jakarta
                customer.latitude = -6.2088;
                customer.longitude = 106.8456;
                customer.coordinateStatus = 'default';
            } else if (!this.isValidCoordinate(customer.latitude, customer.longitude)) {
                // Koordinat tidak valid, gunakan default
                customer.latitude = -6.2088;
                customer.longitude = 106.8456;
                customer.coordinateStatus = 'invalid';
            } else {
                customer.coordinateStatus = 'valid';
            }
            
            return customer;
        } catch (error) {
            console.error('Error validating customer coordinates:', error);
            customer.latitude = -6.2088;
            customer.longitude = 106.8456;
            customer.coordinateStatus = 'error';
            return customer;
        }
    }
    
    /**
     * Format koordinat untuk display
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {string} Formatted coordinate string
     */
    static formatCoordinates(latitude, longitude) {
        try {
            const latDir = latitude >= 0 ? 'N' : 'S';
            const lngDir = longitude >= 0 ? 'E' : 'W';
            
            const latAbs = Math.abs(latitude);
            const lngAbs = Math.abs(longitude);
            
            const latDeg = Math.floor(latAbs);
            const latMin = Math.floor((latAbs - latDeg) * 60);
            const latSec = ((latAbs - latDeg - latMin / 60) * 3600).toFixed(2);
            
            const lngDeg = Math.floor(lngAbs);
            const lngMin = Math.floor((lngAbs - lngDeg) * 60);
            const lngSec = ((lngAbs - lngDeg - lngMin / 60) * 3600).toFixed(2);
            
            return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
        } catch (error) {
            console.error('Error formatting coordinates:', error);
            return `${latitude}, ${longitude}`;
        }
    }
}

module.exports = MappingUtils;
