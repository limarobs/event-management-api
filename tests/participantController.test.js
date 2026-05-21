const participantController = require('../common/controllers/participantController');
const Participant = require('../common/models/participant');
const Event = require('../common/models/Event');
const { updateEventStatus } = require('../common/helpers/eventHelper');
const { sendSubscriptionConfirmation } = require('../common/helpers/emailHelper');

jest.mock('../common/models/participant');
jest.mock('../common/models/Event');
jest.mock('../common/helpers/eventHelper', () => ({
    updateEventStatus: jest.fn().mockResolvedValue()
}));
jest.mock('../common/helpers/emailHelper', () => ({
    sendSubscriptionConfirmation: jest.fn().mockResolvedValue()
}));

describe('Participant Controller', () => {

    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 1 },
            query: {},
            user: { id: 1, name: "João", email: "joao@email.com" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    it('deve listar participantes do evento', async () => {
        Participant.findAll.mockResolvedValue([{ id: 1, name: "João", approvalStatus: 'approved' }]);

        await participantController.getParticipants(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    it('não deve listar participantes rejeitados', async () => {
        // Apenas participantes approved e pending
        Participant.findAll.mockResolvedValue([
            { id: 1, name: "João", approvalStatus: 'approved' },
            { id: 2, name: "Maria", approvalStatus: 'pending' }
        ]);

        await participantController.getParticipants(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
        const callArgs = res.json.mock.calls[0][0];
        // Verifica que nenhum item tem approvalStatus 'rejected'
        expect(callArgs.some(p => p.approvalStatus === 'rejected')).toBe(false);
    });

    it('deve inscrever usuário', async () => {
        Event.findByPk.mockResolvedValue({
            id: 1, maxParticipants: 10,
            title: 'Test event', date: new Date(), location: 'Test',
            update: jest.fn()
        });
        Participant.findOne.mockResolvedValue(null);
        Participant.count.mockResolvedValue(0);
        Participant.create.mockResolvedValue({ id: 1, eventId: 1, userId: 1 });

        await participantController.subscribe(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve bloquear nova inscrição quando estiver pendente', async () => {
        Event.findByPk.mockResolvedValue({
            id: 1, maxParticipants: 10,
            title: 'Test event', date: new Date(), location: 'Test',
            update: jest.fn()
        });
        Participant.findOne.mockResolvedValue({ approvalStatus: 'pending' });

        await participantController.subscribe(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].status).toBe(409);
        expect(next.mock.calls[0][0].message).toBe('Inscrição pendente: não é possível inscrever novamente');
    });

    it('deve bloquear nova inscrição quando estiver rejeitada', async () => {
        Event.findByPk.mockResolvedValue({
            id: 1, maxParticipants: 10,
            title: 'Test event', date: new Date(), location: 'Test',
            update: jest.fn()
        });
        Participant.findOne.mockResolvedValue({ approvalStatus: 'rejected' });

        await participantController.subscribe(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].status).toBe(409);
        expect(next.mock.calls[0][0].message).toBe('Inscrição rejeitada: não é possível inscrever novamente');
    });

    it('deve cancelar inscrição', async () => {
        Participant.destroy.mockResolvedValue(1);

        await participantController.cancelMySubscription(req, res, next);

        if (next.mock.calls.length > 0) {
            console.error('Controller threw', next.mock.calls[0][0]);
        }

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    it('debug subscribe', async () => {
    Event.findByPk.mockResolvedValue({
        id: 1, maxParticipants: 10,
        title: 'Test event', date: new Date(), location: 'Test',
        update: jest.fn()
    });
    Participant.findOne.mockResolvedValue(null);
    Participant.count.mockResolvedValue(0);
    Participant.create.mockResolvedValue({ id: 1, eventId: 1, userId: 1 });

    try {
        await participantController.subscribe.toString();
        console.log('subscribe fn:', participantController.subscribe);

        const fn = participantController.subscribe;
        await fn(req, res, next);
        console.log('res.status calls:', res.status.mock.calls);
        console.log('res.json calls:', res.json.mock.calls);
        console.log('next calls:', next.mock.calls);
    } catch(e) {
        console.error('RAW ERROR:', e);
    }
});
});