const express = require('express');
const router = express.Router();
const db = require('../models');
const { verifyToken } = require('../middleware/verifyToken');
const { permit } = require('../middleware/permit');

const Attendance = db.Attendance;

// GET all attendances
router.get('/', verifyToken, async (req, res) => {
  try {
    let attendances;
    if (req.user.role?.name === 'student') {
      attendances = await Attendance.findAll({
        where: { studentId: req.user.id },
        include: [
          { model: db.Schedule, as: 'schedule', include: [{ model: db.Module, as: 'module', attributes: ['id','name'] }] }
        ]
      });
    } else {
      attendances = await Attendance.findAll({
        include: [
          { model: db.User, as: 'student', attributes: ['id','username','email'] },
          { model: db.Schedule, as: 'schedule', include: [{ model: db.Module, as: 'module', attributes: ['id','name'] }] }
        ]
      });
    }
    res.json(attendances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET attendance by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'student', attributes: ['id','username','email'] },
        { model: db.Schedule, as: 'schedule', include: [{ model: db.Module, as: 'module', attributes: ['id','name'] }] }
      ]
    });
    if (!attendance) return res.status(404).json({ message: 'Présence introuvable' });

    if (req.user.role?.name === 'student' && attendance.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST attendance
router.post('/', verifyToken, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, scheduleId, status } = req.body;
    const attendance = await Attendance.create({ studentId, scheduleId, status });
    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT attendance
router.put('/:id', verifyToken, permit('teacher', 'admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Présence introuvable' });

    const { status } = req.body;
    await attendance.update({ status });
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE attendance
router.delete('/:id', verifyToken, permit('teacher', 'admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Présence introuvable' });

    await attendance.destroy();
    res.json({ message: 'Présence supprimée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
