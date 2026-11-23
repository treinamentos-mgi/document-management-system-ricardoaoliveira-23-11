const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));
const previousStorageDirectory = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = storageDirectory;

const app = require('../src/app');
const server = app.listen(0);
let baseUrl;

before(() => new Promise((resolve) => {
  server.once('listening', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => {
    fs.rmSync(storageDirectory, { recursive: true, force: true });
    if (previousStorageDirectory === undefined) {
      delete process.env.STORAGE_DIR;
    } else {
      process.env.STORAGE_DIR = previousStorageDirectory;
    }

    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
}));

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo do documento'], { type: 'text/plain' }), 'notas.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);

  const uploadedDocument = await uploadResponse.json();
  assert.equal(uploadedDocument.originalName, 'notas.txt');
  assert.equal(uploadedDocument.size, 21);
  assert.equal(uploadedDocument.owner, 'default');
  assert.equal('filePath' in uploadedDocument, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [uploadedDocument]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /notas\.txt/);
  assert.equal(await downloadResponse.text(), 'conteudo do documento');
});

test('retorna erro quando o upload não inclui um arquivo', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'FILE_REQUIRED',
      message: 'Selecione um arquivo para enviar.',
    },
  });
});

test('retorna 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/unknown/download`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
