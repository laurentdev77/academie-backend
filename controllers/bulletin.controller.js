// controllers/bulletin.controller.js
const db = require('../models');
const Bulletin = db.Bulletin;
const User = db.User;
const Note = db.Note;

// GET all bulletins
exports.getAllBulletins = async (req, res) => {
  try {
    const bulletins = await Bulletin.findAll({
      include: [
        { model: User, as: 'student', attributes: ['id','username','email'] },
        { model: Note, as: 'notes', attributes: ['id','value','coefficient','moduleId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(bulletins);
  } catch (err) {
    console.error('getAllBulletins error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET one bulletin
exports.getBulletinById = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id','username','email'] },
        { model: Note, as: 'notes', attributes: ['id','value','coefficient','moduleId'] },
      ],
    });
    if (!bulletin) return res.status(404).json({ message: 'Bulletin introuvable' });
    res.status(200).json(bulletin);
  } catch (err) {
    console.error('getBulletinById error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// CREATE bulletin
exports.createBulletin = async (req, res) => {
  try {
    const { term, average, studentId } = req.body;
    if (!term) return res.status(400).json({ message: 'Le trimestre est requis' });

    const bulletin = await Bulletin.create({ term, average, studentId });
    res.status(201).json(bulletin);
  } catch (err) {
    console.error('createBulletin error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// UPDATE bulletin
exports.updateBulletin = async (req, res) => {
  try {
    const { term, average, studentId } = req.body;
    const bulletin = await Bulletin.findByPk(req.params.id);
    if (!bulletin) return res.status(404).json({ message: 'Bulletin introuvable' });

    await bulletin.update({
      term: term ?? bulletin.term,
      average: average ?? bulletin.average,
      studentId: studentId ?? bulletin.studentId,
    });

    res.status(200).json(bulletin);
  } catch (err) {
    console.error('updateBulletin error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// DELETE bulletin
exports.deleteBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByPk(req.params.id);
    if (!bulletin) return res.status(404).json({ message: 'Bulletin introuvable' });

    await bulletin.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('deleteBulletin error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
