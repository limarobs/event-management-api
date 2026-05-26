const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();

const sequelize = require("./common/database");

// ======================
// ROTAS
// ======================

const eventRoutes = require("./common/routes/eventRoutes");

const authRoutes = require("./common/routes/authRoutes");

const dashboardRoutes = require("./common/routes/dashboardRoutes");

const speakerRoutes = require("./common/routes/speakerRoutes");

const newsRoutes = require("./common/routes/newsRoutes.js");

const searchRoutes = require("./common/routes/searchRoutes");

// ======================
// MIDDLEWARES
// ======================

const errorMiddleware = require("./common/middleware/errorMiddleware");

const {
  logInfo,
  logError
} = require("./common/helpers/logger");

// ======================
// CAPTURA DE ERROS
// ======================

process.on("unhandledRejection", (err) => {

  logError("UNHANDLED REJECTION", err);

});

process.on("uncaughtException", (err) => {

  logError("UNCAUGHT EXCEPTION", err);

  process.exit(1);

});

// ======================
// CORS
// ======================

app.use(cors({
  origin: [
    "http://localhost:4200",
    "http://127.0.0.1:4200"
  ],
  credentials: true
}));

// ======================
// JSON
// ======================

app.use(express.json());

// ======================
// ROTAS API
// ======================

app.use("/api/events", eventRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/speakers", speakerRoutes);

app.use("/api/news", newsRoutes);

app.use("/api/search", searchRoutes);

// ======================
// TESTES
// ======================

app.get("/", (req, res) => {

  res.json({
    message: "Event Manager API running"
  });

});

app.get("/teste-news", (req, res) => {

  res.json({
    message: "Rota de news funcionando"
  });

});

app.get("/teste-search", (req, res) => {

  res.json({
    message: "Rota de busca funcionando"
  });

});

// ======================
// MIDDLEWARE DE ERRO
// ======================

app.use(errorMiddleware);

// ======================
// START SERVIDOR
// ======================

async function startServer() {

  try {

    await sequelize.authenticate();

    logInfo("Conexão com o banco estabelecida.");

    if (process.env.FORCE_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      logInfo("Modelos sincronizados (sync alter).");
    } else {
      logInfo("Skipping sequelize.sync; use migrations to manage DB schema.");
    }

    const User = require("./common/models/User");

    const [admin, created] = await User.findOrCreate({

      where: {
        email: "admin@admin.com"
      },

      defaults: {
        name: "Admin",
        password: "adminpassword",
        role: "admin"
      }

    });

    if (created) {

      logInfo("Admin criado.");

    } else {

      logInfo("Admin já existe.");

    }

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {

      logInfo(`Servidor ON na porta ${PORT}`);

      logInfo(`API: http://localhost:${PORT}`);

      logInfo(`Speakers API: http://localhost:${PORT}/api/speakers`);

      logInfo(`News API: http://localhost:${PORT}/api/news`);

      logInfo(`Search API: http://localhost:${PORT}/api/search`);

    });

  } catch (error) {

    logError("ERRO CRÍTICO AO INICIAR SERVIDOR", error);

    process.exit(1);

  }

}

if (require.main === module) {

  startServer();

}

module.exports = app;