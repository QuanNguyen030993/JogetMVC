import { useCallback, useEffect, useState,useMemo  } from 'react';
import appsettings from '../../host.json';

import ChartPanel from './components/ChartPanel';
import MailTemplateDesigner from './components/MailTemplateDesigner';
import MailQueue from './components/MailQueue';
import Flow from './components/Flow';
import SerilogViewer from './components/SerilogViewer';
import SysTable from './components/SysTable';
import DataGridFieldDesigner from './components/DataGridFieldDesigner';
import MenuDesigner from './components/MenuDesigner';
import UserManagement from './components/UserManagement';
import OverviewPanel from './components/OverviewPanel';
import EnumDesign from './components/EnumDesign';
import SlaDesign from './components/SlaDesign';
import WorkflowRecover from './components/WorkflowRecover';
import ActiveUsersPanel from './components/ActiveUsersPanel';
import AspLogViewer from './components/AspLogViewer';
import CustomGrid from '../../TMIVCom/src/components/CustomGrid'
import NotificationHub from './components/NotificationHub';
import SqlStoredProcedure from './components/SqlStoredProcedure';
import NotificationTemplate from './components/NotificationTemplate';
import NotificationTemplateDesigner from './components/NotificationTemplateDesigner';
import DatabaseManagement from './components/DatabaseManagement';
import './styles/flow.css';
import './styles/com.all.css';
import './styles/serilogs.css';
import './styles/systable.css';
import './styles/datagridfielddesigner.css';
import './styles/mailtemplatedesigner.css'
import './styles/mailqueue.css';
import './styles/menudesigner.css';
import './styles/sladesigner.css';
import './styles/notificationtemplate.css';
import './styles/notificationTemplateDesigner.css';
import './styles/databasemanagement.css';
import './styles/turnAroundTimeAnalytics.css';
import './styles/usermanagement.css';
import { notify, ToastContainer } from '../../TMIVCom/src/components/Notification';
import "./fonts/css/all.min.css";

// Override global window.alert to route through TMIVCom Notification (right bottom)
if (typeof window !== 'undefined') {
  window.alert = (message) => {
    const msg = String(message || '');
    const isError = /lỗi|thất bại|failed|error/i.test(msg);
    const isSuccess = /thành công|success|đã lưu|đã thêm|đã xóa|đã sao chép|copied/i.test(msg);
    const isWarning = /vui lòng|cảnh báo|warning|không thể/i.test(msg);
    const type = isError ? 'error' : isSuccess ? 'success' : isWarning ? 'warning' : 'info';
    notify({ content: msg, type: type, position: "bottom-right" });
  };
}

// Global API Monitor Interceptor to capture client-to-server traffic
const apiHistory = [];
const apiListeners = new Set();

const addApiRecord = (record) => {
  apiHistory.push(record);
  if (apiHistory.length > 300) apiHistory.shift();
  apiListeners.forEach(listener => {
    try {
      listener(record);
    } catch (e) {
      console.error(e);
    }
  });
};

if (typeof window !== 'undefined' && !window.__apiInterceptorInstalled) {
  window.__apiInterceptorInstalled = true;

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const start = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    let status = 200;
    let ok = true;
    try {
      const response = await originalFetch.apply(this, args);
      status = response.status;
      ok = response.ok;
      return response;
    } catch (error) {
      status = 500;
      ok = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      addApiRecord({
        url,
        timestamp: new Date(),
        duration: Math.round(duration),
        status,
        ok,
        method: args[1]?.method || 'GET'
      });
    }
  };

  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    this._method = method;
    this._startTime = performance.now();
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('loadend', () => {
      const duration = performance.now() - (this._startTime || performance.now());
      addApiRecord({
        url: this._url || '',
        timestamp: new Date(),
        duration: Math.round(duration),
        status: this.status || 200,
        ok: this.status >= 200 && this.status < 300,
        method: this._method || 'GET'
      });
    });
    return originalSend.apply(this, args);
  };

  window.__apiHistory = apiHistory;
  window.__apiListeners = apiListeners;
}


function App() {
  const [loginStats,setLoginStats]=useState([]);
  const [disk,setDisk]=useState(0);
  const [ticketData,setTicketData]=useState([]);
  const [serilogHourly,setSerilogHourly]=useState([]);
  const [onlineUsers,setOnlineUsers]=useState([]);
  const [onlineUsersLoading,setOnlineUsersLoading]=useState(true);
  const [onlineUsersError,setOnlineUsersError]=useState('');
  const [currentAccount, setCurrentAccount] = useState(() => String(window._loginUser || '').replace('TOKIOMARINE\\', ''));
  const [isImpersonating, setIsImpersonating] = useState(() => String(window._isDebugMode || '').toLowerCase() === 'true');
  const [returningAccount, setReturningAccount] = useState(false);
//  const [appsettings, setAppsettings] = useState(null);

  useEffect(() => {
    let attempts = 0;
    const syncLoginContext = () => {
      const account = String(window._loginUser || '').replace('TOKIOMARINE\\', '').trim();
      if (account) setCurrentAccount(account);
      setIsImpersonating(String(window._isDebugMode || '').toLowerCase() === 'true');
      attempts += 1;
      if (account || attempts >= 40) window.clearInterval(timer);
    };
    const timer = window.setInterval(syncLoginContext, 250);
    syncLoginContext();
    return () => window.clearInterval(timer);
  }, []);

  const returnToAdminAccount = async () => {
    setReturningAccount(true);
    try {
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/Users/ReturnToAccount`, { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || 'Unable to return to Admin account.');
      window.location.replace(`${result.redirectUrl || '/Management'}?returned=${Date.now()}`);
    } catch (error) {
      notify({ content: error.message, type: 'error', position: 'bottom-right' });
      setReturningAccount(false);
    }
  };
  // Demo Notification: Delay 5 seconds on load then trigger toast
  // useEffect(() => {
  //   const testTimer = setTimeout(() => {
  //     notify({
  //       title: "Thông báo thử nghiệm! 🎉",
  //       content: "Đây là thông báo Toast tự động xuất hiện sau <b>5 giây</b> delay.<br/>Hỗ trợ định dạng HTML, tự đóng & click handler!",
  //       type: "success",
  //       position: "bottom-right",
  //       duration: 6000,
  //       onClick: (toast) => {
  //         notify("Bạn vừa click vào thông báo thử nghiệm! 🚀", "info");
  //       }
  //     });
  //   }, 5000);

  //   return () => clearTimeout(testTimer);
  // }, []);
  
// useEffect(() => {
//    const initialize = async () => {
//        const config = await fetch("../../appsettings.json")
//            .then(r => r.json());
//        setAppsettings(config);
//        const host = config.URLConfig.Host;
//        debugger
//        // Gọi API bằng host
//        loadOnlineUsers(host);
//       fetch(`${appsettings.UrlConfig.Host}/api/UsersSession/OnlineUsers`)
//         .then(response => {
//           if (!response.ok) throw new Error(`Online users failed (${response.status})`);
//           return response.json();
//         })
//         .then(users => {
//           setOnlineUsers(Array.isArray(users) ? users : []);
//           setOnlineUsersError('');
//         })
//         .catch(error => setOnlineUsersError(error?.message || 'Unable to load active users'))
//         .finally(() => setOnlineUsersLoading(false));
//    };
//    initialize();
// }, []);

        useEffect(() => {
            let activeUsersTimer;
    const loadOnlineUsers = () => {
      setOnlineUsersLoading(true);
      
      fetch(`${appsettings.UrlConfig.Host}/api/UsersSession/OnlineUsers`)
        .then(response => {
          if (!response.ok) throw new Error(`Online users failed (${response.status})`);
          return response.json();
        })
        .then(users => {
          setOnlineUsers(Array.isArray(users) ? users : []);
          setOnlineUsersError('');
        })
        .catch(error => setOnlineUsersError(error?.message || 'Unable to load active users'))
        .finally(() => setOnlineUsersLoading(false));
    };
    loadOnlineUsers();
    activeUsersTimer = setInterval(loadOnlineUsers, 15000);
    fetch(`${appsettings.UrlConfig.Host}/api/UsersSession/ExecuteCustomQuery`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify("1")
    })
    .then(r=>r.json())
    .then(data=>{
      let result=[];
      data.forEach(row=>{
        let month=row.Month || row.month;
        Object.keys(row).forEach(k=>{
          if(k.startsWith("h")){
            result.push({
              month,
              hour:parseInt(k.substring(1)),
              loginCount:Number(row[k])||0
            });
          }
        });
      });
      setLoginStats(result);
    });

    fetch(`${appsettings.UrlConfig.Host}/api/UsersSession/ExecuteCustomQuery`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify("2")
    })
    .then(r=>r.json())
    .then(d=>
      setDisk(d[0]?.availableSpace||0)
    );

    fetch(`${appsettings.UrlConfig.Host}/api/UsersSession/ExecuteCustomQuery`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify("3")
    })
    .then(r=>r.json())
    .then(d=>
      setTicketData(d || [])
    )
    .catch(err=>console.error("Fetch ticketData failed", err));

    fetch(`${appsettings.UrlConfig.Host}/api/CommentLog/GetSerilogHourlyToday`)
      .then(response => {
        if (!response.ok) throw new Error(`Serilog hourly count failed (${response.status})`);
        return response.json();
      })
      .then(rows => {
        setSerilogHourly((rows || []).map(row => {
          const hour = Number(row.hour ?? row.Hour) || 0;
          return {
            hour,
            label: `${String(hour).padStart(2, '0')}:00`,
            count: Number(row.count ?? row.Count) || 0
          };
        }));
      })
      .catch(error => {
        console.error('Load Serilog hourly count failed', error);
        setSerilogHourly([]);
      });

    Promise.all([
      fetch(`${appsettings.UrlConfig.Host}/api/ClientBrowserError/CountTrend?interval=day&take=30`),
      fetch(`${appsettings.UrlConfig.Host}/api/ErrorBrowserDetails/CountTrend?interval=day&take=30`)
    ])
      .then(async ([clientResponse, detailResponse]) => {
        if (!clientResponse.ok) throw new Error(`ClientBrowserError trend failed (${clientResponse.status})`);
        if (!detailResponse.ok) throw new Error(`ErrorBrowserDetails trend failed (${detailResponse.status})`);
        const [clientRows, detailRows] = await Promise.all([clientResponse.json(), detailResponse.json()]);
        return [
          ...(clientRows || []).map(row => ({ ...row, source: 'ClientBrowserError' })),
          ...(detailRows || []).map(row => ({ ...row, source: 'ErrorBrowserDetails' }))
        ];
      })
      .then(rows => {
        const buckets = new Map();
        (rows || []).forEach(row => {
          const time = row.time ?? row.Time;
          const source = row.source ?? row.Source;
          const count = Number(row.count ?? row.Count) || 0;
          const key = String(time || 'Unknown');
          if (!buckets.has(key)) {
            const parsedDate = new Date(time);
            buckets.set(key, {
              time: key,
              day: Number.isNaN(parsedDate.getTime()) ? key : parsedDate.toLocaleDateString([], { month: 'short', day: '2-digit' }),
              clientBrowserError: 0,
              errorBrowserDetails: 0
            });
          }
          const bucket = buckets.get(key);
          if (String(source).toLowerCase() === 'clientbrowsererror') bucket.clientBrowserError = count;
          if (String(source).toLowerCase() === 'errorbrowserdetails') bucket.errorBrowserDetails = count;
        });
        setTicketData(Array.from(buckets.values()).sort((a, b) => new Date(a.time) - new Date(b.time)));
      })
      .catch(error => {
        console.error('Load Ticket IT trend failed', error);
        setTicketData([]);
      });
    return () => clearInterval(activeUsersTimer);
  },[]);

  const userCount = useMemo(() => ({
    label: 'Người dùng hoạt động',
    value: String(onlineUsers.length),
    detail: onlineUsers.length ? 'SignalR sessions currently online' : 'No active SignalR session'
  }), [onlineUsers]);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'overview', label: 'Overview System' },
    { id: 'menudesigner', label: 'Menu' },
    { id: 'menu-grid', label: 'Menu List' },
    { id: 'systable', label: 'System Tables' } ,
    { id: 'users', label: 'Users' },
    { id: 'enum-design', label: 'Enum' },
    { id: 'enumdata-grid', label: 'Enum List' },
    { id: 'mail-template', label: 'Mail Template' },
    { id: 'mail-queue', label: 'Mail Queue' },
    { id: 'flowgrid', label: 'Workflow List' },
    { id: 'flow', label: 'Workflow Form' },
    { id: 'workflow-recover', label: 'Recover / Revise Flow' },
    { id: 'serilog', label: 'Serilogs' },
    { id: 'asplog', label: 'ASP.NET Local log' },
    { id: 'datagridfielddesigner', label: 'DataGrid' },
    { id: 'datagridconfig-grid', label: 'DataGrid List' },
    { id: 'notification-template', label: 'Notification Template' },
    { id: 'notification-designer', label: 'Notification Design' },
    { id: 'notification-grid', label: 'Notification Queue List' },
    { id: 'notification-hub', label: 'Notification Queue Detail' },
    { id: 'sladesigner', label: 'SLA' },
    { id: 'sql-stored', label: 'Stored Procedure Management' },
    { id: 'database-mgmt', label: 'Backup & Script Database' },
    { id: 'formfielddesigner', label: 'Views cshtml edit - Not working' },

  ];

  const systemStatus = useMemo(() => [
    { name: 'Cơ sở dữ liệu (Database)', value: 'Kết nối tốt', state: 'online' },
    { name: 'Dịch vụ Email (Mail Service)', value: 'Hoạt động', state: 'online' },
    { name: 'Liên kết LDAP', value: 'Hoạt động', state: 'online' }
  ], []);

  const alerts = useMemo(() => [
    { title: 'Phát hiện đăng nhập bất thường từ IP 192.168.1.100', time: '10 phút trước' },
    { title: 'Hàng đợi mail vượt quá 100 email chưa gửi', time: '30 phút trước' },
    { title: 'Bộ nhớ đệm Redis sắp đầy', time: '1 giờ trước' }
  ], []);

  const content = useMemo(() => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewPanel
            cards={[userCount, { label: 'Dung lượng đĩa khả dụng', value: `${disk} GB`, detail: 'Trạng thái lưu trữ' }]}
            systemStatus={systemStatus}
            alerts={alerts}
          />
        );
      case 'users':
        return <UserManagement />;
      case 'mail-template':
        return <MailTemplateDesigner />;
      case 'mail-queue':
        return <MailQueue />;
      case 'flow':
        return <Flow id={selectedWorkflowId} />;
      case 'flowgrid':
        return (
          <CustomGrid
            modelName="WorkflowDefinition"
            apiBaseUrl={appsettings.UrlConfig.Host}
            onRowClick={(row) => {
              const rowId = row.id || row.Id;
              if (rowId) {
                setSelectedWorkflowId(rowId);
                setActiveSection('flow');
              }
            }}
            onDesignFlow={(row) => {
              const rowId = row.id || row.Id;
              if (rowId) {
                setSelectedWorkflowId(rowId);
                setActiveSection('flow');
              }
            }}
          />
        );
      case 'workflow-recover':
        return <WorkflowRecover />;
      case 'serilog':
        return <SerilogViewer />;
      case 'asplog':
        return <AspLogViewer />;
      case 'systable':
        return <SysTable />;
      case 'sql-stored':
        return <SqlStoredProcedure />;
      case 'database-mgmt':
        return <DatabaseManagement />;
      case 'datagridfielddesigner':
        return <DataGridFieldDesigner />;
      case 'formfielddesigner':
        return (
          <div style={{ width: "100%", height: "calc(100vh - 120px)", overflow: "hidden", background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
            <iframe 
              src={`${appsettings.UrlConfig.Host}/Config/FormFieldDesign`} 
              style={{ width: "100%", height: "100%", border: "none" }} 
              title="Form Field Designer"
            />
          </div>
        );
      case 'datagridconfig-grid':
        return <CustomGrid modelName="DataGridConfig" gridType="System" apiBaseUrl={appsettings.UrlConfig.Host} editMode="batch" />;
      case 'menudesigner':
        return <MenuDesigner />;
      case 'menu-grid':
        return <CustomGrid modelName="Menu" gridType="System" apiBaseUrl={appsettings.UrlConfig.Host} editMode="batch" />;
      case 'enum-design':
        return <EnumDesign />;
      case 'enumdata-grid':
        return <CustomGrid modelName="EnumData" gridType="System" apiBaseUrl={appsettings.UrlConfig.Host} editMode="batch" />;
      case 'notification-grid':
        return <CustomGrid modelName="Notification" gridType="System" apiBaseUrl={appsettings.UrlConfig.Host} editMode="batch" />;
      case 'notification-hub':
        return <NotificationHub />;
      case 'notification-template':
        return <NotificationTemplate />;
      case 'notification-designer':
        return <NotificationTemplateDesigner />;
      case 'sladesigner':
        return <SlaDesign />;
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
            <ChartPanel
              serilogData={serilogHourly}
              ticketData={ticketData}
              loginStats={loginStats}
              disk={disk}
            />
            <ActiveUsersPanel users={onlineUsers} loading={onlineUsersLoading} error={onlineUsersError} />
          </>
        );
    }
  }, [activeSection, selectedWorkflowId, disk, loginStats, ticketData, serilogHourly, onlineUsers, onlineUsersLoading, onlineUsersError, userCount]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand">Admin Config</div>
          <details className="admin-context-dropdown">
            <summary title="Current login context">
              <span className="admin-context-avatar">{(currentAccount || '?').slice(0, 1).toUpperCase()}</span>
              <span className="admin-context-name">{currentAccount || 'Loading...'}</span>
              <span className="admin-context-arrow">▾</span>
            </summary>
            <div className="admin-context-menu">
              <small>Current login context</small>
              <strong>{currentAccount || 'Unknown account'}</strong>
              <span className={isImpersonating ? 'impersonating' : ''}>{isImpersonating ? 'Login as context' : 'Admin account'}</span>
              {isImpersonating && <button type="button" disabled={returningAccount} onClick={returnToAdminAccount}>{returningAccount ? 'Returning...' : 'Back to Admin'}</button>}
            </div>
          </details>
        </div>
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
        {content}
      </main>
      <ToastContainer />
    </div>
  );
}

export default App;
