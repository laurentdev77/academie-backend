// routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/dashboard.controller");
const { verifyToken } = require("../middleware/authJwt");

router.get("/stats", verifyToken, getStats);

module.exports = router;
