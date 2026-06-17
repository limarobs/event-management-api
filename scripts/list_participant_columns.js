const sequelize = require('../common/database');

(async () => {
  try {
    await sequelize.authenticate();
    const res = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='Participants' ORDER BY ordinal_position;");
    console.log(res[0].map(r => r.column_name).join('\n'));
    await sequelize.close();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
