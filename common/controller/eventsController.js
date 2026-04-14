const Event = require('../models/events');

// GET /events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll();

        if (!events.length) {
            return res.status(200).json({ message: "Nenhum evento cadastrado" });
        }

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar eventos" });
    }
};

// GET /events/:id
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar evento" });
    }
};

// POST /events
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, time, location, maxParticipants } = req.body;

        // validação básica
        if (!title || !date || !time || !location || !maxParticipants) {
            return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });
        }

        if (maxParticipants <= 0) {
            return res.status(400).json({ error: "Número máximo de participantes inválido" });
        }

        const newEvent = await Event.create(req.body);

        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar evento" });
    }
};

// PUT /events/:id
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        await event.update(req.body);

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar evento" });
    }
};

// DELETE /events/:id
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        await event.destroy();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir evento" });
    }
};