const { DataTypes } = require('sequelize');

const sequelize = require('../database');

const News = sequelize.define('News', {

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  type: {
    type: DataTypes.STRING,
    defaultValue: 'news'
  },

  author: {
    type: DataTypes.STRING
  },

  publishedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

});

module.exports = News;