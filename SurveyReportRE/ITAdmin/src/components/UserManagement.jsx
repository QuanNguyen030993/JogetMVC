import React, { useEffect, useMemo, useState } from 'react';
import appsettings from '../../../host.json';

const MKT_ROOTS = new Set(['Quotations', 'PolicyIssuances', 'SLA', 'DashBoard', 'MasterData']);
const valueOf = (item, ...keys) => keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);
const userIdOf = (user) => String(valueOf(user, 'id', 'Id') ?? valueOf(user, 'username', 'Username', 'userName', 'UserName'));
const userNameOf = (user) => String(valueOf(user, 'username', 'Username', 'userName', 'UserName') || '');
const departmentOf = (user) => String(valueOf(user, 'department', 'Department') || '').trim().toUpperCase();
const menuIdOf = (menu) => String(valueOf(menu, 'id', 'Id') ?? '');
const menuParentIdOf = (menu) => valueOf(menu, 'parentId', 'ParentId');
const menuNameOf = (menu) => String(valueOf(menu, 'name', 'Name', 'title', 'Title') || 'Unnamed menu');
const isMenuActive = (menu) => Boolean(valueOf(menu, 'active', 'Active') ?? true) && !Boolean(valueOf(menu, 'deleted', 'Deleted') ?? false);

const MenuTree = ({ menus, parentId = null }) => {
  const children = menus.filter((menu) => {
    const currentParentId = menuParentIdOf(menu);
    return parentId === null
      ? currentParentId === null || currentParentId === undefined || currentParentId === ''
      : String(currentParentId) === String(parentId);
  });
  if (!children.length) return null;
  return (
    <ul className="role-menu-tree">
      {children.map((menu) => (
        <li key={menuIdOf(menu)}>
          <div className="role-menu-node"><span>✓</span>{menuNameOf(menu)}</div>
          <MenuTree menus={menus} parentId={menuIdOf(menu)} />
        </li>
      ))}
    </ul>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [stagedUsers, setStagedUsers] = useState([]);
  const [previewUserId, setPreviewUserId] = useState('');
  const [roleName, setRoleName] = useState('Staff');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const getJson = async (path) => {
      const response = await fetch(`${appsettings.UrlConfig.Host}${path}`);
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return response.json();
    };
    Promise.all([
      getJson('/api/Users/GetAll'),
      getJson('/api/Roles/GetAll').catch(() => []),
      getJson('/api/Menu/GetAll').catch(() => []),
    ])
      .then(([userData, roleData, menuData]) => {
        setUsers(Array.isArray(userData) ? userData : []);
        setRoles(Array.isArray(roleData) ? roleData : []);
        setMenus(Array.isArray(menuData) ? menuData : []);
      })
      .catch((error) => setMessage({ type: 'error', text: `Không tải được dữ liệu: ${error.message}` }))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [
      valueOf(user, 'fullname', 'Fullname', 'name', 'Name'),
      userNameOf(user),
      valueOf(user, 'email', 'Email'),
      departmentOf(user),
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [searchTerm, users]);

  const addUsersToPanel = (items) => {
    const byId = new Map(stagedUsers.map((user) => [userIdOf(user), user]));
    items.forEach((user) => byId.set(userIdOf(user), user));
    const nextUsers = [...byId.values()];
    setStagedUsers(nextUsers);
    setPreviewUserId((current) => current || userIdOf(nextUsers[0]));
  };

  const selectedUsers = users.filter((user) => selectedIds.has(userIdOf(user)));
  const previewUser = stagedUsers.find((user) => userIdOf(user) === previewUserId) || stagedUsers[0];
  const previewDepartment = departmentOf(previewUser);

  const allowedMenus = useMemo(() => {
    const activeMenus = menus.filter(isMenuActive);
    if (previewDepartment === 'IT') return activeMenus;
    if (previewDepartment !== 'MKT') return [];
    const allowedIds = new Set(
      activeMenus
        .filter((menu) => (menuParentIdOf(menu) === null || menuParentIdOf(menu) === undefined) && MKT_ROOTS.has(menuNameOf(menu)))
        .map(menuIdOf),
    );
    let changed = true;
    while (changed) {
      changed = false;
      activeMenus.forEach((menu) => {
        const parentId = menuParentIdOf(menu);
        if (parentId !== null && parentId !== undefined && allowedIds.has(String(parentId)) && !allowedIds.has(menuIdOf(menu))) {
          allowedIds.add(menuIdOf(menu));
          changed = true;
        }
      });
    }
    return activeMenus.filter((menu) => allowedIds.has(menuIdOf(menu)));
  }, [menus, previewDepartment]);

  const submitRoleMenu = async (isClear) => {
    if (!stagedUsers.length) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/Users/AssignRoleMenus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName,
          userNames: stagedUsers.map(userNameOf).filter(Boolean),
          isClear,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || 'Không thể cập nhật quyền.');
      const failed = (result.results || []).filter((item) => !item.success);
      setMessage({
        type: failed.length ? 'warning' : 'success',
        text: failed.length
          ? `Hoàn tất nhưng có ${failed.length} user lỗi: ${failed.map((item) => item.userName).join(', ')}`
          : `${isClear ? 'Đã xóa' : 'Đã cấp'} quyền cho ${stagedUsers.length} user.`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel role-assignment-page">
      <div className="panel-header role-assignment-header">
        <div><h2>User Role & Menu Assignment</h2><p>Kéo một hoặc nhiều user vào panel để cấp quyền theo department.</p></div>
        <input type="search" placeholder="Tìm user, email, department..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
      </div>

      {message && <div className={`role-assignment-message ${message.type}`}>{message.text}</div>}

      <div className="role-assignment-layout">
        <div className="role-users-panel">
          <div className="role-panel-title">
            <strong>Users ({filteredUsers.length})</strong>
            <button type="button" disabled={!selectedUsers.length} onClick={() => addUsersToPanel(selectedUsers)}>Thêm {selectedUsers.length || ''} user →</button>
          </div>
          <div className="role-users-list">
            {loading ? <div className="role-empty">Đang tải users...</div> : filteredUsers.map((user) => {
              const id = userIdOf(user);
              const checked = selectedIds.has(id);
              return (
                <div
                  key={id}
                  className={`role-user-row${checked ? ' selected' : ''}`}
                  draggable
                  onDragStart={(event) => {
                    const draggingUsers = checked && selectedUsers.length ? selectedUsers : [user];
                    event.dataTransfer.setData('application/json', JSON.stringify(draggingUsers.map(userIdOf)));
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <input type="checkbox" checked={checked} onChange={() => setSelectedIds((current) => {
                    const next = new Set(current);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  })} />
                  <div className="role-user-avatar">{userNameOf(user).slice(0, 2).toUpperCase()}</div>
                  <div className="role-user-info"><strong>{valueOf(user, 'fullname', 'Fullname', 'name', 'Name') || userNameOf(user)}</strong><span>{userNameOf(user)} · {valueOf(user, 'email', 'Email') || 'No email'}</span></div>
                  <span className={`role-department ${departmentOf(user).toLowerCase()}`}>{departmentOf(user) || 'N/A'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`role-drop-panel${stagedUsers.length ? ' has-users' : ''}`}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
          onDrop={(event) => {
            event.preventDefault();
            try {
              const ids = JSON.parse(event.dataTransfer.getData('application/json') || '[]');
              addUsersToPanel(users.filter((user) => ids.includes(userIdOf(user))));
            } catch { setMessage({ type: 'error', text: 'Dữ liệu kéo thả không hợp lệ.' }); }
          }}
        >
          <div className="role-panel-title"><strong>Assignment panel</strong><span>{stagedUsers.length} selected</span></div>
          {!stagedUsers.length ? (
            <div className="role-drop-placeholder"><b>Thả users vào đây</b><span>Có thể chọn nhiều user rồi kéo một lần</span></div>
          ) : (
            <div className="role-staged-users">
              {stagedUsers.map((user) => (
                <button key={userIdOf(user)} type="button" className={userIdOf(user) === userIdOf(previewUser) ? 'active' : ''} onClick={() => setPreviewUserId(userIdOf(user))}>
                  <span>{userNameOf(user)}</span><small>{departmentOf(user) || 'N/A'}</small>
                  <i onClick={(event) => { event.stopPropagation(); setStagedUsers((current) => current.filter((item) => userIdOf(item) !== userIdOf(user))); }}>×</i>
                </button>
              ))}
            </div>
          )}
          <label className="role-select-field"><span>Role</span><select value={roleName} onChange={(event) => setRoleName(event.target.value)}>
            {!roles.some((role) => String(valueOf(role, 'roleName', 'RoleName')) === 'Staff') && <option value="Staff">Staff</option>}
            {roles.map((role) => { const name = String(valueOf(role, 'roleName', 'RoleName') || ''); return name && <option key={valueOf(role, 'id', 'Id') || name} value={name}>{name}</option>; })}
          </select></label>
          <div className="role-assignment-actions">
            <button type="button" className="clear" disabled={saving || !stagedUsers.length} onClick={() => submitRoleMenu(true)}>Clear role/menu</button>
            <button type="button" className="apply" disabled={saving || !stagedUsers.length} onClick={() => submitRoleMenu(false)}>{saving ? 'Đang xử lý...' : 'Apply role/menu'}</button>
          </div>
        </div>

        <div className="role-menu-preview">
          <div className="role-panel-title"><strong>Menu preview</strong><span>{previewUser ? `${userNameOf(previewUser)} · ${previewDepartment || 'N/A'}` : 'Chọn user'}</span></div>
          {previewUser && !['MKT', 'IT'].includes(previewDepartment) ? (
            <div className="role-policy-warning">Department chưa được hỗ trợ. Store chỉ chấp nhận MKT và IT.</div>
          ) : previewUser ? (
            <><div className="role-policy-summary"><b>{previewDepartment}</b><span>{previewDepartment === 'IT' ? 'Tất cả menu đang hoạt động' : '5 nhóm menu MKT và toàn bộ menu con'}</span><em>{allowedMenus.length} menus</em></div><div className="role-menu-tree-wrap"><MenuTree menus={allowedMenus} /></div></>
          ) : <div className="role-empty">Thêm và chọn một user để xem menu.</div>}
        </div>
      </div>
    </section>
  );
};

export default UserManagement;
