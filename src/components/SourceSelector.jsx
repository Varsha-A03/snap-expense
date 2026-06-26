import { useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useSources } from '../hooks/useSources';

export default function SourceSelector({ value, onChange, disabled = false }) {
  const { user } = useAuth();
  const { sources, loading, addSource } = useSources();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleAddSource(event) {
    event.preventDefault();
    setError('');

    if (!newName.trim()) {
      setError('Enter a source name.');
      return;
    }

    setSaving(true);
    try {
      const created = await addSource(user.id, newName);
      onChange(created.id);
      setNewName('');
      setAdding(false);
    } catch (err) {
      setError(err.message || 'Could not add source.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="field">
      <span className="field-label">Money source</span>
      <p className="field-hint">
        Where did this money come from or go to? (e.g. Salary, Friend A, Me)
      </p>

      <select
        id="source"
        className="field-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading || saving}
      >
        <option value="">Select a source…</option>
        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.name}
          </option>
        ))}
      </select>

      {!adding ? (
        <button
          type="button"
          className="source-add-toggle"
          onClick={() => setAdding(true)}
          disabled={disabled || saving}
        >
          <MdAdd size={18} />
          Add new source
        </button>
      ) : (
        <form className="source-add-form" onSubmit={handleAddSource}>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. Source A, Friend, Me"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={saving}
            autoFocus
          />
          <div className="source-add-actions">
            <button
              type="button"
              className="source-add-cancel"
              onClick={() => {
                setAdding(false);
                setNewName('');
                setError('');
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="source-add-save" disabled={saving}>
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
