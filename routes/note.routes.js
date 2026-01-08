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
router.get("/module/:moduleId", isTeacher, noteController.getNotesByModule);              // Voir les notes du module
router.post("/module/:moduleId/add", isTeacher, noteController.addNoteForModule);        // Ajouter une note
router.put("/module/:moduleId/:noteId", isTeacher, noteController.updateNoteForModule);  // Modifier une note
router.delete("/module/:moduleId/:noteId", isTeacher, noteController.deleteNoteForModule); // Supprimer une note

/* =============================================================
   🧑‍💼 Admin + Secretary + DE — Accès complet
   ============================================================= */
router.get("/", isAdminFamily, noteController.getAllNotes);         // Voir toutes les notes
router.get("/:id", isAdminFamily, noteController.getNoteById);      // Voir une note
router.post("/", isAdminFamily, noteController.createNote);         // Ajouter une note
router.put("/:id", isAdminFamily, noteController.updateNote);       // Modifier une note
router.delete("/:id", isAdminFamily, noteController.deleteNote);    // Supprimer une note

/* =============================================================
   🔹 Optionnel : Notes par étudiant (Admin)
   ============================================================= */
router.get("/student/:studentId", isAdminFamily, noteController.getNotesByStudent);

module.exports = router;
