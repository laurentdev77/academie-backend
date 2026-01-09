const db = require("../models");
const Note = db.Note;
const Student = db.Student;
const Module = db.Module;
const Promotion = db.Promotion;
const Filiere = db.Filiere;
const { Op } = db.Sequelize;

/* ============================================================
   UTILITAIRE — calcul du score (serveur uniquement)
============================================================ */
function calculateScore(ce, fe) {
  return Number(((parseFloat(ce) || 0) * 0.4 + (parseFloat(fe) || 0) * 0.6).toFixed(2));
}

/* ============================================================
   UTILITAIRE — mapper une note
============================================================ */
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
   ✅ GET NOTE BY ID — Teacher limité à ses modules
============================================================ */
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
      ],
    });

    if (!note) return res.status(404).json({ message: "Note introuvable" });

    if (
      req.user.role.name === "teacher" &&
      note.module.teacherId !== req.user.id
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json({ data: mapNote(note) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTES BY MODULE — Teacher limité à son module
============================================================ */
exports.getNotesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findByPk(moduleId);

    if (!module) return res.status(404).json({ message: "Module introuvable" });

    if (
      req.user.role.name === "teacher" &&
      module.teacherId !== req.user.id
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const notes = await Note.findAll({
      where: { moduleId },
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
      ],
    });

    res.json({ data: notes.map(mapNote) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ TEACHER — AJOUTER UNE NOTE (MODULE PROPRIÉTAIRE)
============================================================ */
exports.addNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });

    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Module non autorisé" });

    const { studentId, ce, fe, appreciation, session, semester } = req.body;
    const score = calculateScore(ce, fe);

    const note = await Note.create({
      studentId,
      moduleId,
      ce,
      fe,
      score,
      appreciation,
      session,
      semester,
    });

    res.status(201).json({ message: "Note ajoutée", data: mapNote(note) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ TEACHER — MODIFIER UNE NOTE (MODULE + NOTE LIÉS)
============================================================ */
exports.updateNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId, noteId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });

    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Module non autorisé" });

    const note = await Note.findOne({
      where: { id: noteId, moduleId },
    });

    if (!note) return res.status(404).json({ message: "Note introuvable" });

    const { ce, fe, appreciation, session, semester } = req.body;
    const score = calculateScore(ce, fe);

    await note.update({ ce, fe, score, appreciation, session, semester });

    res.json({ message: "Note mise à jour", data: mapNote(note) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ TEACHER — SUPPRIMER UNE NOTE (MODULE + NOTE LIÉS)
============================================================ */
exports.deleteNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId, noteId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable" });

    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Module non autorisé" });

    const note = await Note.findOne({
      where: { id: noteId, moduleId },
    });

    if (!note) return res.status(404).json({ message: "Note introuvable" });

    await note.destroy();
    res.json({ message: "Note supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ TEACHER — RÉCUPÉRER TOUTES SES NOTES
============================================================ */
exports.getMyNotes = async (req, res) => {
  try {
    if (req.user.role.name !== "teacher") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const notes = await Note.findAll({
      include: [
        { model: Student, as: "student", include: [{ model: Promotion, as: "promotion" }] },
        {
          model: Module,
          as: "module",
          where: { teacherId: req.user.id },
        },
      ],
    });

    res.json({ data: notes.map(mapNote) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ============================================================
// 🎓 ÉTUDIANT — voir SES notes uniquement
// ============================================================
exports.getStudentNotes = async (req, res) => {
  try {
    if (req.user.role.name !== "student") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // 1️⃣ Trouver l'étudiant lié au user connecté
    const student = await db.Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: "Étudiant introuvable" });

    // 2️⃣ Récupérer ses notes
    const notes = await db.Note.findAll({
      where: { studentId: student.id },
      include: [
        { model: db.Module, as: "module" },
      ],
    });

    res.json({ data: notes });
  } catch (err) {
    console.error("getStudentNotes error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================================================
   🛡️ ADMIN / SECRETARY / DE — TOUTES LES NOTES
============================================================ */
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
      ],
    });

    res.json({ data: notes.map(mapNote) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🛡️ ADMIN — CRÉER UNE NOTE
============================================================ */
exports.createNote = async (req, res) => {
  try {
    const { studentId, moduleId, ce, fe, appreciation, session, semester } = req.body;
    const score = calculateScore(ce, fe);

    const note = await Note.create({
      studentId,
      moduleId,
      ce,
      fe,
      score,
      appreciation,
      session,
      semester,
    });

    res.status(201).json({ message: "Note créée", data: mapNote(note) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🛡️ ADMIN — MODIFIER UNE NOTE
============================================================ */
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    const { ce, fe, appreciation, session, semester } = req.body;
    const score = calculateScore(ce, fe);

    await note.update({ ce, fe, score, appreciation, session, semester });

    res.json({ message: "Note mise à jour", data: mapNote(note) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🛡️ ADMIN — SUPPRIMER UNE NOTE
============================================================ */
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    await note.destroy();
    res.json({ message: "Note supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
