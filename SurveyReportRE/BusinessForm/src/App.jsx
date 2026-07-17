import { useCallback, useEffect, useState,useMemo  } from 'react';
import { API_BASE_URL } from './config';

import WorkloadChart from './components/WorkloadChart';
// import MailTemplateDesigner from './components/MailTemplateDesigner';
// import MailQueue from './components/MailQueue';
import Flow from './components/Flow';
import SerilogViewer from './components/SerilogViewer';
import AspLogViewer from './components/AspLogViewer';
// import SysTable from './components/SysTable';
// import DataGridFieldDesigner from './components/DataGridFieldDesigner';
// import MenuDesigner from './components/MenuDesigner';
// import UserManagement from './components/UserManagement';
// import OverviewPanel from './components/OverviewPanel';
// import EnumDesign from './components/EnumDesign';
// import SlaDesign from './components/SlaDesign';
// import CustomGrid from '../../TMIVCom/src/components/CustomGrid'
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




// function App() {
//   // const [loginStats,setLoginStats]=useState([]);
//   //  const [disk,setDisk]=useState(0);
//   //  const [selectedWorkflowId, setSelectedWorkflowId] = useState(11);
//   //     const [selectedWorkflowGuid, setSelectedWorkflowGuid] = useState("00cf6f4b-1228-40f6-bd4b-45b1daf996b3");
//   //       return <Flow id={selectedWorkflowId} guid={selectedWorkflowGuid} />;
//  const [department, setDepartment] = useState("All");
//   const [documentType, setDocumentType] = useState("All");

//   const rawData = [
//     { department: "FO", type: "Quotation", status: "Pending", count: 14 },
//     { department: "FO", type: "Quotation", status: "Completed", count: 35 },
//     { department: "FO", type: "Quotation", status: "Rejected", count: 3 },

//     { department: "FO", type: "PolicyIssuance", status: "Pending", count: 8 },
//     { department: "FO", type: "PolicyIssuance", status: "Completed", count: 21 },

//     { department: "TS", type: "Quotation", status: "Pending", count: 12 },
//     { department: "TS", type: "Quotation", status: "Completed", count: 28 },

//     { department: "TS", type: "PolicyIssuance", status: "Pending", count: 10 },
//     { department: "TS", type: "PolicyIssuance", status: "Completed", count: 17 },

//     { department: "UW", type: "Quotation", status: "Pending", count: 25 },
//     { department: "UW", type: "Quotation", status: "Completed", count: 90 },

//     { department: "UW", type: "PolicyIssuance", status: "Pending", count: 15 },
//     { department: "UW", type: "PolicyIssuance", status: "Completed", count: 40 },

//     { department: "PM", type: "Quotation", status: "Pending", count: 6 },
//     { department: "PM", type: "Quotation", status: "Completed", count: 12 },

//     { department: "PM", type: "PolicyIssuance", status: "Pending", count: 5 },
//     { department: "PM", type: "PolicyIssuance", status: "Completed", count: 18 }
//   ];
// const memberData = [
//   {
//     department: "FO",
//     member: "Nguyen Van A",
//     quotation: 35,
//     policyIssuance: 12
//   },
//   {
//     department: "FO",
//     member: "Tran Van B",
//     quotation: 24,
//     policyIssuance: 18
//   },
//   {
//     department: "TS",
//     member: "Le Thi C",
//     quotation: 50,
//     policyIssuance: 10
//   },
//   {
//     department: "UW",
//     member: "Pham Van D",
//     quotation: 80,
//     policyIssuance: 35
//   },
//   {
//     department: "UW",
//     member: "Nguyen Van E",
//     quotation: 65,
//     policyIssuance: 20
//   },
//   {
//     department: "PM",
//     member: "Tran Thi F",
//     quotation: 18,
//     policyIssuance: 8
//   }
// ];
//   const filteredData = useMemo(() => {
//     return rawData.filter(
//       (x) =>
//         (department === "All" || x.department === department) &&
//         (documentType === "All" || x.type === documentType)
//     );
//   }, [rawData, department, documentType]);

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Operation Dashboard</h2>

//       <div
//         style={{
//           display: "flex",
//           gap: 12,
//           marginBottom: 20
//         }}
//       >
//         <select
//           value={department}
//           onChange={(e) => setDepartment(e.target.value)}
//         >
//           <option>All</option>
//           <option>FO</option>
//           <option>TS</option>
//           <option>UW</option>
//           <option>PM</option>
//         </select>

//         <select
//           value={documentType}
//           onChange={(e) => setDocumentType(e.target.value)}
//         >
//           <option>All</option>
//           <option>Quotation</option>
//           <option>PolicyIssuance</option>
//         </select>
//       </div>

//       <WorkloadChart data={filteredData} memberData={memberData}/>
//     </div>
//   );
// }
import data from "../data/data.json";

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Báo cáo công việc (Dashboard)' },
    { id: 'serilog', label: 'Nhật ký hệ thống (Serilogs)' },
    { id: 'asplog', label: 'Nhật ký ứng dụng (ASP Log)' },
    { id: 'diagram', label: 'Diagram' }
  ];

  const content = useMemo(() => {
    switch (activeSection) {
      case 'serilog':
        return <SerilogViewer />;
      case 'asplog':
        return <AspLogViewer />;
      case 'diagram':
        return <Flow id={11} guid="6c5c0375-f255-49f7-aaec-c17ce778fe53"/>;
      case 'dashboard':
      default:
        return <WorkloadChart data={data} />;
    }
  }, [activeSection]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" style={{ padding: "0 0 10px 0", borderBottom: "1px solid #1f2937" }}>
          <i className="fas fa-chart-line" style={{ marginRight: 8, color: "#3b82f6" }}></i>
          Joget Survey
        </div>
        <nav style={{ marginTop: 20 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeSection ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "12px 14px",
                marginBottom: "8px",
                background: item.id === activeSection ? "#1f2937" : "transparent",
                color: "#f9fafb",
                borderRadius: "10px",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {item.id === 'dashboard' && <i className="fas fa-tachometer-alt" style={{ width: 18 }}></i>}
              {item.id === 'serilog' && <i className="fas fa-database" style={{ width: 18 }}></i>}
              {item.id === 'asplog' && <i className="fas fa-file-alt" style={{ width: 18 }}></i>}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content" style={{ background: "#f5f6fa", flex: 1, minHeight: "100vh" }}>
        <header className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "#1e293b" }}>
            {menuItems.find(m => m.id === activeSection)?.label}
          </h1>
        </header>

        <div style={{ flex: 1 }}>
          {content}
        </div>
      </main>
    </div>
  );
}

export default App;