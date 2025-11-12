/**
 * Test script untuk memverifikasi canvas dan qrcode library
 * Run: node test-canvas.js
 */

console.log('Testing dependencies...\n');

// Test 1: Canvas
try {
  console.log('1. Testing canvas...');
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'blue';
  ctx.fillRect(10, 10, 100, 100);
  const buffer = canvas.toBuffer('image/png');
  console.log('   ✅ Canvas works! Buffer size:', buffer.length);
} catch (error) {
  console.error('   ❌ Canvas error:', error.message);
  console.error('   Install canvas dependencies:');
  console.error('   macOS: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
  process.exit(1);
}

// Test 2: QRCode
try {
  console.log('\n2. Testing qrcode...');
  const QRCode = require('qrcode');
  
  QRCode.create('test', {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 1
  }, (err, qr) => {
    if (err) {
      console.error('   ❌ QRCode error:', err.message);
      process.exit(1);
    }
    console.log('   ✅ QRCode works!');
    console.log('   Module size:', qr.modules?.size);
    console.log('   Has get method:', typeof qr.modules?.get === 'function');
    
    // Test 3: Full integration
    console.log('\n3. Testing integration...');
    try {
      const { createCanvas } = require('canvas');
      const modules = qr.modules;
      const size = modules.size;
      const canvas = createCanvas(size * 10, size * 10);
      const ctx = canvas.getContext('2d');
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const isDark = modules.get(row, col);
          ctx.fillStyle = isDark ? '#000' : '#fff';
          ctx.fillRect(col * 10, row * 10, 10, 10);
        }
      }
      
      const buffer = canvas.toBuffer('image/png');
      console.log('   ✅ Integration works! Buffer size:', buffer.length);
      console.log('\n✅ All tests passed!');
    } catch (error) {
      console.error('   ❌ Integration error:', error.message);
      process.exit(1);
    }
  });
} catch (error) {
  console.error('   ❌ QRCode error:', error.message);
  process.exit(1);
}

