const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Event = sequelize.define("Event", {
   title: { type: DataTypes.STRING, allowNull: false },
   description: { type: DataTypes.TEXT, allowNull: true },
   date: { type: DataTypes.DATEONLY, allowNull: false },
   time: { type: DataTypes.TIME, allowNull: false },
   location: { type: DataTypes.STRING, allowNull: true },
   maxParticipants: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } }
}, {
   validate: {
      isEventDateValid() {
         const eventDateTime = new Date(`${this.date}T${this.time}`);
         const now = new Date();
         if (eventDateTime < now) {
            throw new Error("Data e hora do evento incompativeis");
         }
      }
   }
});

module.exports = Event;
