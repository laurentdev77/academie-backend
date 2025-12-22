const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

const router = express.Router();

// ⚠️ ROUTE TEMPORAIRE - À SUPPRIMER APRÈS
router.post("/create-admin", async (req, res) => {
  try {
    const existing = await User.findOne({ where: { username: "jeannette" } });
    if (existing) {
      return res.json({ message: "Admin existe déjà" });
    }

    const adminRole = await Role.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      return res.status(500).json({ message: "Role admin introuvable" });
    }

    const password = await bcrypt.hash("123456", 10);

    const admin = await User.create({
      username: "jeannette",
      email: "jeannette@academie.com",
      password,
      roleId: adminRole.id,
      status: "active",
    });

    return res.json({
      message: "ADMIN CRÉÉ",
      id: admin.id,
      roleId: admin.roleId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
