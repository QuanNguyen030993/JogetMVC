import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const ChartPanel = ({ cpuData, ticketData }) => (
  <section className="panel chart-panel">
    <div className="chart-row">
      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Tải CPU theo ngày</h3>
          <span>Đơn vị: %</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={cpuData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="usage" stroke="#2563eb" fill="url(#colorCpu)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Ticket IT trong tuần</h3>
          <span>Mở / Đã đóng</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ticketData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="open" stackId="a" fill="#f59e0b" />
            <Bar dataKey="closed" stackId="a" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </section>
);

export default ChartPanel;
