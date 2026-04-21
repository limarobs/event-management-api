const express = require('express');
const router = express.Router();

// Como você já está dentro de 'common', basta um '../' para subir um nível
const eventCtrl = require('../controllers/eventsController'); // Verifique se tem o 's' no final do arquivo físico
const partCtrl = require('../controllers/participantController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware');

// Rotas de Eventos
router.get('/', eventCtrl.getAllEvents);
router.get('/:id', eventCtrl.getEventById);
router.post('/', authMid, adminMid, eventCtrl.createEvent);
router.put('/:id', authMid, adminMid, eventCtrl.updateEvent);
router.delete('/:id', authMid, adminMid, eventCtrl.deleteEvent);

// Rotas de Participantes
router.get('/:id/participants', authMid, partCtrl.getParticipants);
router.post('/:id/participants', authMid, partCtrl.subscribe);
router.delete('/:id/participants/me', authMid, partCtrl.cancelMySubscription);

module.exports = router;