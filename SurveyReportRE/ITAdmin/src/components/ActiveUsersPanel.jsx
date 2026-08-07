import '../styles/ActiveUsersPanel.css';

export default function ActiveUsersPanel({ users = [], loading = false, error = '' }) {
  return (
    <section className="active-users-panel">
      <div className="active-users-header">
        <div>
          <span>Live sessions</span>
          <h2>Người dùng đang hoạt động</h2>
        </div>
        <strong>{users.length}</strong>
      </div>

      <div className="active-users-table-wrap">
        <table className="active-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Authentication</th>
              <th>Connections</th>
              <th>Last seen</th>
              <th>Connection ID</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan="5" className="active-users-state">Loading active users…</td></tr>
            ) : error ? (
              <tr><td colSpan="5" className="active-users-state error">{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="active-users-state">No users online.</td></tr>
            ) : users.map((user, index) => (
              <tr key={user.connectionId || user.ConnectionId || `${user.user || user.User}-${index}`}>
                <td><span className="active-user-dot"></span><b>{user.user ?? user.User ?? '-'}</b></td>
                <td>{user.authType ?? user.AuthType ?? '-'}</td>
                <td>{user.connections ?? user.Connections ?? 0}</td>
                <td>{new Date(user.lastSeen ?? user.LastSeen).toLocaleString()}</td>
                <td className="connection-id" title={user.connectionId ?? user.ConnectionId}>{user.connectionId ?? user.ConnectionId ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

