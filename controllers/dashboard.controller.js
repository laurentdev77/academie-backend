const db = require("../models");

exports.getStats = async (req, res) => {
  try {
    const { User, Student, Teacher, Module, Note, Bulletin } = db;

    const user = req.user;
    const role = user?.role?.name;

    /* ================================
       📊 STATS GLOBALES (POUR TOUS)
    ================================ */
    const [
      studentsCount,
      teachersCount,
      modulesCount,
      notesCount,
    ] = await Promise.all([
      Student.count(),
      Teacher.count(),
      Module.count(),
      Note.count(),
    ]);

    const stats = {
      students: studentsCount,
      teachers: teachersCount,
      modules: modulesCount,
      notes: notesCount,
    };

    /* ================================
       🎓 STATS ÉTUDIANT (OPTIONNEL)
    ================================ */
    if (role === "student") {
      const student = await Student.findOne({
        where: { userId: user.id },
      });

      if (student) {
        stats.notes = await Note.count({
          where: { studentId: student.id },
        });

        stats.bulletins = Bulletin
          ? await Bulletin.count({
              where: { studentId: student.id },
            })
          : 0;
      }
    }

    /* ================================
       👨‍🏫 STATS ENSEIGNANT (OPTIONNEL)
    ================================ */
    if (role === "teacher" || role === "enseignant") {
      const teacher = await Teacher.findOne({
        where: { userId: user.id },
      });

      if (teacher) {
        stats.modules = await Module.count({
          where: { teacherId: teacher.id },
        });
      }
    }

    /* ================================
       🎩 ADMIN (EXTRA)
    ================================ */
    if (role === "admin") {
      stats.users = await User.count();
      stats.bulletins = Bulletin ? await Bulletin.count() : 0;
    }

    return res.status(200).json({
      role,
      stats,
    });

  } catch (error) {
    console.error("Erreur getStats:", error);
    return res.status(500).json({
      message: "Erreur serveur dashboard",
      error: error.message,
    });
  }
};
