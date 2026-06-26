export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

export const DIRECTIONS = {
  credit: {
    value: 'credit',
    label: 'Money in',
    shortLabel: 'In',
    hint: 'Added to your account (received)',
  },
  debit: {
    value: 'debit',
    label: 'Money out',
    shortLabel: 'Out',
    hint: 'Removed from your account (spent)',
  },
};

const CHART_COLORS = [
  '#4f46e5',
  '#2563eb',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
];

function parseDateOnly(dateString) {
  if (!dateString) return null;

  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function getChartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatDate(dateString) {
  const date = parseDateOnly(dateString);
  if (!date) return 'Unknown date';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getTotalAmount(transactions) {
  return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getSignedAmount(transaction) {
  const amount = Number(transaction.amount) || 0;
  const direction = transaction.direction ?? 'debit';
  return direction === 'credit' ? amount : -amount;
}

export function getBalance(transactions) {
  return transactions.reduce((sum, t) => sum + getSignedAmount(t), 0);
}

export function getTotalByDirection(transactions, direction) {
  return transactions
    .filter((t) => t.direction === direction)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getSourceName(transaction) {
  return transaction.sources?.name ?? 'Unassigned';
}

export function groupBySource(transactions) {
  const map = new Map();

  for (const t of transactions) {
    const key = t.source_id ?? '__unassigned__';
    const name = getSourceName(t);

    if (!map.has(key)) {
      map.set(key, {
        id: t.source_id,
        name,
        moneyIn: 0,
        moneyOut: 0,
        balance: 0,
        count: 0,
      });
    }

    const bucket = map.get(key);
    const amount = Number(t.amount) || 0;
    bucket.count += 1;

    if (t.direction === 'credit') {
      bucket.moneyIn += amount;
    } else {
      bucket.moneyOut += amount;
    }

    bucket.balance = bucket.moneyIn - bucket.moneyOut;
  }

  return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
}

export function getCurrentMonthTransactions(transactions) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return transactions.filter((t) => {
    const d = parseDateOnly(t.transaction_date);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function groupByCategory(transactions) {
  const map = {};

  for (const t of transactions) {
    if (t.direction !== 'debit') continue;
    const cat = t.category || 'Other';
    map[cat] = (map[cat] || 0) + Number(t.amount);
  }

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupByMonth(transactions, monthCount = 6) {
  const now = new Date();
  const months = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      }),
      year: d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    });
  }

  for (const t of transactions) {
    const d = parseDateOnly(t.transaction_date);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.total += getSignedAmount(t);
    }
  }

  return months.map(({ label, total }) => ({ month: label, total }));
}

export function filterTransactions(
  transactions,
  { search = '', category = 'All', month = '', source = 'All', direction = 'All' },
) {
  return transactions.filter((t) => {
    if (category !== 'All' && t.category !== category) return false;

    if (direction !== 'All' && t.direction !== direction) return false;

    if (source !== 'All') {
      if (source === '__unassigned__') {
        if (t.source_id) return false;
      } else if (t.source_id !== source) {
        return false;
      }
    }

    if (month) {
      const d = parseDateOnly(t.transaction_date);
      if (!d) return false;
      const txMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (txMonth !== month) return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!String(t.merchant ?? '').toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

export function getSourceFilterOptions(transactions, sources) {
  const usedIds = new Set(
    transactions.map((t) => t.source_id).filter(Boolean),
  );

  const options = sources
    .filter((s) => usedIds.has(s.id))
    .map((s) => ({ value: s.id, label: s.name }));

  if (transactions.some((t) => !t.source_id)) {
    options.push({ value: '__unassigned__', label: 'Unassigned' });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function getMonthOptions(transactions) {
  const set = new Set();

  for (const t of transactions) {
    const d = parseDateOnly(t.transaction_date);
    if (!d) continue;
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return Array.from(set)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => {
      const [year, month] = value.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
        'en-IN',
        { month: 'long', year: 'numeric' },
      );
      return { value, label };
    });
}
