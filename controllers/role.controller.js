// controllers/role.controller.js
const db = require('../models');
const Role = db.Role;

// GET all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    res.status(200).json(roles);
  } catch (err) {
    console.error('getAllRoles error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET one role
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle introuvable' });
    res.status(200).json(role);
  } catch (err) {
    console.error('getRoleById error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// CREATE role
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom du rôle est requis' });

    const exist = await Role.findOne({ where: { name } });
    if (exist) return res.status(400).json({ message: 'Rôle déjà existant' });

    const role = await Role.create({ name });
    res.status(201).json(role);
  } catch (err) {
    console.error('createRole error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// UPDATE role
exports.updateRole = async (req, res) => {
  try {
    const { name } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle introuvable' });

    await role.update({ name: name ?? role.name });
    res.status(200).json(role);
  } catch (err) {
    console.error('updateRole error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// DELETE role
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle introuvable' });

    await role.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('deleteRole error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
