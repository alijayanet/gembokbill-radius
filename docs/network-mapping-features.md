# 🌍 Network Mapping Features - GEMBOK-BILLING

## 📋 **Overview**
Network Mapping adalah fitur canggih untuk visualisasi dan analisis jaringan customer ISP secara geografis. Fitur ini memungkinkan admin untuk memonitor distribusi customer, analisis coverage area, dan manajemen koordinat secara real-time.

## 🚀 **New Dependencies Added**

### **Backend Dependencies**
```json
{
  "geolib": "^3.3.4",        // Geolocation calculations
  "leaflet": "^1.9.4",       // Offline mapping capability
  "turf": "^6.5.0"           // Advanced mapping operations
}
```

### **Development Dependencies**
```json
{
  "leaflet-cli": "^1.0.0"    // Build optimization
}
```

## 🛠️ **Utility Functions (MappingUtils)**

### **Core Functions**
- `calculateDistance(coord1, coord2)` - Hitung jarak antar koordinat
- `isValidCoordinate(lat, lng)` - Validasi koordinat
- `getCenterCoordinate(coordinates)` - Dapatkan koordinat tengah
- `getBoundingBox(coordinates)` - Hitung bounding box

### **Advanced Functions**
- `createClusters(coordinates, maxDistance)` - Buat cluster berdasarkan jarak
- `calculateCoverageArea(coordinates)` - Hitung area coverage dalam km²
- `generateHeatmapData(coordinates)` - Generate data untuk heatmap
- `findNearestCoordinate(reference, coordinates)` - Cari koordinat terdekat

### **Helper Functions**
- `validateCustomerCoordinates(customer)` - Validasi & normalisasi koordinat
- `formatCoordinates(lat, lng)` - Format koordinat untuk display

## 🔌 **New API Endpoints**

### **1. GET /admin/billing/api/mapping/data**
**Description**: Ambil data mapping lengkap dengan statistik dan clusters

**Response**:
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "clusters": [...],
    "statistics": {
      "totalCustomers": 150,
      "validCoordinates": 120,
      "defaultCoordinates": 25,
      "invalidCoordinates": 5,
      "coverageArea": 25.5
    }
  }
}
```

### **2. GET /admin/billing/api/mapping/coverage**
**Description**: Analisis coverage area dengan density analysis

**Response**:
```json
{
  "success": true,
  "data": {
    "coverageArea": 25.5,
    "boundingBox": {...},
    "center": {...},
    "densityAnalysis": {
      "highDensity": 3,
      "mediumDensity": 8,
      "lowDensity": 15,
      "totalClusters": 26
    }
  }
}
```

### **3. PUT /admin/billing/api/mapping/customers/:id/coordinates**
**Description**: Update koordinat customer individual

**Request Body**:
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

### **4. POST /admin/billing/api/mapping/customers/bulk-coordinates**
**Description**: Bulk update koordinat multiple customers

**Request Body**:
```json
{
  "coordinates": [
    {
      "customer_id": 1,
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    {
      "customer_id": 2,
      "latitude": -6.2089,
      "longitude": 106.8457
    }
  ]
}
```

### **5. GET /admin/billing/api/mapping/export**
**Description**: Export data mapping dalam format JSON atau CSV

**Query Parameters**:
- `format`: `json` (default) atau `csv`

## 📊 **Enhanced Features**

### **1. Smart Clustering**
- **Auto-clustering** berdasarkan jarak (configurable radius)
- **Density analysis** untuk identifikasi area padat
- **Performance optimization** untuk large datasets

### **2. Coverage Analysis**
- **Area calculation** menggunakan Turf.js
- **Bounding box** untuk zoom optimization
- **Density mapping** untuk network planning

### **3. Coordinate Validation**
- **Real-time validation** saat input koordinat
- **Auto-correction** untuk koordinat invalid
- **Default coordinates** untuk customer tanpa koordinat

### **4. Export Capabilities**
- **JSON export** untuk data processing
- **CSV export** untuk spreadsheet analysis
- **Formatted coordinates** dalam multiple formats

## 🔧 **Installation & Setup**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Database Migration**
```bash
node scripts/add-coordinates-to-customers.js
```

### **3. Verify Installation**
```bash
# Test utility functions
node -e "
const MappingUtils = require('./utils/mappingUtils');
console.log('✅ MappingUtils loaded successfully');
console.log('Distance calculation:', MappingUtils.calculateDistance(
  {latitude: -6.2088, longitude: 106.8456},
  {latitude: -6.2089, longitude: 106.8457}
));
"
```

## 📱 **Frontend Integration**

### **1. Enhanced Map Controls**
- **Cluster visualization** dengan custom markers
- **Density indicators** untuk area analysis
- **Real-time statistics** update

### **2. Advanced Filtering**
- **Status-based filtering** (Online/Offline)
- **Package-based filtering** untuk customer segmentation
- **Location search** dengan coordinate validation

### **3. Interactive Features**
- **Click-to-edit** device information
- **Drag-and-drop** coordinate updates
- **Bulk coordinate import** via CSV

## 📈 **Performance Optimizations**

### **1. Efficient Clustering**
- **Lazy loading** untuk large datasets
- **Viewport-based** data loading
- **Memory management** untuk marker objects

### **2. Caching Strategy**
- **Coordinate validation** caching
- **Distance calculation** memoization
- **API response** caching

### **3. Database Optimization**
- **Spatial indexing** untuk coordinate queries
- **Batch operations** untuk bulk updates
- **Connection pooling** untuk concurrent requests

## 🚨 **Error Handling**

### **1. Coordinate Validation**
- **Invalid coordinate** detection
- **Range validation** (latitude: -90 to 90, longitude: -180 to 180)
- **Format validation** untuk decimal precision

### **2. API Error Responses**
- **Detailed error messages** dalam Bahasa Indonesia
- **HTTP status codes** yang appropriate
- **Logging** untuk debugging

### **3. Fallback Mechanisms**
- **Default coordinates** untuk invalid data
- **Graceful degradation** untuk missing data
- **Retry mechanisms** untuk failed operations

## 🔮 **Future Enhancements**

### **1. Advanced Mapping**
- **3D visualization** untuk building mapping
- **Satellite imagery** integration
- **Real-time traffic** data overlay

### **2. Analytics Dashboard**
- **Network performance** metrics
- **Customer density** heatmaps
- **Coverage optimization** suggestions

### **3. Mobile Integration**
- **GPS coordinate** capture
- **Offline mapping** capabilities
- **Mobile-optimized** interface

## 📝 **Usage Examples**

### **1. Basic Distance Calculation**
```javascript
const MappingUtils = require('./utils/mappingUtils');

const distance = MappingUtils.calculateDistanceKm(
  {latitude: -6.2088, longitude: 106.8456}, // Jakarta
  {latitude: -6.2089, longitude: 106.8457}  // Nearby point
);

console.log(`Distance: ${distance} km`);
```

### **2. Coverage Analysis**
```javascript
const coordinates = [
  {latitude: -6.2088, longitude: 106.8456},
  {latitude: -6.2089, longitude: 106.8457},
  {latitude: -6.2090, longitude: 106.8458}
];

const coverageArea = MappingUtils.calculateCoverageArea(coordinates);
console.log(`Coverage Area: ${coverageArea} km²`);
```

### **3. Cluster Creation**
```javascript
const clusters = MappingUtils.createClusters(coordinates, 2000); // 2km radius
console.log(`Created ${clusters.length} clusters`);
```

## ✅ **Testing**

### **1. Unit Tests**
```bash
# Test utility functions
npm test utils/mappingUtils.test.js
```

### **2. Integration Tests**
```bash
# Test API endpoints
npm test routes/adminBilling.test.js
```

### **3. Performance Tests**
```bash
# Test with large datasets
npm run test:performance
```

## 📚 **References**

- **Geolib Documentation**: https://github.com/manuelbieh/geolib
- **Leaflet.js Documentation**: https://leafletjs.com/
- **Turf.js Documentation**: https://turfjs.org/
- **OpenStreetMap**: https://www.openstreetmap.org/

---

**Version**: 2.1.0  
**Last Updated**: 2025-01-27  
**Author**: GEMBOK-BILLING Team
