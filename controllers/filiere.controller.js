// controllers/filiere.controller.js

const db = require("../models");
const Filiere = db.Filiere;

/**
 * ==============================
 * 📚 GESTION DES FILIÈRES
 * ==============================
 */

/** 🔹 Récupérer toutes les filières */
exports.getAllFilieres = async (req, res) => {
  try {
    const filieres = await Filiere.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(filieres);
  } catch (error) {
    console.error("Erreur getAllFilieres :", error);
    res.status(500).json({
      message: "Erreur lors du chargement des filières.",
      error: error.message,
    });
  }
};

/** 🔹 Créer une nouvelle filière */
exports.createFiliere = async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ message: "Le nom de la filière est requis." });
    }

    // Vérification doublon
    const exist = await Filiere.findOne({ where: { nom } });
    if (exist) {
      return res.status(409).json({ message: "Cette filière existe déjà." });
    }

    // ✅ Garantir que description ne soit jamais null
    const newFiliere = await Filiere.create({
      nom: nom.trim(),
      description: description?.trim() || "",
    });

    res.status(201).json({
      message: "Filière créée avec succès.",
      data: newFiliere,
    });
  } catch (error) {
    console.error("Erreur createFiliere :", error);
    res.status(500).json({
      message: "Erreur lors de la création de la filière.",
      error: error.message,
    });
  }
};

/** 🔹 Mettre à jour une filière */
exports.updateFiliere = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;

    const filiere = await Filiere.findByPk(id);
    if (!filiere) {
      return res.status(404).json({ message: "Filière introuvable." });
    }

    // Vérification doublon sur un autre enregistrement
    const exist = await Filiere.findOne({ where: { nom } });
    if (exist && exist.id !== filiere.id) {
      return res.status(409).json({ message: "Ce nom de filière est déjà utilisé." });
    }

    // ✅ Mise à jour complète
    filiere.nom = nom?.trim() || filiere.nom;
    filiere.description = description?.trim() || filiere.description || "";
    await filiere.save();

    res.status(200).json({
      message: "Filière mise à jour avec succès.",
      data: filiere,
    });
  } catch (error) {
    console.error("Erreur updateFiliere :", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de la filière.",
      error: error.message,
    });
  }
};

/** 🔹 Supprimer une filière */
exports.deleteFiliere = async (req, res) => {
  try {
    const { id } = req.params;
    const filiere = await Filiere.findByPk(id);

    if (!filiere) {
      return res.status(404).json({ message: "Filière introuvable." });
    }

    await filiere.destroy();
    res.status(200).json({ message: "Filière supprimée avec succès." });
  } catch (error) {
    console.error("Erreur deleteFiliere :", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la filière.",
      error: error.message,
    });
  }
};
