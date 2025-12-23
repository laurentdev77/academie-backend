// routes/presence.routes.js
const express = require("express");
const router = express.Router();

const presenceController = require("../controllers/presence.controller");
const { verifyToken, isTeacher, isStudent } = require("../middleware/authJwt");

// Toutes les routes nécessitent un token
router.use(verifyToken);

/* SEANCES - CRUD */
router.post("/seance", isTeacher, presenceController.createSeance);
router.get("/seances/by-module/:moduleId", isTeacher, presenceController.getSeances);
router.get("/seance/:id", isTeacher, presenceController.getSeanceById);
router.put("/seance/:id", isTeacher, presenceController.updateSeance);
router.delete("/seance/:id", isTeacher, presenceController.deleteSeance);

/* PRESENCES - CRUD */
router.post("/", isTeacher, presenceController.upsertPresence);
router.delete("/:id", isTeacher, presenceController.deletePresence);
router.get("/by-module/:moduleId", isTeacher, presenceController.getPresenceByModule);
router.get("/by-seance/:seanceId", isTeacher, presenceController.getPresenceBySeance);

/* STATS */
router.get("/stats/module/:moduleId", isTeacher, presenceController.getPresenceStatsByModule);
router.get("/stats/seance/:seanceId", isTeacher, presenceController.getPresenceStatsBySeance);

/* STUDENT */
router.get("/me", isStudent, presenceController.getPresenceForStudent);

// Alias pour compatibilité frontend
router.get("/student/my", isStudent, presenceController.getPresenceForStudent);

module.exports = router;
