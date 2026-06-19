import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, getChartColor } from '../lib/transactionUtils';

export default function CategoryPieChart({ data }) {
  if (!data.length) {
    return <p className="chart-empty">No spending data yet.</p>;
  }

  return (
    <div
      className="chart-visual"
      role="img"
      aria-label={`Spending by category: ${data
        .map((item) => `${item.name} ${formatCurrency(item.value)}`)
        .join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius="38%"
            outerRadius="65%"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={getChartColor(index)} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
