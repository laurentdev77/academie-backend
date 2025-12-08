// controllers/teacher.controller.js

const db = require("../models");
const Teacher = db.Teacher;
const User = db.User;
const Role = db.Role;
const Module = db.Module;

/* ============================================================
   🔹 Liste complète des enseignants
   ============================================================ */
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
        {
          model: Module,
          as: "modules",
        },
      ],
      order: [["nom", "ASC"]],
    });

    // Fusion automatique des données User → Teacher
    const formatted = teachers.map(t => ({
      ...t.toJSON(),
      email: t.user?.email ?? null,
      telephone: t.user?.telephone ?? null,
      photoUrl: t.user?.photoUrl ?? t.photoUrl ?? null,
      username: t.user?.username ?? null,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Erreur getAllTeachers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Récupérer un enseignant par ID
   ============================================================ */
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
        {
          model: Module,
          as: "modules",
        },
      ],
    });

    if (!teacher)
      return res.status(404).json({ message: "Enseignant introuvable" });

    // Fusion automatique
    const formatted = {
      ...teacher.toJSON(),
      email: teacher.user?.email ?? null,
      telephone: teacher.user?.telephone ?? null,
      photoUrl: teacher.user?.photoUrl ?? teacher.photoUrl ?? null,
      username: teacher.user?.username ?? null,
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Erreur getTeacherById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Créer un enseignant (avec ou sans user)
   ============================================================ */
exports.createTeacher = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      grade,
      specialite,
      userId,
      createUser,
      username,
      email,
      password,
      telephone,
    } = req.body;

    if (!nom)
      return res.status(400).json({ message: "Le nom est obligatoire." });

    let finalUserId = userId || null;

    /* ---------------------------------------------
       1️⃣ CAS : CRÉATION D’UN NOUVEAU USER AUTOMATIQUE
    ----------------------------------------------*/
    if (createUser === true) {
      if (!username || !email || !password)
        return res.status(400).json({
          message: "username, email et password requis pour créer un compte.",
        });

      // Vérifier unicité email / username
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail)
        return res.status(409).json({ message: "Email déjà utilisé." });

      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername)
        return res.status(409).json({ message: "Username déjà utilisé." });

      // Récupérer rôle TEACHER
      const teacherRole = await Role.findOne({ where: { name: "teacher" } });
      if (!teacherRole)
        return res
          .status(500)
          .json({ message: "Le rôle teacher n'existe pas dans la base." });

      // Création user
      const newUser = await User.create({
        username,
        email,
        password,
        telephone: telephone || null,
        roleId: teacherRole.id,
      });

      finalUserId = newUser.id;
    }

    /* ---------------------------------------------
       2️⃣ CAS : LIAISON AVEC UN USER EXISTANT
    ----------------------------------------------*/
    if (finalUserId) {
      const existingLink = await Teacher.findOne({
        where: { userId: finalUserId },
      });

      if (existingLink)
        return res.status(400).json({
          message: "Cet utilisateur est déjà lié à un enseignant.",
        });

      // Assurer que son rôle est bien TEACHER
      const teacherRole = await Role.findOne({ where: { name: "teacher" } });
      if (teacherRole) {
        await User.update(
          { roleId: teacherRole.id },
          { where: { id: finalUserId } }
        );
      }
    }

    /* ---------------------------------------------
       3️⃣ CRÉATION ENSEIGNANT
    ----------------------------------------------*/
    const teacher = await Teacher.create({
      nom,
      prenom,
      grade,
      specialite,
      userId: finalUserId,
    });

    const newTeacher = await Teacher.findByPk(teacher.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
      ],
    });

    res.status(201).json({
      message: "Enseignant créé avec succès",
      teacher: newTeacher,
    });
  } catch (error) {
    console.error("Erreur createTeacher:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Mise à jour d’un enseignant
   ============================================================ */
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher)
      return res.status(404).json({ message: "Enseignant introuvable." });

    const { nom, prenom, grade, specialite, userId } = req.body;

    // Vérifier userId unique
    if (userId && userId !== teacher.userId) {
      const existingLink = await Teacher.findOne({ where: { userId } });
      if (existingLink)
        return res.status(400).json({
          message: "Cet utilisateur est déjà lié à un autre enseignant.",
        });
    }

    // Mettre à jour le rôle du user lié
    if (userId) {
      const teacherRole = await Role.findOne({ where: { name: "teacher" } });
      if (teacherRole)
        await User.update(
          { roleId: teacherRole.id },
          { where: { id: userId } }
        );
    }

    await teacher.update({
      nom,
      prenom,
      grade,
      specialite,
      userId: userId || null,
    });

    const updated = await Teacher.findByPk(teacher.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "telephone", "photoUrl"],
        },
      ],
    });

    res.status(200).json({
      message: "Enseignant mis à jour",
      teacher: updated,
    });
  } catch (error) {
    console.error("Erreur updateTeacher:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Supprimer un enseignant
   ============================================================ */
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher)
      return res.status(404).json({ message: "Enseignant introuvable" });

    await teacher.destroy();

    res.status(200).json({ message: "Enseignant supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteTeacher:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Liaison User ↔ Enseignant (logique Student)
   ============================================================ */
exports.linkUserToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;   // ← correct
    const { userId } = req.body;        // ← correct

    if (!teacherId || !userId)
      return res
        .status(400)
        .json({ message: "teacherId et userId sont requis." });

    const teacher = await Teacher.findByPk(teacherId);
    const user = await User.findByPk(userId);

    if (!teacher || !user)
      return res
        .status(404)
        .json({ message: "Enseignant ou utilisateur introuvable." });

    // Vérifier si user lié ailleurs
    const existingLink = await Teacher.findOne({ where: { userId } });
    if (existingLink)
      return res.status(400).json({
        message: "Cet utilisateur est déjà lié à un autre enseignant.",
      });

    // Forcer rôle TEACHER
    const teacherRole = await Role.findOne({ where: { name: "teacher" } });
    if (teacherRole) await user.update({ roleId: teacherRole.id });

    teacher.userId = userId;
    await teacher.save();

    res.status(200).json({
      message: "Liaison effectuée avec succès",
      teacher,
    });
  } catch (error) {
    console.error("Erreur linkUserToTeacher:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.uploadTeacherPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé." });
    }

    const teacherId = req.params.id;

    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Enseignant introuvable." });
    }

    // Harmonisation → même dossier que upload.controller.js
    const cleanPath = `/uploads/photos/${req.file.filename}`;

    await teacher.update({ photoUrl: cleanPath });

    return res.status(200).json({
      message: "Photo mise à jour",
      photoUrl: cleanPath,
    });

  } catch (err) {
    console.error("uploadTeacherPhoto error:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};