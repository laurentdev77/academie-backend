const express = require("express");
const router = express.Router();

const studentController = require("../controllers/student.controller");
const authJwt = require("../middleware/authJwt"); 
const multer = require("multer");

/* ============================================================
   📁 CONFIGURATION UPLOAD PHOTO
   ============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

/* ============================================================
   🔐 Token obligatoire pour toutes les routes
   ============================================================ */
router.use(authJwt.verifyToken);

/* ============================================================
   📸 Upload de photo étudiant (accès admin + secretary + DE)
   ============================================================ */
router.post("/upload-photo", authJwt.isAdminFamily, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
});

/* ============================================================
   🎓 Étudiant connecté — Modules de sa promotion
   ============================================================ */
router.get(
  "/mes-modules",
  authJwt.isStudent,
  studentController.getModulesForStudent
);

/* ============================================================
   🧑‍💼 CRUD complet — Admin + Secretary + DE
   ============================================================ */
router.get("/", authJwt.isAdminFamily, studentController.getAllStudents);
router.get("/:id", authJwt.isAdminFamily, studentController.getStudentById);
router.post("/", authJwt.isAdminFamily, studentController.createStudent);
router.put("/:id", authJwt.isAdminFamily, studentController.updateStudent);
router.delete("/:id", authJwt.isAdminFamily, studentController.deleteStudent);

/* ============================================================
   👨‍🏫 Enseignant — voir les étudiants d’une promotion
   ============================================================ */
router.get(
  "/by-promotion/:promotionId",
  authJwt.isTeacher,
  studentController.getStudentsByPromotion
);

/* ============================================================
   🔗 Liaison User ↔ Étudiant (Admin + Secretary + DE)
   ============================================================ */
router.post("/link", authJwt.isAdminFamily, studentController.linkUserToStudent);

module.exports = router;
