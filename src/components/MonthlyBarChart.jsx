import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../lib/transactionUtils';

export default function MonthlyBarChart({ data }) {
  if (!data.some((d) => d.total !== 0)) {
    return <p className="chart-empty">No monthly activity data yet.</p>;
  }

  return (
    <div
      className="chart-visual"
      role="img"
      aria-label={`Monthly net change: ${data
        .map((item) => `${item.month} ${formatCurrency(item.total)}`)
        .join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              `₹${Math.abs(v) >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : v}`
            }
          />
          <Tooltip
            cursor={{ fill: '#eef2ff' }}
            formatter={(value) => [formatCurrency(value), 'Net change']}
          />
          <Bar
            dataKey="total"
            name="Net change"
            fill="#4f46e5"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
