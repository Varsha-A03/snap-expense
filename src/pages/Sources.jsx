import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useSources } from '../hooks/useSources';
import { deleteSource, createSource } from '../lib/sources';
import LoadingScreen from '../components/LoadingScreen';
import '../styles/sources.css';

export default function Sources() {
  const { user } = useAuth();
  const { sources, loading, error, reload } = useSources();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function handleAdd(event) {
    event.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('Enter a source name.');
      return;
    }

    setSaving(true);
    try {
      await createSource({ userId: user.id, name: newName });
      setNewName('');
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not add source.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sourceId) {
    setDeletingId(sourceId);
    try {
      await deleteSource(sourceId);
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not delete source.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading sources..." />;
  }

  return (
    <>
      <header className="page-header">
        <h1>Money Sources</h1>
        <p>
          Track where money comes from and goes to within your account — e.g. salary,
          gifts, or personal funds.
        </p>
      </header>

      <div className="sources-card">
        <form className="sources-add-form" onSubmit={handleAdd}>
          <label className="sources-add-label" htmlFor="new-source">
            Add a source
          </label>
          <div className="sources-add-row">
            <input
              id="new-source"
              type="text"
              className="sources-add-input"
              placeholder="e.g. Source A, Friend, Me"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={saving}
            />
            <button type="submit" className="sources-add-btn" disabled={saving}>
              <MdAdd size={18} />
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>

        {(error || formError) && (
          <p className="sources-error" role="alert">
            {error || formError}
          </p>
        )}

        {sources.length === 0 ? (
          <p className="page-card-placeholder">
            No sources yet. Add one above, or create one when saving a transaction on
            the{' '}
            <Link to="/upload">Upload</Link> page.
          </p>
        ) : (
          <ul className="sources-list">
            {sources.map((source) => (
              <li key={source.id} className="sources-list-item">
                <span className="sources-list-name">{source.name}</span>
                <button
                  type="button"
                  className="sources-delete-btn"
                  onClick={() => handleDelete(source.id)}
                  disabled={deletingId === source.id}
                  title="Delete source"
                >
                  <MdDelete size={18} />
                  {deletingId === source.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
