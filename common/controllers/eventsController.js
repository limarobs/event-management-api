const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const fs = require('fs');
const asyncHandler = require('../helpers/asyncHandler');
const { Op } = require('sequelize');

const {
    serializeEvent,
    normalizeEventPayload,
    IGNORED_FIELDS,
    getDeletedEvents,
    getAllEvents,
    getEventById,
    createEvent,
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

    normalizeEventPayload(req.body);

    const event = await Event.findByPk(req.params.id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const before = event.toJSON();
    const updateData = { ...req.body };

    if (req.file) {
        if (event.imagePath && fs.existsSync(event.imagePath)) {
            fs.unlinkSync(event.imagePath);
        }
        updateData.imagePath = req.file.path;
    }

    await event.update(updateData);

    const after = event.toJSON();
    const changedFields = {};

    for (const key of Object.keys(updateData)) {
        if (IGNORED_FIELDS.includes(key)) continue;

        if (String(before[key]) !== String(after[key])) {
            changedFields[key] = { before: before[key], after: after[key] };
        }
    }

    await EventHistory.create({
        eventId: event.id,
        userId: req.user.id,
        action: 'updated',
        changedFields: Object.keys(changedFields).length ? changedFields : null
    });

    const participants = await Participant.findAll({
        where: {
            eventId: event.id,
            approvalStatus: { [Op.in]: ['pending', 'approved'] }
        }
    });

    const registeredParticipants = participants.length;
    const max = event.maxParticipants ?? 0;

    res.json({
        message: "Evento updated com sucesso",
        data: {
            ...serializeEvent(req, event),
            registeredParticipants,
            availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
            isSoldOut: max > 0 ? registeredParticipants >= max : false
        }
    });
});

exports.deleteEvent = asyncHandler(async (req, res) => {

    const event = await Event.findByPk(req.params.id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    await EventHistory.create({
        eventId: event.id,
        userId: req.user.id,
        action: 'deleted',
        changedFields: null
    });

    await event.destroy();

    res.json({ message: "Evento excluído com sucesso" });
});

exports.getEventHistory = asyncHandler(async (req, res) => {
    const history = await getEventHistory(req.params.id);
    res.json(history);
});