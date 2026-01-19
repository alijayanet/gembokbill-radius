# 🔗 GenieACS - Network Mapping Integration

## 📋 **Overview**
Dokumen ini menjelaskan integrasi lengkap antara sistem GenieACS (ONU Device Management) dengan fitur Network Mapping GEMBOK-BILLING. Integrasi ini memungkinkan admin untuk memvisualisasikan device ONU secara geografis dengan koordinat customer yang terintegrasi.

## 🎯 **Tujuan Integrasi**

### **1. Device Location Mapping**
- **Visualisasi geografis** device ONU berdasarkan koordinat customer
- **Real-time status** monitoring (Online/Offline)
- **Network topology** analysis berdasarkan distribusi device

### **2. Customer-Device Association**
- **Linking customer** dengan device ONU melalui multiple methods
- **Coordinate sharing** antara customer dan device
- **Unified view** untuk network management

### **3. Operational Efficiency**
- **Quick device location** untuk troubleshooting
- **Coverage analysis** untuk network planning
- **Customer service** improvement

## 🔌 **API Endpoints Baru**

### **1. GET /admin/genieacs/api/mapping/devices**
**Description**: Ambil semua device GenieACS dengan koordinat customer

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "devices": [...],                    // Semua devices
    "devicesWithCoords": [...],          // Devices dengan koordinat
    "devicesWithoutCoords": [...],       // Devices tanpa koordinat
    "statistics": {
      "totalDevices": 150,
      "devicesWithCoords": 120,
      "devicesWithoutCoords": 30,
      "onlineDevices": 110,
      "offlineDevices": 40
    },
    "coordinateSources": {
      "pppoe_username": 80,
      "device_tag": 25,
      "serial_number": 15
    }
  }
}
```

**Device Object Structure**:
```json
{
  "id": "device_id_123",
  "serialNumber": "ABCD1234",
  "model": "ONU-123",
  "lastInform": "2025-01-27 10:30:00",
  "pppoeUsername": "customer123",
  "ssid": "WiFi-Customer123",
  "password": "password123",
  "userKonek": "3",
  "rxPower": "-19.74",
  "tag": "6281947215703",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "coordinateSource": "pppoe_username",
  "customerId": 123,
  "customerName": "John Doe",
  "customerPhone": "6281947215703",
  "status": "Online"
}
```

### **2. PUT /admin/genieacs/api/mapping/devices/:deviceId/coordinates**
**Description**: Update koordinat device berdasarkan customer ID

**Request Body**:
```json
{
  "customerId": 123,
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

### **3. POST /admin/genieacs/api/mapping/devices/bulk-coordinates**
**Description**: Bulk update koordinat multiple devices

**Request Body**:
```json
{
  "deviceCoordinates": [
    {
      "deviceId": "device_123",
      "customerId": 123,
      "latitude": -6.2088,
      "longitude": 106.8456
    }
  ]
}
```

## 🔍 **Coordinate Mapping Logic**

### **1. Priority-based Customer Search**

#### **Priority 1: PPPoE Username**
```javascript
// Cari customer berdasarkan PPPoE username
const pppoeUsername = getParameterWithPaths(device, parameterPaths.pppUsername);
if (pppoeUsername && pppoeUsername !== '-') {
  customer = await billingManager.getCustomerByUsername(pppoeUsername);
  coordinateSource = 'pppoe_username';
}
```

#### **Priority 2: Device Tag**
```javascript
// Cari customer berdasarkan device tag (phone number)
const deviceTags = device.Tags || device._tags || [];
for (const tag of deviceTags) {
  customer = await billingManager.getCustomerByPhone(tag);
  if (customer) {
    coordinateSource = 'device_tag';
    break;
  }
}
```

#### **Priority 3: Serial Number**
```javascript
// Cari customer berdasarkan serial number
const serialNumber = device.DeviceID?.SerialNumber || device._id;
if (serialNumber) {
  customer = await billingManager.getCustomerBySerialNumber(serialNumber);
  if (customer) {
    coordinateSource = 'serial_number';
  }
}
```

### **2. Coordinate Source Classification**

| Source | Description | Priority | Reliability |
|--------|-------------|----------|-------------|
| `pppoe_username` | Customer PPPoE username match | 1 | ⭐⭐⭐⭐⭐ |
| `device_tag` | Device tag (phone number) match | 2 | ⭐⭐⭐⭐ |
| `serial_number` | Serial number match | 3 | ⭐⭐⭐ |
| `none` | No coordinate found | 4 | ⭐ |

## 🗺️ **Frontend Integration**

### **1. Enhanced Map Display**

#### **Customer Markers (Green)**
- **Source**: Billing system coordinates
- **Data**: Customer information, package, status
- **Actions**: View customer details

#### **ONU Device Markers (Blue/Red)**
- **Source**: GenieACS + Customer coordinates
- **Data**: Device info, customer info, status
- **Actions**: Edit device, edit coordinates

### **2. Real-time Statistics**

#### **Coordinate Statistics**
```javascript
// Statistik koordinat
const devicesWithCoords = data.statistics.devicesWithCoords;
const devicesWithoutCoords = data.statistics.devicesWithoutCoords;

// Update stats
updateStats('totalONU', totalDevices);
updateStats('onlineONU', onlineDevices);
updateStats('offlineONU', offlineDevices);
```

#### **Source Distribution**
```javascript
// Distribusi sumber koordinat
const sources = data.coordinateSources;
const pppoeCount = sources.pppoe_username;
const tagCount = sources.device_tag;
const serialCount = sources.serial_number;
```

### **3. Interactive Features**

#### **Device Popup Information**
```html
<div class="text-center">
  <h6><strong>ONU Device</strong></h6>
  <p><strong>Serial:</strong> ${device.serialNumber}</p>
  <p><strong>Customer:</strong> ${device.customerName}</p>
  <p><strong>Source:</strong> ${device.coordinateSource}</p>
  <button onclick="editDevice('${device.id}')">Edit Device</button>
  <button onclick="editCustomerCoordinates(${device.customerId})">Edit Koordinat</button>
</div>
```

#### **Coordinate Editing**
```javascript
// Edit koordinat customer
function editCustomerCoordinates(customerId, currentLat, currentLng) {
  const newLat = prompt('Latitude baru:', currentLat);
  const newLng = prompt('Longitude baru:', currentLng);
  
  if (validateCoordinates(newLat, newLng)) {
    updateCustomerCoordinates(customerId, newLat, newLng);
  }
}
```

## 🔧 **Implementation Details**

### **1. Database Integration**

#### **Customer Table Structure**
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  phone TEXT,
  username TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  -- ... other fields
);
```

#### **Coordinate Validation**
```javascript
// Validasi koordinat
function validateCoordinates(lat, lng) {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}
```

### **2. Error Handling**

#### **Device Not Found**
```javascript
try {
  customer = await billingManager.getCustomerByUsername(pppoeUsername);
} catch (error) {
  console.log(`Customer not found for PPPoE username: ${pppoeUsername}`);
  // Continue to next search method
}
```

#### **Coordinate Update Failure**
```javascript
try {
  const result = await billingManager.updateCustomerCoordinates(customerId, coords);
  if (result) {
    showToast('Koordinat berhasil diperbarui', 'success');
  }
} catch (error) {
  showToast('Gagal update koordinat', 'error');
}
```

## 📊 **Performance Optimization**

### **1. Efficient Data Loading**
```javascript
// Load data secara parallel
const [customersResponse, onuResponse] = await Promise.all([
  fetch('/admin/billing/api/customers'),
  fetch('/admin/genieacs/api/mapping/devices')
]);
```

### **2. Smart Filtering**
```javascript
// Filter devices yang punya koordinat
const devicesWithCoords = onuData.data.devicesWithCoords;
const devicesWithoutCoords = onuData.data.devicesWithoutCoords;

// Hanya render devices dengan koordinat
addONUMarkers(devicesWithCoords);
```

### **3. Caching Strategy**
```javascript
// Cache device data untuk performance
let deviceCache = new Map();

function getCachedDevice(deviceId) {
  if (deviceCache.has(deviceId)) {
    return deviceCache.get(deviceId);
  }
  // Fetch from API if not cached
}
```

## 🚨 **Troubleshooting**

### **1. Common Issues**

#### **Device Tidak Muncul di Map**
- **Cause**: Device tidak punya koordinat
- **Solution**: Update koordinat customer melalui billing system

#### **Koordinat Tidak Update**
- **Cause**: Customer tidak ditemukan
- **Solution**: Pastikan PPPoE username, tag, atau serial number match

#### **Status Device Salah**
- **Cause**: Last inform time calculation error
- **Solution**: Check GenieACS connection dan device data

### **2. Debug Information**

#### **Enable Debug Logging**
```javascript
// Debug coordinate mapping
console.log('Device mapping:', {
  deviceId: device._id,
  pppoeUsername,
  deviceTags,
  serialNumber,
  foundCustomer: customer,
  coordinateSource
});
```

#### **Coordinate Source Analysis**
```javascript
// Analisis sumber koordinat
const sourceAnalysis = {
  total: devices.length,
  withCoords: devices.filter(d => d.latitude).length,
  withoutCoords: devices.filter(d => !d.latitude).length,
  sources: {
    pppoe: devices.filter(d => d.coordinateSource === 'pppoe_username').length,
    tag: devices.filter(d => d.coordinateSource === 'device_tag').length,
    serial: devices.filter(d => d.coordinateSource === 'serial_number').length
  }
};
```

## 🔮 **Future Enhancements**

### **1. Advanced Mapping Features**
- **Heatmap visualization** berdasarkan device density
- **Coverage area calculation** menggunakan device coordinates
- **Network topology mapping** dengan connection lines

### **2. Real-time Updates**
- **WebSocket integration** untuk live device status
- **Push notifications** untuk device offline
- **Auto-refresh** koordinat dan status

### **3. Analytics Dashboard**
- **Device performance metrics** berdasarkan lokasi
- **Customer satisfaction analysis** berdasarkan coverage
- **Network optimization suggestions**

## ✅ **Testing & Validation**

### **1. API Testing**
```bash
# Test mapping devices endpoint
curl -X GET "http://localhost:3003/admin/genieacs/api/mapping/devices" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test coordinate update
curl -X PUT "http://localhost:3003/admin/genieacs/api/mapping/devices/DEVICE_ID/coordinates" \
  -H "Content-Type: application/json" \
  -d '{"customerId": 123, "latitude": -6.2088, "longitude": 106.8456}'
```

### **2. Frontend Testing**
```javascript
// Test coordinate mapping
const testDevice = {
  pppoeUsername: 'testuser',
  Tags: ['6281947215703'],
  DeviceID: { SerialNumber: 'TEST123' }
};

// Test customer search priority
const customer = await findCustomerForDevice(testDevice);
console.log('Found customer:', customer);
```

## 📚 **References**

- **GenieACS Documentation**: https://docs.genieacs.com/
- **Network Mapping API**: `/admin/genieacs/api/mapping/devices`
- **Billing System Integration**: Customer coordinate management
- **Leaflet.js Integration**: Map visualization

---

**Version**: 2.1.0  
**Last Updated**: 2025-01-27  
**Integration Status**: ✅ Fully Integrated  
**Author**: GEMBOK-BILLING Team
