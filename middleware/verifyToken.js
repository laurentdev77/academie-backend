const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth.config');

async function verifyToken(req, res, next) {
  try {
    // 1️⃣ Récupérer le token
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Token manquant" });

    // 2️⃣ Vérifier le token
    const decoded = jwt.verify(token, authConfig.secret);

    // 3️⃣ Charger l'utilisateur
    const user = await db.User.findByPk(decoded.id, {
      include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

    // 4️⃣ Attacher le profil user
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : null,
    };

    // 5️⃣ Lier Teacher / Student si nécessaire
    req.teacherId = null;
    req.studentId = null;

    if (req.user.role === "teacher") {
      const teacher = await db.Teacher.findOne({ where: { userId: user.id } });
      if (teacher) req.teacherId = teacher.id;
    }

    if (req.user.role === "student") {
      const student = await db.Student.findOne({ where: { userId: user.id } });
      if (student) req.studentId = student.id;
    }

    next();
  } catch (error) {
    console.error("Erreur verifyToken :", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { verifyToken };
