const eventsController = require('../common/controllers/eventsController');
const Event = require('../common/models/Event');
const Participant = require('../common/models/participant');

jest.mock('../common/models/Event');
jest.mock('../common/models/participant');

describe('Events Controller', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            params: {},
            user: { id: 1 }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve listar eventos com campos calculados', async () => {

        Event.findAll.mockResolvedValue([
            {
                id: 1,
                title: "Evento 1",
                maxParticipants: 10,
                toJSON: () => ({ id: 1, title: "Evento 1", maxParticipants: 10 })
            }
        ]);

        Participant.findAll.mockResolvedValue([
            { eventId: 1, userId: 1 }
        ]);

        await eventsController.getAllEvents(req, res);

        expect(res.json).toHaveBeenCalled();
    });

    it('deve retornar evento por id', async () => {

        req.params.id = 1;

        Event.findByPk.mockResolvedValue({
            id: 1,
            title: "Evento 1",
            maxParticipants: 10,
            toJSON: () => ({ id: 1, title: "Evento 1", maxParticipants: 10 })
        });

        Participant.findAll.mockResolvedValue([
            { userId: 1 }
        ]);

        await eventsController.getEventById(req, res);

        expect(res.json).toHaveBeenCalled();
    });

});