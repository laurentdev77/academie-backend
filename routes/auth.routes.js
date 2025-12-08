const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authJwt = require("../middleware/authJwt");

/**
 * ============================================
 * 🔑 AUTHENTICATION ROUTES
 * ============================================
 */

// 🔐 Inscription — Public
router.post("/register", authController.register);

// 🔐 Connexion — Public
router.post("/login", authController.login);

// 🔐 Profil utilisateur connecté (token requis)
router.get("/profile", authJwt.verifyToken, authController.getProfile);

module.exports = router;
