/**
 * Example script untuk test QR code generator
 *
 * Usage:
 * 1. Start server: npm start
 * 2. Run this script: node example.js
 */

const http = require("http");
const fs = require("fs");

// Test 1: Generate QR code tanpa logo
console.log("Test 1: Generate QR code tanpa logo...");
const url1 =
  "http://localhost:3000/api/qrcode/generate?data=https://example.com&colorDark=%231DB9B9&width=1000";
http
  .get(url1, (res) => {
    const file = fs.createWriteStream("test-qrcode-simple.png");
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log(
        "✅ QR code sederhana berhasil dibuat: test-qrcode-simple.png"
      );

      // Test 2: Generate QR code dengan logo dari URL (jika ada)
      console.log("\nTest 2: Generate QR code dengan logo dari URL...");
      // Uncomment dan ganti dengan URL logo yang valid
      // const logoUrl = encodeURIComponent('https://example.com/logo.png');
      // const url2 = `http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=${logoUrl}&colorDark=%231DB9B9&width=1000&logoSize=0.2`;
      // http.get(url2, (res) => {
      //   const file = fs.createWriteStream('test-qrcode-with-logo.png');
      //   res.pipe(file);
      //   file.on('finish', () => {
      //     file.close();
      //     console.log('✅ QR code dengan logo berhasil dibuat: test-qrcode-with-logo.png');
      //   });
      // });
    });
  })
  .on("error", (err) => {
    console.error("❌ Error:", err.message);
    console.log("Pastikan server sudah running dengan: npm start");
  });
