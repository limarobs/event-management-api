const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
        return res.status(401).json({ message: "Token ausente" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expirado",
                code: "TOKEN_EXPIRED"
            });
        }
        return res.status(401).json({ message: "Token inválido" });
    }
};