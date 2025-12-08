const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");
const { verifyToken, isTeacher, isAdminFamily } = require("../middleware/authJwt");

// Authentification requise
router.use(verifyToken);

/* ============================================================
   🔹 Lecture accessible : admin + secretary + de + teacher
   ============================================================ */
router.get("/", (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé à admin, secretary, DE ou enseignant."
  });
}, promotionController.getAllPromotions);

/* ============================================================
   🔹 Promotions par filière (teacher + adminFamily)
   ============================================================ */
router.get("/by-filiere/:filiereId", (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé à admin, secretary, DE ou enseignant."
  });
}, promotionController.getPromotionsByFiliere);

/* ============================================================
   🔹 Lire une promotion (lecture seule pour teacher)
   ============================================================ */
router.get("/:id", (req, res, next) => {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: "Accès refusé — réservé à admin, secretary, DE ou enseignant."
  });
}, promotionController.getPromotionById);

/* ============================================================
   🔹 CRUD complet (admin + secretary + DE)
   ============================================================ */
router.post("/", isAdminFamily, promotionController.createPromotion);
router.put("/:id", isAdminFamily, promotionController.updatePromotion);
router.delete("/:id", isAdminFamily, promotionController.deletePromotion);

module.exports = router;
