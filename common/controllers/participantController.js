const Participant = require('../models/participant');
const Event = require('../models/Event');
const { updateEventStatus } = require('../helpers/eventHelper');
const { sendSubscriptionConfirmation } = require('../helpers/emailHelper');
const crypto = require('crypto');

const asyncHandler = require('../helpers/asyncHandler');


// GET /api/events/:id/participants
exports.getParticipants = asyncHandler(async (req, res) => {
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


// GET /api/events/:id/participants/me
exports.getMySubscription = asyncHandler(async (req, res) => {
    const participant = await Participant.findOne({
        where: {
            eventId: req.params.id,
            userId: req.user.id
        }
    });

    if (!participant) {
        const err = new Error("Inscrição não encontrada");
        err.status = 404;
        throw err;
    }

    res.json({
        success: true,
        data: participant
    });
});


// POST /api/events/:id/participants
exports.subscribe = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { id: userId, name, email } = req.user;

    const event = await Event.findByPk(id);

    if (!event) {
        const err = new Error("Evento não encontrado");
        err.status = 404;
        throw err;
    }

    const exists = await Participant.findOne({
        where: { eventId: id, userId }
    });

    if (exists) {
        const err = new Error("Usuário já inscrito");
        err.status = 409;
        throw err;
    }

    const count = await Participant.count({
        where: { eventId: id }
    });

    if (count >= event.maxParticipants) {
        const err = new Error("Evento lotado");
        err.status = 409;
        throw err;
    }

    const subscriptionToken = crypto.randomBytes(32).toString('hex');

    const sub = await Participant.create({
        eventId: id,
        userId,
        name,
        email,
        subscriptionToken
    });

    await updateEventStatus(id);

    sendSubscriptionConfirmation({
        name,
        email,
        title: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        subscriptionToken
    }).catch(() => {});

    res.status(201).json({
        message: "Inscrição realizada com sucesso",
        data: sub
    });
});


// POST /api/events/:id/checkin
exports.checkIn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { subscriptionToken } = req.body;

    const participant = await Participant.findOne({
        where: {
            eventId: id,
            subscriptionToken
        }
    });

    if (!participant) {
        const err = new Error("Token inválido ou não pertence a este evento");
        err.status = 404;
        throw err;
    }

    if (participant.isCheckedIn) {
        const err = new Error("Participante já realizou check-in");
        err.status = 409;
        throw err;
    }

    await participant.update({
        isCheckedIn: true,
        checkedInAt: new Date()
    });

    res.json({
        success: true,
        message: "Check-in realizado com sucesso",
        data: {
            name: participant.name,
            email: participant.email,
            checkedInAt: participant.checkedInAt
        }
    });
});


// GET /api/events/:id/validate/:token
exports.validateSubscription = asyncHandler(async (req, res) => {
    const { id, token } = req.params;

    const participant = await Participant.findOne({
        where: {
            eventId: id,
            subscriptionToken: token
        }
    });

    if (!participant) {
        const err = new Error("Inscrição não encontrada");
        err.status = 404;
        throw err;
    }

    res.json({
        valid: true,
        message: "Inscrição válida",
        data: {
            name: participant.name,
            email: participant.email,
            eventId: participant.eventId
        }
    });
});


// DELETE /api/events/:id/participants/me
exports.cancelMySubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deleted = await Participant.destroy({
        where: {
            eventId: id,
            userId: req.user.id
        }
    });

    if (!deleted) {
        const err = new Error("Inscrição não encontrada");
        err.status = 404;
        throw err;
    }

    await updateEventStatus(id);

    res.json({
        message: "Inscrição cancelada com sucesso"
    });
});