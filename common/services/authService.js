const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET;
const REFRESH_EXPIRY_DAYS = 7;

const generateAccessToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        SECRET,
        { expiresIn: '15m' }
    );

const generateRefreshToken = () =>
    crypto.randomBytes(64).toString('hex');

const generateRefreshExpiry = () =>
    new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000);


exports.registerUser = async ({ name, email, password }) => {

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

    const user = await User.create({ name, email, password, role: 'user' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = generateRefreshExpiry();

    await user.update({ refreshToken, refreshTokenExpiry });

    return {
        user: { name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
    };
};


exports.loginUser = async ({ email, password }) => {

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
    const refreshTokenExpiry = generateRefreshExpiry();

    await user.update({ refreshToken, refreshTokenExpiry });

    return {
        user: { name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
    };
};


exports.refreshTokens = async ({ refreshToken }) => {

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
    const newRefreshTokenExpiry = generateRefreshExpiry();

    await user.update({
        refreshToken: newRefreshToken,
        refreshTokenExpiry: newRefreshTokenExpiry
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};


exports.logoutUser = async ({ refreshToken }) => {

    if (!refreshToken) {
        const err = new Error("Refresh token não informado");
        err.status = 400;
        throw err;
    }

    const user = await User.findOne({ where: { refreshToken } });

    if (user) {
        await user.update({ refreshToken: null, refreshTokenExpiry: null });
    }
};


exports.getAllUsers = async () => {
    return User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });
};