import { useCallback, useEffect, useState } from 'react';
import { fetchBudgets } from '../lib/budgets';

export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchBudgets();
      setBudgets(data);
    } catch (err) {
      setError(err.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { budgets, loading, error, reload };
}
