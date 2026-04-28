const request = require('supertest');
const app = require('../index');

describe('Events Routes', () => {

    it('GET / deve retornar API funcionando', async () => {

        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/events deve funcionar', async () => {

        const res = await request(app).get('/api/events');

        expect(res.statusCode).toBe(200);
    });

});