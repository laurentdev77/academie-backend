const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const { verifyToken, isTeacher, isStudent, isAdminFamily } = require("../middleware/authJwt");

// Token obligatoire pour toutes les routes
router.use(verifyToken);

/* =============================================================
   🎓 Étudiant — Accès à ses propres notes
   ============================================================= */
router.get("/student/my", isStudent, noteController.getMyNotes);

/* =============================================================
   👨‍🏫 Enseignant — Gestion des notes de ses modules
   ============================================================= */
router.get("/module/:moduleId", isTeacher, noteController.getNotesByModule);
router.post("/module/:moduleId/add", isTeacher, noteController.addNoteForModule);
router.put("/module/:moduleId/:noteId", isTeacher, noteController.updateNoteForModule);
router.delete("/module/:moduleId/:noteId", isTeacher, noteController.deleteNoteForModule);

/* =============================================================
   🧑‍💼 Admin + Secretary + DE — Accès complet
   ============================================================= */
router.get("/", isAdminFamily, isTeacher, noteController.getAllNotes);         // Voir toutes les notes
router.get("/:id", isAdminFamily, isTeacher, noteController.getNoteById);      // Voir une note
router.post("/", isAdminFamily, isTeacher, noteController.createNote);         // Ajouter une note
router.put("/:id", isAdminFamily, isTeacher, noteController.updateNote);       // Modifier une note
router.delete("/:id", isAdminFamily, isTeacher, noteController.deleteNote);    // Supprimer une note

module.exports = router;
