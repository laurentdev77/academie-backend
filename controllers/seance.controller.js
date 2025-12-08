// controllers/seance.controller.js
const db = require("../models");

const Seance = db.Seance;
const Module = db.Module;
const Presence = db.Presence;
const Student = db.Student;

/* Helper */
function handleServerError(res, error, context = "") {
  console.error(`❌ Erreur ${context}:`, error);
  return res.status(500).json({ message: "Erreur serveur.", error: error?.message || error });
}

/* CREATE SEANCE
   Expects: { titre, dateSeance, heureDebut?, heureFin?, moduleId }
   dateSeance -> DATEONLY
*/
exports.createSeance = async (req, res) => {
  try {
    const { titre, dateSeance, heureDebut, heureFin, moduleId } = req.body;
    if (!moduleId) return res.status(400).json({ message: "moduleId requis." });

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    const dateVal = dateSeance ? dateSeance : new Date().toISOString().slice(0,10);

    const seance = await Seance.create({
      titre: titre ?? `Séance du ${dateVal}`,
      dateSeance: dateVal,
      heureDebut: heureDebut ?? null,
      heureFin: heureFin ?? null,
      moduleId,
    });

    res.status(201).json({ seance });

  } catch (error) {
    handleServerError(res, error, "createSeance");
  }
};

/* GET ALL SEANCES */
exports.getAllSeances = async (req, res) => {
  try {
    const seances = await Seance.findAll({
      include: [{ model: Module, as: "module" }],
      order: [["dateSeance", "DESC"]],
    });
    res.json({ seances });
  } catch (error) {
    handleServerError(res, error, "getAllSeances");
  }
};

/* GET SEANCE BY ID */
exports.getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id, {
      include: [{ model: Module, as: "module" }],
    });
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });
    res.json({ seance });
  } catch (error) {
    handleServerError(res, error, "getSeanceById");
  }
};

/* UPDATE SEANCE */
exports.updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    const { titre, dateSeance, heureDebut, heureFin } = req.body;
    await seance.update({ titre, dateSeance, heureDebut, heureFin });

    res.json({ seance });
  } catch (error) {
    handleServerError(res, error, "updateSeance");
  }
};

/* DELETE SEANCE */
exports.deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    await seance.destroy();
    res.json({ message: "Séance supprimée avec succès." });
  } catch (error) {
    handleServerError(res, error, "deleteSeance");
  }
};

/* GET SEANCES BY MODULE (used by some routes) */
exports.getSeancesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const seances = await Seance.findAll({
      where: { moduleId },
      order: [["dateSeance", "DESC"]],
    });
    return res.json({ seances, count: seances.length, message: "Séances du module" });
  } catch (error) {
    handleServerError(res, error, "getSeancesByModule");
  }
};

/* GET PRESENCES OF SEANCE */
exports.getSeancePresences = async (req, res) => {
  try {
    const { seanceId } = req.params;
    const seance = await Seance.findByPk(seanceId);
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    const presences = await Presence.findAll({
      where: { seanceId },
      include: [{ model: Student, as: "student" }],
    });

    res.json({ presences });
  } catch (error) {
    handleServerError(res, error, "getSeancePresences");
  }
};

/* GET STATS FOR SEANCE */
exports.getSeanceStats = async (req, res) => {
  try {
    const { seanceId } = req.params;
    const presences = await Presence.findAll({ where: { seanceId } });
    const stats = {
      present: presences.filter((p) => p.statut === "present").length,
      absent: presences.filter((p) => p.statut === "absent").length,
      retard: presences.filter((p) => p.statut === "retard").length,
      total: presences.length,
    };
    res.json({ stats });
  } catch (error) {
    handleServerError(res, error, "getSeanceStats");
  }
};
