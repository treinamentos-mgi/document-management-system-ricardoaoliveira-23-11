const fs = require('node:fs');

function createDocumentController(service) {
  return {
    upload(req, res) {
      if (!req.file) {
        return res.status(400).json({ error: 'É necessário enviar um arquivo.' });
      }

      const document = service.createDocument(req.file, req.body.owner);
      return res.status(201).json(document);
    },
    list(_req, res) {
      return res.json(service.listDocuments());
    },
    download(req, res) {
      const document = service.findDocumentById(req.params.id);
      if (!document || !fs.existsSync(document.storagePath)) {
        return res.status(404).json({ error: 'Documento não encontrado.' });
      }

      return res.download(document.storagePath, document.originalName);
    },
  };
}

module.exports = { createDocumentController };
