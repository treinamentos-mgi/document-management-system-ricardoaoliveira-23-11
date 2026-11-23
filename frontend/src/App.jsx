import { useEffect, useState } from 'react';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(file) {
    setError('');
    setNotice('');
    await uploadDocument(file);
    setNotice('Documento enviado com sucesso.');
    await refreshDocuments();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span> / DOCUMENTOS</span></span>
        </a>
        <span className="topbar-status"><span aria-hidden="true" /> Armazenamento local</span>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO</p>
            <h1 id="page-title">Seus documentos</h1>
            <p className="page-description">Envie, organize e acesse seus arquivos em um só lugar.</p>
          </div>
          <div className="document-total" aria-live="polite">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button className="text-button" type="button" onClick={refreshDocuments}>Tentar novamente</button>
          </div>
        )}
        {notice && <p className="alert alert-success" role="status">{notice}</p>}

        <div className="content-grid">
          <aside className="upload-panel" aria-labelledby="upload-heading">
            <div className="panel-heading">
              <span className="section-index">01</span>
              <div>
                <p className="eyebrow">ADICIONAR</p>
                <h2 id="upload-heading">Novo arquivo</h2>
              </div>
            </div>
            <UploadComponent onUpload={handleUpload} />
            <div className="storage-note">
              <span className="storage-indicator" aria-hidden="true" />
              <p>Seus arquivos ficam armazenados localmente nesta aplicação.</p>
            </div>
          </aside>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <div className="panel-heading documents-heading">
              <span className="section-index">02</span>
              <div>
                <p className="eyebrow">BIBLIOTECA</p>
                <h2 id="documents-heading">Arquivos enviados</h2>
              </div>
              <button
                className="refresh-button"
                type="button"
                onClick={refreshDocuments}
                disabled={isLoading}
                aria-label="Atualizar lista de documentos"
                title="Atualizar lista"
              >
                <span aria-hidden="true" className={isLoading ? 'refresh-icon is-spinning' : 'refresh-icon'}>↻</span>
              </button>
            </div>
            <DocumentList documents={documents} isLoading={isLoading} onRetry={refreshDocuments} />
          </section>
        </div>
      </main>
      <footer className="page-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>Gestão simples, acesso direto.</span>
      </footer>
    </div>
  );
}
