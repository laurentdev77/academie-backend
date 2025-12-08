const db = require("../models");
const Note = db.Note;
const Student = db.Student;
const Module = db.Module;
const Promotion = db.Promotion;
const Filiere = db.Filiere;
const Teacher = db.Teacher; // Assure-toi que ce modèle existe bien
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
        attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
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
   ✅ GET NOTE BY ID — Tous rôles (selon permissions)
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
          attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
        },
      ],
    });

    if (!note) return res.status(404).json({ message: "Note introuvable" });

    res.json({ message: "Note trouvée", data: mapNote(note) });
  } catch (err) {
    console.error("getNoteById error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ GET NOTES BY STUDENT — Admin
   ============================================================ */
exports.getNotesByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const notes = await Note.findAll({
      where: { studentId },
      include: [
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ message: "Notes de l’étudiant", data: notes.map(mapNote) });
  } catch (err) {
    console.error("getNotesByStudent error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* -------------------------
   ✅ GET NOTES BY MODULE
   ------------------------- */
exports.getNotesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Si l'utilisateur est enseignant, on vérifie la propriété du module
    if (req.user?.role?.name === "teacher") {
      const module = await Module.findByPk(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module introuvable" });
      }

      // Vérifier si ce module appartient bien à l’enseignant connecté
      if (module.teacherId && module.teacherId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Accès refusé : ce module ne vous appartient pas." });
      }
    }

    // 🔍 Récupération des notes du module
    const notes = await Note.findAll({
      where: { moduleId },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
        },
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId", "teacherId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!notes || notes.length === 0) {
      return res.json({ message: "Aucune note pour ce module", data: [] });
    }

    res.json({
      message: "Notes du module",
      data: notes.map(mapNote),
    });
  } catch (err) {
    console.error("getNotesByModule error:", err);
    res.status(500).json({
      message: "Erreur serveur lors du chargement des notes du module.",
      error: err.message,
    });
  }
};

/* ============================================================
   ✅ GET MY NOTES — Étudiant connecté
   ============================================================ */
exports.getMyNotes = async (req, res) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const notes = await Note.findAll({
      where: { studentId },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
        },
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      message: "Notes chargées avec succès.",
      data: notes.map(mapNote),
    });
  } catch (err) {
    console.error("getMyNotes error:", err);
    res.status(500).json({
      message: "Erreur serveur lors du chargement des notes de l'étudiant connecté.",
      error: err.message,
    });
  }
};

/* ============================================================
   ✅ CREATE NOTE — Admin uniquement
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
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
        },
      ],
    });

    res.status(201).json({ message: "Note créée avec succès", data: mapNote(created) });
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ UPDATE NOTE — Admin uniquement
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
        {
          model: Module,
          as: "module",
          attributes: ["id", "title", "code", "credits", "semester", "promotionId"],
        },
      ],
    });

    res.json({ message: "Note mise à jour", data: mapNote(updated) });
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   ✅ DELETE NOTE — Admin uniquement
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
   ✅ IMPORT CSV (optionnel)
   ============================================================ */
exports.importNotesFromCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Aucun fichier fourni" });

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

// 🔹 Enseignant — Ajouter une note dans un module dont il est responsable
exports.addNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { moduleId } = req.params;
    const { studentId, ce, fe, score, appreciation, session, semester } = req.body;

    // Vérifier si le module appartient à l’enseignant
    const module = await db.Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres modules." });

    // Créer la note
    const note = await db.Note.create({
      studentId,
      moduleId,
      ce: ce ?? null,
      fe: fe ?? null,
      score: score ?? 0,
      appreciation: appreciation ?? "",
      session: session ?? "Normale",
      semester: semester ?? module.semester ?? 1,
    });

    return res.status(201).json({
      message: "Note ajoutée avec succès.",
      data: note,
    });
  } catch (error) {
    console.error("Erreur addNoteForModule:", error);
    return res.status(500).json({
      message: "Erreur lors de l’ajout de la note.",
      error: error.message,
    });
  }
};

// 🔹 Enseignant — Mettre à jour une note d’un de ses modules
exports.updateNoteForModule = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { moduleId, noteId } = req.params;
    const { ce, fe, score, appreciation, session, semester } = req.body;

    const module = await db.Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    if (module.teacherId !== teacherId)
      return res.status(403).json({ message: "Accès refusé à ce module." });

    const note = await db.Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable." });

    await note.update({
      ce: ce ?? note.ce,
      fe: fe ?? note.fe,
      score: score ?? note.score,
      appreciation: appreciation ?? note.appreciation,
      session: session ?? note.session,
      semester: semester ?? note.semester,
    });

    return res.json({
      message: "Note mise à jour avec succès.",
      data: note,
    });
  } catch (error) {
    console.error("Erreur updateNoteForModule:", error);
    return res.status(500).json({
      message: "Erreur lors de la mise à jour de la note.",
      error: error.message,
    });
  }
};

/* ============================================================
   🧑‍🏫 ENSEIGNANT — MODIFIER UNE NOTE D’UN DE SES MODULES
   ============================================================ */
exports.updateNoteForModule = async (req, res) => {
  try {
    const { moduleId, noteId } = req.params;
    const { ce, fe, session, semester, appreciation } = req.body;

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    if (req.user.role.name === "teacher" && module.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé à ce module." });
    }

    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ message: "Note introuvable." });

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

    res.json({ message: "Note mise à jour avec succès.", data: mapNote(note) });
  } catch (err) {
    console.error("updateNoteForModule error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🧑‍🏫 ENSEIGNANT — SUPPRIMER UNE NOTE D’UN DE SES MODULES
   ============================================================ */
exports.deleteNoteForModule = async (req, res) => {
  try {
    const { moduleId, noteId } = req.params;

    // Vérifier que le module existe
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module introuvable." });

    // Vérifier que l’enseignant est bien propriétaire du module
    if (req.user.role.name === "teacher" && module.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé à ce module." });
    }

    // Récupérer la note à supprimer
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

exports.getStudentNotes = async (req, res) => {
  try {
    const studentId = req.user.id; // récupéré depuis le token
    const notes = await Note.findAll({
      where: { studentId },
      include: [
        { model: Module, as: "module" },
        { model: Student, as: "student" },
      ],
    });
    res.json({ message: "Notes de l'étudiant", data: notes });
  } catch (error) {
    console.error("getStudentNotes error:", error);
    res.status(500).json({ message: "Erreur lors du chargement des notes." });
  }
};

// ========================================
// 🎓 Étudiant : Récupérer mes notes (corrigé)
// ========================================
exports.getMyNotes = async (req, res) => {
  try {
    // récupération robuste de l'ID étudiant (middleware met req.studentId si possible)
    const studentId = req.studentId || req.student?.id || req.user?.id || req.userId;

    if (!studentId) {
      return res.status(401).json({ message: "Identifiant étudiant non trouvé dans le token." });
    }

    console.log("🎓 getMyNotes - étudiant:", studentId);

    const rawNotes = await Note.findAll({
      where: { studentId },
      include: [
        { model: Module, as: "module" },
        { model: Student, as: "student" },
      ],
      order: [["createdAt", "ASC"]],
    });

    if (!rawNotes || rawNotes.length === 0) {
      return res.status(200).json({ message: "Aucune note trouvée pour cet étudiant.", data: [] });
    }

    // Normalisation: s'assurer que module.code et module.credits existent
    const notes = await Promise.all(
      rawNotes.map(async (n) => {
        // module depuis l'inclusion
        let moduleObj = n.module || null;
        // si l'inclusion a échoué, on tente une récupération sûre
        if (!moduleObj && n.moduleId) {
          const fetched = await Module.findByPk(n.moduleId);
          if (fetched) moduleObj = fetched;
        }

        const safeModule = moduleObj
          ? {
              id: moduleObj.id,
              title: moduleObj.title ?? moduleObj.name ?? "Module",
              code: moduleObj.code ?? "",
              credits: Number(moduleObj.credits ?? 0) || 0,
              semester: moduleObj.semester,
              coefficient: moduleObj.coefficient ?? 1,
            }
          : null;

        // forcer numeric
        const ceNum = n.ce != null ? Number(n.ce) : null;
        const feNum = n.fe != null ? Number(n.fe) : null;
        let scoreNum = null;
        if (n.score != null) scoreNum = Number(n.score);
        else if (ceNum !== null || feNum !== null) {
          const a = ceNum !== null ? ceNum : 0;
          const b = feNum !== null ? feNum : 0;
          scoreNum = Number(((a * 0.4) + (b * 0.6)).toFixed(2));
        }

        return {
          id: n.id,
          studentId: n.studentId,
          moduleId: n.moduleId,
          ce: ceNum,
          fe: feNum,
          score: scoreNum ?? 0,
          appreciation: n.appreciation ?? "",
          session: n.session ?? "Normale",
          semester: n.semester ?? safeModule?.semester ?? 1,
          module: safeModule,
          student: n.student ? {
            id: n.student.id,
            nom: n.student.nom,
            prenom: n.student.prenom,
            matricule: n.student.matricule,
            promotionId: n.student.promotionId
          } : null,
        };
      })
    );

    return res.status(200).json({ message: "Notes chargées avec succès.", data: notes });
  } catch (err) {
    console.error("getMyNotes error (fixed):", err);
    return res.status(500).json({ message: "Erreur serveur lors du chargement des notes.", error: err.message });
  }
};

/* ============================================================
   ✅ Alias pour compatibilité
   ============================================================ */
exports.listNotes = exports.getAllNotes;
