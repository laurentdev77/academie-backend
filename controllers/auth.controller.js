const { Op } = require("sequelize");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;
const Student = db.Student;
const Role = db.Role;
const Teacher = db.Teacher;


const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const JWT_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "12h";

/**
 * -------------------------
 *  🔹 REGISTER (public)
 * -------------------------
 */
exports.register = async (req, res) => {
  try {
    let { username, email, password, telephone, photoUrl, matricule } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email et password requis" });
    }

    username = username.trim();
    email = email.toLowerCase().trim();

    const existing = await User.findOne({
      where: db.Sequelize.or({ username }, { email })
    });
    if (existing) return res.status(409).json({ message: "Nom d'utilisateur ou email déjà utilisé" });

    const defaultRole = await Role.findOne({ where: { name: "student" } });
    const roleId = defaultRole ? defaultRole.id : null;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      telephone: telephone || null,
      photoUrl: photoUrl || null,
      roleId,
      status: "active",
    });

    // Tentative d'association automatique : si un étudiant existe avec le même email ou matricule
    try {
      let student = null;
      if (email) {
        student = await Student.findOne({ where: { "$user.email$": email }, include: [{ model: db.User, as: "user" }] });
      }
      // fallback by matricule if provided
      if (!student && matricule) {
        student = await Student.findOne({ where: { matricule } });
      }
      // if student found and not linked, link it
      if (student && !student.userId) {
        await student.update({ userId: user.id });
      }
    } catch (err) {
      console.warn("auto-link student after register failed:", err.message || err);
    }

    const safeUser = await User.findByPk(user.id, {
      attributes: ["id", "username", "email", "telephone", "photoUrl", "status", "roleId"]
    });

    return res.status(201).json({ message: "Compte créé", user: safeUser });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 /**
 * -------------------------
 *  🔹 LOGIN
 * -------------------------
 */
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        message: "Identifiant (username ou email) et mot de passe requis.",
      });
    }

    const loginField = usernameOrEmail.toString().trim();

    // 🔹 1. Récupération de l'utilisateur (SANS JOIN)
    const user = await User.scope("withPassword").findOne({
      where: {
        [Op.or]: [
          { username: loginField },
          { email: loginField.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Compte inactif." });
    }

    // 🔹 2. Vérification du mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // 🔹 3. Récupération MANUELLE du rôle (FIX RENDER)
    let role = null;
    if (user.roleId) {
      role = await Role.findByPk(user.roleId);
    }

    // 🔹 4. Génération du token JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: role ? role.name : null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // 🔹 5. Mise à jour de la dernière connexion
    await user.update({ lastLoginAt: new Date() });

    // 🔹 6. Réponse finale
    return res.status(200).json({
      message: "Connexion réussie.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: role
          ? {
              id: role.id,
              name: role.name,
            }
          : null,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Erreur serveur lors de la connexion.",
      error: err.message,
    });
  }
};

/**
 * -------------------------
 *  🔹 GET PROFILE
 * -------------------------
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    // 🔹 Récupérer l'utilisateur avec son rôle via include
    const user = await User.findByPk(userId, {
      attributes: [
        "id", "username", "email", "telephone", "photoUrl",
        "status", "lastLoginAt", "createdAt"
      ],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    // 🔹 Si étudiant, inclure profil étudiant
    let student = null;
    if (user.role?.name === "student") {
      student = await Student.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
      });
    }

    // 🔹 Si enseignant, inclure profil enseignant
    let teacher = null;
    if (["teacher", "enseignant"].includes(user.role?.name)) {
      teacher = await Teacher.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "grade", "specialite"],
      });
    }

    return res.status(200).json({
      user,
      student,
      teacher,
    });
  } catch (err) {
    console.error("Erreur getProfile:", err);
    return res.status(500).json({ 
      message: "Erreur serveur lors du chargement du profil.", 
      error: err.message 
    });
  }
};