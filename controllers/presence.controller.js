// controllers/presence.controller.js
const db = require("../models");
const Joi = require("joi");

const Presence = db.Presence;
const Student = db.Student;
const Module = db.Module;
const Seance = db.Seance;
const sequelize = db.sequelize;

/* Helper */
const handleServerError = (res, err, where = "") => {
  console.error(where, err);
  return res.status(500).json({ message: "Erreur serveur." });
};

/* Joi validation */
const seanceSchema = Joi.object({
  moduleId: Joi.string().required(),
  date: Joi.date().required(),
  titre: Joi.string().allow("", null),
  heureDebut: Joi.string().optional(),
  heureFin: Joi.string().optional()
});

const upsertPresenceSchema = Joi.object({
  studentId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  moduleId: Joi.string().required(),
  seanceId: Joi.string().optional(),
  date: Joi.date().optional(),
  statut: Joi.string().valid("present", "absent", "retard", "justifie").required(),
  motif: Joi.string().allow("", null)
});

/* =======================================================================
   CREATE SEANCE
======================================================================= */
exports.createSeance = async (req, res) => {
  try {
    const payload = req.body;
    const { error } = seanceSchema.validate(payload);
    if (error) return res.status(400).json({ message: error.message });

    const teacherId = req.teacherId || req.user?.id;

    const seance = await Seance.create({
      moduleId: payload.moduleId,
      date: payload.date,
      titre: payload.titre || `Séance du ${payload.date}`,
      teacherId,
      heureDebut: payload.heureDebut || "08:00:00",
      heureFin: payload.heureFin || "10:00:00"
    });

    return res.status(201).json({ seance });
  } catch (error) {
    return handleServerError(res, error, "createSeance");
  }
};

/* =======================================================================
   UPDATE SEANCE
======================================================================= */
exports.updateSeance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, titre, heureDebut, heureFin } = req.body;

    const seance = await Seance.findByPk(id);
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    if (date) seance.date = date;
    if (typeof titre !== "undefined") seance.titre = titre;
    if (heureDebut) seance.heureDebut = heureDebut;
    if (heureFin) seance.heureFin = heureFin;

    await seance.save();
    return res.json(seance);
  } catch (error) {
    return handleServerError(res, error, "updateSeance");
  }
};

/* =======================================================================
   DELETE SEANCE
======================================================================= */
exports.deleteSeance = async (req, res) => {
  try {
    const { id } = req.params;

    const seance = await Seance.findByPk(id);
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    await sequelize.transaction(async (t) => {
      await Presence.destroy({ where: { seanceId: id }, transaction: t });
      await seance.destroy({ transaction: t });
    });

    return res.json({ message: "Séance supprimée avec les présences associées." });
  } catch (error) {
    return handleServerError(res, error, "deleteSeance");
  }
};

/* =======================================================================
   GET SEANCES BY MODULE (used by frontend)
======================================================================= */
exports.getSeances = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const seances = await Seance.findAll({
      where: { moduleId },
      order: [["date", "DESC"]],
    });

    return res.status(200).json({ seances });
  } catch (error) {
    return handleServerError(res, error, "getSeances");
  }
};

/* =======================================================================
   GET SEANCE BY ID
======================================================================= */
exports.getSeanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const seance = await Seance.findByPk(id, {
      include: [{ model: Module, as: "module" }],
    });

    if (!seance) return res.status(404).json({ message: "Séance introuvable." });

    return res.json(seance);
  } catch (error) {
    return handleServerError(res, error, "getSeanceById");
  }
};

/* =======================================================================
   UPSERT PRESENCE
======================================================================= */
exports.upsertPresence = async (req, res) => {
  try {
    const payload = req.body;
    const { error } = upsertPresenceSchema.validate(payload);
    if (error) return res.status(400).json({ message: error.message });

    const teacherId = req.teacherId || req.user?.id;
    let seanceId = payload.seanceId;

    /** Auto-create séance if given only a date */
    if (!seanceId && payload.date) {
      let seance = await Seance.findOne({
        where: {
          moduleId: payload.moduleId,
          date: payload.date
        }
      });

      if (!seance) {
        seance = await Seance.create({
          moduleId: payload.moduleId,
          date: payload.date,
          titre: `Séance du ${payload.date}`,
          teacherId,
        });
      }

      seanceId = seance.id;
    }

    /* Find presence */
    let presence = await Presence.findOne({
      where: {
        studentId: payload.studentId,
        moduleId: payload.moduleId,
        seanceId
      }
    });

    /* Update */
    if (presence) {
      presence.statut = payload.statut;
      presence.motif = payload.motif ?? null;
      presence.teacherId = teacherId;
      await presence.save();

      return res.json({ presence });
    }

    /* Create */
    presence = await Presence.create({
      studentId: payload.studentId,
      moduleId: payload.moduleId,
      seanceId,
      statut: payload.statut,
      motif: payload.motif ?? null,
      teacherId,
    });

    return res.status(201).json({ presence });
  } catch (error) {
    return handleServerError(res, error, "upsertPresence");
  }
};

/* =======================================================================
   DELETE PRESENCE
======================================================================= */
exports.deletePresence = async (req, res) => {
  try {
    const { id } = req.params;

    const presence = await Presence.findByPk(id);
    if (!presence) return res.status(404).json({ message: "Présence introuvable." });

    await presence.destroy();
    return res.json({ message: "Présence supprimée." });
  } catch (error) {
    return handleServerError(res, error, "deletePresence");
  }
};

/* =======================================================================
   GET PRESENCES BY MODULE
======================================================================= */
exports.getPresenceByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    const students = await Student.findAll({
      where: { promotionId: module.promotionId },
      attributes: ["id", "nom", "prenom", "matricule"]
    });

    const presences = await Presence.findAll({
      where: { moduleId },
      include: [
        { model: Student, as: "student" },
        { model: Seance, as: "seance" }
      ]
    });

    const result = students.map((st) => {
      const p = presences.find((x) => x.studentId == st.id);
      return p || {
        id: null,
        studentId: st.id,
        student: st,
        statut: "absent",
        motif: null,
        seanceId: null,
        date: null,
      };
    });

    return res.json(result);
  } catch (error) {
    return handleServerError(res, error, "getPresenceByModule");
  }
};

/* =======================================================================
   GET PRESENCES BY SEANCE
======================================================================= */
exports.getPresenceBySeance = async (req, res) => {
  try {
    const { seanceId } = req.params;

    const list = await Presence.findAll({
      where: { seanceId },
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
        { model: Seance, as: "seance" },
      ],
    });

    return res.json({ presences: list });
  } catch (error) {
    return handleServerError(res, error, "getPresenceBySeance");
  }
};

/* =======================================================================
   STUDENT SELF
======================================================================= */
exports.getPresenceForStudent = async (req, res) => {
  try {
    const studentId = req.student?.id;
    if (!studentId) return res.status(400).json({ message: "Aucun étudiant associé." });

    const list = await Presence.findAll({
      where: { studentId },
      include: [
        { model: Module, as: "module" },
        { model: Student, as: "student" },
        { model: Seance, as: "seance" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(list);
  } catch (error) {
    return handleServerError(res, error, "getPresenceForStudent");
  }
};

/* =======================================================================
   STATS
======================================================================= */
exports.getPresenceStatsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const list = await Presence.findAll({ where: { moduleId } });

    return res.json({
      total: list.length,
      present: list.filter((p) => p.statut === "present").length,
      absent: list.filter((p) => p.statut === "absent").length,
      retard: list.filter((p) => p.statut === "retard").length,
    });
  } catch (error) {
    return handleServerError(res, error, "getPresenceStatsByModule");
  }
};

exports.getPresenceStatsBySeance = async (req, res) => {
  try {
    const { seanceId } = req.params;

    const list = await Presence.findAll({ where: { seanceId } });

    return res.json({
      total: list.length,
      present: list.filter((p) => p.statut === "present").length,
      absent: list.filter((p) => p.statut === "absent").length,
      retard: list.filter((p) => p.statut === "retard").length,
    });
  } catch (error) {
    return handleServerError(res, error, "getPresenceStatsBySeance");
  }
};
