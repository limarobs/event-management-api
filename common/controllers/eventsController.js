const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');
const { updateEventStatus } = require('../helpers/eventHelper');

// Campos ignorados na comparação do histórico de alterações
const IGNORED_FIELDS = ['updatedAt', 'createdAt', 'id'];

exports.getAllEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const { count: totalItems, rows: events } = await Event.findAndCountAll({
            limit,
            offset,
            order: [['date', 'ASC'], ['startTime', 'ASC']]
        });

        const eventIds = events.map(event => event.id);
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
            const availableSpots = max > 0 ? Math.max(max - registeredParticipants, 0) : null;
            const isSoldOut = max > 0 ? registeredParticipants >= max : false;
            const isUserRegistered = userId ? list.includes(userId) : false;

            return {
                ...event.toJSON(),
                registeredParticipants,
                availableSpots,
                isSoldOut,
                isUserRegistered
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

    } catch (error) {
        console.error('Erro ao listar eventos:', error.message);
        res.status(500).json({ message: "Erro ao listar eventos: " + error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        const participants = await Participant.findAll({
            where: { eventId: event.id },
            attributes: ["userId"]
        });

        const userIds = participants.map(p => p.userId);
        const registeredParticipants = userIds.length;
        const max = event.maxParticipants ?? 0;
        const availableSpots = max > 0 ? Math.max(max - registeredParticipants, 0) : null;
        const isSoldOut = max > 0 ? registeredParticipants >= max : false;
        const isUserRegistered = userId ? userIds.includes(userId) : false;

        res.json({
            ...event.toJSON(),
            registeredParticipants,
            availableSpots,
            isSoldOut,
            isUserRegistered
        });

    } catch (error) {
        console.error('Erro ao buscar evento:', error.message);
        res.status(500).json({ message: "Erro ao buscar evento: " + error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Erro ao criar evento:', error.message);

        if (
            error.message.includes('Data e hora de início do evento incompatíveis') ||
            error.message.includes('A hora de fim deve ser posterior à hora de início')
        ) {
            return res.status(400).json({ message: error.message });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Dados inválidos: " + error.message });
        }

        res.status(500).json({ message: "Erro ao criar evento: " + error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        // Captura estado anterior antes de atualizar
        const before = event.toJSON();
        await event.update(req.body);
        const after = event.toJSON();

        // Compara apenas os campos enviados na requisição, ignorando campos internos
        const changedFields = {};
        for (const key of Object.keys(req.body)) {
            if (IGNORED_FIELDS.includes(key)) continue;
            if (String(before[key]) !== String(after[key])) {
                changedFields[key] = { before: before[key], after: after[key] };
            }
        }

        await EventHistory.create({
            eventId: event.id,
            userId: req.user.id,
            action: 'updated',
            changedFields: Object.keys(changedFields).length > 0 ? changedFields : null
        });

        const participants = await Participant.findAll({ where: { eventId: event.id } });
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

    } catch (error) {
        console.error('Erro ao atualizar evento:', error.message);

        if (
            error.message.includes('Data e hora de início do evento incompatíveis') ||
            error.message.includes('A hora de fim deve ser posterior à hora de início')
        ) {
            return res.status(400).json({ message: error.message });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Dados inválidos: " + error.message });
        }

        res.status(500).json({ message: "Erro ao atualizar evento: " + error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        // Grava histórico antes de destruir o registro
        await EventHistory.create({
            eventId: event.id,
            userId: req.user.id,
            action: 'deleted',
            changedFields: null
        });

        await event.destroy();

        res.json({ message: "Evento excluído com sucesso" });

    } catch (error) {
        console.error('Erro ao excluir evento:', error.message);
        res.status(500).json({ message: "Erro ao excluir evento: " + error.message });
    }
};

// GET /api/events/:id/history — admin only
exports.getEventHistory = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        const history = await EventHistory.findAll({
            where: { eventId: req.params.id },
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(history);

    } catch (error) {
        console.error('Erro ao buscar histórico:', error.message);
        res.status(500).json({ message: "Erro ao buscar histórico: " + error.message });
    }
};
