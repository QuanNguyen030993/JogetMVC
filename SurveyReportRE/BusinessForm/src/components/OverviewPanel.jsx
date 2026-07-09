const OverviewPanel = ({ cards, systemStatus, alerts, showStatusOnly, showAlertsOnly }) => (
  <section className="panel overview-panel">
    {!showAlertsOnly && (
      <div className="cards-grid">
        {cards.map((card) => (
          <article key={card.label} className="card">
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    )}

    {!showAlertsOnly && (
      <div className="status-section">
        <h2>Trạng thái hệ thống</h2>
        <div className="status-list">
          {systemStatus.map((item) => (
            <div key={item.name} className="status-item">
              <span>{item.name}</span>
              <strong>{item.value}</strong>
              <small>{item.state}</small>
            </div>
          ))}
        </div>
      </div>
    )}

    {!showStatusOnly && (
      <div className="alerts-section">
        <h2>Cảnh báo gần đây</h2>
        <ul>
          {alerts.map((alert) => (
            <li key={alert.title}>
              <strong>{alert.title}</strong>
              <span>{alert.time}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
);

export default OverviewPanel;
