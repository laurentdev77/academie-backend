const jwt = require("jsonwebtoken");
const db = require("../models");
const authConfig = require("../config/auth.config");

async function verifyToken(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, authConfig.secret);

    const user = await db.User.findByPk(decoded.id, {
      include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name.toLowerCase() : null,
    };

    // Si user est enseignant, on définit teacherId pour les vérifications
    if (req.user.role === "teacher") {
      req.teacherId = user.id;
    }

    // Si user est étudiant, on définit studentId pour les vérifications
    if (req.user.role === "student") {
      const student = await db.Student.findOne({ where: { userId: user.id } });
      if (student) {
        req.studentId = student.id;
      }
    }

    next();
  } catch (error) {
    console.error("Erreur verifyToken :", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

function isAdminFamily(req, res, next) {
  if (["admin", "secretary", "de"].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: "Accès réservé à l’administration" });
}

function isAdminOrTeacher(req, res, next) {
  if (["admin", "secretary", "de", "teacher"].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: "Accès réservé aux enseignants et admins" });
}

function isStudent(req, res, next) {
  if (req.user.role === "student") return next();
  return res.status(403).json({ message: "Accès réservé aux étudiants" });
}

module.exports = { verifyToken, isAdminFamily, isAdminOrTeacher, isStudent };
