const News = require('../models/News');

const createNews = async (req, res) => {

  try {

    const author = req.user.name;
    const eventId = req.query.eventId;

    const news = await News.create({
      ...req.body,
      eventId: req.query.eventId,
      author: req.user.name
  });

    res.status(201).json(news);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const getNews = async (req, res) => {

  try {

    const news = await News.findAll();

    res.json(news);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const updateNews = async (req, res) => {

  try {

    const news = await News.findByPk(req.params.id);

    if (!news) {

      return res.status(404).json({
        error: 'Notícia não encontrada'
      });

    }

    await news.update(req.body);

    res.json(news);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const deleteNews = async (req, res) => {

  try {

    const news = await News.findByPk(req.params.id);

    if (!news) {

      return res.status(404).json({
        error: 'Notícia não encontrada'
      });

    }

    await news.destroy();

    res.json({
      message: 'Notícia removida'
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

module.exports = {
  createNews,
  getNews,
  updateNews,
  deleteNews
};