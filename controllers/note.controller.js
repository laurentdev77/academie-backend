const db = require("../models");
const Note = db.Note;
const Student = db.Student;
const Module = db.Module;
const Promotion = db.Promotion;
const Filiere = db.Filiere;
const Teacher = db.Teacher;
const { Op } = db.Sequelize;
const { createAudit } = require("../utils/audit");
const csv = require("csv-parser");
const fs = require("fs");

// Utilitaire pour mapper une note
function mapNote(n) {
  return {
    id: n.id,
    ce: n.ce,
    fe: n.fe,
    score: n.score,
    appreciation: n.appreciation,
    session: n.session,
    semester: n.semester,
    studentId: n.studentId,
    moduleId: n.moduleId,
    student: n.student
      ? {
          id: n.student.id,
          nom: n.student.nom,
          prenom: n.student.prenom,
          matricule: n.student.matricule,
          promotionId: n.student.promotionId,
        }
      : null,
    module: n.module
      ? {
          id: n.module.id,
          title: n.module.title,
          code: n.module.code,
          credits: n.module.credits,
          semester: n.module.semester,
          promotionId: n.module.promotionId,
          teacherId: n.module.teacherId,
        }
      : null,
  };
}

/* ============================================================
   ✅ GET ALL NOTES — Admin/Secretary/DE
============================================================ */
exports.getAllNotes = async (req, res) => {
  try {
    const { search, moduleId, promotionId, session, semester } = req.query;
    const where = {};
    if (session && session !== "all") where.session = session;
    if (semester && !isNaN(Number(semester))) where.semester = Number(semester);
    if (moduleId && moduleId !== "all") where.moduleId = moduleId;

    const include = [
      {
        model: Student,
        as: "student",
        include: [
          { model: Promotion, as: "promotion", include: [{ model: Filiere, as: "filiere" }] },
        ],
      },
      { model: Module, as: "module" },
    ];

    if (search) {
      where[Op.or] = [
        { "$student.nom$": { [Op.iLike]: `%${search}%` } },
        { "$student.prenom$": { [Op.iLike]: `%${search}%` } },
        { "$module.title$": { [Op.iLike]: `%${search}%` } },
        { "$module.code$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (promotionId && promotionId !== "all") include[0].where = { promotionId };

    const notes = await Note.findAll({ where, include, order: [["createdAt", "DESC"]] });
    res.json({ message: "Liste complète des notes", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getAllNotes error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTE BY ID — Tous rôles (selon permissions)
============================================================ */
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, { include: [{ model: Student, as: "student" }, { model: Module, as: "module" }] });
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    // Vérification pour teacher
    if (req.user.role.name === "teacher" && note.module?.teacherId !== req.user.id)
      return res.status(403).json({ message: "Accès refusé à cette note." });

    res.json({ message: "Note trouvée", data: mapNote(note) });
  } catch (err) {
    console.error("getNoteById error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTES BY MODULE — Teacher ou Admin
============================================================ */
exports.getNotesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });

    // Teacher permission
    if (req.user.role.name === "teacher" && module.teacherId !== req.user.id)
      return res.status(403).json({ message: "Accès refusé à ce module." });

    const notes = await Note.findAll({ where: { moduleId }, include: [{ model: Student, as: "student" }, { model: Module, as: "module" }] });
    res.json({ message: "Notes du module", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getNotesByModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ CREATE NOTE — Admin seulement
============================================================ */
exports.createNote = async (req, res) => {
  try {
    const { studentId, moduleId, ce, fe, session, semester, appreciation } = req.body;
    if (!studentId || !moduleId) return res.status(400).json({ message: "Étudiant et module requis" });

    const score = Number(((parseFloat(ce) || 0) * 0.4 + (parseFloat(fe) || 0) * 0.6).toFixed(2));
    const note = await Note.create({ studentId, moduleId, ce, fe, score, session, semester, appreciation });
    res.status(201).json({ message: "Note créée", data: mapNote(note) });
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ UPDATE NOTE — Admin seulement
============================================================ */
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    const { ce, fe, session, semester, appreciation } = req.body;
    const score = Number(((parseFloat(ce) || 0) * 0.4 + (parseFloat(fe) || 0) * 0.6).toFixed(2));
    await note.update({ ce, fe, score, session, semester, appreciation });
    res.json({ message: "Note mise à jour", data: mapNote(note) });
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ DELETE NOTE — Admin seulement
============================================================ */
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });
    await note.destroy();
    res.json({ message: "Note supprimée" });
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ TEACHER — Ajouter / Modifier / Supprimer ses notes
============================================================ */
exports.addNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId } = req.params;
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });
    if (module.teacherId !== teacherId) return res.status(403).json({ message: "Module non autorisé" });

    const { studentId, ce, fe, score, appreciation, session, semester } = req.body;
    const note = await Note.create({ studentId, moduleId, ce, fe, score, appreciation, session, semester });
    res.status(201).json({ message: "Note ajoutée", data: mapNote(note) });
  } catch (err) {
    console.error("addNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId, noteId } = req.params;
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });
    if (module.teacherId !== teacherId) return res.status(403).json({ message: "Module non autorisé" });

    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    const { ce, fe, score, appreciation, session, semester } = req.body;
    await note.update({ ce, fe, score, appreciation, session, semester });
    res.json({ message: "Note mise à jour", data: mapNote(note) });
  } catch (err) {
    console.error("updateNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId, noteId } = req.params;
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });
    if (module.teacherId !== teacherId) return res.status(403).json({ message: "Module non autorisé" });

    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    await note.destroy();
    res.json({ message: "Note supprimée" });
  } catch (err) {
    console.error("deleteNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET MY NOTES — Étudiant
============================================================ */
exports.getMyNotes = async (req, res) => {
  try {
    if (!req.teacherId) {
      return res.status(403).json({ message: "Impossible de récupérer les notes pour cet utilisateur" });
    }

    const notes = await Note.findAll({
      where: { teacherId: req.teacherId },
      include: [
        { model: Student, as: "student", include: [{ model: Promotion, as: "promotion" }] },
        { model: Module, as: "module" }
      ]
    });

    res.json({ data: notes });
  } catch (err) {
    console.error("getMyNotes error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

