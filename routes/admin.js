const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "⚠️ Un utilisateur avec cet email existe déjà" });
    }

    let adminRole = await Role.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      adminRole = await Role.create({ name: "admin" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      roleId: adminRole.id,
      status: "active",
    });

    return res.json({
      message: "✅ Admin créé avec succès",
      id: admin.id,
      email: admin.email,
      role: adminRole.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

module.exports = router;