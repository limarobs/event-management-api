// Importa o Express
const express = require('express');

// Cria o sistema de rotas
const router = express.Router();

const newsController = require('../controllers/newsController');

router.get('/', newsController.getNews);

router.post('/', newsController.createNews);

router.put('/:id', newsController.updateNews);

router.delete('/:id', newsController.deleteNews);

// Exporta as rotas
module.exports = router;