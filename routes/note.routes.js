const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const {
  verifyToken,
  isTeacher,
  isStudent,
  isAdminFamily,
} = require("../middleware/authJwt");

router.use(verifyToken);

/* ============================================================
   🎓 ÉTUDIANT — voir SES notes uniquement
============================================================ */
router.get(
  "/student/my",
  isStudent,
  noteController.getStudentNotes // 👉 fonction dédiée
);

/* ============================================================
   👨‍🏫 TEACHER — gérer SES modules
============================================================ */
router.get(
  "/module/:moduleId",
  isTeacher,
  noteController.getNotesByModule
);

router.post(
  "/module/:moduleId/add",
  isTeacher,
  noteController.addNoteForModule
);

router.put(
  "/module/:moduleId/:noteId",
  isTeacher,
  noteController.updateNoteForModule
);

router.delete(
  "/module/:moduleId/:noteId",
  isTeacher,
  noteController.deleteNoteForModule
);

/* ============================================================
   🏛️ ADMIN / DE / SECRÉTARIAT
============================================================ */
router.get("/", isAdminFamily, noteController.getAllNotes);

router.get(
  "/:id",
  isAdminFamily,
  noteController.getNoteById
);

router.post("/", isAdminFamily, noteController.createNote);

router.put("/:id", isAdminFamily, noteController.updateNote);

router.delete("/:id", isAdminFamily, noteController.deleteNote);

module.exports = router;
