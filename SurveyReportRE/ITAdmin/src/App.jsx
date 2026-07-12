import { useCallback, useEffect, useState,useMemo  } from 'react';
import { API_BASE_URL } from './config';

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
import CustomGrid from '../../TMIVCom/src/components/CustomGrid'
import './styles/flow.css';
import './styles/com.all.css';
import './styles/serilogs.css';
import './styles/systable.css';
import './styles/datagridfielddesigner.css';
import './styles/mailtemplatedesigner.css'
import './styles/mailqueue.css';
import './styles/menudesigner.css';
import './styles/sladesigner.css';
import "./fonts/css/all.min.css";

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
  const [loginStats,setLoginStats]=useState([]);
  const [disk,setDisk]=useState(0);
   
  useEffect(()=>{
    fetch(`${API_BASE_URL}/api/UsersSession/ExecuteCustomQuery`,{
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

    fetch(`${API_BASE_URL}/api/UsersSession/ExecuteCustomQuery`,{
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
  },[]);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Bảng điều khiển (Dashboard)' },
    { id: 'overview', label: 'Tổng quan hệ thống (Overview)' },
    { id: 'users', label: 'Quản lý người dùng (Users)' },
    { id: 'mail-template', label: 'Cấu hình mẫu Email' },
    { id: 'mail-queue', label: 'Hàng đợi Email' },
    { id: 'flow', label: 'Luồng quy trình (Flow)' },
    { id: 'flowgrid', label: 'Luồng quy trình (Flow Grid)' },
    { id: 'workflow-recover', label: 'Recover / Revise Flow' },
    { id: 'serilog', label: 'Nhật ký hệ thống (Serilogs)' },
    { id: 'systable', label: 'Bảng hệ thống' } ,
    { id: 'datagridfielddesigner', label: 'Thiết kế trường DataGrid' },
    { id: 'datagridconfig-grid', label: 'Bảng DataGrid Config (CustomGrid)' },
    { id: 'menudesigner', label: 'Thiết kế Menu' },
    { id: 'menu-grid', label: 'Bảng Menu (CustomGrid)' },
    { id: 'enum-design', label: 'Cấu hình danh mục Enum' },
    { id: 'enumdata-grid', label: 'Bảng Enum Data (CustomGrid)' },
    { id: 'sladesigner', label: 'Cấu hình chỉ số SLA' }
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
            apiBaseUrl={API_BASE_URL}
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
      case 'systable':
        return <SysTable />;
      case 'datagridfielddesigner':
        return <DataGridFieldDesigner />;
      case 'datagridconfig-grid':
        return <CustomGrid modelName="DataGridConfig" apiBaseUrl={API_BASE_URL} editMode="batch" />;
      case 'menudesigner':
        return <MenuDesigner />;
      case 'menu-grid':
        return <CustomGrid modelName="Menu" apiBaseUrl={API_BASE_URL} editMode="batch" />;
      case 'enum-design':
        return <EnumDesign />;
      case 'enumdata-grid':
        return <CustomGrid modelName="EnumData" apiBaseUrl={API_BASE_URL} editMode="batch" />;
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
              cpuData={cpuData}
              ticketData={ticketData}
              loginStats={loginStats}
              disk={disk}
            />
          </>
        );
    }
  }, [activeSection, selectedWorkflowId, disk, loginStats]);

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
            <h1>Administrator</h1>
          </div>
        </header>

        {content}
      </main>
    </div>
  );
}

export default App;
