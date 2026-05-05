const Participant = require('../models/participant');
const Event = require('../models/Event');
const { updateEventStatus } = require('../helpers/eventHelper');
const { sendSubscriptionConfirmation } = require('../helpers/emailHelper');
const crypto = require('crypto');

const asyncHandler = require('../helpers/asyncHandler');


// 🔥 GET PARTICIPANTS
exports.getParticipants = asyncHandler(async (req, res) => {
    const list = await Participant.findAll({
        where: { eventId: req.params.id }
    });

    res.json(list);
});


// 🔥 SUBSCRIBE
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

    // ⚠️ não quebrar fluxo se email falhar
    sendSubscriptionConfirmation({
        name,
        email,
        title: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        subscriptionToken
    }).catch(() => {
        // erro já vai pro logger se você quiser melhorar depois
    });

    res.status(201).json({
        message: "Inscrição realizada com sucesso",
        data: sub
    });
});


// 🔥 VALIDATE SUBSCRIPTION
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


// 🔥 CANCEL SUBSCRIPTION
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