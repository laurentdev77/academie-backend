const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const teacherController = require("../controllers/teacher.controller");
const { verifyToken, isAdminFamily } = require("../middleware/authJwt");

/**
 * ============================================================
 * 📸 CONFIG UPLOAD PHOTO ENSEIGNANT
 * ============================================================
 */

const uploadDir = path.join(__dirname, "..", "uploads", "photos");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `teacher-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * ============================================================
 * 👨‍🏫 ROUTES ENSEIGNANTS
 * ============================================================
 */

// 🔹 Lire la liste de tous les enseignants
router.get(
  "/",
  verifyToken,
  (req, res, next) => {
    const role = req.user?.role?.name?.toLowerCase();
    if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
      return next();
    }
    return res.status(403).json({
      message: "Accès refusé — réservé aux admin, secretary, DE ou enseignants.",
    });
  },
  teacherController.getAllTeachers
);

// 🔹 Lire un enseignant par ID
router.get(
  "/:id",
  verifyToken,
  (req, res, next) => {
    const role = req.user?.role?.name?.toLowerCase();
    if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
      return next();
    }
    return res.status(403).json({
      message: "Accès refusé — réservé aux admin, secretary, DE ou enseignants.",
    });
  },
  teacherController.getTeacherById
);

/**
 * ============================================================
 * 🔹 CRUD complet — Admin / Secretary / DE
 * ============================================================
 */

router.post("/", verifyToken, isAdminFamily, teacherController.createTeacher);
router.put("/:id", verifyToken, isAdminFamily, teacherController.updateTeacher);
router.delete("/:id", verifyToken, isAdminFamily, teacherController.deleteTeacher);

// 🔹 Lier un User à un Teacher
router.put(
  "/link-user/:teacherId",
  verifyToken,
  isAdminFamily,
  teacherController.linkUserToTeacher
);

/**
 * ============================================================
 * 📸 UPLOAD PHOTO ENSEIGNANT (ROUTE MANQUANTE AVANT)
 * ============================================================
 * POST /api/teachers/:id/photo
 */
router.post(
  "/:id/photo",
  verifyToken,
  isAdminFamily,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier envoyé" });
      }

      const photoUrl = `/uploads/photos/${req.file.filename}`;

      // Mise à jour en DB
      await teacherController.updateTeacherPhoto(req.params.id, photoUrl);

      return res.json({
        message: "Photo enseignant mise à jour",
        photoUrl,
      });
    } catch (err) {
      console.error("❌ Upload photo enseignant:", err);
      return res.status(500).json({ message: "Erreur upload photo" });
    }
  }
);

module.exports = router;
