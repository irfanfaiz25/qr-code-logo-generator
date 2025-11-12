# QR Code Generator API dengan Logo

API untuk generate QR code dengan logo yang rapi dan terstruktur, dengan fitur custom styling seperti rounded corners, custom colors, dan logo placement di center.

## Fitur

- ✅ Generate QR code dengan logo di center
- ✅ Custom colors (dark modules & background)
- ✅ Rounded corners pada modules
- ✅ Error correction level yang dapat disesuaikan
- ✅ Support upload logo file atau URL logo
- ✅ Production-ready dengan error handling
- ✅ Works di local dan production

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. (Optional) Edit `.env` untuk konfigurasi:
```
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=5242880
```

## Menjalankan

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### 1. Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Generate QR Code (POST)

```
POST /api/qrcode/generate
Content-Type: multipart/form-data
```

**Body Parameters:**
- `data` (required): URL atau text yang akan di-encode ke QR code
- `logoFile` (optional): File logo yang di-upload (jpeg, jpg, png, gif, svg)
- `logoUrl` (optional): URL dari logo image
- `colorDark` (optional): Warna untuk QR modules (default: `#1DB9B9`)
- `colorLight` (optional): Warna background (default: `#FFFFFF`)
- `errorCorrectionLevel` (optional): Level error correction - `L`, `M`, `Q`, `H` (default: `H`)
- `margin` (optional): Ukuran margin (default: `4`)
- `width` (optional): Lebar output dalam pixels (default: `1000`)
- `logoSize` (optional): Ukuran logo sebagai persentase dari QR code (default: `0.2` = 20%)
- `roundedCorners` (optional): Enable rounded corners (default: `true`)

**Response:**
- Content-Type: `image/png`
- Body: PNG image buffer

**Contoh menggunakan cURL:**
```bash
curl -X POST http://localhost:3000/api/qrcode/generate \
  -F "data=https://example.com" \
  -F "logoFile=@logo.png" \
  -F "colorDark=#1DB9B9" \
  -F "width=1000" \
  -F "logoSize=0.2" \
  -F "roundedCorners=true" \
  --output qrcode.png
```

**Contoh menggunakan JavaScript (FormData):**
```javascript
const formData = new FormData();
formData.append('data', 'https://example.com');
formData.append('logoFile', logoFileInput.files[0]);
formData.append('colorDark', '#1DB9B9');
formData.append('width', '1000');

fetch('http://localhost:3000/api/qrcode/generate', {
  method: 'POST',
  body: formData
})
.then(response => response.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  document.body.appendChild(img);
});
```

### 3. Generate QR Code (GET)

```
GET /api/qrcode/generate
```

**Query Parameters:**
- `data` (required): URL atau text yang akan di-encode
- `logoUrl` (optional): URL dari logo image (support query parameters, e.g. `?api_key=...`)
- `colorDark` (optional): Warna untuk QR modules
- `colorLight` (optional): Warna background
- `errorCorrectionLevel` (optional): Level error correction
- `margin` (optional): Ukuran margin
- `width` (optional): Lebar output
- `logoSize` (optional): Ukuran logo
- `roundedCorners` (optional): Enable rounded corners

**Note:** `logoUrl` mendukung URL dengan query parameters (seperti `?api_key=...`), redirect, dan berbagai format image (JPEG, PNG, GIF, SVG).

**Response:**
- Content-Type: `image/png`
- Body: PNG image buffer

**Contoh:**
```
# URL sederhana
GET http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=https://example.com/logo.png&colorDark=%231DB9B9&width=1000

# URL dengan query parameter (perlu di-encode)
GET http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=http%3A%2F%2Fcloudbantex.niago.id%2Fstorage%2Fbantex%2Fjavamifi-c3RbEOJaSV%2Fdigi-logo.jpeg%3Fapi_key%3DTwPMTNhTWRg772gTGDG0r5OJXydRAdP05t1SXLXK&colorDark=%231DB9B9&width=1000
```

**Catatan:** Saat menggunakan URL dengan query parameter sebagai `logoUrl`, pastikan untuk meng-encode URL tersebut dengan `encodeURIComponent()` di JavaScript atau URL encoding di browser/curl.

## Contoh Penggunaan

### 1. Generate QR Code Sederhana (tanpa logo)
```bash
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com" --output qrcode.png
```

### 2. Generate QR Code dengan Logo dari URL
```bash
# URL sederhana
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=https://example.com/logo.png&colorDark=%231DB9B9&width=1000&logoSize=0.2" --output qrcode.png

# URL dengan query parameter (menggunakan encodeURIComponent)
curl "http://localhost:3000/api/qrcode/generate?data=https://example.com&logoUrl=$(node -e "console.log(encodeURIComponent('http://cloudbantex.niago.id/storage/bantex/javamifi-c3RbEOJaSV/digi-logo.jpeg?api_key=TwPMTNhTWRg772gTGDG0r5OJXydRAdP05t1SXLXK'))")&colorDark=%231DB9B9&width=1000&logoSize=0.2" --output qrcode.png
```

### 3. Generate QR Code dengan Upload Logo
```bash
curl -X POST http://localhost:3000/api/qrcode/generate \
  -F "data=https://example.com" \
  -F "logoFile=@./logo.png" \
  -F "colorDark=#1DB9B9" \
  -F "colorLight=#FFFFFF" \
  -F "roundedCorners=true" \
  --output qrcode.png
```

## Struktur Proyek

```
qrcode-logo-new/
├── server.js              # Main server file
├── routes/
│   └── qrcode.js         # QR code routes
├── services/
│   └── qrcodeService.js  # QR code generation logic
├── temp/                 # Temporary files (auto-created)
├── package.json
├── .env                  # Environment variables
├── .env.example
├── .gitignore
└── README.md
```

## Teknologi yang Digunakan

- **Express.js**: Web framework
- **qrcode**: QR code generation library
- **canvas**: Image manipulation dan rendering
- **multer**: File upload handling
- **dotenv**: Environment configuration

## Error Correction Levels

- **L**: ~7% error correction
- **M**: ~15% error correction
- **Q**: ~25% error correction
- **H**: ~30% error correction (recommended untuk logo)

Level `H` direkomendasikan ketika menggunakan logo karena logo akan menutupi beberapa modules di center QR code.

## Production Deployment

### Environment Variables untuk Production

```env
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=5242880
```

### Deploy ke Platform

#### Heroku
```bash
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
railway init
railway up
```

#### Vercel/Netlify
Perlu setup serverless functions sesuai platform masing-masing.

### Docker (Optional)

Buat `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p temp
EXPOSE 3000
CMD ["node", "server.js"]
```

Build dan run:
```bash
docker build -t qrcode-generator .
docker run -p 3000:3000 qrcode-generator
```

## Troubleshooting

### Test Dependencies
Sebelum menjalankan server, test dependencies dengan:
```bash
node test-canvas.js
```

Jika ada error, install dependencies yang diperlukan.

### Canvas tidak terinstall dengan benar

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm rebuild canvas
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm rebuild canvas
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
npm rebuild canvas
```

### Endpoint Generate Loading Terus (Tidak Ada Response)

1. **Cek console/logs server** untuk melihat error message
2. **Pastikan canvas terinstall dengan benar:**
   ```bash
   node test-canvas.js
   ```
3. **Cek apakah dependencies terinstall:**
   ```bash
   npm list canvas qrcode
   ```
4. **Jika canvas error, rebuild:**
   ```bash
   npm rebuild canvas
   ```
5. **Cek error di browser console atau network tab** untuk melihat response error

### Logo tidak muncul
- Pastikan logo file valid dan dapat dibaca
- Pastikan `logoSize` tidak terlalu besar (max 0.3)
- Pastikan `errorCorrectionLevel` set ke `H` untuk best results
- Jika menggunakan `logoUrl`, pastikan URL dapat diakses dan valid

### QR Code tidak bisa di-scan
- Pastikan `errorCorrectionLevel` cukup tinggi (minimal `M`, recommended `H`)
- Pastikan logo tidak terlalu besar
- Pastikan warna kontras cukup (dark modules vs light background)
- Pastikan margin cukup besar (minimal 4)

### Error: "Cannot find module 'canvas'"
Install canvas dependencies sesuai OS Anda (lihat di atas), kemudian:
```bash
npm install canvas
```

### Error: "Failed to create QR code matrix"
- Pastikan URL/text yang di-encode valid
- Cek apakah qrcode library terinstall: `npm list qrcode`
- Cek console untuk error message detail

## License

ISC

