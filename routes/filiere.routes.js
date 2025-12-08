const express = require("express");
const router = express.Router();
const filiereController = require("../controllers/filiere.controller");
const { verifyToken, isAdminFamily } = require("../middleware/authJwt");

/**
 * ==============================
 * 📘 ROUTES FILIÈRES
 * ==============================
 */

// 🔹 Lecture autorisée à admin + secretary + de + teacher
router.get("/", verifyToken, (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé aux admins, secretary, DE ou enseignants."
  });
}, filiereController.getAllFilieres);

// 🔹 Création — admin + secretary + DE
router.post("/", verifyToken, isAdminFamily, filiereController.createFiliere);

// 🔹 Mise à jour — admin + secretary + DE
router.put("/:id", verifyToken, isAdminFamily, filiereController.updateFiliere);

// 🔹 Suppression — admin + secretary + DE
router.delete("/:id", verifyToken, isAdminFamily, filiereController.deleteFiliere);

module.exports = router;
