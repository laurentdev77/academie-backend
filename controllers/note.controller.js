const db = require("../models");
const Note = db.Note;
const Student = db.Student;
const Module = db.Module;
const Promotion = db.Promotion;
const Filiere = db.Filiere;
const Teacher = db.Teacher; // Assure-toi que ce modèle existe
const { Op } = db.Sequelize;
const { createAudit } = require("../utils/audit");
const csv = require("csv-parser");
const fs = require("fs");

/* ============================================================
   🧠 UTILITAIRE : Mapper une note pour structurer la réponse
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
          teacherId: n.module.teacherId ?? null,
        }
      : null,
  };
}

/* ============================================================
   ✅ GET ALL NOTES — Admin uniquement
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
          {
            model: Promotion,
            as: "promotion",
            include: [{ model: Filiere, as: "filiere" }],
          },
        ],
      },
      {
        model: Module,
        as: "module",
        attributes: ["id", "title", "code", "credits", "semester", "promotionId", "teacherId"],
      },
    ];

    if (search) {
      where[Op.or] = [
        { "$student.nom$": { [Op.iLike]: `%${search}%` } },
        { "$student.prenom$": { [Op.iLike]: `%${search}%` } },
        { "$module.title$": { [Op.iLike]: `%${search}%` } },
        { "$module.code$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (promotionId && promotionId !== "all") {
      include[0].where = { promotionId };
    }

    const notes = await Note.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    res.json({ message: "Liste complète des notes", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getAllNotes error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTE BY ID — Tous rôles
   ============================================================ */
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: "student",
          include: [
            {
              model: Promotion,
              as: "promotion",
              include: [{ model: Filiere, as: "filiere" }],
            },
          ],
        },
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId", "teacherId"],
        },
      ],
    });

    if (!note) return res.status(404).json({ message: "Note introuvable" });

    // Si teacher, vérifier l'appartenance au module
    if (req.user.role.name === "teacher" && note.module?.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé : ce module ne vous appartient pas." });
    }

    res.json({ message: "Note trouvée", data: mapNote(note) });
  } catch (err) {
    console.error("getNoteById error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTES BY STUDENT
   ============================================================ */
exports.getNotesByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const notes = await Note.findAll({
      where: { studentId },
      include: [
        { model: Module, as: "module", attributes: ["id", "title", "code", "credits", "semester", "promotionId", "teacherId"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ message: "Notes de l’étudiant", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getNotesByStudent error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTES BY MODULE
   ============================================================ */
exports.getNotesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    // Vérifier teacher ownership
    if (req.user.role.name === "teacher" && module.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé : ce module ne vous appartient pas." });
    }

    const notes = await Note.findAll({
      where: { moduleId },
      include: [
        { model: Student, as: "student", attributes: ["id", "nom", "prenom", "matricule", "promotionId"] },
        { model: Module, as: "module", attributes: ["id", "title", "code", "credits", "semester", "promotionId", "teacherId"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ message: "Notes du module", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getNotesByModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET MY NOTES — Étudiant
   ============================================================ */
exports.getMyNotes = async (req, res) => {
  try {
    const studentId = req.studentId || req.user?.id;
    if (!studentId) return res.status(401).json({ message: "Identifiant étudiant non trouvé." });

    const notes = await Note.findAll({
      where: { studentId },
      include: [
        { model: Module, as: "module" },
        { model: Student, as: "student" },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({ message: "Notes chargées avec succès.", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getMyNotes error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ CREATE NOTE
   ============================================================ */
exports.createNote = async (req, res) => {
  try {
    const { studentId, moduleId, ce, fe, session, semester, appreciation } = req.body;

    if (!studentId || !moduleId)
      return res.status(400).json({ message: "Étudiant et module requis" });

    const ceNum = parseFloat(ce) || 0;
    const feNum = parseFloat(fe) || 0;
    const score = Number((ceNum * 0.4 + feNum * 0.6).toFixed(2));

    const note = await Note.create({
      studentId,
      moduleId,
      ce: ceNum,
      fe: feNum,
      score,
      session: session || "Normale",
      semester: semester || 1,
      appreciation: appreciation || "",
    });

    await createAudit({
      userId: req.userId,
      actionType: "CREATE_NOTE",
      targetType: "Note",
      targetId: note.id,
      payload: { studentId, moduleId, score },
      ip: req.ip,
    });

    const created = await Note.findByPk(note.id, {
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
      ],
    });

    res.status(201).json({ message: "Note créée avec succès", data: mapNote(created) });
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ UPDATE NOTE
   ============================================================ */
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    const { ce, fe, session, semester, appreciation } = req.body;

    const ceNum = parseFloat(ce) || 0;
    const feNum = parseFloat(fe) || 0;
    const score = Number((ceNum * 0.4 + feNum * 0.6).toFixed(2));

    await note.update({
      ce: ceNum,
      fe: feNum,
      score,
      session: session || note.session,
      semester: semester || note.semester,
      appreciation: appreciation ?? note.appreciation,
    });

    await createAudit({
      userId: req.userId,
      actionType: "UPDATE_NOTE",
      targetType: "Note",
      targetId: note.id,
      payload: { ce: ceNum, fe: feNum, score },
      ip: req.ip,
    });

    const updated = await Note.findByPk(note.id, {
      include: [
        { model: Student, as: "student" },
        { model: Module, as: "module" },
      ],
    });

    res.json({ message: "Note mise à jour", data: mapNote(updated) });
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ DELETE NOTE
   ============================================================ */
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: "Note introuvable" });

    await note.destroy();

    await createAudit({
      userId: req.userId,
      actionType: "DELETE_NOTE",
      targetType: "Note",
      targetId: note.id,
      payload: {},
      ip: req.ip,
    });

    res.json({ message: "Note supprimée" });
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ IMPORT CSV
   ============================================================ */
exports.importNotesFromCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier fourni" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        for (const row of results) {
          const ceNum = parseFloat(row.ce) || 0;
          const feNum = parseFloat(row.fe) || 0;
          const score = Number((ceNum * 0.4 + feNum * 0.6).toFixed(2));

          await Note.create({
            studentId: row.studentId,
            moduleId: row.moduleId,
            ce: ceNum,
            fe: feNum,
            score,
            session: row.session || "Normale",
            semester: row.semester || 1,
            appreciation: row.appreciation || "",
          });
        }
        res.json({ message: "Importation terminée", count: results.length });
      });
  } catch (err) {
    console.error("importNotesFromCSV error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🧑‍🏫 TEACHER — Ajouter une note dans un module qu'il possède
   ============================================================ */
exports.addNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId } = req.params;
    const { studentId, ce, fe, score, appreciation, session, semester } = req.body;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });
    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres modules." });

    const ceNum = ce != null ? Number(ce) : 0;
    const feNum = fe != null ? Number(fe) : 0;
    const calcScore = score ?? Number((ceNum * 0.4 + feNum * 0.6).toFixed(2));

    const note = await Note.create({
      studentId,
      moduleId,
      ce: ceNum,
      fe: feNum,
      score: calcScore,
      appreciation: appreciation ?? "",
      session: session ?? "Normale",
      semester: semester ?? module.semester ?? 1,
    });

    res.status(201).json({ message: "Note ajoutée avec succès.", data: mapNote(note) });
  } catch (err) {
    console.error("addNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🧑‍🏫 TEACHER — Mettre à jour une note d’un de ses modules
   ============================================================ */
exports.updateNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { moduleId, noteId } = req.params;
    const { ce, fe, session, semester, appreciation } = req.body;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });
    if (req.user.role.name === "teacher" && module.teacherId !== teacherId) {
      return res.status(403).json({ message: "Accès refusé à ce module." });
    }

    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable." });

    const ceNum = ce != null ? Number(ce) : note.ce;
    const feNum = fe != null ? Number(fe) : note.fe;
    const scoreNum = Number((ceNum * 0.4 + feNum * 0.6).toFixed(2));

    await note.update({
      ce: ceNum,
      fe: feNum,
      score: scoreNum,
      session: session ?? note.session,
      semester: semester ?? note.semester,
      appreciation: appreciation ?? note.appreciation,
    });

    res.json({ message: "Note mise à jour avec succès.", data: mapNote(note) });
  } catch (err) {
    console.error("updateNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🧑‍🏫 TEACHER — Supprimer une note d’un de ses modules
   ============================================================ */
exports.deleteNoteForModule = async (req, res) => {
  try {
    const { moduleId, noteId } = req.params;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });
    if (req.user.role.name === "teacher" && module.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé à ce module." });
    }

    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable." });

    await note.destroy();

    await createAudit({
      userId: req.userId,
      actionType: "DELETE_NOTE",
      targetType: "Note",
      targetId: note.id,
      payload: {},
      ip: req.ip,
    });

    res.json({ message: "Note supprimée avec succès." });
  } catch (err) {
    console.error("deleteNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ Alias pour compatibilité
   ============================================================ */
exports.listNotes = exports.getAllNotes;
