const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Event = require("./Event");
const User = require("./User");

const EventHistory = sequelize.define("EventHistory", {
   eventId: { type: DataTypes.INTEGER, allowNull: false },
   userId: { type: DataTypes.INTEGER, allowNull: false },
   action: {
      type: DataTypes.ENUM('created', 'updated', 'deleted'),
      allowNull: false
   },
   changedFields: {
      type: DataTypes.JSON,
      allowNull: true
   }
});

EventHistory.belongsTo(Event, { foreignKey: 'eventId' });
EventHistory.belongsTo(User, { foreignKey: 'userId' });

module.exports = EventHistory;
