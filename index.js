const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const sequelize = require('./common/database');

const eventRoutes = require('./common/routes/eventRoutes');
const authRoutes = require('./common/routes/authRoutes');

const errorMiddleware = require('./common/middleware/errorMiddleware');
const { logInfo, logError } = require('./common/helpers/logger');

process.on('unhandledRejection', (err) => {
  logError('UNHANDLED REJECTION', err);
});

process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION', err);
  process.exit(1);
});

app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
  ],
  credentials: true
}));

app.use(express.json());

// rotas
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Event Manager API running'
  });
});

app.use(errorMiddleware);

async function startServer() {
  try {
    await sequelize.authenticate();
    logInfo('Conexão com o banco estabelecida.');

    await sequelize.sync();
    logInfo('Modelos sincronizados.');

    const User = require('./common/models/User');

    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        name: 'Admin',
        password: 'adminpassword',
        role: 'admin'
      }
    });

    if (created) logInfo('Admin criado.');
    else logInfo('Admin já existe.');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      logInfo(`Servidor ON na porta ${PORT}`);
      logInfo(`API: http://localhost:${PORT}`);
    });

  } catch (error) {
    logError('ERRO CRÍTICO AO INICIAR SERVIDOR', error);
    process.exit(1); 
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;