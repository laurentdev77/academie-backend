const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

const router = express.Router();

// ⚠️ ROUTE TEMPORAIRE — À SUPPRIMER APRÈS
router.post("/create-admin", async (req, res) => {
  try {
    const adminRole = await Role.findOne({ where: { name: "admin" } });

    if (!adminRole) {
      return res.status(500).json({ message: "Role admin introuvable" });
    }

    const existing = await User.findOne({ where: { username: "admin" } });
    if (existing) {
      return res.json({ message: "Admin existe déjà" });
    }

    const password = await bcrypt.hash("Admin123456", 10);

    const admin = await User.create({
      username: "admin",
      email: "admin@academie.com",
      password,
      roleId: adminRole.id,
      status: "active",
    });

    return res.json({
      message: "ADMIN CRÉÉ",
      id: admin.id,
      roleId: admin.roleId,
    });
  } catch (error) {
    console.error("CREATE ADMIN ERROR:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
