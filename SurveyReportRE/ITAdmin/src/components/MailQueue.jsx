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

// New states for Search, Filters, Infinite Scroll, and Details Drawer
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [displayedCount, setDisplayedCount] = useState(15);
const [loadingMore, setLoadingMore] = useState(false);
const [selectedMail, setSelectedMail] = useState(null);
const [isResending, setIsResending] = useState(false);

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

// Update displayed items count on filter or search changes
useEffect(() => {
  setDisplayedCount(15);
}, [searchTerm, statusFilter]);

const summary = useMemo(() => {
  const counts = queueItems.reduce(
    (acc, item) => {
      const statusKey = item.status.toLowerCase();
      if (acc.hasOwnProperty(statusKey)) {
        acc[statusKey] += 1;
      }
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
}, [queueItems]);

// Client-side filtering logic
const filteredItems = useMemo(() => {
  return queueItems.filter((item) => {
    // 1) Status Filter
    if (statusFilter !== "All" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    // 2) Search Term Filter
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      const subjectMatch = item.subject?.toLowerCase().includes(query);
      const recipientMatch = item.recipient?.toLowerCase().includes(query);
      const fromMatch = item.from?.toLowerCase().includes(query);
      const bodyMatch = item.body?.toLowerCase().includes(query);
      const priorityMatch = item.priority?.toLowerCase().includes(query);
      if (!subjectMatch && !recipientMatch && !fromMatch && !bodyMatch && !priorityMatch) {
        return false;
      }
    }
    return true;
  });
}, [queueItems, searchTerm, statusFilter]);

// Handle scrolling to trigger infinite scroll loading
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  if (scrollHeight - scrollTop - clientHeight < 20) {
    if (displayedCount < filteredItems.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayedCount((prev) => Math.min(prev + 15, filteredItems.length));
        setLoadingMore(false);
      }, 500);
    }
  }
};

// Handle resending an email from the details drawer
const handleResend = async () => {
  if (!selectedMail) return;
  try {
    setIsResending(true);
    
    // Construct the payload matching the backend expectations
    const payload = {
      Id: selectedMail.id,
      ToName: selectedMail.toName,
      ToEmail: selectedMail.recipientEmail,
      Subject: selectedMail.subject,
      HtmlBody: selectedMail.body,
      CC: selectedMail.cc,
      FromAccount: selectedMail.from,
      IsSend: selectedMail.isSend
    };

    const response = await fetch(`${API_BASE_URL}/api/MailQueue/Resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Gửi lại email thất bại");
    
    window.alert("Gửi lại email thành công!");
    
    // Refresh mail list to see updated status
    loadData();
  } catch (e) {
    console.error(e);
    window.alert(`Lỗi: ${e.message || "Gửi lại email thất bại!"}`);
  } finally {
    setIsResending(false);
  }
};

const statusFilterPills = ["All", "Pending", "Sent", "Failed", "Queued"];

return (
  <section className="mailqueue-page">
    <div className="mailqueue-hero">
      <div>
        <p className="mailqueue-eyebrow">IT Operation</p>
        <h2>Mail Queue Delivery</h2>
        <p className="mailqueue-subtitle">
          Quản lý, tìm kiếm và kiểm tra hàng đợi gửi email trong hệ thống
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

    {/* Search and Filters Bar */}
    <div className="mailqueue-filter-bar">
      <div className="mailqueue-filter-left">
        <div className="mailqueue-search-wrap">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            type="text"
            className="mailqueue-search-input"
            placeholder="Tìm kiếm tiêu đề, người nhận, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="mailqueue-clear-search"
              onClick={() => setSearchTerm("")}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <div className="mailqueue-filter-group">
          {statusFilterPills.map((pill) => (
            <button
              key={pill}
              type="button"
              className={`mailqueue-filter-pill ${statusFilter === pill ? "active" : ""}`}
              onClick={() => setStatusFilter(pill)}
            >
              {pill === "All" ? "Tất cả" : pill}
            </button>
          ))}
        </div>
      </div>

      <div className="mailqueue-results-counter">
        Tìm thấy <strong>{filteredItems.length}</strong> / <strong>{queueItems.length}</strong> thư
      </div>
    </div>

    <div className="mailqueue-content-grid">
      <div className="mailqueue-panel">
        <div className="mailqueue-panel-header">
          <div>
            <h3>Recent delivery jobs</h3>
            <p>Danh sách mail trong hệ thống (Cuộn để xem thêm)</p>
          </div>
        </div>

        {/* Scrollable Table wrap */}
        <div className="mailqueue-table-wrap scrollable" onScroll={handleScroll}>
          {filteredItems.length === 0 ? (
            <div className="mailqueue-empty-state">
              <i className="fa-solid fa-envelope-open-text" />
              <p>Không tìm thấy thư nào phù hợp với bộ lọc</p>
            </div>
          ) : (
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
                {filteredItems.slice(0, displayedCount).map((item) => (
                  <tr 
                    key={item.id}
                    className={`mailqueue-row-clickable ${selectedMail?.id === item.id ? "selected-row" : ""}`}
                    onClick={() => setSelectedMail(item)}
                  >
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
                
                {/* Scroll spinner indicator */}
                {loadingMore && (
                  <tr className="mailqueue-loading-more-row">
                    <td colSpan={5}>
                      <span className="mailqueue-spinner" />
                      Đang tải thêm...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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

    {/* Mail Details Drawer Overlay */}
    <div 
      className={`mailqueue-drawer-overlay ${selectedMail ? "open" : ""}`}
      onClick={() => setSelectedMail(null)}
    />

    {/* Mail Details Drawer */}
    <div className={`mailqueue-drawer ${selectedMail ? "open" : ""}`}>
      {selectedMail && (
        <>
          <div className="mailqueue-drawer-header">
            <div className="mailqueue-drawer-title-area">
              <div className="mailqueue-drawer-meta-badges">
                <span className={statusClassName(selectedMail.status)}>{selectedMail.status}</span>
                <span className="mailqueue-status queued" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                  {selectedMail.priority} Priority
                </span>
              </div>
              <h3>{selectedMail.subject}</h3>
            </div>
            <button 
              type="button" 
              className="mailqueue-drawer-close"
              onClick={() => setSelectedMail(null)}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="mailqueue-drawer-body">
            <div>
              <h4 className="drawer-section-title">Thông tin chung</h4>
              <div className="mail-metadata-grid">
                <div className="mail-metadata-label">Từ tài khoản:</div>
                <div className="mail-metadata-value">{selectedMail.from}</div>
                
                <div className="mail-metadata-label">Người nhận:</div>
                <div className="mail-metadata-value">{selectedMail.recipient}</div>

                {selectedMail.cc && (
                  <>
                    <div className="mail-metadata-label">CC:</div>
                    <div className="mail-metadata-value">{selectedMail.cc}</div>
                  </>
                )}

                <div className="mail-metadata-label">Ngày tạo:</div>
                <div className="mail-metadata-value">{selectedMail.createdAt}</div>

                <div className="mail-metadata-label">Số lần thử:</div>
                <div className="mail-metadata-value">{selectedMail.attempts}</div>
              </div>
            </div>

            <div className="mail-body-preview-container">
              <h4 className="drawer-section-title">Xem trước nội dung</h4>
              <div className="mail-body-preview">
                {selectedMail.body ? (
                  <iframe
                    title="Mail HTML Body"
                    className="mail-body-iframe"
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <style>
                            body {
                              font-family: system-ui, -apple-system, sans-serif;
                              font-size: 14px;
                              line-height: 1.6;
                              color: #334155;
                              margin: 0;
                              padding: 12px;
                            }
                          </style>
                        </head>
                        <body>
                          ${selectedMail.body}
                        </body>
                      </html>
                    `}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                    (Thư này không có nội dung hiển thị)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mailqueue-drawer-footer">
            <button 
              type="button" 
              className="drawer-close-btn"
              onClick={() => setSelectedMail(null)}
            >
              Đóng
            </button>
            <button 
              type="button" 
              className="drawer-resend-btn"
              disabled={isResending}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <span className="mailqueue-spinner" style={{ borderColor: "#fff", borderTopColor: "transparent", marginRight: "4px" }} />
                  Đang gửi lại...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" /> Gửi lại email
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  </section>
);
}

export default MailQueue;
