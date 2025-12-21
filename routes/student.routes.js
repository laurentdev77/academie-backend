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
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

/* ============================================================
   🔐 Vérification du token
============================================================ */
router.use(authJwt.verifyToken);

/* ============================================================
   📸 Upload photo étudiant
============================================================ */
router.post(
  "/upload-photo",
  authJwt.isAdminFamily,
  upload.single("photo"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu" });
    }
    res.status(200).json({ url: `/uploads/${req.file.filename}` });
  }
);

/* ============================================================
   🎓 Modules de l'étudiant connecté
============================================================ */
router.get(
  "/mes-modules",
  authJwt.isStudent,
  studentController.getModulesForStudent
);

/* ============================================================
   🧑‍💼 CRUD étudiants
============================================================ */
router.get("/", authJwt.isAdminFamily, studentController.getAllStudents);

// ❌ SUPPRIMÉ car la fonction n’existe pas
// router.get("/:id", authJwt.isAdminFamily, studentController.getStudentById);

router.post("/", authJwt.isAdminFamily, studentController.createStudent);
router.put("/:id", authJwt.isAdminFamily, studentController.updateStudent);
router.delete("/:id", authJwt.isAdminFamily, studentController.deleteStudent);

/* ============================================================
   👨‍🏫 Étudiants par promotion
============================================================ */
router.get(
  "/by-promotion/:promotionId",
  authJwt.isTeacher,
  studentController.getStudentsByPromotion
);

/* ============================================================
   🔗 Liaison User ↔ Étudiant
============================================================ */
router.post(
  "/link",
  authJwt.isAdminFamily,
  studentController.linkUserToStudent
);

module.exports = router;
