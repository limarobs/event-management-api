const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const sequelize = require('./common/database');

const eventRoutes = require('./common/routes/eventRoutes');
const authRoutes = require('./common/routes/authRoutes');

app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
  ],
  credentials: true
}));

app.use(express.json());

app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Event Manager API running'
  });
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco estabelecida.');

    await sequelize.sync();
    console.log('Modelos sincronizados.');

    const User = require('./common/models/User');

    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        name: 'Admin',
        password: 'adminpassword',
        role: 'admin'
      }
    });

    if (created) console.log('Admin criado.');
    else console.log('Admin já existe.');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Servidor ON na porta ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro Crítico:', error.message);
    console.error(error);
  }
}

startServer();