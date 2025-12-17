const { Op } = require("sequelize");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;
const Student = db.Student;
const Role = db.Role;

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
 * -------------------------
 *  🔹 LOGIN
 * -------------------------
 */
exports.login = async (req, res) => {
  try {
    const { username, email, usernameOrEmail, password } = req.body;

    if (!password || !(username || email || usernameOrEmail)) {
      return res.status(400).json({ message: "Username ou email et mot de passe requis." });
    }

    const loginField = (username || email || usernameOrEmail).toString().trim();

    // Récupération de l'utilisateur avec son rôle
    const user = await User.scope("withPassword").findOne({
      where: {
        [Op.or]: [
          { username: loginField },
          { email: loginField.toLowerCase() },
        ],
      },
      include: [{
        model: Role,
        as: "role", // l'alias doit correspondre exactement à celui de l'association
        attributes: ["id", "name"],
      }],
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Votre compte est inactif. Veuillez attendre la validation d’un administrateur.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Mot de passe incorrect." });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role ? user.role.name : null },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Mettre à jour la dernière connexion
    await user.update({ lastLoginAt: new Date() });

    // Réponse JSON avec le rôle correct
    return res.json({
      message: "Connexion réussie.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role ? { id: user.role.id, name: user.role.name } : null,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (err) {
    console.error("Erreur login:", err);
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

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "email",
        "status",
        "roleId",
        "lastLoginAt",
        "createdAt",
      ],
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    return res.json({ user });
  } catch (err) {
    console.error("Erreur getProfile:", err);
    return res.status(500).json({
      message: "Erreur serveur lors du chargement du profil.",
      error: err.message,
    });
  }
};

/**
 * GET PROFILE - sécurisé
 */
exports.getProfile = async (req, res) => {
  try {
    // req.userId est ajouté par verifyToken
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "email",
        "telephone",
        "photoUrl",
        "status",
        "lastLoginAt",
        "createdAt",
      ],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Si c’est un étudiant, inclure son profil étudiant
    let student = null;
    if (user.role?.name === "student") {
      student = await Student.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
      });
    }

    return res.status(200).json({ user, student });
  } catch (error) {
    console.error("Erreur getProfile:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du chargement du profil.",
      error: error.message,
    });
  }
};
