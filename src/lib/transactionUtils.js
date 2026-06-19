export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

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
      bucket.total += Number(t.amount);
    }
  }

  return months.map(({ label, total }) => ({ month: label, total }));
}

export function filterTransactions(transactions, { search = '', category = 'All', month = '' }) {
  return transactions.filter((t) => {
    if (category !== 'All' && t.category !== category) return false;

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
