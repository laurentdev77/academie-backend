const db = require("../models");

exports.getStats = async (req, res) => {
  try {
    const { User, Student, Teacher, Module, Note, Bulletin } = db;

    if (!User || !Student || !Module || !Note) {
      return res.status(500).json({
        message: "Certains modèles Sequelize sont introuvables.",
      });
    }

    const user = req.user;
    const role = user?.role?.name;

    // =========================
    // 🎓 ÉTUDIANT
    // =========================
    if (role === "student") {
      if (!req.student) {
        return res.status(400).json({
          message: "Profil étudiant non lié à ce compte.",
        });
      }

      const notesCount = await Note.count({
        where: { studentId: req.student.id },
      });

      const bulletinsCount = Bulletin
        ? await Bulletin.count({
            where: { studentId: req.student.id },
          })
        : 0;

      return res.status(200).json({
        role,
        stats: {
          notes: notesCount,
          bulletins: bulletinsCount,
        },
      });
    }

    // =========================
    // 👨‍🏫 ENSEIGNANT
    // =========================
    if (role === "teacher" || role === "enseignant") {
      if (!req.teacherId) {
        return res.status(400).json({
          message: "Profil enseignant non lié à ce compte.",
        });
      }

      const modulesCount = await Module.count({
        where: { teacherId: req.teacherId },
      });

      return res.status(200).json({
        role,
        stats: {
          modules: modulesCount,
        },
      });
    }

    // =========================
    // 🎩 ADMIN
    // =========================
    if (role === "admin") {
      const [
        studentsCount,
        teachersCount,
        modulesCount,
        notesCount,
        bulletinsCount,
        usersCount,
      ] = await Promise.all([
        Student.count(),
        Teacher ? Teacher.count() : 0,
        Module.count(),
        Note.count(),
        Bulletin ? Bulletin.count() : 0,
        User.count(),
      ]);

      return res.status(200).json({
        role,
        stats: {
          users: usersCount,
          students: studentsCount,
          teachers: teachersCount,
          modules: modulesCount,
          notes: notesCount,
          bulletins: bulletinsCount,
        },
      });
    }

    // =========================
    // ❌ AUTRES RÔLES
    // =========================
    return res.status(403).json({
      message: "Rôle non autorisé pour accéder au dashboard.",
    });

  } catch (error) {
    console.error("Erreur getStats:", error);
    return res.status(500).json({
      message: "Erreur serveur dashboard.",
      error: error.message,
    });
  }
};
