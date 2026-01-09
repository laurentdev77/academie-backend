const db = require("./models"); // adapte le chemin si nécessaire
const Module = db.Module;
const Teacher = db.Teacher;
const User = db.User;

async function checkModules() {
  try {
    const modules = await Module.findAll({
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "nom", "prenom", "userId"],
        },
      ],
      order: [["title", "ASC"]],
    });

    console.log("Liste des modules et leurs enseignants :\n");

    modules.forEach((mod) => {
      const teacher = mod.teacher;
      console.log(`Module: ${mod.title} (${mod.id})`);
      if (teacher) {
        console.log(`  Teacher.id: ${teacher.id}`);
        console.log(`  Teacher.nom: ${teacher.nom} ${teacher.prenom}`);
        console.log(`  Teacher.userId: ${teacher.userId}`);
      } else {
        console.log("  Aucun enseignant lié !");
      }
      console.log("  module.teacherId:", mod.teacherId);
      console.log("---");
    });

    process.exit(0);
  } catch (err) {
    console.error("Erreur checkModules:", err);
    process.exit(1);
  }
}

checkModules();
