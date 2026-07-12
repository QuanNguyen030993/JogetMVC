import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { API_BASE_URL } from '../config';
import '../styles/evaluation.css';

const COLORS = ['#334155', '#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1', '#4d7c0f'];

const getValue = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return null;
};

const formatTimeLabel = (value, interval) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (interval === 'hour') return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit' });
  if (interval === 'month') return date.toLocaleString([], { month: 'short', year: 'numeric' });
  if (interval === 'year') return String(date.getFullYear());
  return date.toLocaleDateString([], { month: 'short', day: '2-digit' });
};

export default function EvaluationPanel() {
  const [dimension, setDimension] = useState('action');
  const [interval, setInterval] = useState('day');
  const [topN, setTopN] = useState(1000);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEvaluation = useCallback(async () => {
    const options = {
      mode: dimension === 'total' ? 'trend_total' : `trend_${dimension}`,
      dimension,
      from: null,
      to: null,
      interval,
      topN: Number(topN) || 1000,
      method: null,
      controller: null,
      action: null
    };

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/HttpRequestAuditLog/Query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // API receives [FromBody] string, matching the existing Evaluation screen.
        body: JSON.stringify(JSON.stringify(options))
      });
      if (!response.ok) throw new Error(`Evaluation API failed (${response.status})`);
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      setError(err?.message || 'Unable to load API evaluation data');
    } finally {
      setLoading(false);
    }
  }, [dimension, interval, topN]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  const { chartData, series, totalRequests } = useMemo(() => {
    const bucketMap = new Map();
    const seriesSet = new Set();
    let total = 0;

    rows.forEach((row) => {
      const time = getValue(row, 't', 'T');
      const count = Number(getValue(row, 'count', 'Count')) || 0;
      const name = dimension === 'total'
        ? 'Total requests'
        : String(getValue(row, 'dim', 'Dim') || 'Unknown');
      const bucketKey = String(time || 'Unknown');
      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, { time: bucketKey, label: formatTimeLabel(time, interval) });
      }
      bucketMap.get(bucketKey)[name] = count;
      seriesSet.add(name);
      total += count;
    });

    return {
      chartData: Array.from(bucketMap.values()).sort((a, b) => new Date(a.time) - new Date(b.time)),
      series: Array.from(seriesSet),
      totalRequests: total
    };
  }, [rows, dimension, interval]);

  return (
    <section className="evaluation-panel">
      <div className="evaluation-header">
        <div>
          <span className="evaluation-eyebrow">API evaluation</span>
          <h2>Request activity</h2>
          <p>Request volume returned by the existing Evaluation API.</p>
        </div>
        <div className="evaluation-summary">
          <strong>{totalRequests.toLocaleString()}</strong>
          <span>requests in result</span>
        </div>
      </div>

      <div className="evaluation-filters">
        <label>
          <span>Group by</span>
          <select value={dimension} onChange={(event) => setDimension(event.target.value)}>
            <option value="total">Total</option>
            <option value="action">Action</option>
            <option value="controller">Controller</option>
            <option value="endpoint">Endpoint</option>
            <option value="method">Method</option>
          </select>
        </label>
        <label>
          <span>Interval</span>
          <select value={interval} onChange={(event) => setInterval(event.target.value)}>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label>
          <span>Top results</span>
          <input type="number" min="1" max="1000" value={topN} onChange={(event) => setTopN(event.target.value)} />
        </label>
        <button type="button" onClick={loadEvaluation} disabled={loading}>
          <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
          {loading ? 'Loading' : 'Refresh'}
        </button>
      </div>

      <div className="evaluation-chart">
        {error ? (
          <div className="evaluation-state error"><i className="fa-solid fa-triangle-exclamation"></i><span>{error}</span></div>
        ) : loading && rows.length === 0 ? (
          <div className="evaluation-state"><i className="fa-solid fa-spinner fa-spin"></i><span>Loading evaluation data…</span></div>
        ) : chartData.length === 0 ? (
          <div className="evaluation-state"><i className="fa-regular fa-chart-bar"></i><span>No request data for this selection.</span></div>
        ) : (
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e8edf3" strokeDasharray="3 4" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 9, border: '1px solid #dbe3ec', boxShadow: '0 8px 24px rgba(15,23,42,.1)' }} />
              {series.length > 1 && <Legend />}
              {series.map((name, index) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS[index % COLORS.length]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

