const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Event = sequelize.define("Event", {
   title: { type: DataTypes.STRING, allowNull: false },
   description: { type: DataTypes.TEXT, allowNull: true },
   date: { type: DataTypes.DATEONLY, allowNull: false },
   startTime: { type: DataTypes.TIME, allowNull: false },
   endTime: { type: DataTypes.TIME, allowNull: false },
   location: { type: DataTypes.STRING, allowNull: true },
   maxParticipants: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } }
}, {
   validate: {
      isEventDateValid() {
         const eventDateTime = new Date(`${this.date}T${this.startTime}`);
         const now = new Date();
         if (eventDateTime < now) {
            throw new Error("Data e hora de início do evento incompatíveis");
         }
      },
      isEndTimeAfterStartTime() {
         if (this.startTime && this.endTime && this.endTime <= this.startTime) {
            throw new Error("A hora de fim deve ser posterior à hora de início");
         }
      }
   }
});

module.exports = Event;
            