const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Event = require('./Event');
const User = require('./User');

const EventMaterial = sequelize.define('EventMaterial', {

    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID do admin que fez o upload'
    },

    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nome original do arquivo'
    },

    storedName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nome do arquivo salvo em disco (uuid)'
    },

    fileType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'MIME type do arquivo'
    },

    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Tamanho em bytes'
    },

    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Caminho relativo do arquivo no servidor'
    },

    title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Título/descrição exibida para o participante'
    }

}, {
    timestamps: true
});

EventMaterial.belongsTo(Event, { foreignKey: 'eventId' });
EventMaterial.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

module.exports = EventMaterial;