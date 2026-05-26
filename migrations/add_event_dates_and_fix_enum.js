const sequelize = require('../common/database'); // Importa a conexão com o banco de dados
const { Sequelize } = require('sequelize'); // Importa recursos do Sequelize

(async () => { // Função assíncrona autoexecutável

  const queryInterface = sequelize.getQueryInterface(); // Obtém interface para alterar tabelas

  try {

    await sequelize.authenticate(); // Testa a conexão com o banco
    console.log('DB connection OK');

    const tableName = '"Events"'; // Nome da tabela de eventos

    // =============================
    // Verificar se startDate existe
    // =============================

    const startCol = await sequelize.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Events'
      AND column_name = 'startDate'
      `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    ); // Procura a coluna startDate

    // =============================
    // Verificar se endDate existe
    // =============================

    const endCol = await sequelize.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Events'
      AND column_name = 'endDate'
      `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    ); // Procura a coluna endDate

    // =============================
    // Criar startDate se necessário
    // =============================

    if (!startCol.length) {

      await queryInterface.addColumn(
        'Events',
        'startDate',
        {
          type: Sequelize.DataTypes.DATEONLY,
          allowNull: true
        }
      ); // Adiciona a coluna startDate

      console.log('Added startDate (nullable)');

    } else {

      console.log('startDate already exists');
    }

    // =============================
    // Criar endDate se necessário
    // =============================

    if (!endCol.length) {

      await queryInterface.addColumn(
        'Events',
        'endDate',
        {
          type: Sequelize.DataTypes.DATEONLY,
          allowNull: true
        }
      ); // Adiciona a coluna endDate

      console.log('Added endDate (nullable)');

    } else {

      console.log('endDate already exists');
    }

    // =============================
    // Verificar coluna antiga date
    // =============================

    const dateCol = await sequelize.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Events'
      AND column_name = 'date'
      `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    ); // Verifica se existe a coluna antiga date

    // =============================
    // Migrar dados antigos
    // =============================

    if (dateCol.length) {

      const res = await sequelize.query(`
        UPDATE "Events"
        SET "startDate" = "date"
        WHERE "startDate" IS NULL
        RETURNING id;
      `); // Copia os dados de date para startDate

      console.log(
        'Backfilled startDate from date for rows:',
        (res[1] && res[1].rowCount) || 'unknown'
      );

      const res2 = await sequelize.query(`
        UPDATE "Events"
        SET "endDate" = "date"
        WHERE "endDate" IS NULL
        RETURNING id;
      `); // Copia os dados de date para endDate

      console.log(
        'Backfilled endDate from date for rows:',
        (res2[1] && res2[1].rowCount) || 'unknown'
      );

    } else {

      console.log(
        'No legacy date column found; skipping backfill'
      ); // Não existe coluna antiga para migrar
    }

    // =============================
    // Verificar registros sem startDate
    // =============================

    const missingStart = await sequelize.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM "Events"
      WHERE "startDate" IS NULL
      `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    ); // Conta quantos registros estão sem startDate

    // =============================
    // Verificar registros sem endDate
    // =============================

    const missingEnd = await sequelize.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM "Events"
      WHERE "endDate" IS NULL
      `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    ); // Conta quantos registros estão sem endDate

    // =============================
    // Tornar startDate obrigatório
    // =============================

    if (missingStart[0].cnt === 0) {

      await sequelize.query(`
        ALTER TABLE ${tableName}
        ALTER COLUMN "startDate"
        SET NOT NULL;
      `); // Define startDate como obrigatório

      console.log('startDate set NOT NULL');

    } else {

      console.log(
        `startDate has ${missingStart[0].cnt} NULL rows; left nullable`
      ); // Mantém opcional se ainda houver registros vazios
    }

    // =============================
    // Tornar endDate obrigatório
    // =============================

    if (missingEnd[0].cnt === 0) {

      await sequelize.query(`
        ALTER TABLE ${tableName}
        ALTER COLUMN "endDate"
        SET NOT NULL;
      `); // Define endDate como obrigatório

      console.log('endDate set NOT NULL');

    } else {

      console.log(
        `endDate has ${missingEnd[0].cnt} NULL rows; left nullable`
      ); // Mantém opcional se ainda houver registros vazios
    }

    console.log('Migration script finished'); // Migração concluída com sucesso

    process.exit(0); // Finaliza o processo com sucesso

  } catch (err) {

    console.error('Migration failed:', err); // Exibe erro da migração

    process.exit(1); // Finaliza o processo indicando falha
  }

})();