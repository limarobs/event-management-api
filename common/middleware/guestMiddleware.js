const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, SECRET);
            req.user = decoded;
        } catch (err) {
            // token inválido — ignora e continua como visitante
        }
    }

    next();
};
