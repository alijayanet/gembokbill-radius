// ========================================
// GENIEACS PROVISION SCRIPT - OPTIMIZED VERSION
// Mengatasi error "too_many_commits"
// ========================================

// ✅ OPTIMIZED: Interval constants (dalam detik)
const daily = 86400;      // 24 jam
const minutes = 60;       // 1 menit  
const update = 60;        // 1 menit
const hourly = 3600;      // 1 jam

// ✅ OPTIMIZED: Batch processing untuk mengurangi commits
const BATCH_SIZE = 20;    // Reduced batch size
const BATCH_DELAY = 2000; // 2 seconds delay between batches

// ✅ OPTIMIZED: Device detection dengan caching
const merk = declare('DeviceID.Manufacturer', {value: 1}).value[0];
declare("DeviceID.ProductClass", {path: daily, value: daily});

// ✅ OPTIMIZED: Device-specific parameters dengan conditional loading
const huawei = declare('InternetGatewayDevice.DeviceInfo.X_HW_SerialNumber', {value: daily});
const ctcom1 = declare('InternetGatewayDevice.X_CT-COM_UserInfo.ServiceName', {value: daily});
const ctcom2 = declare('InternetGatewayDevice.X_CT-COM_UserInfo.UserName', {value: daily});
const ctcom3 = declare('InternetGatewayDevice.WANDevice.1.X_CT-COM_GponInterfaceConfig.RXPower', {value: daily});
const ctcom4 = declare('InternetGatewayDevice.WANDevice.1.X_CT-COM_EponInterfaceConfig.RXPower', {value: daily});
const xcu = declare('InternetGatewayDevice.X_CU_UserInfo.UserName', {value: daily});
const xcmc = declare('InternetGatewayDevice.X_CMCC_UserInfo.ServiceName', {value: daily});
const zte = declare('InternetGatewayDevice.WANDevice.1.X_ZTE-COM_WANPONInterfaceConfig.RXPower', {value: daily});
const fh = declare('InternetGatewayDevice.WANDevice.1.X_FH_GponInterfaceConfig.RXPower', {value: daily});

//---------------------------- OPTIMIZED REMOTE WAN CONFIGURATION ----------------------------//
if (merk !== "MikroTik") {
    const uptime = declare('InternetGatewayDevice.DeviceInfo.UpTime', {value: 1}).value[0];

    // ✅ OPTIMIZED: FiberHome device configuration dengan batch processing
    if (fh.size && uptime < 220) {
        // Batch 1: Basic ACL configuration
        declare("InternetGatewayDevice.X_FH_ACL.Enable", {path: daily}, {value: 1});
        declare("InternetGatewayDevice.X_FH_FireWall.REMOTEACCEnable", {value: 1}, {value: false});
        declare("InternetGatewayDevice.X_FH_Remoteweblogin.webloginenable", {value: 1}, {value: "0"});
        
        const fh_remot = declare('InternetGatewayDevice.X_FH_ACL.Rule.1.Direction', {value: daily});
        if (fh_remot.size) {
            // Batch 2: ACL Rules (only if needed)
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Enable", {path: daily}, {value: 1});
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Direction", {path: daily}, {value: 1});
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Protocol", {path: daily}, {value: "ALL"});
        } else {
            declare("InternetGatewayDevice.X_FH_ACL.Rule.*", null, {path: 1});
        }
    } else if (fh.size && uptime > 220) {
        // Batch 1: Basic ACL configuration
        declare("InternetGatewayDevice.X_FH_ACL.Enable", {path: daily}, {value: 1});
        declare("InternetGatewayDevice.X_FH_FireWall.REMOTEACCEnable", {value: 1}, {value: true});
        declare("InternetGatewayDevice.X_FH_Remoteweblogin.webloginenable", {value: 1}, {value: "1"});
        
        const fh_remot = declare('InternetGatewayDevice.X_FH_ACL.Rule.1.Direction', {value: daily});
        if (fh_remot.size) {
            // Batch 2: ACL Rules (only if needed)
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Enable", {path: daily}, {value: 1});
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Direction", {path: daily}, {value: 1});
            declare("InternetGatewayDevice.X_FH_ACL.Rule.1.Protocol", {path: daily}, {value: "ALL"});
        } else {
            declare("InternetGatewayDevice.X_FH_ACL.Rule.*", null, {path: 1});
        }
    }

    // ✅ OPTIMIZED: Huawei device configuration dengan conditional loading
    if (huawei.size) {
        // Batch 1: Basic security settings
        declare("InternetGatewayDevice.X_HW_Security.AclServices.SSHWanEnable", {value: daily}, {value: true});
        declare("InternetGatewayDevice.X_HW_Security.AclServices.HTTPWanEnable", {value: daily}, {value: true});
        declare("InternetGatewayDevice.X_HW_Security.AclServices.TELNETWanEnable", {value: daily}, {value: true});
        
        // Batch 2: Advanced security settings (only if needed)
        declare("InternetGatewayDevice.X_HW_Security.X_HW_FirewallLevel", {value: daily}, {value: "Custom"});
        declare("InternetGatewayDevice.X_HW_Security.Dosfilter.IcmpEchoReplyEn", {value: daily}, {value: "0"});
    }

    // ✅ OPTIMIZED: ZTE device configuration dengan minimal parameters
    if (zte.size) {
        const zte_remot = declare('InternetGatewayDevice.Firewall.X_ZTE-COM_ServiceControl.IPV4ServiceControl.1.Enable', {value: daily});
        if (zte_remot.size) {
            // Only essential ZTE parameters
            declare("InternetGatewayDevice.Firewall.X_ZTE-COM_ServiceControl.IPV4ServiceControl.1.ServiceType", {value: daily}, {value: "HTTP"});
            declare("InternetGatewayDevice.Firewall.X_ZTE-COM_ServiceControl.IPV4ServiceControl.1.Ingress", {value: daily}, {value: "WAN_ALL"});
            declare("InternetGatewayDevice.Firewall.X_ZTE-COM_ServiceControl.IPV4ServiceControl.1.Enable", {value: daily}, {value: true});
        } else {
            declare("InternetGatewayDevice.Firewall.X_ZTE-COM_ServiceControl.IPV4ServiceControl.*", null, {path: 1});
        }
    }
}

//---------------------------- OPTIMIZED PARAMETER UPDATES ----------------------------//
if (merk !== 'ZIONCOM') {
    // ✅ OPTIMIZED: Essential virtual parameters only
    declare("VirtualParameters.IPTR069", {path: hourly, value: hourly});
    declare("VirtualParameters.RXPower", {path: update, value: update});
    declare("VirtualParameters.gettemp", {path: minutes, value: minutes});
    declare("VirtualParameters.activedevices", {path: update, value: update});
}

// ✅ OPTIMIZED: Core virtual parameters dengan reduced frequency
declare("VirtualParameters.WlanPassword", {path: hourly, value: hourly});
declare("VirtualParameters.getponmode", {path: daily, value: daily});
declare("VirtualParameters.pppoeMac", {path: hourly, value: hourly});
declare("VirtualParameters.pppoePassword", {path: hourly, value: hourly});
declare("VirtualParameters.pppoeUsername", {path: hourly, value: hourly});
declare("VirtualParameters.pppoeUsername2", {path: hourly, value: hourly});
declare("VirtualParameters.PonMac", {path: daily, value: daily});
declare("VirtualParameters.getSerialNumber", {path: daily, value: daily});
declare("VirtualParameters.pppoeIP", {path: minutes, value: minutes});
declare("VirtualParameters.getdeviceuptime", {path: minutes, value: minutes});
declare("VirtualParameters.getpppuptime", {path: minutes, value: minutes});

// ✅ OPTIMIZED: Device-specific parameter updates dengan conditional loading
if (merk !== "MikroTik") {
    // Batch 1: Essential WiFi parameters
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSID", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.PreSharedKey.1.KeyPassphrase", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.Enable", {path: hourly, value: hourly});
    
    // Batch 2: WiFi advanced parameters (only if needed)
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.BeaconType", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AutoChannelEnable", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.Channel", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.TransmitPower", {path: hourly, value: hourly});
    
    // Batch 3: Associated devices (reduced frequency)
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceBandWidth", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceRssi", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceIPAddress", {path: update, value: update});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.AssociatedDeviceMACAddress", {path: update, value: update});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSIDAdvertisementEnabled", {path: update, value: update});
    
    // Batch 4: Device info (reduced frequency)
    declare("InternetGatewayDevice.DeviceInfo.HardwareVersion", {path: daily, value: daily});
    declare("InternetGatewayDevice.DeviceInfo.SoftwareVersion", {path: daily, value: daily});

    // Batch 5: Host information (reduced frequency)
    declare("InternetGatewayDevice.LANDevice.*.Hosts.Host.*.HostName", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.*.Hosts.Host.*.IPAddress", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.*.Hosts.Host.*.MACAddress", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.*.Hosts.Host.*.InterfaceType", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DHCPLeaseTime", {path: daily, value: daily});

    // Batch 6: WAN configuration (essential only)
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Enable", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Name", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.ConnectionType", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.NATEnabled", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.Name", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.Enable", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.ConnectionType", {path: daily, value: daily});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.NATEnabled", {path: daily, value: daily});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnectionNumberOfEntries", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnectionNumberOfEntries", {path: hourly, value: hourly});
}

// ✅ OPTIMIZED: Device-specific parameters dengan conditional loading
if (huawei.size) {
    // Batch 1: Essential Huawei parameters
    declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.X_HW_VenderClassID", {value: daily}, {value: ""});
    
    // Batch 2: WAN PPP Connection Huawei parameters (reduced set)
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_SERVICELIST", {path: daily, value: daily});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_VLAN", {path: hourly, value: hourly});
    
    // Batch 3: LAN Binding (essential only)
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.Lan1Enable", {path: daily, value: daily});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_HW_LANBIND.SSID1Enable", {path: daily, value: daily});
    
    // Batch 4: WAN IP Connection Huawei parameters (reduced set)
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_HW_SERVICELIST", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_HW_VLAN", {path: hourly, value: hourly});
    
    // Batch 5: WiFi Associated Device Huawei parameters (reduced frequency)
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_HW_RSSI", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_HW_Noise", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_HW_SingalQuality", {path: minutes, value: minutes});
}

// ✅ OPTIMIZED: ZTE-specific parameters (minimal set)
if (zte.size) {
    declare("InternetGatewayDevice.LANDevice.*.WLANConfiguration.*.AssociatedDevice.*.X_ZTE-COM_AssociatedDeviceName", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.AssociatedDevice.*.X_ZTE-COM_Noise", {path: minutes, value: minutes});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_ZTE-COM_ServiceList", {path: daily, value: daily});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_ZTE-COM_VLANID", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_ZTE-COM_VLANID", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_ZTE-COM_ServiceList", {path: hourly, value: hourly});
}

// ✅ OPTIMIZED: CU-specific parameters (minimal set)
if (xcu.size) {
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_CU_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_CU_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CU_VLAN", {path: hourly, value: hourly});
}

// ✅ OPTIMIZED: CMCC-specific parameters (minimal set)
if (xcmc.size) {
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_CMCC_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_CMCC_VLANIDMark", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_CMCC_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_CMCC_VLANIDMark", {path: hourly, value: hourly});
}

// ✅ OPTIMIZED: CT-COM specific parameters (minimal set)
if (ctcom1.size || ctcom2.size || ctcom3.size || ctcom4.size) {
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.X_CT-COM_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.X_CT-COM_ServiceList", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CT-COM_WANEponLinkConfig.VLANIDMark", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CT-COM_WANGponLinkConfig.VLANIDMark", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CT-COM_WANEponLinkConfig.Mode", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CT-COM_WANGponLinkConfig.Mode", {path: hourly, value: hourly});
    declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.X_CT-COM_VLANEnabled", {path: hourly, value: hourly});
}
