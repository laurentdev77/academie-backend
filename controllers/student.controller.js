const db = require("../models");
const Student = db.Student;
const Module = db.Module;
const Promotion = db.Promotion;
const Filiere = db.Filiere;
const User = db.User;
const Role = db.Role;
const path = require("path");

/* ============================================================
   🔹 Liste complète des étudiants
   ============================================================ */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: Promotion,
          as: "promotion",
          include: [{ model: Filiere, as: "filiere" }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
      ],
      order: [["nom", "ASC"]],
    });

    res.status(200).json(students);
  } catch (error) {
    console.error("Erreur getAllStudents:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Récupérer un étudiant par ID
   ============================================================ */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        {
          model: Promotion,
          as: "promotion",
          include: [{ model: Filiere, as: "filiere" }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
      ],
    });

    if (!student)
      return res.status(404).json({ message: "Étudiant introuvable" });

    res.status(200).json(student);
  } catch (error) {
    console.error("Erreur getStudentById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Créer un étudiant
   ============================================================ */
exports.createStudent = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      matricule,
      sexe,
      dateNaissance,
      lieuNaissance,
      grade,
      etatDossier,
      promotionId,
      userId,
      photoUrl,
    } = req.body;

    if (!nom || !matricule || !promotionId)
      return res
        .status(400)
        .json({ message: "Nom, matricule et promotion sont obligatoires." });

    // Vérifier doublon matricule
    const existing = await Student.findOne({ where: { matricule } });
    if (existing)
      return res.status(409).json({ message: "Ce matricule existe déjà." });

    // Vérifier doublon de liaison userId
    if (userId) {
      const existingLink = await Student.findOne({ where: { userId } });
      if (existingLink)
        return res
          .status(400)
          .json({ message: "Cet utilisateur est déjà lié à un autre étudiant." });
    }

    // Création
    const student = await Student.create({
      nom,
      prenom,
      matricule,
      sexe,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      lieuNaissance,
      grade,
      etatDossier,
      promotionId,
      userId: userId || null,
      photoUrl: photoUrl || null,
    });

    const newStudent = await Student.findByPk(student.id, {
      include: [
        { model: Promotion, as: "promotion", include: [{ model: Filiere, as: "filiere" }] },
        { model: User, as: "user", attributes: ["id", "username", "email", "telephone", "photoUrl"] },
      ],
    });

    res.status(201).json({ message: "Étudiant créé avec succès", student: newStudent });
  } catch (error) {
    console.error("Erreur createStudent:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Mise à jour d’un étudiant
   ============================================================ */
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Étudiant introuvable." });

    const {
      nom,
      prenom,
      matricule,
      sexe,
      dateNaissance,
      lieuNaissance,
      grade,
      etatDossier,
      promotionId,
      userId,
      photoUrl,
    } = req.body;

    // Vérification userId unique
    if (userId && userId !== student.userId) {
      const existingLink = await Student.findOne({ where: { userId } });
      if (existingLink)
        return res
          .status(400)
          .json({ message: "Cet utilisateur est déjà lié à un autre étudiant." });
    }

    await student.update({
      nom,
      prenom,
      matricule,
      sexe,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      lieuNaissance,
      grade,
      etatDossier,
      promotionId,
      userId: userId || null,
      photoUrl: photoUrl || student.photoUrl,
    });

    const updated = await Student.findByPk(student.id, {
      include: [
        { model: Promotion, as: "promotion", include: [{ model: Filiere, as: "filiere" }] },
        { model: User, as: "user", attributes: ["id", "username", "email", "telephone", "photoUrl"] },
      ],
    });

    res.status(200).json({ message: "Étudiant mis à jour", student: updated });
  } catch (error) {
    console.error("Erreur updateStudent:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Supprimer un étudiant
   ============================================================ */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Étudiant introuvable" });

    await student.destroy();
    res.status(200).json({ message: "Étudiant supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteStudent:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Liaison User ↔ Étudiant
   ============================================================ */
exports.linkUserToStudent = async (req, res) => {
  try {
    const { studentId, userId } = req.body;
    if (!studentId || !userId)
      return res.status(400).json({ message: "studentId et userId sont requis." });

    const student = await Student.findByPk(studentId);
    const user = await User.findByPk(userId);
    if (!student || !user)
      return res.status(404).json({ message: "Étudiant ou utilisateur introuvable." });

    const existingLink = await Student.findOne({ where: { userId } });
    if (existingLink)
      return res.status(400).json({ message: "Cet utilisateur est déjà lié à un autre étudiant." });

    student.userId = userId;
    await student.save();

    res.status(200).json({ message: "Liaison effectuée avec succès", student });
  } catch (error) {
    console.error("Erreur linkUserToStudent:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Liste des étudiants d'une promotion spécifique
exports.getStudentsByPromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;
    if (!promotionId) {
      return res.status(400).json({ message: "ID de promotion manquant" });
    }

    const students = await db.Student.findAll({
      where: { promotionId },
      include: [
        { model: db.Promotion, as: "promotion" },
        { model: db.User, as: "user", attributes: ["id", "email", "telephone"] },
      ],
      order: [["nom", "ASC"]],
    });

    res.json(students);
  } catch (error) {
    console.error("Erreur getStudentsByPromotion:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.getModulesForStudent = async (req, res) => {
  try {
    const studentId = req.studentId;
    if (!studentId) {
      return res.status(403).json({ message: "Accès réservé aux étudiants." });
    }

    // Récupérer l'étudiant avec sa promotion
    const student = await db.Student.findByPk(studentId, {
      include: [
        {
          model: db.Promotion,
          as: "promotion",
          attributes: ["id", "nom", "annee"]
        }
      ]
    });

    if (!student || !student.promotion) {
      return res.status(404).json({ message: "Promotion non trouvée." });
    }

    // Récupérer les modules de sa promotion + ressources
    const modules = await db.Module.findAll({
      where: { promotionId: student.promotion.id },
      include: [
        {
          model: db.Resource,
          as: "resources",
          attributes: ["id", "title", "url", "type", "description", "createdAt"]
        },
        {
          model: db.User,     // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<< CORRECTION
          as: "teacher",      // alias correct
          attributes: ["username", "email"]
        },
        {
          model: db.Promotion,
          as: "promotion",
          attributes: ["nom", "annee"]
        }
      ],
      order: [["title", "ASC"]]
    });

    return res.status(200).json({
      promotion: {
        id: student.promotion.id,
        nom: student.promotion.nom,
        annee: student.promotion.annee
      },
      modules
    });

  } catch (err) {
    console.error("getModulesForStudent error:", err);
    return res.status(500).json({
      message: "Erreur serveur.",
      error: err.message
    });
  }
};
