const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');
const { updateEventStatus } = require('../helpers/eventHelper');

const asyncHandler = require('../helpers/asyncHandler');
const { Op } = require('sequelize');

const IGNORED_FIELDS = ['updatedAt', 'createdAt', 'id'];

exports.getDeletedEvents = asyncHandler(async (req, res) => {
    const events = await Event.findAll({
        where: {
            deletedAt: { [Op.ne]: null }
        },
        paranoid: false,
        order: [['deletedAt', 'DESC']]
    });

    res.json({
        success: true,
        data: events
    });
});

exports.getAllEvents = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const { count: totalItems, rows: events } = await Event.findAndCountAll({
        limit,
        offset,
        order: [['date', 'ASC'], ['startTime', 'ASC']]
    });

    const eventIds = events.map(e => e.id);

    const participants = await Participant.findAll({
        where: { eventId: eventIds },
        attributes: ["eventId", "userId"]
    });

    const map = {};
    participants.forEach(p => {
        if (!map[p.eventId]) map[p.eventId] = [];
        map[p.eventId].push(p.userId);
    });

    const data = events.map(event => {
        const list = map[event.id] || [];
        const registeredParticipants = list.length;
        const max = event.maxParticipants ?? 0;

        return {
            ...event.toJSON(),
            registeredParticipants,
            availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
            isSoldOut: max > 0 ? registeredParticipants >= max : false,
            isUserRegistered: userId ? list.includes(userId) : false
        };
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
        page,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        data
    });
});

exports.getEventById = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const event = await Event.findByPk(req.params.id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const participants = await Participant.findAll({
        where: { eventId: event.id },
        attributes: ["userId"]
    });

    const userIds = participants.map(p => p.userId);
    const registeredParticipants = userIds.length;
    const max = event.maxParticipants ?? 0;

    res.json({
        ...event.toJSON(),
        registeredParticipants,
        availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
        isSoldOut: max > 0 ? registeredParticipants >= max : false,
        isUserRegistered: userId ? userIds.includes(userId) : false
    });
});

exports.createEvent = asyncHandler(async (req, res) => {
    const event = await Event.create(req.body);

    await EventHistory.create({
        eventId: event.id,
        userId: req.user.id,
        action: 'created',
        changedFields: null
    });

    res.status(201).json({
        message: "Evento criado com sucesso",
        data: {
            ...event.toJSON(),
            registeredParticipants: 0,
            availableSpots: event.maxParticipants ?? null,
            isSoldOut: false,
            isUserRegistered: false
        }
    });
});

exports.updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const before = event.toJSON();

    await event.update(req.body);

    const after = event.toJSON();

    const changedFields = {};

    for (const key of Object.keys(req.body)) {
        if (IGNORED_FIELDS.includes(key)) continue;

        if (String(before[key]) !== String(after[key])) {
            changedFields[key] = {
                before: before[key],
                after: after[key]
            };
        }
    }

    await EventHistory.create({
        eventId: event.id,
        userId: req.user.id,
        action: 'updated',
        changedFields: Object.keys(changedFields).length ? changedFields : null
    });

    const participants = await Participant.findAll({
        where: { eventId: event.id }
    });

    const registeredParticipants = participants.length;
    const max = event.maxParticipants ?? 0;

    res.json({
        message: "Evento atualizado com sucesso",
        data: {
            ...event.toJSON(),
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
    const event = await Event.findByPk(req.params.id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const history = await EventHistory.findAll({
        where: { eventId: req.params.id },
        include: [{ model: User, attributes: ['name', 'email'] }],
        order: [['createdAt', 'DESC']]
    });

    res.json(history);
});

exports.getEventOrderedByName = asyncHandler(async (req, res) => {
     const { sortBy = 'name', order = 'ASC' } = req.query;

    const allowedSortFields = {
        name: 'name',
        createdAt: 'createdAt',
        presence: 'isCheckedIn'
    };

    const sortField = allowedSortFields[sortBy] ?? 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const list = await Participant.findAll({
        where: { eventId: req.params.id },
        order: [[sortField, sortOrder]]
    });

    res.json(list);
});