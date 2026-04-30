const request = require('supertest');
const app = require('../index');

describe('Events Routes', () => {

    it('GET / deve retornar API funcionando', async () => {

        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/events deve retornar paginação padrão de 10 eventos', async () => {

        const res = await request(app).get('/api/events');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 10);
        expect(res.body).toHaveProperty('totalItems');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/events?page=2 deve aceitar paginação via query string', async () => {

        const res = await request(app).get('/api/events?page=2');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('page', 2);
        expect(res.body).toHaveProperty('limit', 10);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

});