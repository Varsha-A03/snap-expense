import { useCallback, useEffect, useState } from 'react';
import { createSource, fetchSources } from '../lib/sources';

export function useSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      setError(err.message || 'Failed to load sources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSource = useCallback(
    async (userId, name) => {
      const created = await createSource({ userId, name });
      setSources((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return created;
    },
    [],
  );

  return { sources, loading, error, reload, addSource };
}
