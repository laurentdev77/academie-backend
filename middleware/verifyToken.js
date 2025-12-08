const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth.config');

async function verifyToken(req, res, next) {
  try {
    let token = null;

    // 1️⃣ Récupérer Authorization
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    // 2️⃣ Vérifier token AVEC LE BON SECRET
    const decoded = jwt.verify(token, authConfig.secret);

    // 3️⃣ Charger utilisateur
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
      role: user.role ? user.role.name : null,
    };

    if (req.user.role === "teacher" || req.user.role === "enseignant") {
      const teacher = await db.Teacher.findOne({ where: { userId: user.id } });
      if (teacher) req.teacherId = teacher.id;
    }

    next();
  } catch (error) {
    console.error("Erreur verifyToken :", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { verifyToken };
