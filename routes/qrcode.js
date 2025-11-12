const express = require("express");
const router = express.Router();
const QRCodeService = require("../services/qrcodeService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for logo upload
const upload = multer({
  dest: "temp/",
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, svg)"));
    }
  },
});

/**
 * POST /api/qrcode/generate
 * Generate QR code with logo
 *
 * Body parameters:
 * - data (required): The URL or text to encode in QR code
 * - logoUrl (optional): URL of logo image
 * - logoFile (optional): Uploaded logo file
 * - colorDark (optional): Color for QR modules (default: '#1DB9B9')
 * - colorLight (optional): Background color (default: '#FFFFFF')
 * - errorCorrectionLevel (optional): 'L', 'M', 'Q', 'H' (default: 'H')
 * - margin (optional): Margin size (default: 4)
 * - width (optional): Output width in pixels (default: 1000)
 * - logoSize (optional): Logo size as percentage of QR code (default: 0.2)
 * - roundedCorners (optional): Enable rounded corners (default: true)
 */
router.post("/generate", upload.single("logoFile"), async (req, res, next) => {
  let logoPath = null;

  try {
    const {
      data,
      logoUrl,
      colorDark = "#1DB9B9",
      colorLight = "#FFFFFF",
      errorCorrectionLevel = "H",
      margin = 4,
      width = 1000,
      logoSize = 0.2,
      roundedCorners = true,
    } = req.body;

    // Validate required parameters
    if (!data) {
      return res.status(400).json({ error: "data parameter is required" });
    }

    // Handle logo
    if (req.file) {
      logoPath = req.file.path;
    } else if (logoUrl) {
      // Download logo from URL if provided
      logoPath = await QRCodeService.downloadLogo(logoUrl);
    }

    // Check if data contains LPA
    const isLPA = QRCodeService.isLPAData(data);
    const storagePath = QRCodeService.getStoragePath(data);

    // Get base URL from request or environment
    const getBaseUrl = () => {
      // Priority 1: Environment variable BASE_URL
      if (process.env.BASE_URL) {
        return process.env.BASE_URL;
      }
      // Priority 2: Construct from request (for production)
      // Handle proxy/load balancer with X-Forwarded-* headers
      const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      if (protocol && host) {
        return `${protocol}://${host}`;
      }
      // Priority 3: Return null (will use relative path)
      return null;
    };

    const baseUrl = getBaseUrl();

    // If LPA data, check if file already exists
    if (isLPA && QRCodeService.fileExists(storagePath)) {
      console.log("QR code already exists in storage:", storagePath);
      const imageUrl = QRCodeService.getPublicUrl(storagePath, baseUrl);

      // Clean up temporary files
      if (logoPath && req.file) {
        fs.unlinkSync(logoPath);
      }

      // Return JSON with imageUrl
      return res.json({
        success: true,
        imageUrl: imageUrl,
        cached: true,
        message: "QR code retrieved from storage",
      });
    }

    // Generate QR code
    const qrCodeBuffer = await QRCodeService.generateQRCodeWithLogo({
      url: data, // Internal service uses 'url' parameter name
      logoPath,
      colorDark,
      colorLight,
      errorCorrectionLevel,
      margin: parseInt(margin),
      width: parseInt(width),
      logoSize: parseFloat(logoSize),
      roundedCorners: roundedCorners === "true" || roundedCorners === true,
    });

    // Save to storage
    await QRCodeService.saveQRCodeToStorage(qrCodeBuffer, storagePath);
    const imageUrl = QRCodeService.getPublicUrl(storagePath, baseUrl);

    // Clean up temporary files
    if (logoPath && req.file) {
      fs.unlinkSync(logoPath);
    }

    console.log("QR code generated and saved, imageUrl:", imageUrl);

    // Return JSON with imageUrl
    res.json({
      success: true,
      imageUrl: imageUrl,
      cached: false,
      message: "QR code generated and saved",
    });
  } catch (error) {
    // Clean up temporary files on error
    if (logoPath && fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }
    next(error);
  }
});

/**
 * GET /api/qrcode/generate
 * Generate QR code with logo (GET method for simple use)
 *
 * Query parameters:
 * - data (required): The URL or text to encode
 * - logoUrl (optional): URL of logo image
 * - colorDark (optional): Color for QR modules
 * - colorLight (optional): Background color
 * - width (optional): Output width
 */
router.get("/generate", async (req, res, next) => {
  let logoPath = null;

  try {
    const {
      data,
      logoUrl,
      colorDark = "#1DB9B9",
      colorLight = "#FFFFFF",
      errorCorrectionLevel = "H",
      margin = 4,
      width = 1000,
      logoSize = 0.2,
      roundedCorners = true,
    } = req.query;

    if (!data) {
      return res.status(400).json({ error: "data parameter is required" });
    }

    if (logoUrl) {
      try {
        logoPath = await QRCodeService.downloadLogo(logoUrl);
      } catch (logoError) {
        console.warn(
          "Failed to download logo, continuing without logo:",
          logoError.message
        );
        logoPath = null;
      }
    }

    console.log("Request parameters:", {
      data,
      colorDark,
      width,
      logoSize,
      roundedCorners,
    });

    // Check if data contains LPA
    const isLPA = QRCodeService.isLPAData(data);
    const storagePath = QRCodeService.getStoragePath(data);

    // Get base URL from request or environment
    const getBaseUrl = () => {
      // Priority 1: Environment variable BASE_URL
      if (process.env.BASE_URL) {
        return process.env.BASE_URL;
      }
      // Priority 2: Construct from request (for production)
      // Handle proxy/load balancer with X-Forwarded-* headers
      const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      if (protocol && host) {
        return `${protocol}://${host}`;
      }
      // Priority 3: Return null (will use relative path)
      return null;
    };

    const baseUrl = getBaseUrl();

    // If LPA data, check if file already exists
    if (isLPA && QRCodeService.fileExists(storagePath)) {
      console.log("QR code already exists in storage:", storagePath);
      const imageUrl = QRCodeService.getPublicUrl(storagePath, baseUrl);

      // Clean up temporary files
      if (logoPath && fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      // Return JSON with imageUrl
      return res.json({
        success: true,
        imageUrl: imageUrl,
        cached: true,
        message: "QR code retrieved from storage",
      });
    }

    // Generate new QR code
    const qrCodeBuffer = await QRCodeService.generateQRCodeWithLogo({
      url: data, // Internal service uses 'url' parameter name
      logoPath,
      colorDark,
      colorLight,
      errorCorrectionLevel,
      margin: parseInt(margin),
      width: parseInt(width),
      logoSize: parseFloat(logoSize),
      roundedCorners: roundedCorners === "true" || roundedCorners === true,
    });

    // Save to storage
    await QRCodeService.saveQRCodeToStorage(qrCodeBuffer, storagePath);
    const imageUrl = QRCodeService.getPublicUrl(storagePath, baseUrl);

    // Clean up temporary files
    if (logoPath && fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    console.log("QR code generated and saved, imageUrl:", imageUrl);

    // Return JSON with imageUrl
    res.json({
      success: true,
      imageUrl: imageUrl,
      cached: false,
      message: "QR code generated and saved",
    });
  } catch (error) {
    // Clean up temporary files on error
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        fs.unlinkSync(logoPath);
      } catch (cleanupError) {
        console.error("Error cleaning up logo file:", cleanupError);
      }
    }
    console.error("Error generating QR code:", error);
    next(error);
  }
});

module.exports = router;
