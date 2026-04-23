require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./common/database');

const eventRoutes = require('./common/routes/eventRoutes');
const authRoutes = require('./common/routes/authRoutes');

app.use(express.json());
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err.message);
    res.status(500).json({ message: "Erro interno do servidor" });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("Conexão com o banco estabelecida.");

        await sequelize.sync();
        console.log("Modelos sincronizados.");

        const User = require('./common/models/User');

        if (!User || typeof User.findOrCreate !== 'function') {
            throw new Error("O Model User não exportou a função findOrCreate. Verifique o arquivo User.js");
        }

        const [admin, created] = await User.findOrCreate({
            where: { email: 'admin@admin.com' },
            defaults: {
                name: 'Admin',
                password: 'adminpassword',
                role: 'admin'
            }
        });

        if (created) console.log("Admin criado.");
        else console.log("Admin já existe.");

        app.listen(3000, () => console.log("Servidor ON na porta 3000"));

    } catch (error) {
        console.error("Erro Crítico:", error.message);

        console.error(error); 
    }
}

startServer();