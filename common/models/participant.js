const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Participant = sequelize.define('Participant', {

    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false
    },

    approvalStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'approved',
        field: 'status'
    },

    approvalReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    subscriptionToken: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true
    },

    isCheckedIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    checkedInAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }

});

module.exports = Participant;