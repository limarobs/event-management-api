require('dotenv').config();
const SECRET = process.env.JWT_SECRET;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });
        }

        const exists = await User.findOne({ where: { email } });

        if (exists) {
            return res.status(409).json({ message: "Email já cadastrado" });
        }

        const user = await User.create({ name, email, password, role: 'user' });
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            SECRET
        );

        res.status(201).json({
            message: "Usuário cadastrado com sucesso",
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                token
            }
        });
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Email já cadastrado" });
        }
        res.status(400).json({ message: "Erro ao cadastrar usuário: " + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email e senha são obrigatórios" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            SECRET
        );

        res.json({
            message: "Login realizado com sucesso",
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                token
            }
        });
    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).json({ message: "Erro ao realizar login" });
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