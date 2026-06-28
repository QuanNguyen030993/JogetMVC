const UserManagement = ({ users }) => (
  <section className="panel user-management">
    <div className="panel-header">
      <h2>Người dùng IT</h2>
      <button type="button">Thêm người dùng</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Vai trò</th>
          <th>Email</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.email}>
            <td>{user.name}</td>
            <td>{user.role}</td>
            <td>{user.email}</td>
            <td>{user.status}</td>
            <td>
              <button type="button">Sửa</button>
              <button type="button">Khóa</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default UserManagement;
