const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');
const fs = require('fs');
const { updateEventStatus } = require('../helpers/eventHelper');

const asyncHandler = require('../helpers/asyncHandler');

const { Op } = require('sequelize');

function getEventImageUrl(req, event) {

    if (!event.imagePath) {
        return null;
    }

    const normalizedPath = event.imagePath.replace(/\\/g, '/');
    const uploadsIndex = normalizedPath.lastIndexOf('uploads/');

    if (uploadsIndex === -1) {
        return null;
    }

    return `${req.protocol}://${req.get('host')}/${normalizedPath.slice(uploadsIndex)}`;
}

function serializeEvent(req, event) {

    return {
        ...event.toJSON(),
        imageUrl: getEventImageUrl(req, event)
    };
}

function normalizeEventPayload(body) {
    if (!body) {
        return;
    }

    if (!body.startDate && body.date) {
        body.startDate = body.date;
    }

    if (!body.endDate && body.date) {
        body.endDate = body.date;
    }
}

const IGNORED_FIELDS = [
    'updatedAt',
    'createdAt',
    'id'
];


// =============================
// Eventos deletados
// =============================

exports.getDeletedEvents = asyncHandler(async (req, res) => {

    const events = await Event.findAll({
        where: {
            deletedAt: {
                [Op.ne]: null
            }
        },
        paranoid: false,
        order: [['deletedAt', 'DESC']]
    });

    res.json({
        success: true,
        data: events
    });
});


// =============================
// Listar eventos
// =============================

exports.getAllEvents = asyncHandler(async (req, res) => {

    const userId = req.user?.id;

    const page =
        Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit =
        Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            50
        );

    const offset = (page - 1) * limit;

    const {
        count: totalItems,
        rows: events
    } = await Event.findAndCountAll({
        limit,
        offset,
        order: [['startDate', 'ASC'], ['startTime', 'ASC']]
    });

    const eventIds = events.map(e => e.id);

    const participants = await Participant.findAll({
        where: {
            eventId: eventIds
        },
        attributes: [
            'eventId',
            'userId',
            'approvalStatus',
            'isCheckedIn'
        ]
    });

    const map = {};

    participants.forEach(p => {

        if (!map[p.eventId]) {
            map[p.eventId] = [];
        }

        map[p.eventId].push({
            userId: p.userId,
            approvalStatus: p.approvalStatus,
            isCheckedIn: p.isCheckedIn
        });
    });

    const data = events.map(event => {

        const list = map[event.id] || [];

        const registeredParticipants = list.filter(p =>
            ['pending', 'approved'].includes(p.approvalStatus)
        ).length;

        const max = event.maxParticipants ?? 0;

        const uid = (userId !== undefined && userId !== null)
            ? Number(userId)
            : null;

        const userParticipant =
            uid !== null
                ? list.find(p => Number(p.userId) === uid)
                : null;

        return {

            ...serializeEvent(req, event),

            date: event.startDate,

            registeredParticipants,

            availableSpots:
                max > 0
                    ? Math.max(max - registeredParticipants, 0)
                    : null,

            isSoldOut:
                max > 0
                    ? registeredParticipants >= max
                    : false,

            isUserRegistered:
                !!userParticipant,

            userRegistrationApprovalStatus:
                userParticipant
                    ? userParticipant.approvalStatus
                    : null,

            isCheckedIn:
                userParticipant
                    ? userParticipant.isCheckedIn
                    : false,
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


// =============================
// Buscar evento por ID
// =============================

exports.getEventById = asyncHandler(async (req, res) => {

    const userId = req.user?.id;

    const event = await Event.findByPk(req.params.id);

    if (!event) {

        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const participants = await Participant.findAll({
        where: {
            eventId: event.id
        },
        attributes: [
            'userId',
            'approvalStatus',
            'isCheckedIn'
        ]
    });

    const registeredParticipants = participants.filter(p =>
        ['pending', 'approved'].includes(p.approvalStatus)
    ).length;

    const max = event.maxParticipants ?? 0;

    const uid = (userId !== undefined && userId !== null)
        ? Number(userId)
        : null;

    const userParticipant =
        uid !== null
            ? participants.find(p => Number(p.userId) === uid)
            : null;

    res.json({

        ...serializeEvent(req, event),

        date: event.startDate,

        registeredParticipants,

        availableSpots:
            max > 0
                ? Math.max(max - registeredParticipants, 0)
                : null,

        isSoldOut:
            max > 0
                ? registeredParticipants >= max
                : false,

        isUserRegistered:
            !!userParticipant,

        userRegistrationApprovalStatus:
            userParticipant
                ? userParticipant.approvalStatus
                : null,

        isCheckedIn:
            userParticipant
                ? userParticipant.isCheckedIn
                : false
    });
});


// =============================
// Criar evento
// =============================


exports.createEvent = asyncHandler(async (req, res) => {

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

    res.status(201).json({
        message: "Evento criado com sucesso",
        data: {
            ...serializeEvent(req, event),
            registeredParticipants: 0,
            availableSpots: event.maxParticipants ?? null,
            isSoldOut: false,
            isUserRegistered: false,
            userRegistrationApprovalStatus: null
        }
    });
});


// =============================
// Atualizar evento
// =============================
exports.updateEvent = asyncHandler(async (req, res) => {

    normalizeEventPayload(req.body);
    const event = await Event.findByPk(req.params.id);

    if (!event) {

        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const before = event.toJSON();

    const updateData = {
        ...req.body
    };

    if (req.file) {

        if (
            event.imagePath &&
            fs.existsSync(event.imagePath)
        ) {
            fs.unlinkSync(event.imagePath);
        }

        updateData.imagePath = req.file.path;
    }

    await event.update(updateData);

    const after = event.toJSON();

    const changedFields = {};

    for (const key of Object.keys(updateData)) {

        if (IGNORED_FIELDS.includes(key)) {
            continue;
        }

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
        changedFields:
            Object.keys(changedFields).length
                ? changedFields
                : null
    });

    const participants = await Participant.findAll({
        where: {
            eventId: event.id,
            approvalStatus: {
                [Op.in]: ['pending', 'approved']
            }
        }
    });

    const registeredParticipants =
        participants.length;

    const max = event.maxParticipants ?? 0;

    res.json({
        message: "Evento updated com sucesso",
        data: {
            ...serializeEvent(req, event),
            registeredParticipants,
            availableSpots:
                max > 0
                    ? Math.max(max - registeredParticipants, 0)
                    : null,
            isSoldOut:
                max > 0
                    ? registeredParticipants >= max
                    : false
        }
    });

    console.log(req.body);
    console.log(req.file);
});


// =============================
// Deletar evento
// =============================

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

    res.json({
        message: "Evento excluído com sucesso"
    });
});


// =============================
// Histórico do evento
// =============================

exports.getEventHistory = asyncHandler(async (req, res) => {

    const event = await Event.findByPk(req.params.id);

    if (!event) {

        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const history = await EventHistory.findAll({
        where: {
            eventId: req.params.id
        },
        include: [{
            model: User,
            attributes: ['name', 'email']
        }],
        order: [['createdAt', 'DESC']]
    });

    res.json(history);
});