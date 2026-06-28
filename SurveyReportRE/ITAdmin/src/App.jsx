import { useMemo, useState } from 'react';
import OverviewPanel from './components/OverviewPanel';
import UserManagement from './components/UserManagement';
import ChartPanel from './components/ChartPanel';

const cards = [
  { label: 'Người dùng hoạt động', value: '128', detail: '20 người dùng IT đang online' },
  { label: 'Máy chủ', value: '6', detail: '2 máy chủ cảnh báo nhiệt độ' },
  { label: 'Sự cố mở', value: '4', detail: 'Sự cố mạng và bảo mật' },
  { label: 'Yêu cầu chờ', value: '13', detail: 'Phê duyệt thiết bị mới' }
];

const users = [
  { name: 'Nguyễn Văn A', role: 'Quản trị hệ thống', email: 'a.admin@company.vn', status: 'Đang hoạt động' },
  { name: 'Trần Thị B', role: 'Quản trị mạng', email: 'b.network@company.vn', status: 'Chờ xác nhận' },
  { name: 'Lê Văn C', role: 'Chuyên viên bảo mật', email: 'c.security@company.vn', status: 'Đang hoạt động' },
  { name: 'Phạm Thị D', role: 'Hỗ trợ nội bộ', email: 'd.support@company.vn', status: 'Bị khóa' }
];

const systemStatus = [
  { name: 'CPU Server', value: '72%', state: 'Ổn định' },
  { name: 'Băng thông WAN', value: '63%', state: 'Cảnh báo' },
  { name: 'Cơ sở dữ liệu', value: 'Hoạt động', state: 'Ổn định' },
  { name: 'Firewall', value: '2 cảnh báo', state: 'Cảnh báo' }
];

const alerts = [
  { title: 'Cập nhật vá lỗi Windows Server', time: '10 phút trước' },
  { title: 'Tài khoản người dùng A cần reset mật khẩu', time: '1 giờ trước' },
  { title: 'Mức sử dụng ổ cứng vượt 85%', time: '2 giờ trước' }
];

const cpuData = [
  { day: 'T2', usage: 64 },
  { day: 'T3', usage: 58 },
  { day: 'T4', usage: 72 },
  { day: 'T5', usage: 81 },
  { day: 'T6', usage: 75 },
  { day: 'T7', usage: 69 },
  { day: 'CN', usage: 73 }
];

const ticketData = [
  { day: 'T2', open: 4, closed: 8 },
  { day: 'T3', open: 7, closed: 6 },
  { day: 'T4', open: 3, closed: 9 },
  { day: 'T5', open: 6, closed: 7 },
  { day: 'T6', open: 5, closed: 7 },
  { day: 'T7', open: 4, closed: 6 },
  { day: 'CN', open: 2, closed: 4 }
];

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const menuItems = [
    { id: 'dashboard', label: 'Bảng điều khiển' },
    { id: 'users', label: 'Quản lý người dùng' },
    { id: 'systems', label: 'Giám sát hệ thống' },
    { id: 'alerts', label: 'Cảnh báo' }
  ];

  const content = useMemo(() => {
    switch (activeSection) {
      case 'users':
        return <UserManagement users={users} />;
      case 'systems':
        return <OverviewPanel cards={cards} systemStatus={systemStatus} alerts={alerts} showStatusOnly />;
      case 'alerts':
        return <OverviewPanel cards={[]} systemStatus={[]} alerts={alerts} showAlertsOnly />;
      default:
        return <OverviewPanel cards={cards} systemStatus={systemStatus} alerts={alerts} />;
    }
  }, [activeSection]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">IT Admin Portal</div>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeSection ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Quản trị IT</h1>
            <p>Giám sát hạ tầng, quản lý quyền truy cập và cảnh báo thời gian thực.</p>
          </div>
          <div className="top-actions">
            <button type="button">Tạo ticket mới</button>
          </div>
        </header>

        {content}

        {activeSection === 'dashboard' && (
          <>
            <ChartPanel cpuData={cpuData} ticketData={ticketData} />
            <UserManagement users={users.slice(0, 3)} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
