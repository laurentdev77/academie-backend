const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const resourceController = require("../controllers/resource.controller");
const { verifyToken, isTeacher, isAdminFamily } = require("../middleware/authJwt");

/**
 * ==============================
 * 📘 ROUTES DE GESTION DES RESSOURCES
 * ==============================
 */

// === Création automatique du dossier uploads/resources ===
const uploadDir = path.join(__dirname, "../uploads/resources");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Dossier créé :", uploadDir);
}

// === Configuration de Multer ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

/* ============================================================
   🔐 Toutes les routes nécessitent un token
   ============================================================ */
router.use(verifyToken);

/* ============================================================
   📌 ROUTES
   ============================================================ */

// ✅ Récupérer toutes les ressources (AdminFamily uniquement)
router.get("/", isAdminFamily, resourceController.getAllResources);

// ✅ Récupérer les ressources d’un module (teacher + admin + secretary + de)
router.get(
  "/by-module/:moduleId",
  isTeacher, // teacher + adminFamily
  resourceController.getResourcesByModule
);

// ✅ Récupérer une ressource précise
router.get("/:id", isTeacher, resourceController.getResourceById);

// ✅ Créer une ressource (teacher + adminFamily)
router.post("/", isTeacher, resourceController.createResource);

// ✅ Modifier une ressource (teacher + adminFamily)
router.put("/:id", isTeacher, resourceController.updateResource);

// ✅ Supprimer une ressource (teacher + adminFamily)
router.delete("/:id", isTeacher, resourceController.deleteResource);

/* ============================================================
   📁 Upload fichier ressource (teacher + adminFamily)
   ============================================================ */
router.post(
  "/upload",
  isTeacher, // teacher + adminFamily
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier envoyé." });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/resources/${req.file.filename}`;

      return res.status(201).json({
        message: "Fichier uploadé avec succès.",
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error("❌ Erreur upload :", error);
      return res.status(500).json({
        message: "Erreur lors de l’upload du fichier.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
