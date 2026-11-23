const { randomUUID } = require('node:crypto');

function toPublicDocument(document) {
  const { storagePath, ...metadata } = document;
  return metadata;
}

function createDocumentService(repository) {
  return {
    createDocument(file, owner) {
      const document = repository.save({
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: owner || 'anonymous',
        storagePath: file.path,
      });

      return toPublicDocument(document);
    },
    listDocuments() {
      return repository.findAll().map(toPublicDocument);
    },
    findDocumentById(id) {
      return repository.findById(id);
    },
  };
}

module.exports = { createDocumentService };
