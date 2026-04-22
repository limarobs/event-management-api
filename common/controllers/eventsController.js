const Event = require('../models/Event');
const Participant = require('../models/Participant');

exports.getAllEvents = async (req, res) => {
    const events = await Event.findAll();
    const data = await Promise.all(events.map(async (e) => {
        const count = await Participant.count({ where: { eventId: e.id } });
        return { ...e.toJSON(), registeredParticipants: count };
    }));
    res.json(data);
};

exports.getEventById = async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Evento não encontrado" });
    const count = await Participant.count({ where: { eventId: event.id } });
    res.json({ ...event.toJSON(), registeredParticipants: count });
};

exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);
        res.status(201).json({ message: "Evento criado com sucesso", data: { ...event.toJSON(), registeredParticipants: 0 } });
    } catch (error) {
        if (error.message.includes('Data e hora do evento incompativeis')) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ message: "Evento não encontrado" });
        await event.update(req.body);
        const count = await Participant.count({ where: { eventId: event.id } });
        res.json({ message: "Evento atualizado com sucesso", data: { ...event.toJSON(), registeredParticipants: count } });
    } catch (error) {
        if (error.message.includes('Data e hora do evento incompativeis')) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
};

exports.deleteEvent = async (req, res) => {
    const deleted = await Event.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Evento não encontrado" });
    res.json({ message: "Evento excluído com sucesso" });
};