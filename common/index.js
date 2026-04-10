const express = require('express');
const sequelize = require('./database'); // Importa sua conexão do database.js
const Event = require('./models/events'); // Importa seu modelo de eventos

const app = express();

// Middleware para permitir que o Express entenda JSON no corpo (body) das requisições
app.use(express.json());

// --- ENDPOINTS ---

// 1. Rota de Verificação (Status)
app.get('/status', (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

// 2. Listar todos os eventos (GET /events)
app.get('/events', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar eventos" });
    }
});

// 3. Buscar detalhes de um evento (GET /events/:id)
app.get('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: "Evento não encontrado" });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Criar um novo evento (POST /events)
app.post('/events', async (req, res) => {
    try {
        const newEvent = await Event.create(req.body);
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 5. Editar um evento existente (PUT /events/:id
app.put('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: "Evento não encontrado" });

        await event.update(req.body);
        res.json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 6. Excluir um evento (DELETE /events/:id)
app.delete('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: "Evento não encontrado" });

        await event.destroy();
        res.status(204).send(); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- INICIALIZAÇÃO ---

// Sincroniza o banco de dados (cria a tabela se não existir) e liga o servidor
const PORT = 4000;

sequelize.sync().then(() => {
    console.log('Banco de dados SQLite sincronizado.');
    app.listen(PORT, () => {
        console.log(`\n--- SERVIDOR ATUALIZADO E RODANDO ---`);
        console.log(`Local: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Não foi possível conectar ao banco de dados:', err);
});