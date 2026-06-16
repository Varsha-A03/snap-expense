import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCloudUpload,
  MdClose,
  MdArrowForward,
  MdErrorOutline,
} from 'react-icons/md';
import '../styles/upload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const TIPS = [
  'Use screenshots from GPay, PhonePe, Paytm, or any UPI app.',
  'Make sure the amount and merchant name are clearly visible.',
  'JPG and PNG formats are supported up to 10 MB.',
  'Landscape or portrait screenshots both work fine.',
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPG and PNG images are supported.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function applyFile(selected) {
    setError('');
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleInputChange(event) {
    const selected = event.target.files?.[0];
    if (selected) applyFile(selected);
    // Reset input so re-selecting the same file still fires onChange
    event.target.value = '';
  }

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  }, []);

  function handleRemove() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError('');
  }

  function handleContinue() {
    if (!file || !preview) return;
    navigate('/confirm', { state: { previewUrl: preview, fileName: file.name, fileSize: file.size } });
  }

  return (
    <>
      <header className="page-header">
        <h1>Upload Screenshot</h1>
        <p>
          Upload a UPI payment screenshot. We&apos;ll extract the transaction
          details for you.
        </p>
      </header>

      {error && (
        <div className="upload-error" role="alert">
          <MdErrorOutline size={18} />
          {error}
        </div>
      )}

      <div className="upload-grid">
        {/* ── Dropzone ── */}
        <div
          className={`dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Click or drag a screenshot here to upload"
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="dropzone-input"
            onChange={handleInputChange}
            aria-hidden="true"
            tabIndex={-1}
          />
          <MdCloudUpload size={48} className="dropzone-icon" />
          <p className="dropzone-title">
            {dragging ? 'Drop your screenshot here' : 'Drag & drop your screenshot'}
          </p>
          <p className="dropzone-subtitle">
            or <strong>click to browse</strong> your files
          </p>
          <p className="dropzone-formats">JPG · PNG · up to 10 MB</p>
        </div>

        {/* ── Preview or tips ── */}
        {preview ? (
          <div className="preview-panel">
            <div className="preview-image-wrapper">
              <img
                src={preview}
                alt="Uploaded screenshot preview"
                className="preview-image"
              />
              <button
                type="button"
                className="preview-remove"
                onClick={handleRemove}
                aria-label="Remove image"
              >
                <MdClose size={16} />
              </button>
            </div>
            <div className="preview-meta">
              <span className="preview-meta-name">{file?.name}</span>
              <span className="preview-meta-size">
                {file ? formatBytes(file.size) : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="upload-tips">
            <p className="upload-tips-title">Tips for best results</p>
            <ul className="upload-tips-list">
              {TIPS.map((tip) => (
                <li key={tip}>
                  <span className="tip-dot" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      {preview && (
        <div className="upload-actions" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-upload btn-upload-secondary"
            onClick={handleRemove}
          >
            Choose different image
          </button>
          <button
            type="button"
            className="btn-upload btn-upload-primary"
            onClick={handleContinue}
          >
            Continue to Confirm
            <MdArrowForward size={18} />
          </button>
        </div>
      )}
    </>
  );
}
