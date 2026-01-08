const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const authJwt = require("../middleware/authJwt");
const multer = require("multer");
const path = require("path");

/* ============================================================
   📁 CONFIGURATION UPLOAD PHOTO
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

/* ============================================================
   🔐 AUTH GLOBAL
============================================================ */
router.use(authJwt.verifyToken);

/* ============================================================
   📸 UPLOAD PHOTO
============================================================ */
router.post(
  "/upload-photo",
  authJwt.isAdminFamily,
  upload.single("photo"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  }
);

/* ============================================================
   🎓 MODULES DE L’ÉTUDIANT CONNECTÉ
============================================================ */
router.get(
  "/mes-modules",
  authJwt.isStudent,
  studentController.getModulesForStudent
);

/* ============================================================
   🧑‍💼 CRUD ÉTUDIANTS
============================================================ */
router.get("/", authJwt.isAdminFamily, studentController.getAllStudents);
router.get("/:id", authJwt.isAdminFamily, studentController.getStudentById);
router.post("/", authJwt.isAdminFamily, studentController.createStudent);
router.put("/:id", authJwt.isAdminFamily, studentController.updateStudent);
router.delete("/:id", authJwt.isAdminFamily, studentController.deleteStudent);

/* ============================================================
   📚 ÉTUDIANTS PAR MODULE
   ✔ Admin / Secretary / DE
   ✔ Teacher (avec contrôle dans le controller)
============================================================ */
router.get(
  "/by-module/:moduleId",
  authJwt.isTeacher,
  studentController.getStudentsByModule
);

/* ============================================================
   👨‍🏫 ÉTUDIANTS PAR PROMOTION
============================================================ */
router.get(
  "/by-promotion/:promotionId",
  authJwt.isTeacher,
  studentController.getStudentsByPromotion
);

/* ============================================================
   🔗 LIAISON USER ↔ ÉTUDIANT
============================================================ */
router.post(
  "/link",
  authJwt.isAdminFamily,
  studentController.linkUserToStudent
);

module.exports = router;
