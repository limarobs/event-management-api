const sequelize = require('../common/database');
const { Sequelize } = require('sequelize');

(async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    console.log('DB connection OK');

    // Ensure enum type exists (Postgres)
    const enumTypeName = 'enum_Events_approvalMode';

    await sequelize.query(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN\n    CREATE TYPE "${enumTypeName}" AS ENUM ('automatic','manual');\n  END IF;\nEND$$;`);

    // If column exists, make sure its type matches the enum
    const tableName = '"Events"';
    const approvalColCheck = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'approvalMode'`, { type: Sequelize.QueryTypes.SELECT });

    if (approvalColCheck.length) {
      try {
        await sequelize.query(`ALTER TABLE ${tableName} ALTER COLUMN "approvalMode" TYPE "${enumTypeName}" USING "approvalMode"::text::"${enumTypeName}";`);
        console.log('approvalMode column type ensured');
      } catch (err) {
        console.warn('Could not alter approvalMode column type (it may already match or values differ).', err.message);
      }
    }

    // Add startDate and endDate columns if missing (allow NULL initially)
    const startCol = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'startDate'`, { type: Sequelize.QueryTypes.SELECT });
    const endCol = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'endDate'`, { type: Sequelize.QueryTypes.SELECT });

    if (!startCol.length) {
      await queryInterface.addColumn('Events', 'startDate', {
        type: Sequelize.DataTypes.DATEONLY,
        allowNull: true
      });
      console.log('Added startDate (nullable)');
    } else {
      console.log('startDate already exists');
    }

    if (!endCol.length) {
      await queryInterface.addColumn('Events', 'endDate', {
        type: Sequelize.DataTypes.DATEONLY,
        allowNull: true
      });
      console.log('Added endDate (nullable)');
    } else {
      console.log('endDate already exists');
    }

    // Backfill from legacy `date` column if present
    const dateCol = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'date'`, { type: Sequelize.QueryTypes.SELECT });

    if (dateCol.length) {
      const res = await sequelize.query(`UPDATE "Events" SET "startDate" = "date" WHERE "startDate" IS NULL RETURNING id;`);
      console.log('Backfilled startDate from date for rows:', (res[1] && res[1].rowCount) || 'unknown');
      const res2 = await sequelize.query(`UPDATE "Events" SET "endDate" = "date" WHERE "endDate" IS NULL RETURNING id;`);
      console.log('Backfilled endDate from date for rows:', (res2[1] && res2[1].rowCount) || 'unknown');
    } else {
      console.log('No legacy `date` column found; skipping backfill from date');
    }

    // If there are rows with NULL startDate or endDate and no legacy date to backfill, leave them nullable for now.

    // After backfill, set NOT NULL constraints if every row has values
    const missingStart = await sequelize.query(`SELECT COUNT(*)::int AS cnt FROM "Events" WHERE "startDate" IS NULL`, { type: Sequelize.QueryTypes.SELECT });
    const missingEnd = await sequelize.query(`SELECT COUNT(*)::int AS cnt FROM "Events" WHERE "endDate" IS NULL`, { type: Sequelize.QueryTypes.SELECT });

    if (missingStart[0].cnt === 0) {
      await sequelize.query(`ALTER TABLE ${tableName} ALTER COLUMN "startDate" SET NOT NULL;`);
      console.log('startDate set NOT NULL');
    } else {
      console.log(`startDate has ${missingStart[0].cnt} NULL rows; left nullable`);
    }

    if (missingEnd[0].cnt === 0) {
      await sequelize.query(`ALTER TABLE ${tableName} ALTER COLUMN "endDate" SET NOT NULL;`);
      console.log('endDate set NOT NULL');
    } else {
      console.log(`endDate has ${missingEnd[0].cnt} NULL rows; left nullable`);
    }

    console.log('Migration script finished');
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }

})();
