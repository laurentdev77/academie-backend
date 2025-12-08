const db = require("../models");

exports.getStats = async (req, res) => {
  try {
    const User = db.User;
    const Student = db.Student;
    const Teacher = db.Teacher; // 👈 IMPORTANT
    const Module = db.Module;
    const Note = db.Note;
    const Bulletin = db.Bulletin;

    if (!User || !Student || !Module || !Note) {
      return res.status(500).json({
        message: "Certains modèles sont introuvables dans Sequelize.",
      });
    }

    const user = req.user;

    // 👨‍🎓 Cas étudiant : statistiques personnelles
    if (user && (user.role === "student" || user.roleId === 3)) {
      const notesCount = await Note.count({ where: { studentId: user.id } });
      const bulletinsCount = await Bulletin.count({ where: { studentId: user.id } });

      return res.status(200).json({
        notesForStudent: notesCount,
        bulletinsForStudent: bulletinsCount,
      });
    }

    // 👨‍🏫 Stats globales
    const studentsCount = await Student.count();
    const teachersCount = Teacher ? await Teacher.count() : 0; // 👈 FIX
    const modulesCount = await Module.count();
    const notesCount = await Note.count();
    const bulletinsCount = Bulletin ? await Bulletin.count() : 0;

    return res.status(200).json({
      students: studentsCount,
      teachers: teachersCount,
      modules: modulesCount,
      notes: notesCount,
      bulletins: bulletinsCount,
    });

  } catch (error) {
    console.error("Erreur getStats:", error);
    res.status(500).json({
      message: "Erreur lors du chargement des statistiques.",
      error: error.message,
    });
  }
};
