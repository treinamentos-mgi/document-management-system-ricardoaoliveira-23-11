const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { createDocumentController } = require('../controllers/documents');

function createDocumentRouter(service, storageDirectory) {
  const router = express.Router();
  const controller = createDocumentController(service);
  const createFileRateLimiter = () => rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Limite de requisições excedido.' },
  });
  const uploadRateLimiter = createFileRateLimiter();
  const downloadRateLimiter = createFileRateLimiter();
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

  router.post('/upload', uploadRateLimiter, upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', downloadRateLimiter, controller.download);

  return router;
}

module.exports = { createDocumentRouter };
