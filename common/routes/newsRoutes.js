// Importa o Express
const express = require('express');

// Cria o sistema de rotas
const router = express.Router();

// Importa o controller dos palestrantes
const speakerController = require('../controllers/speakerController');

// Rota para listar todos os palestrantes
router.get('/', speakerController.getSpeakers);

// Rota para cadastrar um novo palestrante
router.post('/', speakerController.createSpeaker);

// Rota para atualizar um palestrante
router.put('/:id', speakerController.updateSpeaker);

// Rota para remover um palestrante
router.delete('/:id', speakerController.deleteSpeaker);

// Exporta as rotas
module.exports = router;