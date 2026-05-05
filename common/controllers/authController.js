require('dotenv').config();
const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateAccessToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        SECRET,
        { expiresIn: '15m' }
    );

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const REFRESH_EXPIRY_DAYS = 7;

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });

        const exists = await User.findOne({ where: { email } });
        if (exists)
            return res.status(409).json({ message: "Email já cadastrado" });

        const user = await User.create({ name, email, password, role: 'user' });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);

        await user.update({ refreshToken, refreshTokenExpiry });

        res.status(201).json({
            message: "Usuário cadastrado com sucesso",
            data: {
                user: { name: user.name, email: user.email, role: user.role },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        if (error.name === 'SequelizeUniqueConstraintError')
            return res.status(409).json({ message: "Email já cadastrado" });
        res.status(400).json({ message: "Erro ao cadastrar usuário: " + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "Email e senha são obrigatórios" });

        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ message: "Credenciais inválidas" });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);

        await user.update({ refreshToken, refreshTokenExpiry });

        res.json({
            message: "Login realizado com sucesso",
            data: {
                user: { name: user.name, email: user.email, role: user.role },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).json({ message: "Erro ao realizar login" });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken)
            return res.status(400).json({ message: "Refresh token não informado" });

        const user = await User.findOne({ where: { refreshToken } });

        if (!user)
            return res.status(401).json({ message: "Refresh token inválido" });

        if (new Date() > new Date(user.refreshTokenExpiry))
            return res.status(401).json({ message: "Refresh token expirado, faça login novamente" });

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken();
        const newRefreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);

        await user.update({
            refreshToken: newRefreshToken,
            refreshTokenExpiry: newRefreshTokenExpiry
        });

        res.json({
            message: "Token renovado com sucesso",
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('Erro ao renovar token:', error.message);
        res.status(500).json({ message: "Erro ao renovar token" });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken)
            return res.status(400).json({ message: "Refresh token não informado" });

        const user = await User.findOne({ where: { refreshToken } });

        if (user) {
            await user.update({ refreshToken: null, refreshTokenExpiry: null });
        }

        res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
        console.error('Erro no logout:', error.message);
        res.status(500).json({ message: "Erro ao realizar logout" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error.message);
        res.status(500).json({ message: "Erro ao buscar usuários: " + error.message });
    }
};

exports.me = async (req, res) => {
    res.json({ data: req.user });
};