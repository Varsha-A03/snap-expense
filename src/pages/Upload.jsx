import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MdCloudUpload,
  MdClose,
  MdArrowForward,
  MdErrorOutline,
  MdAutoAwesome,
} from 'react-icons/md';
import { extractTransaction } from '../lib/extractTransaction';
import { validateFile } from '../lib/fileValidation';
import {
  consumeSharedImageFromCache,
  takePendingShare,
} from '../lib/sharedImage';
import PwaShareDiagnostics from '../components/PwaShareDiagnostics';
import '../styles/upload.css';

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

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const shareHandled = useRef(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [sharedNotice, setSharedNotice] = useState('');

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

  const goToConfirm = useCallback(
    (selectedFile, selectedPreview, extracted = null) => {
      if (!selectedFile || !selectedPreview) return;
      navigate('/confirm', {
        state: {
          previewUrl: selectedPreview,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          file: selectedFile,
          extracted,
        },
      });
    },
    [navigate],
  );

  const runExtraction = useCallback(
    async (selectedFile, selectedPreview) => {
      setError('');
      setExtracting(true);

      try {
        const extracted = await extractTransaction(selectedFile);
        goToConfirm(selectedFile, selectedPreview, extracted);
      } catch (err) {
        setError(
          err.message ||
            'Could not extract details. Try again or enter manually.',
        );
      } finally {
        setExtracting(false);
      }
    },
    [goToConfirm],
  );

  useEffect(() => {
    if (shareHandled.current) return;

    const sharedParam = searchParams.get('shared');
    if (!sharedParam) return;

    shareHandled.current = true;
    setSearchParams({}, { replace: true });

    async function loadSharedImage() {
      if (sharedParam === 'error') {
        setError('Could not receive the shared image. Please try again.');
        return;
      }

      if (sharedParam === 'pdf') {
        setError(
          'PDF receipts are not supported yet. Share a screenshot (JPG/PNG) instead.',
        );
        return;
      }

      let sharedFile =
        location.state?.sharedFile ?? takePendingShare() ?? null;

      if (!sharedFile) {
        sharedFile = await consumeSharedImageFromCache();
      }

      if (!sharedFile) {
        setError('No shared image found. Please upload a screenshot manually.');
        return;
      }

      const validationError = validateFile(sharedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSharedNotice('Screenshot received from share. Extracting details…');
      const previewUrl = URL.createObjectURL(sharedFile);
      setFile(sharedFile);
      setPreview(previewUrl);
      await runExtraction(sharedFile, previewUrl);
    }

    loadSharedImage();
  }, [location.state, runExtraction, searchParams, setSearchParams]);

  function handleInputChange(event) {
    const selected = event.target.files?.[0];
    if (selected) applyFile(selected);
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

  function goToConfirmManual(extracted = null) {
    goToConfirm(file, preview, extracted);
  }

  async function handleExtract() {
    if (!file || !preview) return;
    await runExtraction(file, preview);
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

      {sharedNotice && !error && (
        <div className="upload-notice" role="status">
          {sharedNotice}
        </div>
      )}

      {error && (
        <div className="upload-error" role="alert">
          <MdErrorOutline size={18} />
          {error}
        </div>
      )}

      <div className="upload-grid">
        <div
          className={`dropzone${dragging ? ' dragging' : ''}${extracting ? ' disabled' : ''}`}
          onDragOver={extracting ? undefined : handleDragOver}
          onDragLeave={extracting ? undefined : handleDragLeave}
          onDrop={extracting ? undefined : handleDrop}
          onClick={extracting ? undefined : () => inputRef.current?.click()}
          role="button"
          tabIndex={extracting ? -1 : 0}
          aria-label="Click or drag a screenshot here to upload"
          onKeyDown={(e) =>
            !extracting && e.key === 'Enter' && inputRef.current?.click()
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="dropzone-input"
            onChange={handleInputChange}
            aria-hidden="true"
            tabIndex={-1}
            disabled={extracting}
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

        {preview ? (
          <div className="preview-panel">
            <div className="preview-image-wrapper">
              <img
                src={preview}
                alt="Uploaded screenshot preview"
                className="preview-image"
              />
              {extracting && (
                <div className="preview-extracting-overlay" aria-live="polite">
                  <div className="extracting-spinner" />
                  <p>Extracting details…</p>
                </div>
              )}
              {!extracting && (
                <button
                  type="button"
                  className="preview-remove"
                  onClick={handleRemove}
                  aria-label="Remove image"
                >
                  <MdClose size={16} />
                </button>
              )}
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

      {preview && (
        <div className="upload-actions" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-upload btn-upload-secondary"
            onClick={handleRemove}
            disabled={extracting}
          >
            Choose different image
          </button>
          <button
            type="button"
            className="btn-upload btn-upload-secondary"
            onClick={() => goToConfirmManual()}
            disabled={extracting}
          >
            Enter manually
            <MdArrowForward size={18} />
          </button>
          <button
            type="button"
            className="btn-upload btn-upload-primary"
            onClick={handleExtract}
            disabled={extracting}
          >
            {extracting ? (
              'Extracting…'
            ) : (
              <>
                <MdAutoAwesome size={18} />
                Extract details
              </>
            )}
          </button>
        </div>
      )}

      <PwaShareDiagnostics />
    </>
  );
}
