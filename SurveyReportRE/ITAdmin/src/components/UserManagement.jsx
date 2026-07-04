import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/Users/GetAll`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load users');
        return res.json();
      })
      .then((data) => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch users failed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="panel user-management">
        <div className="panel-header">
          <h2>Người dùng IT</h2>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Đang tải danh sách người dùng...
        </div>
      </section>
    );
  }

  return (
    <section className="panel user-management">
      <div className="panel-header">
        <h2>Người dùng IT</h2>
        <button type="button">Thêm người dùng</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Tên tài khoản</th>
            <th>Email</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.id || user.email || user.username || idx}>
              <td>{user.fullname || user.name || 'N/A'}</td>
              <td>{user.username || 'N/A'}</td>
              <td>{user.email || 'N/A'}</td>
              <td>{user.active ? 'Hoạt động' : 'Khóa'}</td>
              <td>
                <button type="button" style={{ marginRight: '8px' }}>Sửa</button>
                <button type="button">Khóa</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>
                Không tìm thấy người dùng nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default UserManagement;
