const participantController = require('../common/controllers/participantController');
const Participant = require('../common/models/participant');
const Event = require('../common/models/Event');

jest.mock('../common/models/participant');
jest.mock('../common/models/Event');

describe('Participant Controller', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            params: { id: 1 },
            user: {
                id: 1,
                name: "João",
                email: "joao@email.com"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve listar participantes do evento', async () => {

        Participant.findAll.mockResolvedValue([
            { id: 1, name: "João" }
        ]);

        await participantController.getParticipants(req, res);

        expect(res.json).toHaveBeenCalled();
    });

    it('deve inscrever usuário', async () => {

        Event.findByPk.mockResolvedValue({
            id: 1,
            maxParticipants: 10,
            update: jest.fn()
        });

        Participant.findOne.mockResolvedValue(null);
        Participant.count.mockResolvedValue(0);

        Participant.create.mockResolvedValue({
            id: 1,
            eventId: 1,
            userId: 1
        });

        await participantController.subscribe(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve cancelar inscrição', async () => {

        Participant.destroy.mockResolvedValue(1);

        await participantController.cancelMySubscription(req, res);

        expect(res.json).toHaveBeenCalled();
    });

});