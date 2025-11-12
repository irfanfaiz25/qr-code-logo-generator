/**
 * Test script untuk memverifikasi download logo dari URL dengan query parameter
 * 
 * Usage: node test-logo-url.js
 */

const QRCodeService = require('./services/qrcodeService');

// Test URL dengan query parameter
const testUrl = 'http://cloudbantex.niago.id/storage/bantex/javamifi-c3RbEOJaSV/digi-logo.jpeg?api_key=TwPMTNhTWRg772gTGDG0r5OJXydRAdP05t1SXLXK';

console.log('Testing logo download from URL with query parameters...');
console.log('URL:', testUrl);
console.log('');

QRCodeService.downloadLogo(testUrl)
  .then((filePath) => {
    console.log('✅ Success! Logo downloaded to:', filePath);
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    
    // Clean up
    fs.unlinkSync(filePath);
    console.log('✅ Test file cleaned up');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

