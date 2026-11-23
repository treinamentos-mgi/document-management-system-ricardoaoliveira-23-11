const documentService = require('../services/documentService');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
    mimeType: document.mimeType,
  };
}

function getOwner(req) {
  return req.user?.id || process.env.DMS_DEFAULT_OWNER_ID || 'default';
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Selecione um arquivo para enviar.',
      },
    });
  }

  try {
    const file = req.file;
    const document = await documentService.createDocument({
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storageName: file.filename,
      filePath: file.path,
    }, getOwner(req));
    return res.status(201).json(toPublicDocument(document));
  } catch (error) {
    return next(error);
  }
}

function list(req, res) {
  const documents = documentService.listDocuments(getOwner(req));
  return res.json(documents.map(toPublicDocument));
}

async function download(req, res, next) {
  try {
    const document = await documentService.getDocumentForDownload(req.params.id, getOwner(req));

    if (!document) {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado.',
        },
      });
    }

    return res.download(document.filePath, document.originalName, (error) => {
      if (!error || res.headersSent) {
        return;
      }

      if (error.code === 'ENOENT') {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Documento não encontrado.',
          },
        });
      }

      return next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  upload,
  list,
  download,
};