const express = require('express');
const router = express.Router();
const { adminAuth } = require('./adminAuth');
const { validateConfiguration, getValidationSummary, checkForDefaultSettings } = require('../config/configValidator');

/**
 * API untuk validasi konfigurasi sistem
 * Dapat dipanggil secara manual oleh admin
 */

// GET: Manual validation trigger
router.get('/validate', adminAuth, async (req, res) => {
    try {
        console.log('🔍 [MANUAL_VALIDATION] Admin memicu validasi konfigurasi manual...');
        
        // Jalankan validasi
        const validationResults = await validateConfiguration();
        const summary = getValidationSummary();
        const defaultSettingsWarnings = checkForDefaultSettings();
        
        // Simpan hasil ke session
        req.session.configValidation = {
            hasValidationRun: true,
            results: validationResults,
            summary: summary,
            defaultSettingsWarnings: defaultSettingsWarnings,
            lastValidationTime: Date.now()
        };
        
        console.log('✅ [MANUAL_VALIDATION] Validasi manual selesai');
        
        res.json({
            success: true,
            message: 'Validasi konfigurasi selesai',
            data: {
                results: validationResults,
                summary: summary,
                defaultSettingsWarnings: defaultSettingsWarnings
            }
        });
        
    } catch (error) {
        console.error('❌ [MANUAL_VALIDATION] Error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Gagal menjalankan validasi konfigurasi',
            error: error.message
        });
    }
});

// GET: Get current validation status
router.get('/status', adminAuth, (req, res) => {
    try {
        const configValidation = req.session.configValidation;
        
        if (!configValidation || !configValidation.hasValidationRun) {
            return res.json({
                success: true,
                message: 'Validasi belum dijalankan',
                data: {
                    hasRun: false,
                    results: null,
                    summary: null,
                    defaultSettingsWarnings: []
                }
            });
        }
        
        res.json({
            success: true,
            message: 'Status validasi konfigurasi',
            data: {
                hasRun: true,
                results: configValidation.results,
                summary: configValidation.summary,
                defaultSettingsWarnings: configValidation.defaultSettingsWarnings
            }
        });
        
    } catch (error) {
        console.error('❌ [VALIDATION_STATUS] Error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Gagal mendapatkan status validasi',
            error: error.message
        });
    }
});

// POST: Clear validation results from session
router.post('/clear', adminAuth, (req, res) => {
    try {
        delete req.session.configValidation;
        
        console.log('✅ [VALIDATION_CLEAR] Hasil validasi dihapus dari session');
        
        res.json({
            success: true,
            message: 'Hasil validasi berhasil dihapus'
        });
        
    } catch (error) {
        console.error('❌ [VALIDATION_CLEAR] Error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus hasil validasi',
            error: error.message
        });
    }
});

module.exports = router;
