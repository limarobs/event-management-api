const { logError } = require('../helpers/logger');

function errorMiddleware(err, req, res, next) {
    const statusCode = err.status || 500;

    const dbMessage =
        err?.parent?.message ||
        err?.original?.message ||
        null;

    // log completo com horário
    logError(
        `Erro em ${req.method} ${req.originalUrl} - Status ${statusCode}`,
        err
    );

    // resposta pro cliente
    res.status(statusCode).json({
        success: false,
        error: {
            message: dbMessage || err.message || 'Erro interno do servidor',
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        }
    });
}

module.exports = errorMiddleware;