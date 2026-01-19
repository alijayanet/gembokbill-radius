#!/usr/bin/env node

/**
 * Script untuk membersihkan cache mapping
 * Digunakan ketika data pelanggan atau perangkat berubah secara signifikan
 */

const path = require('path');
const cacheManager = require('../utils/cacheManager');

console.log('🔍 Memeriksa cache mapping...');

const stats = cacheManager.getStats();
console.log(`📊 Statistik cache saat ini:`);
console.log(`   Total entries: ${stats.total}`);
console.log(`   Active entries: ${stats.active}`);
console.log(`   Expired entries: ${stats.expired}`);

const mappingCacheKeys = [
  'mapping_devices_with_coordinates',
  'technician_mapping_devices_with_coordinates'
];

let clearedCount = 0;
console.log('\n🗑️  Membersihkan cache mapping...');

for (const key of mappingCacheKeys) {
  if (cacheManager.get(key) !== null) {
    cacheManager.delete(key);
    console.log(`   ✓ Dihapus: ${key}`);
    clearedCount++;
  } else {
    console.log(`   - Tidak ditemukan: ${key}`);
  }
}

console.log(`\n✅ Selesai! ${clearedCount} cache mapping telah dibersihkan.`);

if (clearedCount > 0) {
  console.log('\n💡 Catatan:');
  console.log('   Data mapping akan di-refresh pada permintaan berikutnya');
  console.log('   Halaman mapping akan memuat data terbaru dari database');
}