// ========================================
// GENIEACS BATCH CONFIGURATION
// Mengatasi error "too_many_commits"
// ========================================

// ✅ BATCH CONFIGURATION untuk mengurangi commits
const batchConfig = {
    // Batch size untuk parameter updates
    batchSize: 15,           // Reduced from 50 to 15
    batchDelay: 3000,        // 3 seconds delay between batches
    
    // Parameter grouping
    groupParameters: true,
    
    // Skip invalid parameters
    skipInvalidParams: true,
    
    // Validate parameters before sending
    validateParams: true,
    
    // Max commits per session
    maxCommitsPerSession: 50,
    
    // Session timeout
    sessionTimeout: 300000,   // 5 minutes
    
    // Retry configuration
    maxRetries: 2,
    retryDelay: 5000,
    
    // Error handling
    continueOnError: true,
    logErrors: true
};

// ✅ PARAMETER GROUPING untuk mengurangi commits
const parameterGroups = {
    // Group 1: Essential device info (low frequency)
    deviceInfo: {
        frequency: 'daily',
        parameters: [
            'InternetGatewayDevice.DeviceInfo.HardwareVersion',
            'InternetGatewayDevice.DeviceInfo.SoftwareVersion',
            'InternetGatewayDevice.DeviceInfo.UpTime'
        ]
    },
    
    // Group 2: WiFi configuration (medium frequency)
    wifiConfig: {
        frequency: 'hourly',
        parameters: [
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSID',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.PreSharedKey.1.KeyPassphrase',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.Enable'
        ]
    },
    
    // Group 3: WiFi advanced (low frequency)
    wifiAdvanced: {
        frequency: 'daily',
        parameters: [
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.BeaconType',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AutoChannelEnable',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.Channel',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.TransmitPower'
        ]
    },
    
    // Group 4: Associated devices (high frequency)
    associatedDevices: {
        frequency: 'minutes',
        parameters: [
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceBandWidth',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceRssi',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceIPAddress',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceMACAddress'
        ]
    },
    
    // Group 5: WAN configuration (medium frequency)
    wanConfig: {
        frequency: 'hourly',
        parameters: [
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Name',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.ConnectionType',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.NATEnabled'
        ]
    },
    
    // Group 6: Host information (medium frequency)
    hostInfo: {
        frequency: 'minutes',
        parameters: [
            'InternetGatewayDevice.LANDevice.*.Hosts.Host.*.HostName',
            'InternetGatewayDevice.LANDevice.*.Hosts.Host.*.IPAddress',
            'InternetGatewayDevice.LANDevice.*.Hosts.Host.*.MACAddress',
            'InternetGatewayDevice.LANDevice.*.Hosts.Host.*.InterfaceType'
        ]
    }
};

// ✅ DEVICE-SPECIFIC OPTIMIZATION
const deviceOptimization = {
    // Huawei devices - reduce parameters
    huawei: {
        maxParametersPerBatch: 10,
        essentialParameters: [
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_SERVICELIST',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_VLAN',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_HW_RSSI',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_HW_Noise'
        ],
        skipParameters: [
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.Lan2Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.Lan3Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.Lan4Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.SSID2Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.SSID3Enable',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.SSID4Enable'
        ]
    },
    
    // ZTE devices - minimal parameters
    zte: {
        maxParametersPerBatch: 8,
        essentialParameters: [
            'InternetGatewayDevice.LANDevice.*.WLANConfiguration.*.AssociatedDevice.*.X_ZTE-COM_AssociatedDeviceName',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_ZTE-COM_ServiceList',
            'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_ZTE-COM_VLANID'
        ]
    },
    
    // FiberHome devices - essential only
    fiberhome: {
        maxParametersPerBatch: 6,
        essentialParameters: [
            'InternetGatewayDevice.X_FH_ACL.Enable',
            'InternetGatewayDevice.X_FH_FireWall.REMOTEACCEnable',
            'InternetGatewayDevice.X_FH_Remoteweblogin.webloginenable'
        ]
    }
};

// ✅ ERROR HANDLING CONFIGURATION
const errorHandling = {
    // Retry configuration
    retryOnTooManyCommits: true,
    maxRetryAttempts: 3,
    retryDelay: [5000, 10000, 20000], // Exponential backoff
    
    // Fallback configuration
    fallbackToMinimalParams: true,
    minimalParamSet: [
        'InternetGatewayDevice.DeviceInfo.HardwareVersion',
        'InternetGatewayDevice.DeviceInfo.SoftwareVersion',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSID',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.PreSharedKey.1.KeyPassphrase'
    ],
    
    // Logging configuration
    logLevel: 'warn',
    logTooManyCommits: true,
    logParameterCount: true
};

// ✅ SESSION MANAGEMENT
const sessionManagement = {
    // Session limits
    maxSessionDuration: 300000, // 5 minutes
    maxCommitsPerSession: 50,
    maxParametersPerSession: 200,
    
    // Session cleanup
    cleanupOnError: true,
    resetSessionOnTooManyCommits: true,
    
    // Session monitoring
    monitorSessionHealth: true,
    alertOnHighCommitCount: true,
    commitCountThreshold: 40
};

// Export configuration
module.exports = {
    batchConfig,
    parameterGroups,
    deviceOptimization,
    errorHandling,
    sessionManagement
};
