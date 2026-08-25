import React, { useEffect, useMemo, useState } from 'react';
import appsettings from '../../../host.json';

const MKT_ROOTS = new Set(['Quotations', 'PolicyIssuances', 'SLA', 'DashBoard', 'MasterData']);
const DEPARTMENT_GROUPS = ['MKT', 'FO', 'TS', 'UW', 'LMKT', 'PM', 'IT'];
const ROLE_TYPES = ['Staff', 'Line Manager', 'HOD', 'BOD'];
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
  const [menus, setMenus] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [stagedUsers, setStagedUsers] = useState([]);
  const [previewUserId, setPreviewUserId] = useState('');
  const [roleName, setRoleName] = useState('Staff');
  const [selectedGroup, setSelectedGroup] = useState('MKT');
  const [selectedTag, setSelectedTag] = useState('');
  const [loginAsUser, setLoginAsUser] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const getJson = async (path) => {
      const response = await fetch(`${appsettings.UrlConfig.Host}${path}`);
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return response.json();
    };
    Promise.all([
      getJson('/api/Users/GetAll'),
      getJson('/api/Employee/GetAll').catch(() => []),
      getJson('/api/Menu/GetAll').catch(() => []),
      getJson('/api/Users/GetUserRoleStatus').catch(() => []),
    ])
      .then(([userData, employeeData, menuData, assignmentData]) => {
        const employeesByAccount = new Map(
          (Array.isArray(employeeData) ? employeeData : [])
            .map((employee) => [String(valueOf(employee, 'accountName', 'AccountName') || '').trim().toLowerCase(), employee])
            .filter(([accountName]) => accountName),
        );
        const mergedUsers = (Array.isArray(userData) ? userData : []).map((user) => {
          const employee = employeesByAccount.get(userNameOf(user).trim().toLowerCase());
          const employeeDepartment = String(valueOf(employee, 'department', 'Department') || '').trim();
          const userDepartment = String(valueOf(user, 'department', 'Department') || '').trim();
          const department = employeeDepartment || userDepartment;
          return { ...user, department, Department: department };
        });
        setUsers(mergedUsers);
        setMenus(Array.isArray(menuData) ? menuData : []);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      })
      .catch((error) => setMessage({ type: 'error', text: `Không tải được dữ liệu: ${error.message}` }))
      .finally(() => setLoading(false));
  }, []);

  const roleByUserName = useMemo(() => {
    const result = new Map();
    assignments.forEach((item) => {
      const userName = userNameOf(item).toLowerCase();
      const assignedRole = String(valueOf(item, 'roleName', 'RoleName') || '').trim();
      if (userName && assignedRole) result.set(userName, assignedRole);
    });
    return result;
  }, [assignments]);

  const roleOfUser = (user) => roleByUserName.get(userNameOf(user).toLowerCase()) || 'Chưa phân quyền';
  const availableTags = useMemo(() => {
    const stagedIds = new Set(stagedUsers.map(userIdOf));
    const tags = new Set();
    users.filter((user) => !stagedIds.has(userIdOf(user))).forEach((user) => {
      if (departmentOf(user)) tags.add(departmentOf(user));
      tags.add(roleByUserName.get(userNameOf(user).toLowerCase()) || 'Chưa phân quyền');
    });
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [roleByUserName, stagedUsers, users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const stagedIds = new Set(stagedUsers.map(userIdOf));
    return users
      .filter((user) => !stagedIds.has(userIdOf(user)))
      .filter((user) => !selectedTag || departmentOf(user) === selectedTag || roleOfUser(user) === selectedTag)
      .filter((user) => !term || [
        valueOf(user, 'fullname', 'Fullname', 'name', 'Name'),
        userNameOf(user),
        valueOf(user, 'email', 'Email', 'mail', 'Mail'),
        departmentOf(user),
        roleOfUser(user),
      ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [roleByUserName, searchTerm, selectedTag, stagedUsers, users]);

  const addUsersToPanel = (items) => {
    const byId = new Map(stagedUsers.map((user) => [userIdOf(user), user]));
    items.forEach((user) => byId.set(userIdOf(user), user));
    const nextUsers = [...byId.values()];
    setStagedUsers(nextUsers);
    setSelectedIds((current) => {
      const next = new Set(current);
      items.forEach((user) => next.delete(userIdOf(user)));
      return next;
    });
    setPreviewUserId((current) => current || userIdOf(nextUsers[0]));
    if (nextUsers[0] && DEPARTMENT_GROUPS.includes(departmentOf(nextUsers[0]))) setSelectedGroup(departmentOf(nextUsers[0]));
  };

  const selectedUsers = users.filter((user) => selectedIds.has(userIdOf(user)));
  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.has(userIdOf(user)));
  const previewUser = stagedUsers.find((user) => userIdOf(user) === previewUserId) || stagedUsers[0];
  const previewDepartment = departmentOf(previewUser);
  const groupMembers = useMemo(() => assignments.filter((item) => departmentOf(item) === selectedGroup), [assignments, selectedGroup]);

  const allowedMenus = useMemo(() => {
    const activeMenus = menus.filter(isMenuActive);
    if (selectedGroup === 'IT') return activeMenus;
    if (!DEPARTMENT_GROUPS.includes(selectedGroup)) return [];
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
  }, [menus, selectedGroup]);

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
      const statusResponse = await fetch(`${appsettings.UrlConfig.Host}/api/Users/GetUserRoleStatus`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setAssignments(Array.isArray(statusData) ? statusData : []);
      }
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

  const loginAs = async (user) => {
    const userName = userNameOf(user);
    if (!userName || !window.confirm(`Đăng nhập với tài khoản ${userName}?`)) return;
    setLoginAsUser(userName);
    setMessage(null);
    try {
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/Users/LoginAs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || 'Không thể Login as user này.');
      window.location.replace(`${result.redirectUrl || '/Management'}?impersonated=${Date.now()}`);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setLoginAsUser('');
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
            <div className="role-user-selection-actions">
              <button type="button" disabled={!filteredUsers.length} onClick={() => setSelectedIds((current) => {
                const next = new Set(current);
                filteredUsers.forEach((user) => allFilteredSelected ? next.delete(userIdOf(user)) : next.add(userIdOf(user)));
                return next;
              })}>{allFilteredSelected ? 'Bỏ chọn tất cả' : 'Select all'}</button>
              <button type="button" disabled={!selectedUsers.length} onClick={() => addUsersToPanel(selectedUsers)}>Thêm {selectedUsers.length || ''} user →</button>
            </div>
          </div>
          <div className="role-user-filter-tags">
            <button type="button" className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag('')}>Tất cả</button>
            {availableTags.map((tag) => <button key={tag} type="button" className={selectedTag === tag ? 'active' : ''} onClick={() => setSelectedTag((current) => current === tag ? '' : tag)}>{tag}</button>)}
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
                  <div className="role-user-info"><strong>{valueOf(user, 'fullname', 'Fullname', 'name', 'Name') || userNameOf(user)}</strong><span>{userNameOf(user)} · {valueOf(user, 'email', 'Email', 'mail', 'Mail') || 'No email'}</span></div>
                  <div className="role-user-row-actions">
                    <div className="role-user-tags">
                      <button type="button" className={`role-department ${departmentOf(user).toLowerCase()}`} onClick={() => setSelectedTag(departmentOf(user))}>{departmentOf(user) || 'N/A'}</button>
                      <button type="button" className="role-access-tag" onClick={() => setSelectedTag(roleOfUser(user))}>{roleOfUser(user)}</button>
                    </div>
                    <button type="button" className="role-login-as-btn" disabled={Boolean(loginAsUser)} onClick={() => loginAs(user)}>{loginAsUser === userNameOf(user) ? 'Đang login...' : 'Login as'}</button>
                  </div>
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
                <button key={userIdOf(user)} type="button" className={userIdOf(user) === userIdOf(previewUser) ? 'active' : ''} onClick={() => { setPreviewUserId(userIdOf(user)); if (DEPARTMENT_GROUPS.includes(departmentOf(user))) setSelectedGroup(departmentOf(user)); }}>
                  <span>{userNameOf(user)}</span><small>{departmentOf(user) || 'N/A'}</small>
                  <i onClick={(event) => { event.stopPropagation(); setStagedUsers((current) => current.filter((item) => userIdOf(item) !== userIdOf(user))); }}>×</i>
                </button>
              ))}
            </div>
          )}
          <label className="role-select-field"><span>Role</span><select value={roleName} onChange={(event) => setRoleName(event.target.value)}>
            {ROLE_TYPES.map((role) => <option key={role} value={role}>{role}</option>)}
          </select></label>
          <div className="role-assignment-actions">
            <button type="button" className="clear" disabled={saving || !stagedUsers.length} onClick={() => submitRoleMenu(true)}>Clear role/menu</button>
            <button type="button" className="apply" disabled={saving || !stagedUsers.length} onClick={() => submitRoleMenu(false)}>{saving ? 'Đang xử lý...' : 'Apply role/menu'}</button>
          </div>
        </div>

        <div className="role-menu-preview">
          <div className="role-panel-title"><strong>Groups, members & menus</strong><span>{groupMembers.length} members</span></div>
          <div className="role-group-tabs">
            {DEPARTMENT_GROUPS.map((group) => <button key={group} type="button" className={selectedGroup === group ? 'active' : ''} onClick={() => setSelectedGroup(group)}>{group}</button>)}
          </div>
          <div className="role-policy-summary"><b>{selectedGroup}</b><span>{selectedGroup === 'IT' ? 'Tất cả menu đang hoạt động' : 'Bộ menu chung cho account không phải IT/admin'}</span><em>{allowedMenus.length} menus</em></div>
          <div className="role-group-members">
            <strong>Đang có những ai</strong>
            {groupMembers.length ? groupMembers.map((member) => (
              <div key={`${valueOf(member, 'userId', 'UserId')}-${valueOf(member, 'roleId', 'RoleId')}`} className="role-member-row">
                <span>{valueOf(member, 'displayName', 'DisplayName') || userNameOf(member)}</span>
                <small>{userNameOf(member)}</small>
                <em>{valueOf(member, 'roleName', 'RoleName') || 'N/A'}</em>
              </div>
            )) : <p>Chưa có user trong nhóm này.</p>}
          </div>
          <div className="role-menu-tree-wrap"><MenuTree menus={allowedMenus} /></div>
        </div>
      </div>
    </section>
  );
};

export default UserManagement;
