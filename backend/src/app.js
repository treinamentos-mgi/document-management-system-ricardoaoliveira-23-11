// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('node:path');
const { createDocumentRepository } = require('./repositories/documents');
const { createDocumentService } = require('./services/documents');
const { createDocumentRouter } = require('./routes/documents');

const PORT = process.env.PORT || 3000;

function createApp({
  storageDirectory = process.env.STORAGE_DIRECTORY || path.join(__dirname, '../storage'),
} = {}) {
  const app = express();
  const repository = createDocumentRepository();
  const service = createDocumentService(repository);

  app.use(express.json());
  app.use(createDocumentRouter(service, storageDirectory));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

app.createApp = createApp;

module.exports = app;
