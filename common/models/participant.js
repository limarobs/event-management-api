const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Event = require('./events');

const Participant = sequelize.define('Participant', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING }
});

Event.hasMany(Participant, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Participant.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = Participant;