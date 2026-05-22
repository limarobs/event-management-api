// Importa os recursos do Sequelize
const { DataTypes } = require('sequelize');

// Importa a conexão com o banco
const sequelize = require('../config/database');

// Cria o model de notícias
const News = sequelize.define('News', {

  // Título da notícia
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Conteúdo da notícia
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }

});

// Exporta o model
module.exports = News;