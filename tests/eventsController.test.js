jest.mock('../common/models/EventHistory', () => ({  
    create: jest.fn(),
    findAll: jest.fn(),
    belongsTo: jest.fn()
}));
jest.mock('../common/models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    belongsTo: jest.fn()
}));
jest.mock('../common/models/Event');
jest.mock('../common/models/participant');
jest.mock('../common/helpers/eventHelper', () => ({
    updateEventStatus: jest.fn().mockResolvedValue()
}));

const eventsController = require('../common/controllers/eventsController');
const Event = require('../common/models/Event');
const Participant = require('../common/models/participant');

describe('Events Controller', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            user: { id: 1 }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve listar eventos com campos calculados', async () => {

        Event.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [
                {
                    id: 1,
                    title: "Evento 1",
                    maxParticipants: 10,
                    count: 10,
                    toJSON: () => ({ id: 1, title: "Evento 1", maxParticipants: 10, count: 10 })
                }
            ]
        });

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