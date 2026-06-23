const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');
const fs = require('fs');

const { Op } = require('sequelize');

function getEventImageUrl(req, event) {
    if (!event.imagePath) return null;

    const normalizedPath = event.imagePath.replace(/\\/g, '/');
    const uploadsIndex = normalizedPath.lastIndexOf('uploads/');

    if (uploadsIndex === -1) return null;

    let host = req.get('host');
    if (host.startsWith('api:')) host = 'localhost:' + host.split(':')[1];

    return `${req.protocol}://${host}/${normalizedPath.slice(uploadsIndex)}`;
}

function serializeEvent(req, event) {
    return { ...event.toJSON(), imageUrl: getEventImageUrl(req, event) };
}

function normalizeEventPayload(body) {
    if (!body) return;

    if (!body.startDate && body.date) body.startDate = body.date;
    if (!body.endDate && body.date) body.endDate = body.date;
}

function buildParticipantMap(participants) {
    const map = {};

    participants.forEach(p => {
        if (!map[p.eventId]) map[p.eventId] = [];

        map[p.eventId].push({
            userId: p.userId,
            approvalStatus: p.approvalStatus,
            isCheckedIn: p.isCheckedIn
        });
    });

    return map;
}

function buildEventSummary(req, event, participants, userId) {
    const registeredParticipants = participants.filter(p =>
        ['pending', 'approved'].includes(p.approvalStatus)
    ).length;

    const max = event.maxParticipants ?? 0;
    const uid = (userId !== undefined && userId !== null) ? Number(userId) : null;
    const userParticipant = uid !== null ? participants.find(p => Number(p.userId) === uid) : null;

    return {
        ...serializeEvent(req, event),
        date: event.startDate,
        registeredParticipants,
        availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
        isSoldOut: max > 0 ? registeredParticipants >= max : false,
        isUserRegistered: !!userParticipant,
        userRegistrationApprovalStatus: userParticipant ? userParticipant.approvalStatus : null,
        isCheckedIn: userParticipant ? userParticipant.isCheckedIn : false
    };
}

const IGNORED_FIELDS = ['updatedAt', 'createdAt', 'id'];

async function getDeletedEvents() {
    return Event.findAll({
        where: { deletedAt: { [Op.ne]: null } },
        paranoid: false,
        order: [['deletedAt', 'DESC']]
    });
}

async function getAllEvents(req) {
    const userId = req.user?.id;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const { count: totalItems, rows: events } = await Event.findAndCountAll({
        limit, offset,
        order: [['startDate', 'ASC'], ['startTime', 'ASC']]
    });

    const participants = await Participant.findAll({
        where: { eventId: events.map(e => e.id) },
        attributes: ['eventId', 'userId', 'approvalStatus', 'isCheckedIn']
    });

    const map = buildParticipantMap(participants);
    const totalPages = Math.ceil(totalItems / limit);

    return {
        page, limit, totalItems, totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        data: events.map(event => buildEventSummary(req, event, map[event.id] || [], userId))
    };
}

async function getEventById(req, id) {
    const event = await Event.findByPk(id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const participants = await Participant.findAll({
        where: { eventId: event.id },
        attributes: ['userId', 'approvalStatus', 'isCheckedIn']
    });

    return buildEventSummary(req, event, participants, req.user?.id);
}

async function createEvent(req) {
    normalizeEventPayload(req.body);

    const event = await Event.create({
        ...req.body,
        imagePath: req.file ? req.file.path : null
    });

    await EventHistory.create({
        eventId: event.id,
        userId: req.user.id,
        action: 'created',
        changedFields: null
    });

    return {
        ...serializeEvent(req, event),
        registeredParticipants: 0,
        availableSpots: event.maxParticipants ?? null,
        isSoldOut: false,
        isUserRegistered: false,
        userRegistrationApprovalStatus: null
    };
}

async function updateEvent(req, id) {
    normalizeEventPayload(req.body);

    const event = await Event.findByPk(id);

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

    return {
        ...serializeEvent(req, event),
        registeredParticipants,
        availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
        isSoldOut: max > 0 ? registeredParticipants >= max : false
    };
}

async function deleteEvent(req, id) {
    const event = await Event.findByPk(id);

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
}

async function getEventHistory(id) {
    const event = await Event.findByPk(id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    return EventHistory.findAll({
        where: { eventId: id },
        include: [{ model: User, attributes: ['name', 'email'] }],
        order: [['createdAt', 'DESC']]
    });
}

module.exports = {
    getDeletedEvents,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventHistory
};