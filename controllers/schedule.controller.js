// controllers/schedule.controller.js
const db = require("../models");
const Schedule = db.Schedule;
const Module = db.Module;
const Teacher = db.Teacher;
const Promotion = db.Promotion;
const Student = db.Student; // 🔥 IMPORT CORRIGÉ

//-----------------------------------------------------
// GET ALL SCHEDULES
//-----------------------------------------------------
exports.getAll = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      include: [
        { model: Module, as: "module" },
        { model: Teacher, as: "teacher" },
        { model: Promotion, as: "promotion" },
      ],
      order: [["start", "ASC"]],
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

//-----------------------------------------------------
// GET ONE
//-----------------------------------------------------
exports.getOne = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) return res.status(404).json({ message: "Introuvable" });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

//-----------------------------------------------------
// CREATE
//-----------------------------------------------------
exports.create = async (req, res) => {
  try {
    const newSchedule = await Schedule.create(req.body);
    res.json(newSchedule);
  } catch (err) {
    res.status(500).json({ message: "Erreur création", error: err.message });
  }
};

//-----------------------------------------------------
// UPDATE
//-----------------------------------------------------
exports.update = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) return res.status(404).json({ message: "Introuvable" });

    await schedule.update(req.body);

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: "Erreur mise à jour", error: err.message });
  }
};

//-----------------------------------------------------
// DELETE
//-----------------------------------------------------
exports.delete = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) return res.status(404).json({ message: "Introuvable" });

    await schedule.destroy();

    res.json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression", error: err.message });
  }
};

//-----------------------------------------------------
// GET TEACHER SCHEDULES
//-----------------------------------------------------
exports.getMySchedules = async (req, res) => {
  try {
    const userId = req.user.id;

    const teacher = await Teacher.findOne({ where: { userId } });

    if (!teacher) {
      return res.status(404).json({ message: "Aucun enseignant trouvé." });
    }

    const schedules = await Schedule.findAll({
      where: { teacherId: teacher.id },
      include: ["module", "teacher", "promotion"],
      order: [["start", "ASC"]],
    });

    res.json(schedules);
  } catch (error) {
    console.error("Erreur getMySchedules:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//-----------------------------------------------------
// GET STUDENT SCHEDULES
//-----------------------------------------------------
exports.getStudentSchedules = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({
        message: "Aucun étudiant trouvé pour cet utilisateur.",
      });
    }

    const schedules = await Schedule.findAll({
      where: { promotionId: student.promotionId },
      include: [
        { model: Module, as: "module" },
        { model: Teacher, as: "teacher" },
        { model: Promotion, as: "promotion" },
      ],
      order: [["start", "ASC"]],
    });

    res.json(schedules);
  } catch (error) {
    console.error("Erreur getStudentSchedules:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
