// routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

// GET all
router.get('/', [verifyToken, isAdmin], roleController.getAllRoles);

// GET one
router.get('/:id', [verifyToken, isAdmin], roleController.getRoleById);

// CREATE
router.post('/', [verifyToken, isAdmin], roleController.createRole);

// UPDATE
router.put('/:id', [verifyToken, isAdmin], roleController.updateRole);

// DELETE
router.delete('/:id', [verifyToken, isAdmin], roleController.deleteRole);

module.exports = router;
