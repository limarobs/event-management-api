const express = require('express');
const sequelize = require('./common/database'); 
const eventRoutes = require('./common/routes/eventRoutes'); 

require('./common/models/participant');

const app = express();
app.use(express.json());

app.get('/status', (req, res) => res.json({ status: 'Online' }));

app.use('/events', eventRoutes);

const PORT = 4000;

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}).catch(err => {   
    console.error('Erro ao conectar ao banco:', err);
});