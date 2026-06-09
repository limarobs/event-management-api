const Participant = require('../models/participant');
const asyncHandler = require('../helpers/asyncHandler');

/**
 * Verifica se o usuário autenticado é um participante aprovado do evento.
 * Deve ser usado após authMiddleware.
 * Admins passam direto (para que possam acessar os materiais que cadastraram).
 */
module.exports = asyncHandler(async (req, res, next) => {

    // Admin sempre tem acesso
    if (req.user.role === 'admin') {
        return next();
    }

    const eventId = req.params.id || req.params.eventId;

    const participant = await Participant.findOne({
        where: {
            eventId,
            userId: req.user.id,
            approvalStatus: 'approved'
        }
    });

    if (!participant) {
        const err = new Error(
            'Acesso restrito a participantes confirmados neste evento'
        );
        err.status = 403;
        throw err;
    }

    next();
});