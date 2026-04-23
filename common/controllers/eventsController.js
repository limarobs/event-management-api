const Event = require('../models/Event');
const Participant = require('../models/Participant');

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll();

        const data = await Promise.all(
            events.map(async (e) => {
                const count = await Participant.count({
                    where: { eventId: e.id }
                });

                return {
                    ...e.toJSON(),
                    registeredParticipants: count
                };
            })
        );

        res.json(data);
    } catch (error) {
        console.error('Erro ao listar eventos:', error.message);
        res.status(500).json({ message: "Erro ao listar eventos: " + error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res
                .status(404)
                .json({ message: "Evento não encontrado" });
        }

        const count = await Participant.count({
            where: { eventId: event.id }
        });

        res.json({
            ...event.toJSON(),
            registeredParticipants: count
        });
    } catch (error) {
        console.error('Erro ao buscar evento:', error.message);
        res.status(500).json({ message: "Erro ao buscar evento: " + error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);

        res.status(201).json({
            message: "Evento criado com sucesso",
            data: {
                ...event.toJSON(),
                registeredParticipants: 0
            }
        });
    } catch (error) {
        console.error('Erro ao criar evento:', error.message);
        if (
            error.message.includes(
                'Data e hora do evento incompativeis'
            )
        ) {
            return res.status(400).json({
                message: error.message
            });
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
            return res
                .status(404)
                .json({ message: "Evento não encontrado" });
        }

        await event.update(req.body);

        const count = await Participant.count({
            where: { eventId: event.id }
        });

        res.json({
            message: "Evento atualizado com sucesso",
            data: {
                ...event.toJSON(),
                registeredParticipants: count
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar evento:', error.message);
        if (
            error.message.includes(
                'Data e hora do evento incompativeis'
            )
        ) {
            return res.status(400).json({
                message: error.message
            });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Dados inválidos: " + error.message });
        }
        res.status(500).json({ message: "Erro ao atualizar evento: " + error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const deleted = await Event.destroy({
            where: { id: req.params.id }
        });

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Evento não encontrado" });
        }

        res.json({ message: "Evento excluído com sucesso" });
    } catch (error) {
        console.error('Erro ao excluir evento:', error.message);
        res.status(500).json({ message: "Erro ao excluir evento: " + error.message });
    }
};