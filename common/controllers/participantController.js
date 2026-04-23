const Participant = require('../models/participant');
const Event = require('../models/Event');

exports.getParticipants = async (req, res) => {
    try {
        const list = await Participant.findAll({
            where: { eventId: req.params.id }
        });
        res.json(list);
    } catch (error) {
        console.error('Erro ao listar participantes:', error.message);
        res.status(500).json({ message: "Erro ao listar participantes: " + error.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, name, email } = req.user;

        const event = await Event.findByPk(id);
        
        if (!event) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        const count = await Participant.count({ where: { eventId: id } });
        
        if (count >= event.maxParticipants) {
            return res.status(409).json({ message: "Evento lotado" });
        }

        const exists = await Participant.findOne({ where: { eventId: id, userId } });
        
        if (exists) {
            return res.status(409).json({ message: "Usuário já inscrito" });
        }

        const sub = await Participant.create({ eventId: id, userId, name, email });
        res.status(201).json({ message: "Inscrição realizada com sucesso", data: sub });
    } catch (error) {
        console.error('Erro ao realizar inscrição:', error.message);
        res.status(500).json({ message: "Erro ao realizar inscrição: " + error.message });
    }
};

exports.cancelMySubscription = async (req, res) => {
    try {
        const deleted = await Participant.destroy({
            where: {
                eventId: req.params.id,
                userId: req.user.id
            }
        });

        if (!deleted) {
            return res.status(404).json({ message: "Inscrição não encontrada" });
        }
        
        res.json({ message: "Inscrição cancelada com sucesso" });
    } catch (error) {
        console.error('Erro ao cancelar inscrição:', error.message);
        res.status(500).json({ message: "Erro ao cancelar inscrição: " + error.message });
    }
};