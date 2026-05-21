const EventHistory = require('../models/EventHistory');
const asyncHandler = require('../helpers/asyncHandler');

/**
 * Verifica se o admin autenticado foi quem criou o evento.
 * Deve ser usado após authMiddleware + adminMiddleware.
 * Consulta o EventHistory para encontrar o registro de 'created'.
 */
module.exports = asyncHandler(async (req, res, next) => {

    const eventId = req.params.id || req.params.eventId;

    const creation = await EventHistory.findOne({
        where: {
            eventId,
            action: 'created'
        },
        order: [['createdAt', 'ASC']]
    });

    if (!creation) {
        const err = new Error('Histórico de criação do evento não encontrado');
        err.status = 404;
        throw err;
    }

    if (creation.userId !== req.user.id) {
        const err = new Error(
            'Apenas o administrador que criou o evento pode gerenciar os materiais'
        );
        err.status = 403;
        throw err;
    }

    next();
});