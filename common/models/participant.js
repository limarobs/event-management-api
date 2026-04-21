const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Participant = sequelize.define('Participant', {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Participant;