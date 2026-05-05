function getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logInfo(msg) {
    console.log(`[${getTimestamp()}] INFO: ${msg}`);
}

function logWarn(msg) {
    console.warn(`[${getTimestamp()}] WARN: ${msg}`);
}

function logError(msg, error = null) {
    console.error(`[${getTimestamp()}] ERROR: ${msg}`);

    if (error) {
        console.error(`[${getTimestamp()}] DETAILS:`, {
            message: error.message,
            dbMessage: error?.parent?.message || error?.original?.message,
            stack: error.stack
        });
    }
}

module.exports = {
    logInfo,
    logWarn,
    logError
};