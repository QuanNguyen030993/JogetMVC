import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

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
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';



const RealtimeApiMonitor = () => {
  const [chartData, setChartData] = useState(() => {
    // Initialize last 20 points (each represents 10s) with 0 requests
    const data = [];
    const now = new Date();
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 10000);
      data.push({
        time: time.toLocaleTimeString('vi-VN', { hour12: false }),
        requests: 0,
        errors: 0,
        latency: 0
      });
    }
    return data;
  });

  const [urlLogs, setUrlLogs] = useState([]);
  const [simulateTraffic, setSimulateTraffic] = useState(true);

  const callsInCurrentInterval = useRef([]);
  const totalCountRef = useRef(0);

  useEffect(() => {
    const handleNewApiCall = (call) => {
      callsInCurrentInterval.current.push(call);
      totalCountRef.current += 1;
      setUrlLogs(prev => {
        const updated = [call, ...prev];
        if (updated.length > 8) updated.pop();
        return updated;
      });
    };

    if (window.__apiListeners) {
      window.__apiListeners.add(handleNewApiCall);
    }

    return () => {
      if (window.__apiListeners) {
        window.__apiListeners.delete(handleNewApiCall);
      }
    };
  }, []);

  // Interval to tick the chart every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });

      let calls = [...callsInCurrentInterval.current];
      callsInCurrentInterval.current = [];

      // If simulateTraffic is on, inject some fake traffic representing a 10s aggregate
      if (simulateTraffic && Math.random() < 0.8) {
        const fakeUrls = [
          '/api/UsersSession/ExecuteCustomQuery',
          '/api/ErrorBrowserDetails/CountTrend',
          '/api/ClientBrowserError/CountTrend',
          '/api/HttpRequestAuditLog/Query',
          '/api/CommentLog/GetSerilogHourlyToday',
          '/api/UsersSession/OnlineUsers'
        ];
        const mockCount = Math.floor(Math.random() * 12) + 5; // 5 to 16 mock calls in a 10s window
        for (let i = 0; i < mockCount; i++) {
          const mockCall = {
            url: fakeUrls[Math.floor(Math.random() * fakeUrls.length)],
            timestamp: new Date(),
            duration: Math.floor(Math.random() * 200) + 25, // Latency in ms matching example logs
            status: Math.random() < 0.98 ? 200 : (Math.random() < 0.5 ? 404 : 500),
            ok: Math.random() < 0.98,
            method: Math.random() < 0.6 ? 'POST' : 'GET'
          };
          calls.push(mockCall);
          totalCountRef.current += 1;
          setUrlLogs(prev => {
            const updated = [mockCall, ...prev];
            if (updated.length > 8) updated.pop();
            return updated;
          });
        }
      }

      const requests = calls.length;
      const errors = calls.filter(c => !c.ok).length;
      const totalDuration = calls.reduce((acc, c) => acc + c.duration, 0);
      const latency = requests > 0 ? Math.round(totalDuration / requests) : 0;

      setChartData(prev => {
        const next = [...prev];
        next.shift();
        next.push({
          time: timeStr,
          requests,
          errors,
          latency
        });
        return next;
      });
    }, 10000); // 10 seconds interval

    return () => clearInterval(interval);
  }, [simulateTraffic]);

  // Calculate current KPI stats
  const currentRate = chartData[chartData.length - 1]?.requests || 0;
  const avgLatency = useMemo(() => {
    const activePoints = chartData.filter(d => d.requests > 0);
    if (activePoints.length === 0) return 0;
    const sum = activePoints.reduce((acc, d) => acc + d.latency, 0);
    return Math.round(sum / activePoints.length);
  }, [chartData]);

  return (
    <div className="chart-card wide realtime-api-monitor">
      <div className="chart-card-header">
        <div className="header-title-area">
          <h3>⚡ Real-time API Traffic & Latency Monitor</h3>
          <span className="live-status"><span className="pulse-dot"></span> LIVE</span>
        </div>
        <div className="chart-controls">
          <label className="sim-control">
            <input 
              type="checkbox" 
              checked={simulateTraffic} 
              onChange={(e) => setSimulateTraffic(e.target.checked)} 
            />
            Mô phỏng Request (Background Traffic Simulation)
          </label>
          <button className="clear-log-btn" onClick={() => setUrlLogs([])}>
            Xóa Log
          </button>
        </div>
      </div>

      <div className="realtime-content-layout">
        <div className="realtime-chart-area">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequestsRealtime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorErrorsRealtime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="left" stroke="#d97706" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              
              {/* Gold Area Chart for request rate */}
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="requests" 
                stroke="#d97706" 
                fill="url(#colorRequestsRealtime)" 
                name="Requests/10s" 
                strokeWidth={2}
                dot={{ r: 3.5, stroke: '#d97706', strokeWidth: 1.5, fill: '#fff' }}
                activeDot={{ r: 6, stroke: '#d97706', strokeWidth: 2, fill: '#fff' }}
              />

              {/* Red Area for error rate */}
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="errors" 
                stroke="#dc2626" 
                fill="url(#colorErrorsRealtime)" 
                name="Errors/10s" 
                strokeWidth={1.5}
                dot={{ r: 2.5, stroke: '#dc2626', strokeWidth: 1, fill: '#fff' }}
              />

              {/* Purple Line for latency */}
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="latency" 
                stroke="#8b5cf6" 
                name="Avg Latency (ms)" 
                strokeWidth={2}
                dot={{ r: 3, stroke: '#8b5cf6', strokeWidth: 1.5, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="realtime-details-area">
          <div className="realtime-kpi-row">
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Rate hiện tại</span>
              <span className="kpi-mini-val">{currentRate} req/10s</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Latency TB</span>
              <span className="kpi-mini-val">{avgLatency} ms</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Tổng số Logs</span>
              <span className="kpi-mini-val">{totalCountRef.current}</span>
            </div>
          </div>

          <div className="api-url-log-panel">
            <h4>Recent API Requests Log:</h4>
            <div className="url-log-list">
              {urlLogs.length === 0 ? (
                <div className="empty-logs">Đang chờ cuộc gọi API tiếp theo...</div>
              ) : (
                urlLogs.map((log, idx) => {
                  const cleanUrl = log.url.split('/').pop() || log.url;
                  return (
                    <div key={idx} className={`url-log-item ${log.ok ? 'success' : 'failed'}`}>
                      <span className="log-method">{log.method}</span>
                      <span className="log-url" title={log.url}>
                        {cleanUrl.length > 25 ? cleanUrl.slice(0, 25) + '...' : cleanUrl}
                      </span>
                      <span className="log-meta">
                        <span className="log-duration">{log.duration}ms</span>
                        <span className={`log-status ${log.status >= 400 ? 'status-err' : 'status-ok'}`}>
                          {log.status}
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartPanel = ({
  serilogData,
  ticketData,
  loginStats = [],
  disk = 0
}) => {


const months=[
 ...new Set(
  loginStats.map(x=>x.month)
 )
];


const hours=[
 ...new Set(
  loginStats.map(x=>x.hour)
 )
];
const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
  "#be123c"
];

const monthColors=[
 "#2563eb",
 "#16a34a",
 "#f59e0b",
 "#dc2626"
];

const pivotData = hours.map(h=>{
 
  
 let row={
   hour:`${h}:00`
 };


 months.forEach(m=>{

   const item =
   loginStats.find(
     x =>
       x.month === m &&
       x.hour === h
   );


   row[m] =
      item?.loginCount || 0;


 });


 return row;

});




const diskData=[

{
 name:"Used",
 value:292-disk
},

{
 name:"Available",
 value:disk
}

];





return (

<section className="panel chart-panel">


<div className="chart-row">



{/* Serilog hourly count */}

<div className="chart-card">

<div className="chart-card-header">

<h3>
Serilog count by hour
</h3>

<span>
Today
</span>

</div>



<ResponsiveContainer
 width="100%"
 height={240}
>

<AreaChart
data={serilogData}
>

<defs>

<linearGradient
id="colorSerilog"
x1="0"
y1="0"
x2="0"
y2="1"
>

<stop
offset="5%"
stopColor="#2563eb"
stopOpacity={0.8}
/>

<stop
offset="95%"
stopColor="#2563eb"
stopOpacity={0.1}
/>

</linearGradient>

</defs>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="label"/>

<YAxis/>


<Tooltip/>


<Area

type="monotone"

dataKey="count"

stroke="#2563eb"

fill="url(#colorSerilog)"

/>


</AreaChart>


</ResponsiveContainer>


</div>








{/* Ticket */}


<div className="chart-card">


<div className="chart-card-header">

<h3>
Ticket IT — Browser errors
</h3>

<span>
Error count by time
</span>

</div>



<ResponsiveContainer
width="100%"
height={240}
>


<BarChart
data={ticketData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="day"/>

<YAxis/>


<Tooltip/>

<Legend/>


<Bar dataKey="clientBrowserError" fill="#475569" name="Client Browser Error" radius={[4, 4, 0, 0]} />


<Bar dataKey="errorBrowserDetails" fill="#0f766e" name="Error Browser Details" radius={[4, 4, 0, 0]} />


</BarChart>


</ResponsiveContainer>



</div>









{/* LOGIN PIVOT */}



<div className="chart-card wide">


<div className="chart-card-header">

<h3>
User Login Monitoring
</h3>

<span>
Hour
</span>

</div>




<ResponsiveContainer
width="100%"
height={260}
>


<BarChart
data={pivotData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis
dataKey="month"
/>


<YAxis/>


<Tooltip/>


<Legend/>


{
months.map((m,index)=>

<Bar

key={m}

dataKey={m}

name={m}

fill={
 monthColors[index % monthColors.length]
}

/>

)
}


</BarChart>


</ResponsiveContainer>



</div>








{/* DISK GAUGE */}

<div className="chart-card">


<div className="chart-card-header">

<h3>
Disk Capacity
</h3>

<span>
GB
</span>

</div>




<ResponsiveContainer
width="100%"
height={240}
>


<PieChart>


<Pie

data={diskData}

dataKey="value"

cx="50%"

cy="50%"

innerRadius={60}

outerRadius={90}

>


{
diskData.map(
(_,index)=>

<Cell
key={index}
/>

)
}


</Pie>


<Tooltip/>

</PieChart>



</ResponsiveContainer>



<div className="disk-value">

{disk} GB Available

</div>



</div>

<RealtimeApiMonitor />

</div>


</section>

);


};


export default ChartPanel;
