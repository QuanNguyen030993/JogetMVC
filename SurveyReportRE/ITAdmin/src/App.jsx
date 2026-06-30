import { useMemo, useState } from 'react';
import ChartPanel from './components/ChartPanel';
import MailTemplateDesigner from './components/MailTemplateDesigner';

const userCount = { label: 'Người dùng hoạt động', value: '128', detail: '20 người dùng IT đang online' };

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
    { id: 'mail-template', label: 'Cấu hình Mail Template' }
  ];

  const content = useMemo(() => {
    switch (activeSection) {
      case 'mail-template':
        return <MailTemplateDesigner />;
      default:
        return (
          <>
            <section className="panel user-stats-card">
              <article className="card">
                <strong>{userCount.value}</strong>
                <span>{userCount.label}</span>
                <p>{userCount.detail}</p>
              </article>
            </section>
            <ChartPanel cpuData={cpuData} ticketData={ticketData} />
          </>
        );
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
            <h1>Admintrator</h1>
          </div>
        </header>

        {content}
      </main>
    </div>
  );
}

export default App;
