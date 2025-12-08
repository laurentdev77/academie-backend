// controllers/resource.controller.js
const db = require("../models");
const Resource = db.Resource;
const path = require("path");
/**
 * 📘 Liste complète des ressources (Admin uniquement)
 */
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll();
    res.status(200).json({ message: "Toutes les ressources", data: resources });
  } catch (error) {
    console.error("Erreur getAllResources:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * 📘 Ressources d’un module spécifique
 */
exports.getResourcesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const resources = await Resource.findAll({ where: { moduleId } });
    res.status(200).json({ message: "Ressources du module", data: resources });
  } catch (error) {
    console.error("Erreur getResourcesByModule:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * 📘 Ressource unique par ID
 */
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource)
      return res.status(404).json({ message: "Ressource introuvable." });
    res.status(200).json({ message: "Ressource trouvée", data: resource });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * ➕ Créer une ressource
 */
exports.createResource = async (req, res) => {
  try {
    const { title, type, url, description, moduleId } = req.body;
    if (!title || !url || !moduleId)
      return res.status(400).json({ message: "Champs manquants." });

    const newResource = await Resource.create({
      title,
      type,
      url,
      description,
      moduleId,
    });

    res.status(201).json({ message: "Ressource créée", data: newResource });
  } catch (error) {
    console.error("Erreur createResource:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * ✏️ Modifier une ressource
 */
exports.updateResource = async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    const resource = await Resource.findByPk(req.params.id);
    if (!resource)
      return res.status(404).json({ message: "Ressource introuvable." });

    await resource.update({
      title: title ?? resource.title,
      type: type ?? resource.type,
      url: url ?? resource.url,
      description: description ?? resource.description,
    });

    res.status(200).json({ message: "Ressource mise à jour", data: resource });
  } catch (error) {
    console.error("Erreur updateResource:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * ❌ Supprimer une ressource
 */
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource)
      return res.status(404).json({ message: "Ressource introuvable." });
    await resource.destroy();
    res.status(200).json({ message: "Ressource supprimée." });
  } catch (error) {
    console.error("Erreur deleteResource:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/**
 * 📂 Upload d’un fichier de ressource
 */
exports.uploadResource = async (req, res) => {
  try {
    const { moduleId, title, type, description } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "Aucun fichier reçu." });

    const fileUrl = `/uploads/resources/${req.file.filename}`;

    const newResource = await db.Resource.create({
      title: title || req.file.originalname,
      type: type || "document",
      description: description || null,
      url: fileUrl,
      moduleId,
    });

    return res.status(201).json({
      message: "Fichier uploadé et ressource créée avec succès",
      data: newResource,
    });
  } catch (error) {
    console.error("Erreur uploadResource:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
