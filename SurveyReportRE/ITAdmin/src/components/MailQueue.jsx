import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";


const statusClassName = (status) => {
  switch (status) {
    case 'Sent':
      return 'mailqueue-status sent';
    case 'Pending':
      return 'mailqueue-status pending';
    case 'Failed':
      return 'mailqueue-status failed';
    default:
      return 'mailqueue-status queued';
  }
};

function MailQueue() {
    
const [queueItems, setQueueItems] = useState([]);
const [loading, setLoading] = useState(true);

const loadData = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/api/MailQueue/GetAll`
    );

    if (!response.ok)
      throw new Error("Load mail queue failed");

    const data = await response.json();

    const mapped = data.map((item, index) => ({

      id: item.id ?? index,

      subject: item.subject ?? "(No Subject)",

      recipient:
        item.toName
          ? `${item.toName} <${item.toEmail}>`
          : item.toEmail ?? "",

      recipientEmail: item.toEmail ?? "",

      toName: item.toName ?? "",

      from: item.fromAccount ?? "",

      cc: item.cc ?? "",

      body: item.htmlBody ?? "",

      attempts: item.isSent,

      createdAt: item.createdDate
        ? new Date(item.createdDate).toLocaleString()
        : "",

      status: item.isSend
        ? "Sent"
        : item.isSent
        ? "Failed"
        : "Pending",

      priority: item.priority ?? "Normal",

      isSend: item.isSend
    }));

    setQueueItems(mapped);

  } catch (e) {

    console.error(e);

  } finally {

    setLoading(false);

  }
};

useEffect(() => {
    loadData(); 
}, []);

  const summary = useMemo(() => {
    const counts = queueItems.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] += 1;
        return acc;
      },
      { pending: 0, sent: 0, failed: 0, queued: 0 }
    );

    return [
      { label: 'Pending', value: counts.pending, accent: 'blue' },
      { label: 'Sent', value: counts.sent, accent: 'green' },
      { label: 'Failed', value: counts.failed, accent: 'red' },
      { label: 'Queued', value: counts.queued, accent: 'purple' }
    ];
  }, []);

  return (
    <section className="mailqueue-page">
      <div className="mailqueue-hero">
        <div>
          <p className="mailqueue-eyebrow"></p>
          <h2>Mail Queue Delivery</h2>
          <p className="mailqueue-subtitle">
          </p>
        </div>
        <button type="button" className="mailqueue-refresh-btn" onClick={loadData}>
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      <div className="mailqueue-summary-grid">
        {summary.map((item) => (
          <div key={item.label} className={`mailqueue-card ${item.accent}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="mailqueue-content-grid">
        <div className="mailqueue-panel">
          <div className="mailqueue-panel-header">
            <div>
              <h3>Recent delivery jobs</h3>
              <p>Danh sách mail gần đây trong hệ thống</p>
            </div>
            <button type="button" className="mailqueue-outline-btn">
              View all
            </button>
          </div>

          <div className="mailqueue-table-wrap">
            <table className="mailqueue-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="mailqueue-subject">
                        <strong>{item.subject}</strong>
                        <span>{item.priority} priority</span>
                      </div>
                    </td>
                    <td>{item.recipient}</td>
                    <td>
                      <span className={statusClassName(item.status)}>{item.status}</span>
                    </td>
                    <td>{item.attempts}</td>
                    <td>{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mailqueue-side-panel">
          <div className="mailqueue-panel">
            <div className="mailqueue-panel-header compact">
              <div>
                <h3>Queue health</h3>
                <p>System health overview</p>
              </div>
            </div>
            <div className="mailqueue-health-list">
              <div>
                <span>Success rate</span>
                <strong>92%</strong>
              </div>
              <div>
                <span>Avg. delivery</span>
                <strong>1.2s</strong>
              </div>
              <div>
                <span>Retry interval</span>
                <strong>5 min</strong>
              </div>
            </div>
          </div>

          <div className="mailqueue-panel">
            <div className="mailqueue-panel-header compact">
              <div>
                <h3>Recent activity</h3>
                <p>Latest events</p>
              </div>
            </div>
            <ul className="mailqueue-activity-list">
              <li>
                <span className="dot green" />
                Mail sent successfully to 24 recipients
              </li>
              <li>
                <span className="dot amber" />
                3 retries triggered for failed jobs
              </li>
              <li>
                <span className="dot blue" />
                Queue backlog reduced by 15%
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MailQueue;
