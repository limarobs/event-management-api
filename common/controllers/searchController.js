// Importa os operadores do Sequelize
const { Op } = require('sequelize');

// Importa o model de palestrantes
const Speaker = require('../models/Speaker');

// Importa o model de notícias
const News = require('../models/News');

// Função responsável pela busca global
const search = async (req, res) => {

  try {

    // Captura o texto digitado pelo usuário na URL
    // Exemplo: /search?q=node
    const q = req.query.q;

    // Verifica se o usuário enviou o parâmetro de busca
    if (!q) {

      // Retorna erro caso o parâmetro não exista
      return res.status(400).json({
        error: 'Parâmetro q é obrigatório'
      });

    }

    // Busca palestrantes pelo nome
    const speakers = await Speaker.findAll({

      where: {

        // Procura nomes parecidos com o texto digitado
        name: {

          // iLike ignora letras maiúsculas/minúsculas
          [Op.iLike]: `%${q}%`
        }
      }
    });

    // Busca notícias pelo título
    const news = await News.findAll({

      where: {

        // Procura títulos parecidos com o texto digitado
        title: {

          [Op.iLike]: `%${q}%`
        }
      }
    });

    // Retorna os dados encontrados em formato JSON
    return res.json({
      speakers,
      news
    });

  } catch (error) {

    // Caso aconteça algum erro interno no servidor
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });

  }

};

// Exporta a função de busca
module.exports = {
  search
};