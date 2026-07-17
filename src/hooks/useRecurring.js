import { useCallback, useEffect, useState } from 'react';
import { fetchRecurring } from '../lib/recurring';

export function useRecurring() {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchRecurring();
      setRecurring(data);
    } catch (err) {
      setError(err.message || 'Failed to load recurring transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { recurring, loading, error, reload };
}
