const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { createDocumentController } = require('../controllers/documents');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function createRateLimiter() {
  const requestsByIp = new Map();

  return (req, res, next) => {
    const now = Date.now();
    for (const [ip, request] of requestsByIp) {
      if (request.resetAt <= now) {
        requestsByIp.delete(ip);
      }
    }

    const request = requestsByIp.get(req.ip);
    if (request && request.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: 'Limite de requisições excedido.' });
    }

    if (request) {
      request.count += 1;
    } else {
      requestsByIp.set(req.ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
    }

    return next();
  };
}

function createDocumentRouter(service, storageDirectory) {
  const router = express.Router();
  const controller = createDocumentController(service);
  const uploadRateLimiter = createRateLimiter();
  const downloadRateLimiter = createRateLimiter();
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
