import { useRef, useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    const form = event.currentTarget;
    setError('');
    setIsUploading(true);

    try {
      await onUpload(file);
      setFile(null);
      form.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setError('');
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker" htmlFor="document-file">
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="file-picker-title">Escolher arquivo</span>
        <span className="file-picker-hint">Selecione um arquivo do seu dispositivo</span>
        <input
          ref={fileInputRef}
          id="document-file"
          name="file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {file && (
        <div className="selected-file" aria-live="polite">
          <span className="file-type" aria-hidden="true">FILE</span>
          <span className="selected-file-details">
            <strong title={file.name}>{file.name}</strong>
            <small>{formatFileSize(file.size)}</small>
          </span>
          <button
            className="remove-file"
            type="button"
            onClick={clearFile}
            disabled={isUploading}
            aria-label="Remover arquivo selecionado"
            title="Remover arquivo"
          >
            ×
          </button>
        </div>
      )}

      {error && <p className="inline-error" role="alert">{error}</p>}

      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
        {!isUploading && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}