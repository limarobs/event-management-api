// Importa o Express
const express = require('express');

// Cria o sistema de rotas
const router = express.Router();

// Importa o controller dos palestrantes
const speakerController = require('../controllers/speakerController');

// Rota para listar todos os palestrantes
router.get('/', speakerController.index);

// Rota para cadastrar um novo palestrante
router.post('/', speakerController.store);

// Rota para atualizar um palestrante
router.put('/:id', speakerController.update);

// Rota para remover um palestrante
router.delete('/:id', speakerController.delete);

// Exporta as rotas
module.exports = router;