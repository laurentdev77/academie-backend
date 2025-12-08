// routes/seance.routes.js
const express = require("express");
const router = express.Router();

const seanceController = require("../controllers/seance.controller");
const { verifyToken, isTeacher, isAdmin } = require("../middleware/authJwt");

router.use(verifyToken);

// Routes spécialisées (avant /:id)
router.get("/module/:moduleId", isTeacher, seanceController.getSeancesByModule);
router.get("/:seanceId/presences", isTeacher, seanceController.getSeancePresences);
router.get("/:seanceId/stats", isTeacher, seanceController.getSeanceStats);

// CRUD
router.post("/", isTeacher, seanceController.createSeance);
router.get("/", isTeacher, seanceController.getAllSeances);
router.get("/:id", isTeacher, seanceController.getSeanceById);
router.put("/:id", isTeacher, seanceController.updateSeance);
router.delete("/:id", isAdmin, seanceController.deleteSeance);

module.exports = router;
