// controllers/promotion.controller.js
const db = require("../models");
const Promotion = db.Promotion;
const Filiere = db.Filiere;

/* =====================================================
   📘 GET toutes les promotions (avec filière associée)
   ===================================================== */
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findAll({
      attributes: ["id", "nom", "annee", "filiereId"],
      include: [
        {
          model: Filiere,
          as: "filiere",
          attributes: ["id", "nom"],
        },
      ],
      order: [["annee", "DESC"]],
    });

    res.status(200).json(promotions);
  } catch (err) {
    console.error("getAllPromotions error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* =====================================================
   📗 GET une promotion par ID
   ===================================================== */
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id, {
      attributes: ["id", "nom", "annee", "filiereId"],
      include: [
        { model: Filiere, as: "filiere", attributes: ["id", "nom"] },
        { association: "students" }, // garde la compatibilité
      ],
    });

    if (!promotion)
      return res.status(404).json({ message: "Promotion introuvable" });

    res.status(200).json(promotion);
  } catch (err) {
    console.error("getPromotionById error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* =====================================================
   🟢 CREATE promotion
   ===================================================== */
exports.createPromotion = async (req, res) => {
  try {
    const { nom, annee, filiereId } = req.body;
    if (!nom || !annee)
      return res.status(400).json({ message: "Champs requis manquants" });

    const promotion = await Promotion.create({ nom, annee, filiereId });
    res.status(201).json(promotion);
  } catch (err) {
    console.error("createPromotion error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* =====================================================
   🟡 UPDATE promotion
   ===================================================== */
exports.updatePromotion = async (req, res) => {
  try {
    const { nom, annee, filiereId } = req.body;
    const promotion = await Promotion.findByPk(req.params.id);

    if (!promotion)
      return res.status(404).json({ message: "Promotion introuvable" });

    await promotion.update({
      nom: nom ?? promotion.nom,
      annee: annee ?? promotion.annee,
      filiereId: filiereId ?? promotion.filiereId,
    });

    res.status(200).json(promotion);
  } catch (err) {
    console.error("updatePromotion error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* =====================================================
   🔴 DELETE promotion
   ===================================================== */
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion)
      return res.status(404).json({ message: "Promotion introuvable" });

    await promotion.destroy();
    res.status(204).send();
  } catch (err) {
    console.error("deletePromotion error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getPromotionsByFiliere = async (req, res) => {
  try {
    const { filiereId } = req.params;
    if (!filiereId) {
      return res.status(400).json({ message: "ID de filière manquant" });
    }

    const promotions = await db.Promotion.findAll({
      where: { filiereId },
      attributes: ["id", "nom", "annee", "filiereId"],
      order: [["annee", "DESC"]],
    });

    res.status(200).json(promotions);
  } catch (error) {
    console.error("Erreur getPromotionsByFiliere:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
