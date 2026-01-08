const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const { verifyToken, isTeacher, isStudent, isAdminFamily } = require("../middleware/authJwt");

router.use(verifyToken);

// Étudiant
router.get("/student/my", isStudent, noteController.getMyNotes);

// Teacher
router.get("/module/:moduleId", isTeacher, noteController.getNotesByModule);
router.post("/module/:moduleId/add", isTeacher, noteController.addNoteForModule);
router.put("/module/:moduleId/:noteId", isTeacher, noteController.updateNoteForModule);
router.delete("/module/:moduleId/:noteId", isTeacher, noteController.deleteNoteForModule);

// Admin / Secretary / DE
router.get("/", isAdminFamily, noteController.getAllNotes);
router.get("/:id", isAdminFamily, noteController.getNoteById);
router.post("/", isAdminFamily, noteController.createNote);
router.put("/:id", isAdminFamily, noteController.updateNote);
router.delete("/:id", isAdminFamily, noteController.deleteNote);

module.exports = router;