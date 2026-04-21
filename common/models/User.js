const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' }
}, {
    hooks: {
        beforeCreate: async (user) => {
            user.password = await bcrypt.hash(user.password, 10);
        }
    }
});

// CERTIFIQUE-SE DISSO AQUI:
module.exports = User;