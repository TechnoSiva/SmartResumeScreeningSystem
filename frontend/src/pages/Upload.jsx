import { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadFile } from '../api/client';
import { useToast } from '../components/ui/Toast';
import './Upload.css';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const addToast = useToast();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.pdf') || f.name.endsWith('.docx')
    );
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setResults([]);

    const newResults = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await uploadFile('upload-resume', file);
        newResults.push({ file: file.name, status: 'success', candidate: res.candidate });
      } catch (err) {
        newResults.push({ file: file.name, status: 'error', error: err.message });
      }
      setResults([...newResults]);
    }

    const successCount = newResults.filter(r => r.status === 'success').length;
    addToast(`Successfully processed ${successCount} of ${files.length} resumes`, successCount === files.length ? 'success' : 'info');
    setUploading(false);
    setFiles([]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload Resumes</h1>
        <p>Upload candidate resumes in PDF or DOCX format — NLP extraction runs automatically</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-zone__icon">
          <UploadIcon size={40} />
        </div>
        <h3>Drag & Drop resumes here</h3>
        <p>or click to browse files</p>
        <p className="upload-zone__formats">Supports PDF, DOCX</p>
        <input
          type="file"
          className="upload-zone__input"
          accept=".pdf,.docx"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {/* Queued Files */}
      {files.length > 0 && (
        <div className="card animate-fade-in" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card__header flex-between">
            <h3>{files.length} file{files.length > 1 ? 's' : ''} ready</h3>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <><Loader size={16} className="spin" /> Processing...</>
              ) : (
                <><UploadIcon size={16} /> Process All</>
              )}
            </button>
          </div>
          <div className="file-list">
            {files.map((f, i) => (
              <div key={i} className="file-item">
                <FileText size={18} className="file-item__icon" />
                <span className="file-item__name">{f.name}</span>
                <span className="file-item__size">{(f.size / 1024).toFixed(1)} KB</span>
                {!uploading && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card animate-fade-in" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card__header">
            <h3>Processing Results</h3>
          </div>
          <div className="results-list">
            {results.map((r, i) => (
              <div key={i} className={`result-item result-item--${r.status}`}>
                {r.status === 'success' ? (
                  <CheckCircle size={18} className="result-item__icon" />
                ) : (
                  <AlertCircle size={18} className="result-item__icon" />
                )}
                <div className="result-item__content">
                  <span className="result-item__file">{r.file}</span>
                  {r.status === 'success' && r.candidate && (
                    <span className="result-item__details">
                      {r.candidate.name} • {r.candidate.experience_years} yrs • {(r.candidate.skills || []).length} skills detected
                    </span>
                  )}
                  {r.status === 'error' && (
                    <span className="result-item__error">{r.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
