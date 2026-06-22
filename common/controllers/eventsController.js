const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const fs = require('fs');
const asyncHandler = require('../helpers/asyncHandler');
const {
    getDeletedEvents,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventHistory
} = require('../services/eventService');

exports.getDeletedEvents = asyncHandler(async (req, res) => {
    const events = await getDeletedEvents();
    res.json({ success: true, data: events });
});

exports.getAllEvents = asyncHandler(async (req, res) => {
    const result = await getAllEvents(req);
    res.json(result);
});

exports.getEventById = asyncHandler(async (req, res) => {
    const event = await getEventById(req, req.params.id);
    res.json(event);
});

exports.createEvent = asyncHandler(async (req, res) => {
    const data = await createEvent(req);

    res.status(201).json({
        message: "Evento criado com sucesso",
        data
    });
});

exports.updateEvent = asyncHandler(async (req, res) => {
    const data = await updateEvent(req, req.params.id);

    res.json({
        message: "Evento atualizado com sucesso",
        data
    });
});

exports.deleteEvent = asyncHandler(async (req, res) => {
    await deleteEvent(req, req.params.id);

    res.json({ message: "Evento excluído com sucesso" });
});

exports.getEventHistory = asyncHandler(async (req, res) => {
    const history = await getEventHistory(req.params.id);
    res.json(history);
});