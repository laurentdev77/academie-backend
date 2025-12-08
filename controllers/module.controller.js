// controllers/module.controller.js
const db = require("../models");
const { Op } = require("sequelize");

const Module = db.Module;
const User = db.User;
const Promotion = db.Promotion;
const Filiere = db.Filiere;

/* ============================================================
   👨‍🏫 Enseignant — Obtenir SES modules (robuste)
   ============================================================ */
exports.getMyModules = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const role = user.role?.name?.toLowerCase() || "";
    if (!["teacher", "enseignant", "admin"].includes(role))
      return res.status(403).json({ message: "Accès réservé aux enseignants." });

    const modules = await Module.findAll({
      where: { teacherId: user.id },
      include: [
        { model: db.User, as: "teacher", attributes: ["id", "username", "email"] },
        {
          model: db.Promotion,
          as: "promotion",
          attributes: ["id", "nom"],
          include: [{ model: db.Filiere, as: "filiere", attributes: ["id", "nom"] }]
        }
      ],
      order: [["semester", "ASC"], ["title", "ASC"]]
    });

    return res.status(200).json({
      message: "Modules assignés à l’enseignant connecté.",
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error("❌ Erreur getMyModules:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du chargement des modules de l’enseignant.",
      error: error.message
    });
  }
};

/* ============================================================
   🔹 Obtenir un module spécifique
   ============================================================ */
exports.getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [
        { model: User, as: "teacher", attributes: ["id", "username", "email"] },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["id", "nom"],
          include: [
            { model: Filiere, as: "filiere", attributes: ["id", "nom"] }
          ]
        }
      ]
    });

    if (!module)
      return res.status(404).json({ message: "Module introuvable." });

    return res.status(200).json({
      message: "Module trouvé",
      data: module
    });
  } catch (error) {
    console.error("❌ Erreur getModuleById:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du chargement du module.",
      error: error.message
    });
  }
};

/* ============================================================
   🔹 Créer un module (Admin)
   ============================================================ */
exports.createModule = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      credits,
      semester,
      teacherId,
      filiereId,
      promotionId
    } = req.body;

    if (!title || !code)
      return res.status(400).json({
        message: "Le titre et le code du module sont obligatoires."
      });

    const exist = await Module.findOne({ where: { code } });

    if (exist)
      return res.status(409).json({
        message: "Ce code de module existe déjà."
      });

    const newModule = await Module.create({
      title,
      code,
      description: description || null,
      credits: credits || 0,
      semester: semester || 1,
      teacherId: teacherId || null,
      filiereId: filiereId || null,
      promotionId: promotionId || null
    });

    return res.status(201).json({
      message: "Module créé avec succès",
      data: newModule
    });
  } catch (error) {
    console.error("❌ Erreur createModule:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la création du module.",
      error: error.message
    });
  }
};

/* ============================================================
   🔹 Mettre à jour un module (Admin)
   ============================================================ */
exports.updateModule = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      credits,
      semester,
      teacherId,
      filiereId,
      promotionId
    } = req.body;

    const module = await Module.findByPk(req.params.id);

    if (!module)
      return res.status(404).json({ message: "Module introuvable." });

    await module.update({
      title: title ?? module.title,
      code: code ?? module.code,
      description: description ?? module.description,
      credits: credits ?? module.credits,
      semester: semester ?? module.semester,
      teacherId: teacherId ?? module.teacherId,
      filiereId: filiereId ?? module.filiereId,
      promotionId: promotionId ?? module.promotionId
    });

    return res.status(200).json({
      message: "Module mis à jour avec succès",
      data: module
    });
  } catch (error) {
    console.error("❌ Erreur updateModule:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du module.",
      error: error.message
    });
  }
};

/* ============================================================
   🔹 Supprimer un module (Admin)
   ============================================================ */
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module)
      return res.status(404).json({ message: "Module introuvable." });

    await module.destroy();

    return res.status(200).json({
      message: "Module supprimé avec succès."
    });
  } catch (error) {
    console.error("❌ Erreur deleteModule:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la suppression du module.",
      error: error.message
    });
  }
};

/* ============================================================
   🔹 Obtenir tous les modules (Admin / Teacher)
============================================================ */
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.findAll({
      include: [
        { model: User, as: "teacher", attributes: ["id", "username", "email"] },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["id", "nom"],
          include: [{ model: Filiere, as: "filiere", attributes: ["id", "nom"] }]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Liste complète des modules",
      data: modules,
    });
  } catch (error) {
    console.error("❌ Erreur getAllModules:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du chargement des modules.",
      error: error.message,
    });
  }
};
