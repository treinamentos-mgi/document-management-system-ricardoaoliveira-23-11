const documentService = require('../services/documentService');

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
    const document = await documentService.createDocument(req.file, getOwner(req));
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res) {
  return res.json(documentService.listDocuments(getOwner(req)));
}

async function download(req, res, next) {
  try {
    const result = await documentService.getDocumentForDownload(req.params.id, getOwner(req));

    if (!result) {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado.',
        },
      });
    }

    return res.download(result.filePath, result.document.originalName, (error) => {
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