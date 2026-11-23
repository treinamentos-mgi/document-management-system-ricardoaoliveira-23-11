const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { createDocumentController } = require('../controllers/documents');

function createDocumentRouter(service, storageDirectory) {
  const router = express.Router();
  const controller = createDocumentController(service);
  const upload = multer({
    storage: multer.diskStorage({
      destination(_req, _file, callback) {
        fs.mkdir(storageDirectory, { recursive: true }, (error) => {
          callback(error, storageDirectory);
        });
      },
      filename(_req, _file, callback) {
        callback(null, randomUUID());
      },
    }),
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
