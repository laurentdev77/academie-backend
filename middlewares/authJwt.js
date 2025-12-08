const jwt = require("jsonwebtoken");
const db = require("../models");
const config = require("../config/auth.config");

const User = db.User;
const Role = db.Role;
const Student = db.Student;

/**
 * 🔹 Vérifie et décode le token JWT
 */
async function verifyToken(req, res, next) {
  try {
    let token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    if (token.startsWith("Bearer ")) token = token.slice(7);

    const decoded = jwt.verify(token, config.secret);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: "role" }],
    });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    req.user = user;
    req.userId = user.id;

    // 🧠 Si c’est un étudiant, relier automatiquement au modèle Student
    if (user.role?.name === "student") {
      const student = await Student.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
      });

      if (student) {
        req.student = student;
        req.studentId = student.id;
      }
    }

    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

/**
 * 🔹 Vérifie si l’utilisateur est ADMIN
 */
function isAdmin(req, res, next) {
  if (req.user?.role?.name === "admin") return next();
  return res.status(403).json({ message: "Accès refusé — réservé à l’administrateur" });
}

/**
 * 🔹 Vérifie si l’utilisateur est ÉTUDIANT
 */
function isStudent(req, res, next) {
  if (["student", "admin"].includes(req.user?.role?.name)) return next();
  return res.status(403).json({ message: "Accès refusé — réservé aux étudiants" });
}

/**
 * 🔹 Vérifie si l’utilisateur est ENSEIGNANT
 */
function isTeacher(req, res, next) {
  if (["teacher", "admin"].includes(req.user?.role?.name)) return next();
  return res.status(403).json({ message: "Accès réservé aux enseignants" });
}

module.exports = {
  verifyToken,
  isAdmin,
  isStudent,
  isTeacher,
};
