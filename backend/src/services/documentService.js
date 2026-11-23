const documentRepository = require('../repositories/documentRepository');

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

async function createDocument(file, owner) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype,
    storageName: file.filename,
    filePath: file.path,
  };

  try {
    documentRepository.save(document);
  } catch (error) {
    try {
      await documentRepository.removeFile(file.path);
    } catch {
      // Preserva o erro original do registro dos metadados.
    }
    throw error;
  }

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

async function getDocumentForDownload(id, owner) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner || !(await documentRepository.fileExists(document))) {
    return null;
  }

  return {
    document: toPublicDocument(document),
    filePath: document.filePath,
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};