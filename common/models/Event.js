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
      type: DataTypes.STRING,
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

      isEventDateValid() { // Cria um Método responsável por validar as datas e horários do evento

         if (
            !this.startDate || // Verifica se a data de início não foi informada
            !this.endDate || // Verifica se a data de término não foi informada
            !this.startTime || // Verifica se o horário de início não foi informado
            !this.endTime // Verifica se o horário de término não foi informado
         ) {
            return; // Encerra a validação caso algum campo esteja vazio
         }

         const localNowStr = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
         const now = new Date(localNowStr);
         const start = new Date(`${this.startDate}T${this.startTime}`);
         const end = new Date(`${this.endDate}T${this.endTime}`);
         const dataAlterada = this.changed('startDate') || this.changed('startTime');

         if (this.isNewRecord || dataAlterada) {
            if (start < now) {
               throw new Error(
                  "O evento não pode iniciar no passado"
               );
            }
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