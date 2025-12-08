const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Dossier officiel et unique pour toutes les photos
const uploadDir = path.join(__dirname, "..", "uploads", "photos");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

exports.uploadPhoto = [
  upload.single("photo"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier envoyé" });

    const fileUrl = `/uploads/photos/${req.file.filename}`;

    return res.status(200).json({ url: fileUrl });
  },
];
