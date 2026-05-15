const express = require('express');

const router = express.Router();

const newsController = require('../controllers/newsController');

router.post('/', newsController.createNews);

router.get('/', newsController.getNews);

router.put('/:id', newsController.updateNews);

router.delete('/:id', newsController.deleteNews);

module.exports = router;