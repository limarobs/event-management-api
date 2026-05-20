const express = require('express');
const router = express.Router();

const eventCtrl = require('../controllers/eventsController');
const partCtrl = require('../controllers/participantController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware.mjs').default;
const guestMid = require('../middleware/guestMiddleware');


// Rotas do soft delete
router.get('/deleted', authMid, adminMid, eventCtrl.getDeletedEvents);

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
router.get('/:id/participants/me', authMid, partCtrl.getMySubscription);
router.post('/:id/participants', authMid, partCtrl.subscribe);
router.post('/:id/checkin', authMid, adminMid, partCtrl.checkIn);
router.delete('/:id/participants/me', authMid, partCtrl.cancelMySubscription);
router.get('/:id/validate/:token', authMid, adminMid, partCtrl.validateSubscription);

module.exports = router;