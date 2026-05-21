const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');

const { updateEventStatus } = require('../helpers/eventHelper');

const asyncHandler = require('../helpers/asyncHandler');

const { Op } = require('sequelize');

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
        order: [['date', 'ASC'], ['startTime', 'ASC']]
    });

    const eventIds = events.map(e => e.id);

    const participants = await Participant.findAll({
        where: {
            eventId: eventIds
        },
        attributes: [
            'eventId',
            'userId',
            'approvalStatus'
        ]
    });

    const map = {};

    participants.forEach(p => {

        if (!map[p.eventId]) {
            map[p.eventId] = [];
        }

        map[p.eventId].push({
            userId: p.userId,
            approvalStatus: p.approvalStatus
        });
    });

    const data = events.map(event => {

        const list = map[event.id] || [];

        const registeredParticipants = list.length;

        const max = event.maxParticipants ?? 0;

        const userParticipant =
            list.find(p => p.userId === userId);

        return {

            ...event.toJSON(),

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
                    : null
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
            'approvalStatus'
        ]
    });

    const registeredParticipants =
        participants.length;

    const max = event.maxParticipants ?? 0;

    const userParticipant =
        participants.find(
            p => p.userId === userId
        );

    res.json({

        ...event.toJSON(),

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
                : null
    });
});


// =============================
// Criar evento
// =============================

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
            isUserRegistered: false,
            userRegistrationApprovalStatus: null
        }
    });
});


// =============================
// Atualizar evento
// =============================

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
            eventId: event.id
        }
    });

    const registeredParticipants =
        participants.length;

    const max = event.maxParticipants ?? 0;

    res.json({
        message: "Evento atualizado com sucesso",
        data: {
            ...event.toJSON(),
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