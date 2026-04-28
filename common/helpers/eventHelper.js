const Event = require('../models/Event');
const Participant = require('../models/participant');

async function updateEventStatus(eventId) {
    try {
        const event = await Event.findByPk(eventId);

        if (!event) {
            console.warn(`updateEventStatus: evento ${eventId} não encontrado`);
            return null;
        }

        const count = await Participant.count({
            where: { eventId }
        });

        const isFull = count >= event.maxParticipants;

        // só atualiza se necessário
        if (event.isFull !== isFull) {
            await event.update({ isFull });
            console.info(`updateEventStatus: evento ${eventId} atualizado para isFull=${isFull}`);
        }

        return {
            eventId,
            isFull,
            registeredParticipants: count
        };

    } catch (error) {
        console.error('updateEventStatus error:', error.message);
        throw error;
    }
}

module.exports = {
    updateEventStatus
};