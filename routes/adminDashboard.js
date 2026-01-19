const express = require('express');
const router = express.Router();
const { adminAuth } = require('./adminAuth');
const fs = require('fs');
const path = require('path');

const { getDevices } = require('../config/genieacs');
const { getActivePPPoEConnections, getInactivePPPoEUsers } = require('../config/mikrotik');
const { getSettingsWithCache } = require('../config/settingsManager');
const { getVersionInfo, getVersionBadge } = require('../config/version-utils');

// GET: Dashboard admin
router.get('/dashboard', adminAuth, async (req, res) => {
  let genieacsTotal = 0, genieacsOnline = 0, genieacsOffline = 0;
  let mikrotikTotal = 0, mikrotikAktif = 0, mikrotikOffline = 0;
  let settings = {};
  
  try {
    // Baca settings.json
    settings = getSettingsWithCache();
    
    // GenieACS dengan timeout dan fallback
    try {
      const devices = await Promise.race([
        getDevices(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GenieACS timeout')), 5000)
        )
      ]);
      genieacsTotal = devices.length;
      // Anggap device online jika ada _lastInform dalam 1 jam terakhir
      const now = Date.now();
      genieacsOnline = devices.filter(dev => dev._lastInform && (now - new Date(dev._lastInform).getTime()) < 3600*1000).length;
      genieacsOffline = genieacsTotal - genieacsOnline;
      console.log('✅ [DASHBOARD] GenieACS data loaded successfully');
    } catch (genieacsError) {
      console.warn('⚠️ [DASHBOARD] GenieACS tidak dapat diakses - menggunakan data default:', genieacsError.message);
      // Set default values jika GenieACS tidak bisa diakses
      genieacsTotal = 0;
      genieacsOnline = 0;
      genieacsOffline = 0;
      // Dashboard tetap bisa dimuat meskipun GenieACS bermasalah
    }
    
    // Mikrotik dengan timeout dan fallback
    try {
      const aktifResult = await Promise.race([
        getActivePPPoEConnections(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Mikrotik timeout')), 5000)
        )
      ]);
      mikrotikAktif = aktifResult.success ? aktifResult.data.length : 0;
      
      const offlineResult = await Promise.race([
        getInactivePPPoEUsers(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Mikrotik timeout')), 5000)
        )
      ]);
      mikrotikOffline = offlineResult.success ? offlineResult.totalInactive : 0;
      mikrotikTotal = (offlineResult.success ? offlineResult.totalSecrets : 0);
      console.log('✅ [DASHBOARD] Mikrotik data loaded successfully');
    } catch (mikrotikError) {
      console.warn('⚠️ [DASHBOARD] Mikrotik tidak dapat diakses - menggunakan data default:', mikrotikError.message);
      // Set default values jika Mikrotik tidak bisa diakses
      mikrotikTotal = 0;
      mikrotikAktif = 0;
      mikrotikOffline = 0;
      // Dashboard tetap bisa dimuat meskipun Mikrotik bermasalah
    }
  } catch (e) {
    console.error('❌ [DASHBOARD] Error in dashboard route:', e);
    // Jika error, biarkan value default 0
  }
  
  // Cek apakah perlu menjalankan validasi konfigurasi ulang
  const shouldRevalidate = !req.session.configValidation || 
                          !req.session.configValidation.hasValidationRun ||
                          req.session.configValidation.lastValidationTime < (Date.now() - 30000); // 30 detik cache

  if (shouldRevalidate) {
    console.log('🔍 [DASHBOARD] Menjalankan validasi konfigurasi ulang...');
    
    // Jalankan validasi konfigurasi secara asinkron
    setImmediate(async () => {
      try {
        const { validateConfiguration, getValidationSummary, checkForDefaultSettings } = require('../config/configValidator');
        
        const validationResults = await validateConfiguration();
        const summary = getValidationSummary();
        const defaultSettingsWarnings = checkForDefaultSettings();
        
        // Update session dengan hasil validasi terbaru
        req.session.configValidation = {
          hasValidationRun: true,
          results: validationResults,
          summary: summary,
          defaultSettingsWarnings: defaultSettingsWarnings,
          lastValidationTime: Date.now()
        };
        
        console.log('✅ [DASHBOARD] Validasi konfigurasi ulang selesai');
      } catch (error) {
        console.error('❌ [DASHBOARD] Error saat validasi konfigurasi ulang:', error);
      }
    });
  }

  res.render('adminDashboard', {
    title: 'Dashboard Admin',
    page: 'dashboard',
    genieacsTotal,
    genieacsOnline,
    genieacsOffline,
    mikrotikTotal,
    mikrotikAktif,
    mikrotikOffline,
    settings, // Sertakan settings di sini
    versionInfo: getVersionInfo(),
    versionBadge: getVersionBadge(),
    configValidation: req.session.configValidation || null // Sertakan hasil validasi konfigurasi
  });
});

module.exports = router;
