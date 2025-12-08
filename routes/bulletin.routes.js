const express = require('express');
const router = express.Router();
const bulletinController = require('../controllers/bulletin.controller');
const { verifyToken, isAdminFamily } = require('../middleware/authJwt');

/**
 * =========================================
 * 📄 ROUTES BULLETINS (ADMIN + SECRETARY + DE)
 * =========================================
 */

// GET all bulletins
router.get('/', verifyToken, isAdminFamily, bulletinController.getAllBulletins);

// GET one bulletin
router.get('/:id', verifyToken, isAdminFamily, bulletinController.getBulletinById);

// CREATE bulletin
router.post('/', verifyToken, isAdminFamily, bulletinController.createBulletin);

// UPDATE bulletin
router.put('/:id', verifyToken, isAdminFamily, bulletinController.updateBulletin);

// DELETE bulletin
router.delete('/:id', verifyToken, isAdminFamily, bulletinController.deleteBulletin);

module.exports = router;
