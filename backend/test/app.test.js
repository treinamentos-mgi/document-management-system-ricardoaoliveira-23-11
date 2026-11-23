const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');
const { once } = require('node:events');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

let server;
let baseUrl;
let storageDirectory;

before(async () => {
  storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  server = app.createApp({ storageDirectory }).listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (storageDirectory) {
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
});

test('upload, listagem e download de documentos', async () => {
  const contents = 'conteúdo do documento';
  const form = new FormData();
  form.append('owner', 'usuario-teste');
  form.append('file', new Blob([contents], { type: 'text/plain' }), 'documento.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();
  assert.equal(uploadedDocument.originalName, 'documento.txt');
  assert.equal(uploadedDocument.size, Buffer.byteLength(contents));
  assert.equal(uploadedDocument.owner, 'usuario-teste');
  assert.ok(uploadedDocument.id);
  assert.ok(uploadedDocument.uploadedAt);
  assert.equal('storagePath' in uploadedDocument, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  const documents = await listResponse.json();
  assert.ok(documents.some(({ id }) => id === uploadedDocument.id));

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), contents);

  const missingDocumentResponse = await fetch(
    `${baseUrl}/documents/unknown/download`,
  );
  assert.equal(missingDocumentResponse.status, 404);

  for (let request = 0; request < 58; request += 1) {
    const response = await fetch(`${baseUrl}/documents/unknown/download`);
    assert.equal(response.status, 404);
  }
  const rateLimitedResponse = await fetch(
    `${baseUrl}/documents/unknown/download`,
  );
  assert.equal(rateLimitedResponse.status, 429);
});
