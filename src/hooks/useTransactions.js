import { useEffect, useState } from 'react';
import { fetchTransactions } from '../lib/transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchTransactions();
        if (!cancelled) setTransactions(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load transactions.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { transactions, loading, error };
}
