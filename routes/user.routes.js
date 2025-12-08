const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, isTeacher, isAdminFamily } = require("../middleware/authJwt");

/* ============================================================
   🛡️ Token obligatoire
   ============================================================ */
router.use(verifyToken);

/* ============================================================
   👨‍🏫 Accès partagé (Admin + Secretary + DE + Enseignant)
   ============================================================ */

// Liste des enseignants
router.get("/teachers", isTeacher, userController.getTeachers);

// Modules d’un enseignant connecté
router.get("/modules", isTeacher, userController.getUserModules);

/* ============================================================
   🧑‍💼 Accès réservé : Admin + Secretary + DE
   ============================================================ */

router.get("/", isAdminFamily, userController.getAllUsers);
router.get("/roles", isAdminFamily, userController.getRoles);
router.get("/non-students", isAdminFamily, userController.getNonStudents);
router.get("/students", isAdminFamily, userController.getStudents);

// CRUD complet
router.get("/:id", isAdminFamily, userController.getUserById);
router.post("/", isAdminFamily, userController.createUser);
router.put("/:id", isAdminFamily, userController.updateUser);

// Gestion du rôle
router.put("/:userId/role", isAdminFamily, userController.updateUserRole);

// Validation et activation
router.patch("/:id/approve", isAdminFamily, userController.approveUser);

// Suppression / restauration
router.delete("/:id", isAdminFamily, userController.deleteUser);
router.patch("/:id/restore", isAdminFamily, userController.restoreUser);
router.delete("/:id/force", isAdminFamily, userController.forceDeleteUser);

// Mise à jour du mot de passe
router.put("/:id/password", isAdminFamily, userController.updateUserPassword);

// Lier un User à un Student
router.put("/:userId/link-student/:studentId", isAdminFamily, userController.linkStudentToUser);

module.exports = router;
