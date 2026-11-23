import DownloadButton from './DownloadButton.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, onRetry }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (!isLoading && documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <h3>Nenhum documento ainda</h3>
        <p>Os arquivos enviados aparecerão nesta lista.</p>
        <button className="text-button" type="button" onClick={onRetry}>Atualizar lista</button>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <div className="document-name-cell">
                  <span className="document-icon" aria-hidden="true">DOC</span>
                  <span className="document-name" title={document.originalName}>{document.originalName}</span>
                </div>
              </td>
              <td className="muted-cell">{formatFileSize(document.size)}</td>
              <td className="muted-cell date-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell"><DownloadButton document={document} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && <p className="refreshing-message" role="status">Atualizando lista...</p>}
    </div>
  );
}