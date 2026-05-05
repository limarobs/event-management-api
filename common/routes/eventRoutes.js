const express = require('express');
const router = express.Router();

const eventCtrl = require('../controllers/eventsController');
const partCtrl = require('../controllers/participantController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware');
const guestMid = require('../middleware/guestMiddleware');

// Rotas de Eventos
router.get('/', guestMid, eventCtrl.getAllEvents);
router.get('/:id', guestMid, eventCtrl.getEventById);
router.post('/', authMid, adminMid, eventCtrl.createEvent);
router.put('/:id', authMid, adminMid, eventCtrl.updateEvent);
router.delete('/:id', authMid, adminMid, eventCtrl.deleteEvent);

// Histórico de alterações 
router.get('/:id/history', authMid, adminMid, eventCtrl.getEventHistory);

// Rotas de Participantes
router.get('/:id/participants', authMid, partCtrl.getParticipants);
router.post('/:id/participants', authMid, partCtrl.subscribe);
router.delete('/:id/participants/me', authMid, partCtrl.cancelMySubscription);
router.get('/:id/validate/:token', authMid, adminMid, partCtrl.validateSubscription);

module.exports = router;
