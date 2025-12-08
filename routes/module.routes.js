const express = require("express");
const router = express.Router();
const moduleController = require("../controllers/module.controller");
const { verifyToken, isTeacher } = require("../middleware/authJwt");

/**
 * ==============================
 * 🎓 ROUTES MODULES
 * ==============================
 */

// Rôles autorisés à VOIR les modules
const canView = ["admin", "teacher", "secretary", "de"];

// Rôles autorisés à créer / modifier / supprimer
const canManage = ["admin", "secretary", "de"];

/* -------------------------------------------
   🔹 Middleware : lecture autorisée
--------------------------------------------- */
function allowView(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (canView.includes(role)) return next();

  return res.status(403).json({
    message: "Accès réservé aux admin, teacher, secretary ou DE."
  });
}

/* -------------------------------------------
   🔹 Middleware : gestion autorisée
--------------------------------------------- */
function allowManage(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (canManage.includes(role)) return next();

  return res.status(403).json({
    message: "Accès réservé aux admin, secretary ou DE."
  });
}

/* ============================================================
   📌 ROUTES
   ============================================================ */

// ✅ Lire tous les modules
router.get("/", verifyToken, allowView, moduleController.getAllModules);

// ✅ Modules de l’enseignant connecté
router.get("/my", verifyToken, isTeacher, moduleController.getMyModules);

// ✅ Lire un module précis
router.get("/:id", verifyToken, allowView, moduleController.getModuleById);

// ✅ CRUD (admin + secretary + DE)
router.post("/", verifyToken, allowManage, moduleController.createModule);
router.put("/:id", verifyToken, allowManage, moduleController.updateModule);
router.delete("/:id", verifyToken, allowManage, moduleController.deleteModule);

module.exports = router;
