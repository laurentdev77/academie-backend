const { Module } = require("../models");

/**
 * Vérifie si l'utilisateur peut accéder à un module
 * - Admin / Secretary / DE → toujours ok
 * - Teacher → seulement si il enseigne le module
 * - Student → interdit
 */
async function canAccessModule(req, res, next) {
  try {
    const { moduleId } = req.params;
    const role = req.user?.role?.name?.toLowerCase();

    // Récupérer le module
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module introuvable" });
    }

    req.module = module; // On garde le module pour le controller

    // Student → interdit
    if (role === "student") {
      return res.status(403).json({ message: "Accès réservé à l’administration ou aux enseignants" });
    }

    // Teacher → doit enseigner le module
    if (["teacher", "enseignant"].includes(role)) {
      if (!req.teacherId) {
        return res.status(403).json({ message: "Profil enseignant non lié" });
      }
      if (String(module.teacherId) !== String(req.teacherId)) {
        return res.status(403).json({ message: "Vous n'enseignez pas ce module" });
      }
    }

    // Admin / Secretary / DE → ok
    next();
  } catch (err) {
    console.error("canAccessModule error:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
}

module.exports = { canAccessModule };
