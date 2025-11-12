# Deployment Guide - Server Setup

Panduan lengkap untuk deploy QR Code Generator API ke server production.

## Prerequisites

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- PM2 (untuk process management)
- Git

## Step-by-Step Deployment

### 1. Install Dependencies untuk Canvas (Linux)

Canvas memerlukan native dependencies. Install terlebih dahulu:

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**CentOS/RHEL:**

```bash
sudo yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
```

### 2. Install Node.js Dependencies

```bash
# Pastikan berada di directory project
cd ~/qr-with-logo  # atau path sesuai project Anda

# Install dependencies
npm install

# Rebuild canvas (penting setelah install native dependencies)
npm rebuild canvas
```

### 3. Setup Environment Variables

Buat atau edit file `.env`:

```bash
nano .env
```

Isi dengan:

```env
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=5242880

# Base URL untuk production (sesuaikan dengan domain Anda)
BASE_URL=https://api.example.com
```

**Catatan**: Ganti `https://api.example.com` dengan domain/URL server Anda.

### 4. Pastikan Folder Structure

```bash
# Buat folder yang diperlukan
mkdir -p storage/activation_code storage/general temp

# Set permissions (jika perlu)
chmod -R 755 storage temp
```

### 5. Test Dependencies

```bash
# Test apakah canvas dan qrcode bekerja
node test-canvas.js
```

Jika ada error, pastikan native dependencies sudah terinstall dengan benar.

### 6. Start dengan PM2

```bash
# Start aplikasi dengan PM2
pm2 start server.js --name qrcode-generator

# Atau dengan ecosystem file (recommended)
# Buat file ecosystem.config.js terlebih dahulu
```

**Ecosystem File (Recommended):**

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "qrcode-generator",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
```

Kemudian start dengan:

```bash
pm2 start ecosystem.config.js
```

### 7. Setup PM2 untuk Auto-Start

```bash
# Save PM2 configuration
pm2 save

# Setup PM2 untuk start saat boot
pm2 startup
# Ikuti instruksi yang muncul
```

### 8. Verify Aplikasi Berjalan

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs qrcode-generator

# Test health endpoint
curl http://localhost:3000/health
```

### 9. Setup Reverse Proxy (Nginx) - Optional

Jika menggunakan Nginx sebagai reverse proxy:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10. Setup SSL (Let's Encrypt) - Optional

```bash
sudo certbot --nginx -d api.example.com
```

## Troubleshooting

### Canvas Error

```bash
# Rebuild canvas
npm rebuild canvas

# Atau install ulang
rm -rf node_modules
npm install
npm rebuild canvas
```

### Port Already in Use

```bash
# Check port
sudo lsof -i :3000

# Kill process atau ubah PORT di .env
```

### Permission Denied

```bash
# Set permissions untuk storage dan temp
chmod -R 755 storage temp
```

### PM2 Not Found

```bash
# Install PM2 globally
npm install -g pm2
```

## Monitoring

```bash
# Monitor PM2
pm2 monit

# View logs
pm2 logs qrcode-generator --lines 100

# Restart aplikasi
pm2 restart qrcode-generator

# Stop aplikasi
pm2 stop qrcode-generator
```

## Update Deployment

Saat ada update dari git:

```bash
# Stop aplikasi
pm2 stop qrcode-generator

# Pull latest code
git pull

# Install dependencies (jika ada perubahan)
npm install

# Rebuild canvas (jika perlu)
npm rebuild canvas

# Restart aplikasi
pm2 restart qrcode-generator

# Check status
pm2 status
pm2 logs qrcode-generator
```

## Production Checklist

- [ ] Native dependencies untuk canvas terinstall
- [ ] Node.js dependencies terinstall (`npm install`)
- [ ] Canvas rebuilt (`npm rebuild canvas`)
- [ ] File `.env` sudah dibuat dengan konfigurasi yang benar
- [ ] Folder `storage/` dan `temp/` sudah dibuat
- [ ] Aplikasi berjalan dengan PM2
- [ ] PM2 auto-start sudah di-setup
- [ ] Health endpoint bisa diakses
- [ ] Test generate QR code berhasil
- [ ] Logs tidak ada error
