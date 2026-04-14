const Participant = require('../models/participant');
const Event = require('../models/events');

// POST /events/:id/participants
exports.subscribe = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        // validações básicas
       if (!name || !email) {
            return res.status(400).json({ error: "Nome e email são obrigatórios" });
        }

        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        // verificar limite de participantes
        const count = await Participant.count({ where: { eventId: id } });

        if (count >= event.maxParticipants) {
            return res.status(400).json({ error: "Evento lotado" });
        }

        const participant = await Participant.create({
            name,
            email,
            phone,
            eventId: id
        });

        res.status(201).json(participant);
    } catch (error) {
        res.status(500).json({ error: "Erro ao inscrever participante" });
    }
};

// GET /events/:id/participants
exports.listByEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        const participants = await Participant.findAll({
            where: { eventId: id }
        });

        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: "Erro ao listar participantes" });
    }
};