const sequelize = require('../common/database');
const { Sequelize } = require('sequelize');

(async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');

    const tableName = '"Participants"';

    const colCheck = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'Participants' AND column_name = 'approvalStatus';",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!colCheck.length) {
      await queryInterface.addColumn('Participants', 'approvalStatus', {
        type: Sequelize.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'approved'
      });
      console.log('Added approvalStatus column to Participants');
    } else {
      console.log('approvalStatus already exists');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
