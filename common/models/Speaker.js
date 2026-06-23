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
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('topics');
      try {
        return value ? JSON.parse(value) : [];
      } catch {
        return value;
      }
    },
    set(value) {
      this.setDataValue(
        'topics',
        Array.isArray(value) ? JSON.stringify(value) : value
      );
    }
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