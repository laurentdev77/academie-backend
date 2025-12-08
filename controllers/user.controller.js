const bcrypt = require("bcryptjs");
const db = require("../models");
const { Op } = db.Sequelize;
const User = db.User;
const Role = db.Role;
const Student = db.Student;
const Teacher = db.Teacher;

/**
 * Validation basique des données utilisateur
 */
function validateUserPayload(payload, { requirePassword = true } = {}) {
  if (!payload) return "Payload manquant";
  const { username, email, password, roleId } = payload;
  if (!username || username.toString().trim().length < 3)
    return "Nom d'utilisateur trop court (≥3 caractères)";
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return "Email invalide";
  if (requirePassword && (!password || password.length < 6))
    return "Mot de passe trop court (≥6 caractères)";
  if (roleId === undefined || roleId === null)
    return "roleId requis";
  return null;
}

/**
 * 🔹 Liste des utilisateurs (avec rôle, téléphone, photo)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "telephone",
        "photoUrl",
        "status",
        "roleId",
        "createdAt",
        "updatedAt",
      ],
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        { model: Student, as: "student", attributes: ["id", "matricule", "nom", "prenom"] },
      ],
      order: [["username", "ASC"]],
    });
    res.json(users);
  } catch (err) {
    console.error("getAllUsers:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Utilisateurs non étudiants
 */
exports.getNonStudents = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: "role",
          where: { name: { [Op.ne]: "student" } },
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    console.error("getNonStudents error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Utilisateurs étudiants
 */
exports.getStudents = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: "role",
          where: { name: "student" },
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    console.error("getStudents error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Récupère tous les enseignants (users dont le rôle = teacher)
 */
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await db.User.findAll({
      include: [
        {
          model: db.Role,
          as: "role",
          where: { name: "teacher" },
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "username", "email", "status"],
      order: [["username", "ASC"]],
    });
    res.json(teachers);
  } catch (err) {
    console.error("getTeachers error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


/**
 * 🔹 Détails d’un utilisateur
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: [
        "id",
        "username",
        "email",
        "telephone",
        "photoUrl",
        "status",
        "roleId",
        "createdAt",
      ],
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        { model: Student, as: "student" },
      ],
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    console.error("getUserById:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Création utilisateur
 */
exports.createUser = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const payload = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      telephone: req.body.telephone || null,
      photoUrl: req.body.photoUrl || null,
      roleId: req.body.roleId,
      status: req.body.status || "inactive",
    };

    const errMsg = validateUserPayload(payload, { requirePassword: true });
    if (errMsg) {
      await t.rollback();
      return res.status(400).json({ message: errMsg });
    }

    const role = await Role.findByPk(payload.roleId);
    if (!role) {
      await t.rollback();
      return res.status(400).json({ message: "roleId invalide" });
    }

    const exists = await User.findOne({
      where: { [Op.or]: [{ username: payload.username }, { email: payload.email }] },
    });
    if (exists) {
      await t.rollback();
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }

    payload.password = await bcrypt.hash(payload.password, 10);
    const user = await User.create(payload, { transaction: t });

    // Recharger avec le rôle
    const newUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    await t.commit();
    res.status(201).json(newUser);
  } catch (err) {
    await t.rollback();
    console.error("createUser error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Mise à jour utilisateur
 */
exports.updateUser = async (req, res) => {
  try {
    const { username, email, telephone, photoUrl, status, roleId, password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const payload = { username, email, telephone, photoUrl, status, roleId };
    if (password) {
      payload.password = await bcrypt.hash(password, 10);
    }

    await user.update(payload);

    // 🔸 Réponse avec rôle inclus
    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    res.json({ message: "Utilisateur mis à jour", user: updatedUser });
  } catch (err) {
    console.error("updateUser:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Validation (Approbation) d’un utilisateur
 * Active le compte et crée la fiche Student si besoin
 */
exports.approveUser = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Si c’est un étudiant
    if (user.role?.name === "student") {
      const exists = await Student.findOne({ where: { userId: user.id } });

      if (!exists) {
        // 🧠 Trouver une promotion par défaut (la première dispo)
        const defaultPromo = await db.Promotion.findOne();

        await Student.create(
          {
            userId: user.id,
            nom: user.username,
            etatDossier: "en_cours",
            grade: null,
            prenom: "",
            promotionId: defaultPromo ? defaultPromo.id : 1, // fallback
            matricule: `ETU-${Math.floor(Math.random() * 100000)}`,
          },
          { transaction: t }
        );
      }

      await user.update({ status: "active" }, { transaction: t });
      await t.commit();
      return res.json({
        message:
          "Étudiant validé : compte activé et fiche étudiant créée avec succès.",
      });
    }

    // ✅ Sinon, c’est un autre rôle
    await user.update({ status: "active" }, { transaction: t });
    await t.commit();
    res.json({
      message: "Utilisateur validé comme non-étudiant.",
    });
  } catch (err) {
    await t.rollback();
    console.error("approveUser error:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la validation.",
      error: err.message,
    });
  }
};

/**
 * 🔹 Suppression douce (soft delete)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    await user.destroy();
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Restauration utilisateur supprimé
 */
exports.restoreUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    if (!user.deletedAt) return res.status(400).json({ message: "Utilisateur non supprimé" });

    await user.restore();
    res.json({ message: "Utilisateur restauré" });
  } catch (err) {
    console.error("restoreUser error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Suppression définitive
 */
exports.forceDeleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    await user.destroy({ force: true });
    res.json({ message: "Utilisateur supprimé définitivement" });
  } catch (err) {
    console.error("forceDeleteUser error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Liste des rôles
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [["id", "ASC"]] });
    res.json(roles);
  } catch (err) {
    console.error("getRoles error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 🔹 Récupération des modules associés à l'utilisateur connecté
 * - Si admin : tous les modules avec enseignants et promotions
 * - Si enseignant : modules qu’il enseigne
 * - Si étudiant : modules de sa promotion, avec ses notes incluses
 */
exports.getUserModules = async (req, res) => {
  try {
    const db = require("../models");
    const { Module, Promotion, Teacher, Note, Student, User } = db;

    // 🧩 Vérifie que l’utilisateur est bien authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // 🔍 Récupère l'utilisateur avec son rôle
    const user = await User.findByPk(req.user.id, {
      include: [{ model: db.Role, as: "role", attributes: ["name"] }],
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const roleName = user.role?.name;

    let modules = [];

    // 🧠 1️⃣ ADMIN → tous les modules avec relations
    if (roleName === "admin") {
      modules = await Module.findAll({
        include: [
          { model: Promotion, as: "promotion", attributes: ["id", "nom"] },
          { model: Teacher, as: "teacher", attributes: ["id", "nom", "prenom"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    // 🧠 2️⃣ TEACHER → modules qu’il enseigne
    else if (roleName === "teacher") {
      const teacher = await Teacher.findOne({ where: { userId: user.id } });
      if (!teacher)
        return res
          .status(404)
          .json({ message: "Aucun enseignant lié à cet utilisateur" });

      modules = await Module.findAll({
        where: { teacherId: teacher.id },
        include: [
          { model: Promotion, as: "promotion", attributes: ["id", "nom"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    // 🧠 3️⃣ STUDENT → modules de sa promotion + notes personnelles
    else if (roleName === "student") {
      const student = await Student.findOne({
        where: { userId: user.id },
        include: [{ model: Promotion, as: "promotion" }],
      });
      if (!student || !student.promotion)
        return res
          .status(404)
          .json({ message: "Aucune promotion liée à cet étudiant" });

      modules = await Module.findAll({
        where: { promotionId: student.promotion.id },
        include: [
          { model: Teacher, as: "teacher", attributes: ["id", "nom", "prenom"] },
          {
            model: Note,
            as: "notes",
            where: { studentId: student.id },
            required: false,
            attributes: ["id", "valeur", "type", "semester"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    // 🧠 4️⃣ AUTRES → accès refusé
    else {
      return res
        .status(403)
        .json({ message: "Accès réservé aux rôles autorisés." });
    }

    res.json(modules);
  } catch (error) {
    console.error("getUserModules error:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Lier un utilisateur à un étudiant existant (admin)
exports.linkStudentToUser = async (req, res) => {
  try {
    const { userId, studentId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Étudiant introuvable" });

    await student.update({ userId: user.id });
    return res.status(200).json({ message: "Utilisateur lié à l'étudiant", student });
  } catch (err) {
    console.error("linkStudentToUser:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/* ============================================================
   🔹 Mise à jour du rôle utilisateur
   ============================================================ */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(id);

    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    user.roleId = roleId;
    await user.save();

    // Charger noms des rôles
    const role = await Role.findByPk(roleId);

    /* ────────────────────────────────────────────────
       🔹 Logique STUDENT (existe déjà)
       ──────────────────────────────────────────────── */
    if (role?.name === "student") {
      const exist = await Student.findOne({ where: { userId: user.id } });

      if (!exist) {
        await Student.create({
          userId: user.id,
          nom: user.username,
          prenom: "",
          matricule: "",
        });
      }
    }

    /* ────────────────────────────────────────────────
       🔹 Logique TEACHER (NOUVELLE)
       ──────────────────────────────────────────────── */
    if (role?.name === "teacher") {
      const exist = await Teacher.findOne({ where: { userId: user.id } });

      if (!exist) {
        await Teacher.create({
          userId: user.id,
          nom: user.username,
          prenom: "",
          grade: "",
          specialite: "",
        });
      }
    }

    res.status(200).json({
      message: "Rôle mis à jour avec succès.",
      user,
    });

  } catch (error) {
    console.error("Erreur updateUserRole:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   🔹 Liaison User ↔ Enseignant (correctif)
   ============================================================ */
exports.linkUserToTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId; // <-- FIX
    const { userId } = req.body;

    if (!teacherId || !userId) {
      return res
        .status(400)
        .json({ message: "teacherId et userId sont requis." });
    }

    const teacher = await Teacher.findByPk(teacherId);
    const user = await User.findByPk(userId);

    if (!teacher || !user) {
      return res
        .status(404)
        .json({ message: "Enseignant ou utilisateur introuvable." });
    }

    // Vérifier si user déjà lié
    const existingLink = await Teacher.findOne({ where: { userId } });
    if (existingLink) {
      return res.status(400).json({
        message: "Cet utilisateur est déjà lié à un autre enseignant.",
      });
    }

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
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};
// ============================================================
// 🔐 ADMIN — Mise à jour du mot de passe utilisateur
// ============================================================
exports.updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const user = await User.scope("withPassword").findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed });

    return res.status(200).json({
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Erreur updateUserPassword:", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      error: error.message,
    });
  }
};
