const documentRepository = require('../repositories/documentRepository');

async function createDocument(upload, owner) {
  const document = {
    id: upload.id,
    originalName: upload.originalName,
    size: upload.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: upload.mimeType,
    storageName: upload.storageName,
    filePath: upload.filePath,
  };

  try {
    documentRepository.save(document);
  } catch (error) {
    try {
      await documentRepository.removeFile(upload.filePath);
    } catch {
      // Preserva o erro original do registro dos metadados.
    }
    throw error;
  }

  return document;
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

async function getDocumentForDownload(id, owner) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner || !(await documentRepository.fileExists(document))) {
    return null;
  }

  return document;
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};