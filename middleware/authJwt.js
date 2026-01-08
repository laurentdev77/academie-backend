const jwt = require("jsonwebtoken");
const db = require("../models");
const config = require("../config/auth.config");

const User = db.User;
const Role = db.Role;
const Student = db.Student;
const Teacher = db.Teacher;

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

    req.student = null;
    req.studentId = null;
    req.teacher = null;
    req.teacherId = null;

    // Étudiant
    if (user.role?.name === "student") {
      const student = await Student.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "matricule", "promotionId"],
      });
      req.student = student;
      req.studentId = student ? student.id : null;
    }

    // Enseignant
    if (["teacher", "enseignant"].includes(user.role?.name)) {
      const teacher = await Teacher.findOne({
        where: { userId: user.id },
        attributes: ["id", "nom", "prenom", "grade", "specialite"],
      });
      req.teacher = teacher;
      req.teacherId = teacher ? teacher.id : null;
    }

    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

// Middleware de rôle
function isAdmin(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (role === "admin") return next();
  return res.status(403).json({ message: "Accès réservé à l'administrateur" });
}

function isAdminFamily(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de"].includes(role)) return next();
  return res.status(403).json({
    message: "Accès réservé à l’administration (admin, secretary, DE)",
  });
}

function isTeacher(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();

  // Tous les rôles enseignants et admin family autorisés
  const allowedRoles = ["teacher", "enseignant", "admin", "secretary", "de", "assistant"];
  
  if (allowedRoles.includes(role)) {
    return next();
  }

  return res.status(403).json({ message: "Accès réservé aux enseignants" });
}

// Nouveau : admin ou teacher
function isAdminOrTeacher(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (["admin", "secretary", "de", "teacher", "enseignant"].includes(role)) return next();
  return res.status(403).json({
    message: "Accès réservé aux enseignants ou à l'administration",
  });
}

function isStudent(req, res, next) {
  const role = req.user?.role?.name?.toLowerCase();
  if (role === "student") return next();
  return res.status(403).json({ message: "Accès réservé aux étudiants" });
}

module.exports = {
  verifyToken,
  isAdmin,
  isAdminFamily,
  isTeacher,
  isAdminOrTeacher,
  isStudent,
};
