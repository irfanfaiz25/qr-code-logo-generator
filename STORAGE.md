# Storage System Documentation

## Overview

Sistem storage QR code terbagi menjadi 2 folder berdasarkan tipe data:

1. **`storage/activation_code/`** - Untuk QR code dengan data yang mengandung "LPA"
2. **`storage/general/`** - Untuk QR code dengan data umum (tidak mengandung "LPA")

## Format Data LPA

Format data LPA: `LPA:1$SMDP$ACTIVATION_CODE`

Contoh:
- `LPA:1$SMDP$ABC123` → Activation code: `ABC123`
- `LPA:1$SMDP$XYZ789` → Activation code: `XYZ789`

## Naming Convention

### Activation Code (LPA Data)
- **Format nama file**: `{ACTIVATION_CODE}.png`
- **Contoh**: `ABC123.png`, `XYZ789.png`
- **Lokasi**: `storage/activation_code/`

### General Data
- **Format nama file**: `qr_{timestamp}.png`
- **Contoh**: `qr_1704067200000.png`
- **Lokasi**: `storage/general/`

## Logic Flow

### Untuk Data LPA:
1. Extract activation code dari data (format: `LPA:1$SMDP$ACTIVATION_CODE`)
2. Check apakah file sudah ada di `storage/activation_code/{ACTIVATION_CODE}.png`
3. **Jika ada**: Return `imageUrl` yang sudah ada (cached)
4. **Jika belum ada**: Generate QR code baru, save ke storage, return `imageUrl`

### Untuk Data General:
1. Generate QR code baru
2. Save ke `storage/general/qr_{timestamp}.png`
3. Return `imageUrl`

## API Response Format

### Success Response (JSON):
```json
{
  "success": true,
  "imageUrl": "/storage/activation_code/ABC123.png",
  "cached": true,
  "message": "QR code retrieved from storage"
}
```

atau

```json
{
  "success": true,
  "imageUrl": "/storage/general/qr_1704067200000.png",
  "cached": false,
  "message": "QR code generated and saved"
}
```

## Public URL

### Development (Local):
Semua file di storage dapat diakses melalui:
- `http://localhost:3000/storage/activation_code/{filename}.png`
- `http://localhost:3000/storage/general/{filename}.png`

### Production:
`imageUrl` akan berisi full URL dengan domain. Prioritas:
1. **Environment Variable `BASE_URL`** (recommended untuk production)
   - Set di `.env`: `BASE_URL=https://api.example.com`
   - Result: `https://api.example.com/storage/activation_code/ABC123.png`

2. **Auto-detect dari Request** (jika BASE_URL tidak set)
   - Menggunakan `req.protocol` dan `req.get("host")`
   - Support proxy/load balancer dengan `X-Forwarded-Proto` dan `X-Forwarded-Host` headers
   - Result: `https://your-domain.com/storage/activation_code/ABC123.png`

3. **Relative Path** (fallback)
   - Jika tidak bisa detect, return relative path
   - Result: `/storage/activation_code/ABC123.png`

## Contoh Penggunaan

### Generate QR Code dengan Data LPA:
```bash
curl "http://localhost:3000/api/qrcode/generate?data=LPA:1\$SMDP\$ABC123"
```

**Response pertama kali** (generate baru):
```json
{
  "success": true,
  "imageUrl": "/storage/activation_code/ABC123.png",
  "cached": false,
  "message": "QR code generated and saved"
}
```

**Response kedua kali** (cached):
```json
{
  "success": true,
  "imageUrl": "/storage/activation_code/ABC123.png",
  "cached": true,
  "message": "QR code retrieved from storage"
}
```

### Generate QR Code dengan Data General:
```bash
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com"
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "/storage/general/qr_1704067200000.png",
  "cached": false,
  "message": "QR code generated and saved"
}
```

## File Structure

```
storage/
├── activation_code/
│   ├── .gitkeep
│   ├── ABC123.png (generated)
│   └── XYZ789.png (generated)
└── general/
    ├── .gitkeep
    ├── qr_1704067200000.png (generated)
    └── qr_1704067300000.png (generated)
```

## Notes

- File `.gitkeep` digunakan untuk mempertahankan struktur folder di Git
- File PNG yang di-generate tidak di-commit ke Git (lihat `.gitignore`)
- Static file serving di-handle oleh Express di route `/storage`

