const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const { verifyToken, isAdminFamily } = require("../middleware/authJwt");

/**
 * ============================================================
 * 👨‍🏫 ROUTES ENSEIGNANTS
 * ============================================================
 */

// 🔹 Lire la liste de tous les enseignants (admin, secretary, DE, teacher)
router.get("/", verifyToken, (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé aux admin, secretary, DE ou enseignants."
  });
}, teacherController.getAllTeachers);

// 🔹 Lire un enseignant (admin, secretary, DE, teacher)
router.get("/:id", verifyToken, (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé aux admin, secretary, DE ou enseignants."
  });
}, teacherController.getTeacherById);

/* ============================================================
   🔹 CRUD complet — réservé à Admin + Secretary + DE
   ============================================================ */
router.post("/", verifyToken, isAdminFamily, teacherController.createTeacher);
router.put("/:id", verifyToken, isAdminFamily, teacherController.updateTeacher);
router.delete("/:id", verifyToken, isAdminFamily, teacherController.deleteTeacher);

// 🔹 Lier un User à un Teacher — réservé admin + secretary + de
router.put("/link-user/:teacherId", verifyToken, isAdminFamily, teacherController.linkUserToTeacher);

module.exports = router;
