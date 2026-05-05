require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const asyncHandler = require('../helpers/asyncHandler');

const generateAccessToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        SECRET,
        { expiresIn: '15m' }
    );

const generateRefreshToken = () =>
    crypto.randomBytes(64).toString('hex');

const REFRESH_EXPIRY_DAYS = 7;

exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        const err = new Error("Nome, email e senha são obrigatórios");
        err.status = 400;
        throw err;
    }

    const exists = await User.findOne({ where: { email } });

    if (exists) {
        const err = new Error("Email já cadastrado");
        err.status = 409;
        throw err;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: 'user'
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);

    await user.update({ refreshToken, refreshTokenExpiry });

    res.status(201).json({
        message: "Usuário cadastrado com sucesso",
        data: {
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken
        }
    });
});


exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        const err = new Error("Email e senha são obrigatórios");
        err.status = 400;
        throw err;
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        const err = new Error("Credenciais inválidas");
        err.status = 401;
        throw err;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);

    await user.update({ refreshToken, refreshTokenExpiry });

    res.json({
        message: "Login realizado com sucesso",
        data: {
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken
        }
    });
});


exports.refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        const err = new Error("Refresh token não informado");
        err.status = 400;
        throw err;
    }

    const user = await User.findOne({ where: { refreshToken } });

    if (!user) {
        const err = new Error("Refresh token inválido");
        err.status = 401;
        throw err;
    }

    if (new Date() > new Date(user.refreshTokenExpiry)) {
        const err = new Error("Refresh token expirado, faça login novamente");
        err.status = 401;
        throw err;
    }

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
});


exports.logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        const err = new Error("Refresh token não informado");
        err.status = 400;
        throw err;
    }

    const user = await User.findOne({ where: { refreshToken } });

    if (user) {
        await user.update({
            refreshToken: null,
            refreshTokenExpiry: null
        });
    }

    res.json({ message: "Logout realizado com sucesso" });
});


exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    res.json(users);
});


exports.me = asyncHandler(async (req, res) => {
    res.json({ data: req.user });
});