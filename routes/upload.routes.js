// backend/routes/upload.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../middleware/authJwt");
const router = express.Router();

// Dossier de stockage
const uploadDir = path.join(__dirname, "..", "uploads", "photos");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

// POST /api/upload-photo
router.post("/", verifyToken, upload.single("photo"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
    const url = `/uploads/photos/${req.file.filename}`;
    res.json({ message: "Upload OK", url, filename: req.file.filename });
  } catch (err) {
    console.error("upload error:", err);
    res.status(500).json({ message: "Erreur upload", error: err.message });
  }
});

module.exports = router;
