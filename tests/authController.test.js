const authController = require('../common/controllers/authController');
const User = require('../common/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../common/models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve cadastrar usuário com sucesso', async () => {

        req.body = {
            name: "João",
            email: "joao@email.com",
            password: "123456"
        };

        User.findOne.mockResolvedValue(null);

        User.create.mockResolvedValue({
            id: 1,
            name: "João",
            email: "joao@email.com",
            role: "user"
        });

        jwt.sign.mockReturnValue("token-fake");

        await authController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro se email já existir', async () => {

        req.body = {
            name: "João",
            email: "existente@email.com",
            password: "123"
        };

        User.findOne.mockResolvedValue({ id: 1 });

        await authController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve fazer login com sucesso', async () => {

        req.body = {
            email: "joao@email.com",
            password: "123456"
        };

        User.findOne.mockResolvedValue({
            id: 1,
            email: "joao@email.com",
            password: "hashed",
            role: "user",
            name: "João"
        });

        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("token123");

        await authController.login(req, res);

        expect(res.json).toHaveBeenCalled();
    });

});