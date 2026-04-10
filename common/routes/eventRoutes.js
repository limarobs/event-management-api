const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventsController'); 
const participantController = require('../controller/participantController');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.get('/:id/participants', participantController.listByEvent);
router.post('/', eventController.createEvent);
router.post('/:id/participants', participantController.subscribe);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;

