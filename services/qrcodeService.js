const QRCode = require("qrcode");
const { createCanvas, loadImage, registerFont } = require("canvas");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Cache for QR code matrices (in-memory cache)
const matrixCache = new Map();
const MAX_CACHE_SIZE = 100; // Limit cache size

class QRCodeService {
  /**
   * Download logo from URL
   */
  static async downloadLogo(url) {
    return new Promise((resolve, reject) => {
      try {
        // Parse URL to handle query parameters properly
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === "https:" ? https : http;
        const tempDir = path.join(__dirname, "../temp");

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = path.join(
          tempDir,
          `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`
        );
        const file = fs.createWriteStream(filename);

        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
          path: urlObj.pathname + urlObj.search, // Include query parameters
          method: "GET",
          headers: {
            "User-Agent": "QRCode-Logo-Generator/1.0",
          },
        };

        const req = protocol.request(requestOptions, (response) => {
          // Handle redirects (301, 302, 307, 308)
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            file.close();
            fs.unlinkSync(filename);
            // Recursively follow redirect
            return this.downloadLogo(response.headers.location)
              .then(resolve)
              .catch(reject);
          }

          if (response.statusCode !== 200) {
            file.close();
            fs.unlinkSync(filename);
            reject(
              new Error(`Failed to download logo: HTTP ${response.statusCode}`)
            );
            return;
          }

          // Check content type (optional but recommended)
          const contentType = response.headers["content-type"];
          if (contentType && !contentType.startsWith("image/")) {
            console.warn(
              `Warning: Content-Type is ${contentType}, expected image/*`
            );
          }

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            // Verify file was created and has content
            const stats = fs.statSync(filename);
            if (stats.size === 0) {
              fs.unlinkSync(filename);
              reject(new Error("Downloaded file is empty"));
              return;
            }
            console.log(
              `Logo downloaded successfully: ${filename}, size: ${stats.size} bytes`
            );
            resolve(filename);
          });

          file.on("error", (err) => {
            file.close();
            if (fs.existsSync(filename)) {
              fs.unlinkSync(filename);
            }
            reject(new Error(`File write error: ${err.message}`));
          });
        });

        req.on("error", (err) => {
          if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
          }
          reject(new Error(`Request error: ${err.message}`));
        });

        req.setTimeout(30000, () => {
          req.destroy();
          if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
          }
          reject(new Error("Request timeout after 30 seconds"));
        });

        req.end();
      } catch (error) {
        reject(new Error(`Invalid URL or download error: ${error.message}`));
      }
    });
  }

  /**
   * Draw rounded rectangle
   */
  static drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Generate cache key for QR code matrix
   */
  static getMatrixCacheKey(url, errorCorrectionLevel) {
    return crypto
      .createHash("md5")
      .update(`${url}:${errorCorrectionLevel}`)
      .digest("hex");
  }

  /**
   * Generate QR code data matrix (with caching for performance)
   */
  static async getQRCodeMatrix(url, errorCorrectionLevel) {
    try {
      // Check cache first (significant performance boost for repeated requests)
      const cacheKey = this.getMatrixCacheKey(url, errorCorrectionLevel);
      if (matrixCache.has(cacheKey)) {
        return matrixCache.get(cacheKey);
      }

      // QRCode.create can be called directly without callback
      const qr = QRCode.create(url, {
        errorCorrectionLevel: errorCorrectionLevel,
        type: "png",
        quality: 1,
        margin: 1,
      });

      if (!qr || !qr.modules) {
        throw new Error("Invalid QR code object received");
      }

      // Cache the matrix (with size limit to prevent memory issues)
      if (matrixCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry (simple FIFO)
        const firstKey = matrixCache.keys().next().value;
        matrixCache.delete(firstKey);
      }
      matrixCache.set(cacheKey, qr.modules);

      return qr.modules;
    } catch (error) {
      console.error("QRCode.create error:", error);
      throw new Error(`Failed to create QR code matrix: ${error.message}`);
    }
  }

  /**
   * Generate QR code with logo
   */
  static async generateQRCodeWithLogo(options) {
    const {
      url,
      logoPath,
      colorDark = "#1DB9B9",
      colorLight = "#FFFFFF",
      errorCorrectionLevel = "H",
      margin = 4,
      width = 1000,
      logoSize = 0.2,
      roundedCorners = true,
    } = options;

    try {
      // Get QR code matrix (with caching)
      const modules = await this.getQRCodeMatrix(url, errorCorrectionLevel);

      if (!modules) {
        throw new Error(
          "Invalid QR code matrix received: modules is null or undefined"
        );
      }

      // Check if modules has size property (BitMatrix)
      let moduleCount;
      if (typeof modules.size === "number") {
        moduleCount = modules.size;
      } else if (modules.data && Array.isArray(modules.data)) {
        // Fallback: calculate from data array
        moduleCount = Math.sqrt(modules.data.length);
      } else {
        throw new Error("Invalid QR code matrix: cannot determine size");
      }

      if (moduleCount === 0 || isNaN(moduleCount)) {
        throw new Error("QR code matrix is empty or invalid");
      }

      const moduleSize = Math.floor((width - margin * 2) / moduleCount);

      if (moduleSize <= 0) {
        throw new Error(
          "Calculated module size is too small. Try increasing width or decreasing margin"
        );
      }

      const qrSize = moduleCount * moduleSize;
      const canvasWidth = qrSize + margin * 2;
      const canvasHeight = canvasWidth;

      // Create canvas
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Fill background
      ctx.fillStyle = colorLight;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw QR code modules (optimized)
      const radius = roundedCorners ? moduleSize * 0.3 : 0;

      // Helper function to get module value (optimized)
      const getModule = (row, col) => {
        if (typeof modules.get === "function") {
          return modules.get(row, col);
        } else if (modules.data && Array.isArray(modules.data)) {
          // Fallback: access from data array
          const index = row * moduleCount + col;
          return modules.data[index] || false;
        }
        return false;
      };

      // Optimize: Only draw dark modules (background already filled with light color)
      // Batch operations by setting fillStyle once per color
      ctx.fillStyle = colorDark;

      if (roundedCorners) {
        // Draw rounded corners for dark modules
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            const isDark = getModule(row, col);
            if (isDark) {
              const x = margin + col * moduleSize;
              const y = margin + row * moduleSize;
              this.drawRoundedRect(ctx, x, y, moduleSize, moduleSize, radius);
              ctx.fill();
            }
          }
        }
      } else {
        // Draw square modules (faster - no path creation)
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            const isDark = getModule(row, col);
            if (isDark) {
              const x = margin + col * moduleSize;
              const y = margin + row * moduleSize;
              ctx.fillRect(x, y, moduleSize, moduleSize);
            }
          }
        }
      }

      // Draw finder patterns with proper styling
      const finderPatternSize = 7;
      const finderPatternOffset = margin;

      // Top-left finder pattern
      this.drawFinderPattern(
        ctx,
        finderPatternOffset,
        finderPatternOffset,
        finderPatternSize,
        moduleSize,
        colorDark,
        colorLight,
        roundedCorners
      );

      // Top-right finder pattern
      this.drawFinderPattern(
        ctx,
        canvasWidth - finderPatternOffset - finderPatternSize * moduleSize,
        finderPatternOffset,
        finderPatternSize,
        moduleSize,
        colorDark,
        colorLight,
        roundedCorners
      );

      // Bottom-left finder pattern
      this.drawFinderPattern(
        ctx,
        finderPatternOffset,
        canvasWidth - finderPatternOffset - finderPatternSize * moduleSize,
        finderPatternSize,
        moduleSize,
        colorDark,
        colorLight,
        roundedCorners
      );

      // Calculate logo area (center of QR code)
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const logoAreaSize = qrSize * logoSize;
      const logoX = centerX - logoAreaSize / 2;
      const logoY = centerY - logoAreaSize / 2;

      // Draw white background for logo area (optimized: load logo in parallel)
      if (logoPath) {
        // Start loading logo early (parallel with drawing)
        const logoPromise = loadImage(logoPath).catch((err) => {
          console.warn(
            "Failed to load logo, continuing without logo:",
            err.message
          );
          return null;
        });

        const logoRadius = logoAreaSize * 0.1;
        const logoBgX = logoX - 10;
        const logoBgY = logoY - 10;
        const logoBgSize = logoAreaSize + 20;

        // Draw white background for logo area
        ctx.fillStyle = colorLight;
        this.drawRoundedRect(
          ctx,
          logoBgX,
          logoBgY,
          logoBgSize,
          logoBgSize,
          logoRadius
        );
        ctx.fill();

        // Draw border around logo area
        ctx.strokeStyle = colorDark;
        ctx.lineWidth = 2;
        this.drawRoundedRect(
          ctx,
          logoBgX,
          logoBgY,
          logoBgSize,
          logoBgSize,
          logoRadius
        );
        ctx.stroke();

        // Wait for logo to load and draw it
        const logo = await logoPromise;
        if (logo) {
          const logoAspectRatio = logo.width / logo.height;
          let logoWidth = logoAreaSize;
          let logoHeight = logoAreaSize;

          if (logoAspectRatio > 1) {
            logoHeight = logoWidth / logoAspectRatio;
          } else {
            logoWidth = logoHeight * logoAspectRatio;
          }

          const logoDrawX = centerX - logoWidth / 2;
          const logoDrawY = centerY - logoHeight / 2;

          // Draw logo with rounded corners
          ctx.save();
          const logoRadiusDraw = logoAreaSize * 0.1;
          this.drawRoundedRect(
            ctx,
            logoDrawX,
            logoDrawY,
            logoWidth,
            logoHeight,
            logoRadiusDraw
          );
          ctx.clip();
          ctx.drawImage(logo, logoDrawX, logoDrawY, logoWidth, logoHeight);
          ctx.restore();
        }
      }

      // Return buffer (optimized: use sync toBuffer for better performance)
      const buffer = canvas.toBuffer("image/png");
      return buffer;
    } catch (error) {
      console.error("Error in generateQRCodeWithLogo:", error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Draw finder pattern (corner squares)
   */
  static drawFinderPattern(
    ctx,
    x,
    y,
    size,
    moduleSize,
    colorDark,
    colorLight,
    roundedCorners
  ) {
    const radius = roundedCorners ? moduleSize * 0.3 : 0;

    // Outer square (dark)
    ctx.fillStyle = colorDark;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const moduleX = x + j * moduleSize;
        const moduleY = y + i * moduleSize;

        if (roundedCorners) {
          this.drawRoundedRect(
            ctx,
            moduleX,
            moduleY,
            moduleSize,
            moduleSize,
            radius
          );
          ctx.fill();
        } else {
          ctx.fillRect(moduleX, moduleY, moduleSize, moduleSize);
        }
      }
    }

    // Inner square (light)
    ctx.fillStyle = colorLight;
    const innerOffset = moduleSize;
    const innerSize = (size - 2) * moduleSize;
    const innerX = x + innerOffset;
    const innerY = y + innerOffset;

    if (roundedCorners) {
      this.drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, radius);
      ctx.fill();
    } else {
      ctx.fillRect(innerX, innerY, innerSize, innerSize);
    }

    // Center square (dark)
    ctx.fillStyle = colorDark;
    const centerOffset = 2 * moduleSize;
    const centerSize = (size - 4) * moduleSize;
    const centerX = x + centerOffset;
    const centerY = y + centerOffset;

    if (roundedCorners) {
      this.drawRoundedRect(
        ctx,
        centerX,
        centerY,
        centerSize,
        centerSize,
        radius
      );
      ctx.fill();
    } else {
      ctx.fillRect(centerX, centerY, centerSize, centerSize);
    }
  }

  /**
   * Extract activation code from LPA data format
   * Format: LPA:1$SMDP$ACTIVATION_CODE or LPA:TEST$ACTIVATION_CODE
   * Returns: ACTIVATION_CODE or null if not found
   */
  static extractActivationCode(data) {
    if (!data || typeof data !== "string") {
      return null;
    }

    // Check if data contains "LPA"
    if (!data.includes("LPA")) {
      return null;
    }

    // Extract activation code from format: LPA:1$SMDP$ACTIVATION_CODE
    const match = data.match(/LPA:.*?\$.*?\$(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback: try to extract after last $ (for formats like LPA:TEST$ACTIVATION_CODE)
    const parts = data.split("$");
    if (parts.length >= 2 && parts[0].includes("LPA")) {
      // Get the last part after the last $
      return parts[parts.length - 1].trim();
    }

    // If no $ found, try to extract everything after LPA:
    const lpaMatch = data.match(/LPA:(.+)/);
    if (lpaMatch && lpaMatch[1]) {
      return lpaMatch[1].trim();
    }

    return null;
  }

  /**
   * Check if data contains LPA
   */
  static isLPAData(data) {
    return data && typeof data === "string" && data.includes("LPA");
  }

  /**
   * Get storage path for QR code based on data
   */
  static getStoragePath(data) {
    const storageBase = path.join(__dirname, "../storage");

    if (this.isLPAData(data)) {
      const activationCode = this.extractActivationCode(data);
      if (activationCode) {
        return path.join(
          storageBase,
          "activation_code",
          `${activationCode}.png`
        );
      }
      // Fallback if can't extract activation code
      return path.join(storageBase, "activation_code", `LPA_${Date.now()}.png`);
    } else {
      // General storage with timestamp
      const timestamp = Date.now();
      return path.join(storageBase, "general", `qr_${timestamp}.png`);
    }
  }

  /**
   * Check if QR code file exists in storage
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Save QR code buffer to storage
   */
  static async saveQRCodeToStorage(buffer, filePath) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file (use async for better performance)
      await fs.promises.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to save QR code to storage: ${error.message}`);
    }
  }

  /**
   * Get public URL for stored QR code
   * @param {string} filePath - Path to the stored file
   * @param {string} baseUrl - Optional base URL (domain) for production
   * @returns {string} Full URL or relative path
   */
  static getPublicUrl(filePath, baseUrl = null) {
    // Extract relative path from storage
    const storageBase = path.join(__dirname, "../storage");
    const relativePath = path.relative(storageBase, filePath);
    const storagePath = `/storage/${relativePath.replace(/\\/g, "/")}`;

    // If baseUrl is provided, return full URL
    if (baseUrl) {
      // Remove trailing slash from baseUrl if exists
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      return `${cleanBaseUrl}${storagePath}`;
    }

    // Check if BASE_URL is set in environment
    if (process.env.BASE_URL) {
      const cleanBaseUrl = process.env.BASE_URL.replace(/\/$/, "");
      return `${cleanBaseUrl}${storagePath}`;
    }

    // Return relative path (for development or when no base URL is set)
    return storagePath;
  }
}

module.exports = QRCodeService;
