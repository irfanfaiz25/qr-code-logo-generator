# Quick Start Guide

## Instalasi Cepat

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start
```

Server akan berjalan di `http://localhost:3000`

## Test API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Generate QR Code Sederhana

```bash
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com" --output qrcode.png
```

### 3. Generate QR Code dengan Logo (GET)

```bash
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=https://via.placeholder.com/200&colorDark=%231DB9B9&width=1000&logoSize=0.2" --output qrcode-with-logo.png
```

### 4. Generate QR Code dengan Upload Logo (POST)

```bash
curl -X POST http://localhost:3000/api/qrcode/generate \
  -F "data=https://example.com" \
  -F "logoFile=@./path/to/logo.png" \
  -F "colorDark=#1DB9B9" \
  -F "width=1000" \
  -F "logoSize=0.2" \
  -F "roundedCorners=true" \
  --output qrcode.png
```

## Parameter yang Tersedia

| Parameter              | Type    | Default      | Deskripsi                    |
| ---------------------- | ------- | ------------ | ---------------------------- |
| `data`                 | string  | **required** | URL atau text untuk QR code  |
| `logoUrl`              | string  | -            | URL logo image               |
| `logoFile`             | file    | -            | Upload logo file (POST only) |
| `colorDark`            | string  | `#1DB9B9`    | Warna QR modules             |
| `colorLight`           | string  | `#FFFFFF`    | Warna background             |
| `errorCorrectionLevel` | string  | `H`          | Level: L, M, Q, H            |
| `margin`               | number  | `4`          | Ukuran margin                |
| `width`                | number  | `1000`       | Lebar output (pixels)        |
| `logoSize`             | number  | `0.2`        | Ukuran logo (0.1-0.3)        |
| `roundedCorners`       | boolean | `true`       | Enable rounded corners       |

## Contoh di Browser

Buka di browser:

```
http://localhost:3000/api/qrcode/generate?data=https://example.com&colorDark=%231DB9B9&width=1000
```

## Production

Set environment variable:

```bash
export NODE_ENV=production
export PORT=3000
npm start
```

atau gunakan `.env` file:

```
NODE_ENV=production
PORT=3000
```
