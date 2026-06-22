const authService = require('../services/authService');
const asyncHandler = require('../helpers/asyncHandler');


exports.register = asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
        message: "Usuário cadastrado com sucesso",
        data: result
    });
});


exports.login = asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body);
    res.json({
        message: "Login realizado com sucesso",
        data: result
    });
});


exports.refresh = asyncHandler(async (req, res) => {
    const result = await authService.refreshTokens(req.body);
    res.json({
        message: "Token renovado com sucesso",
        data: result
    });
});


exports.logout = asyncHandler(async (req, res) => {
    await authService.logoutUser(req.body);
    res.json({ message: "Logout realizado com sucesso" });
});


exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();
    res.json(users);
});


exports.me = asyncHandler(async (req, res) => {
    res.json({ data: req.user });
});