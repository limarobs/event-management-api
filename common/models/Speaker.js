const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Speaker = sequelize.define('Speaker', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  miniBio: {
    type: DataTypes.TEXT
  },

  topics: {
    type: DataTypes.TEXT
  },

  schedule: {
    type: DataTypes.STRING
  },

  email: {
    type: DataTypes.STRING
  },

  photo: {
    type: DataTypes.STRING
  }

});

module.exports = Speaker;