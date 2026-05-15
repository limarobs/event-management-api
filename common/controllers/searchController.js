const { Op } = require('sequelize');

const Speaker = require('../models/Speaker');
const News = require('../models/News');

const search = async (req, res) => {

  try {

    const q = req.query.q;

    if (!q) {

      return res.status(400).json({
        error: 'Parâmetro q é obrigatório'
      });

    }

    // BUSCA PALESTRANTES
    const speakers = await Speaker.findAll({

      where: {
        name: {
          [Op.like]: `%${q}%`
        }
      }

    });

    // BUSCA NOTÍCIAS
    const news = await News.findAll({

      where: {
        title: {
          [Op.like]: `%${q}%`
        }
      }

    });

    // RESPOSTA
    res.json({
      speakers,
      news
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

module.exports = {
  search
};