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

         const start = new Date(
            `${this.startDate}T${this.startTime}`// Junta data e hora de início em um objeto Date
         );

         const end = new Date(
            `${this.endDate}T${this.endTime}`// Junta data e hora de término em um objeto Date
         );

         const now = new Date();// Obtém a data e hora atuais do sistema

         if (start < now) {// Verifica se o evento está sendo criado para uma data passada
            throw new Error(
               "O evento não pode iniciar no passado"// Mensagem de erro exibida ao usuário
            );
         }

         if (end <= start) {// Verifica se o horário final é menor ou igual ao inicial
            throw new Error(
               "A data/hora final deve ser posterior à inicial" // Mensagem de erro caso a data final seja inválida
            );
         }
      }
   }
});

module.exports = Event;