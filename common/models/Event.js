const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Event = sequelize.define("Event", {

   title: {
      type: DataTypes.STRING,
      allowNull: false
   },

   description: {
      type: DataTypes.TEXT,
      allowNull: true
   },

   startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
   },

   endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
   },

   startTime: {
      type: DataTypes.TIME,
      allowNull: false
   },

   endTime: {
      type: DataTypes.TIME,
      allowNull: false
   },

   location: {
      type: DataTypes.STRING,
      allowNull: true
   },

   maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
         min: 1
      }
   },

   approvalMode: {
      type: DataTypes.ENUM('automatic', 'manual'),
      allowNull: false,
      defaultValue: 'automatic'
   },

   approvalRuleDescription: {
      type: DataTypes.TEXT,
      allowNull: true
   }

}, {

   timestamps: true,
   paranoid: true,

   validate: {

      isEventDateValid() {

         if (!this.startDate || !this.startTime) {
            return;
         }

         const eventDateTime = new Date(
            `${this.startDate}T${this.startTime}`
         );

         const now = new Date();

         if (eventDateTime < now) {
            throw new Error("Data e hora de início do evento incompatíveis");
         }
      },

      isEndTimeAfterStartTime() {

         if (
            this.startDate &&
            this.endDate &&
            this.startDate === this.endDate &&
            this.startTime &&
            this.endTime &&
            this.endTime <= this.startTime
         ) {
            throw new Error(
               "A hora de fim deve ser posterior à hora de início"
            );
         }
      }
   }
});

module.exports = Event;