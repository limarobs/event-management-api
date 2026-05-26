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
      allowNull: false
   },

   endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
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

         if (
            !this.startDate ||
            !this.endDate ||
            !this.startTime ||
            !this.endTime
         ) {
            return;
         }

         const start = new Date(
            `${this.startDate}T${this.startTime}`
         );

         const end = new Date(
            `${this.endDate}T${this.endTime}`
         );

         const now = new Date();

         if (start < now) {
            throw new Error(
               "O evento não pode iniciar no passado"
            );
         }

         if (end <= start) {
            throw new Error(
               "A data/hora final deve ser posterior à inicial"
            );
         }
      }
   }
});

module.exports = Event;