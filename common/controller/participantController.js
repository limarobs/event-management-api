const Participant = require('../models/participant');
const Event = require('../models/events');

exports.subscribe = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: "Evento não encontrado" });

        const participant = await Participant.create({
            ...req.body,
            eventId: req.params.id
        });
        res.status(201).json(participant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.listByEvent = async (req, res) => {
    try {
        const participants = await Participant.findAll({
            where: { eventId: req.params.id }
        });
        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};