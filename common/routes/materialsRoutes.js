const express = require('express');
const router = express.Router({ mergeParams: true });
 
const materialsCtrl = require('../controllers/materialsController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware.mjs').default;
const approvedParticipantMid = require('../middleware/approvedParticipantMiddleware');
const eventCreatorMid = require('../middleware/eventCreatorMiddleware');
const { upload } = require('../helpers/uploadHelper');
 
 
// =============================
// Listagem — participantes aprovados + admins
// GET /api/events/:id/materials
// =============================
 
router.get(
    '/',
    authMid,
    approvedParticipantMid,
    materialsCtrl.getMaterials
);
 
 
// =============================
// Upload — somente o admin que criou o evento
// POST /api/events/:id/materials
// =============================
 
router.post(
    '/',
    authMid,
    adminMid,
    eventCreatorMid,
    upload.single('file'),
    materialsCtrl.uploadMaterial
);
 
 
// =============================
// Download — participantes aprovados + admins
// GET /api/events/:id/materials/:materialId/download
// =============================
 
router.get(
    '/:materialId/download',
    authMid,
    approvedParticipantMid,
    materialsCtrl.downloadMaterial
);
 
 
// =============================
// Remoção — somente o admin que criou o evento
// DELETE /api/events/:id/materials/:materialId
// =============================
 
router.delete(
    '/:materialId',
    authMid,
    adminMid,
    eventCreatorMid,
    materialsCtrl.deleteMaterial
);
 
 
module.exports = router;
