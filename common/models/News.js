const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const News = sequelize.define('News', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Título é obrigatório' }
    }
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Conteúdo é obrigatório' }
    }
  },

  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Autor não pode ser vazio' }
    }
  },

  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }

});

module.exports = News;