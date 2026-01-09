const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const authJwt = require("../middleware/authJwt");
const { canAccessModule } = require("../middleware/checkModuleAccess");
const multer = require("multer");
const path = require("path");

// 🔹 Configuration upload fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// 🔹 Middleware global : Token obligatoire
router.use(authJwt.verifyToken);

// 🔹 Upload photo (Admin, Secretary, DE)
router.post(
  "/upload-photo",
  authJwt.isAdminFamily,
  upload.single("photo"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
    res.json({ url: `/uploads/${req.file.filename}` });
  }
);

// 🔹 Modules de l’étudiant connecté
router.get("/mes-modules", authJwt.isStudent, studentController.getModulesForStudent);

// 🔹 CRUD étudiants (Admin / Secretary / DE)
router.get("/", authJwt.isAdminFamily, studentController.getAllStudents);
router.get("/:id", authJwt.isAdminFamily, studentController.getStudentById);
router.post("/", authJwt.isAdminFamily, studentController.createStudent);
router.put("/:id", authJwt.isAdminFamily, studentController.updateStudent);
router.delete("/:id", authJwt.isAdminFamily, studentController.deleteStudent);

// 🔹 Étudiants par module (Admin / Teacher)
router.get("/by-module/:id", authJwt.verifyToken, studentController.getStudentsByModule);

// 🔹 Étudiants par promotion (Admin / Teacher)
router.get(
  "/by-promotion/:promotionId",
  authJwt.isAdminOrTeacher,
  studentController.getStudentsByPromotion
);

// 🔹 Liaison User ↔ Étudiant (Admin / Secretary / DE)
router.post("/link", authJwt.isAdminFamily, studentController.linkUserToStudent);

module.exports = router;
