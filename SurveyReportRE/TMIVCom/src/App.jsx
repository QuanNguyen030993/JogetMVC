import React, { useEffect, useRef, useState } from 'react';
import CustomGrid from './components/CustomGrid';
import HtmlEditor from './components/HtmlEditor';
import DateBox from './components/DateBox';
import CommentEditor from './components/CommentEditor';
import CommentEditorRoute from './components/CommentEditorRoute';
import TextBox from './components/TextBox';
import NumberBox from './components/NumberBox';
import CheckBox from './components/CheckBox';
import SelectBox from './components/SelectBox';
import DropDownBox from './components/DropDownBox';
import CustomForm from './components/CustomForm';
import FileUploader from "./components/FileUploader";
import { notify } from './components/Notification';
  

          


import './css/com.all.css';
import "./fonts/css/all.min.css";
const departmentEnum = [
  { id: 1, key: 'HR', value: 'Human Resources' },
  { id: 2, key: 'DEV', value: 'Development Team' },
  { id: 3, key: 'QA', value: 'Quality Assurance' }
];

const projectsTable = [
  { Id: 101, name: 'Joget Survey Module', client: 'Joget Inc.' },
  { Id: 102, name: 'SurveyReport MVC API', client: 'TMIV Inc.' },
  { Id: 103, name: 'DevExpress Migration', client: 'internal' }
];

const demoFormFields = [
  { dataField: 'name', caption: 'Full Name', formDataType: 'string', defaultValue: "'John Doe'", validationRules: [{ type: 'required', message: 'Name is required' }] },
  { dataField: 'age', caption: 'Age', formDataType: 'number', defaultValue: 30, colSpan: 1 },
  { dataField: 'active', caption: 'Is Active', formDataType: 'boolean', defaultValue: true, colSpan: 1 },
  { 
    dataField: 'deptId', 
    caption: 'Department', 
    formDataType: 'enum', 
    defaultValue: 2,
    lookup: {
      dataSource: departmentEnum,
      valueExpr: 'id',
      displayExpr: 'value'
    }
  },
  {
    dataField: 'projectId',
    caption: 'Project Assigned',
    formDataType: 'table',
    defaultValue: 101,
    lookup: {
      dataSource: projectsTable,
      valueExpr: 'Id',
      displayExpr: 'name',
      columns: ['Id', 'name', 'client']
    },
    editorOptions: {
      dataSource: projectsTable,
      valueExpr: 'Id',
      displayExpr: 'name',
      columns: ['Id', 'name', 'client']
    }
  },
  { dataField: 'bio', caption: 'Biography', formDataType: 'textarea', colSpan: 2, height: '80px' }
];

const defaultRows = [
  { id: 1, name: 'Alice', role: 'Developer', age: 28, active: true, deptId: 2, projectId: 101 },
  { id: 2, name: 'Bob', role: 'Designer', age: 34, active: false, deptId: 1, projectId: 102 },
  { id: 3, name: 'Charlie', role: 'QA', age: 25, active: true, deptId: 3, projectId: 103 },
];

const gridColumns = [
  { dataField: 'id', caption: 'ID', dataType: 'number', visible: false, width: '60px' },
  { dataField: 'name', caption: 'Name', dataType: 'string' },
  { dataField: 'role', caption: 'Role', dataType: 'string' },
  { dataField: 'age', caption: 'Age', dataType: 'number' },
  { dataField: 'active', caption: 'Active', dataType: 'boolean' },
  { 
    dataField: 'deptId', 
    caption: 'Department (Enum)', 
    dataType: 'enum',
    lookup: {
      dataSource: departmentEnum,
      valueExpr: 'id',
      displayExpr: 'value',
      itemTemplate: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: item.key === 'HR' ? '#f43f5e' : item.key === 'DEV' ? '#10b981' : '#3b82f6'
          }} />
          <strong>{item.key}</strong> - <span style={{ color: '#64748b' }}>{item.value}</span>
        </div>
      )
    }
  },
  // {
  //   dataField: 'projectId',
  //   caption: 'Project (Table)',
  //   dataType: 'table',
  //   lookup: {
  //     dataSource: projectsTable,
  //     valueExpr: 'Id',
  //     displayExpr: 'name',
  //     columns: ['Id', 'name', 'client']
  //   },
  //   editorOptions: {
  //     dataSource: projectsTable,
  //     valueExpr: 'Id',
  //     displayExpr: 'name',
  //     columns: ['Id', 'name', 'client']
  //   }
  // }
];


  
function App() {
  const [rows, setRows] = useState(defaultRows);
  const [editorValue, setEditorValue] = useState('');
  const [textValue, setTextValue] = useState('Hello World');
  const [numberValue, setNumberValue] = useState(42);
  const [checkValue, setCheckValue] = useState(true);
  const [selectValue, setSelectValue] = useState(2);
  const [dropValue, setDropValue] = useState(101);

  const [countdown, setCountdown] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);

  // Live countdown timer logic
  useEffect(() => {
    if (countdown <= 0) {
      if (!isTriggered) {
        setIsTriggered(true);
        notify({
          title: "TMIVCom Countdown Event Triggered! 🚀",
          content: "Đồng hồ đếm ngược vừa về <b>0 giây</b>!<br/>Thông báo Toast loại <b>Success</b> đã được phát thành công.",
          type: "success",
          position: "bottom-right",
          duration: 6000,
          onClick: () => {
            notify("Bạn vừa click vào Toast từ sự kiện đếm ngược! 🌟", "info");
          }
        });
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isTriggered]);

  const restartTimer = () => {
    setIsTriggered(false);
    setCountdown(5);
    notify("Đã khởi động lại đồng hồ đếm ngược 5 giây! ⏱️", "info", 2000);
  };


    const uploaderRef = useRef(null);

    const demoDepartments = [
        { id: 'UW', name: 'Phòng Bảo hiểm (Underwriting)' },
        { id: 'CLAIM', name: 'Phòng Bồi thường (Claims)' },
        { id: 'IT', name: 'Phòng Công nghệ thông tin (IT)' },
        { id: 'FIN', name: 'Phòng Kế toán tài chính (Finance)' }
    ];

    const [routeComments, setRouteComments] = useState([
        {
            id: 1,
            author: 'Nguyễn Văn A',
            role: 'Chuyên viên UW',
            text: 'Đã hoàn thành thẩm định sơ bộ, đề xuất chuyển phòng bồi thường xem xét lịch sử tổn thất.',
            time: '14:20',
            toDepartment: 'Phòng Bồi thường (Claims)'
        },
        {
            id: 2,
            author: 'Trần Thị B',
            role: 'Trưởng nhóm Claims',
            text: 'Đã kiểm tra lịch sử tổn thất của khách hàng, đề xuất chuyển phòng IT hỗ trợ cấu hình hệ thống tính phí đặc thù.',
            time: '15:45',
            toDepartment: 'Phòng Công nghệ thông tin (IT)'
        }
    ]);

    const [formData] = useState({
        ModuleName: "PolicyIssuance",
        code: "POL001",
        SectionName: "Underwriting"
    });

    const handleUploaded = () => {
        console.log("Upload thành công");
    };

    const handleDeleted = (file) => {
        console.log("Đã xóa:", file);
    };

    const handleChange = (files) => {
        console.log("Danh sách file hiện tại:", files);
    };

    const getFiles = () => {
        const files = uploaderRef.current?.value();
        console.log(files);
    };

    const refreshFiles = () => {
        uploaderRef.current?.refresh();
    };


  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([...rows, { id: nextId, name: '', role: '', age: 18, active: false, deptId: 1, projectId: 101 }]);
  };

  return (
    <div className="tmivcom-app">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>TMIVCom Reusable Controls</h1>
          <p>Custom React controls for ASP.NET integration: grid and HTML editor.</p>
        </div>

        {/* Live Countdown Timer Widget */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          borderRadius: '10px',
          background: countdown > 0 ? '#1e293b' : '#059669',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '20px' }}>⏱️</div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Đồng hồ sự kiện Toast
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {countdown > 0 ? (
                <span>Đang đếm ngược: <span style={{ color: '#fbbf24', fontSize: '18px' }}>{countdown} giây</span></span>
              ) : (
                <span>🎉 Đã phát Toast thành công!</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={restartTimer}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            {countdown > 0 ? "Reset 5s" : "Kích hoạt lại (5s)"}
          </button>
        </div>
      </header>

      <section className="section">
        <div className="section-title">Custom Grid - DARK Mode (Mockup Style, drag rows, selection, compact)</div>
        <div style={{ padding: '16px', background: '#1e293b', borderRadius: '8px' }}>
          <CustomGrid
            columns={gridColumns}
            rows={rows}
            onRowsChange={setRows}
            onAddRow={addRow}
            theme="dark"
            allowRowReordering={true}
            showSelectionCheckbox={true}
            showCommandsColumn={true}
          />
        </div>
      </section>
      <section className="section">
        <div className="section-title">File Uploader</div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <FileUploader
            ref={uploaderRef}
            guid="3b6f39cc-8a18-4ce3-a8d2-cceb2757a111"
            data={formData}
            specificFolder="QuotationDoc"
            controllerName="Document"
            titleName="Upload tài liệu"
            multiple={true}
            maxFileSize={20 * 1024 * 1024}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
            onUploaded={handleUploaded}
            onDeleted={handleDeleted}
            onChange={handleChange}
          />
        </div>
      </section>

 <section className="section">
        <div className="section-title">Comment Editor </div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <CommentEditor
           value = 'hello'
          placeholder = 'Add comment...'
          emptyText = 'No comments.'
          submitLabel = 'Send'
          headerTitle = 'Comments'
          headerSubtitle = ''
          authorName = 'You'
          roleName = 'Contributor'
          className = ''/>
        </div>
      </section>


      <section className="section">
        <div className="section-title">Comment Editor & Route (Ý kiến và Định hướng chuyển phòng ban)</div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <CommentEditorRoute
            items={routeComments}
            departments={demoDepartments}
            valueExpr="id"
            displayExpr="name"
            routePlaceholder="Chọn phòng ban cần định hướng giải quyết..."
            routeLabel="Định hướng xử lý:"
            onSubmit={(newComment, nextComments) => {
              setRouteComments(nextComments);
              notify(`Đã lưu ý kiến định hướng đến <b>${newComment.toDepartment}</b>!`, "success");
            }}
          />
        </div>
      </section>


{/* 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section className="section">
          <div className="section-title">Text Box</div>
          <TextBox value={textValue} onChange={setTextValue} placeholder="Type something..." />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>Current Value: "{textValue}"</p>
        </section>

        <section className="section">
          <div className="section-title">Number Box</div>
          <NumberBox value={numberValue} onChange={setNumberValue} placeholder="Enter number..." />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>Current Value: {numberValue}</p>
        </section>

        <section className="section">
          <div className="section-title">Check Box</div>
          <CheckBox value={checkValue} onChange={setCheckValue} text="Enable Developer Mode" />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>Current Status: {checkValue ? 'Checked (True)' : 'Unchecked (False)'}</p>
        </section>

        <section className="section">
          <div className="section-title">Select Box (Enum)</div>
          <SelectBox 
            value={selectValue} 
            onChange={setSelectValue} 
            dataSource={departmentEnum} 
            valueExpr="id" 
            displayExpr="value" 
            itemTemplate={(item) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: item.key === 'HR' ? '#f43f5e' : item.key === 'DEV' ? '#10b981' : '#3b82f6'
                }} />
                <strong>{item.key}</strong> - {item.value}
              </div>
            )}
          />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>Selected ID: {selectValue}</p>
        </section>

        <section className="section">
          <div className="section-title">Drop Down Box (Table Grid popup)</div>
          <DropDownBox 
            value={dropValue} 
            onChange={setDropValue} 
            dataSource={projectsTable} 
            columns={['Id', 'name', 'client']}
            valueExpr="Id" 
            displayExpr="name" 
          />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>Selected ID: {dropValue}</p>
        </section>
      </div>

      <section className="section">
        <div className="section-title">HTML Editor</div>
        <HtmlEditor value={editorValue} onChange={setEditorValue} />
      </section>

      <section className="section">
        <div className="section-title">Date box</div>
        <DateBox value={editorValue} onChange={setEditorValue} />
      </section>

      <section className="section">
        <div className="section-title">Comment Editor</div>
        <CommentEditor onChange={setEditorValue} />
      </section>

      <section className="section">
        <div className="section-title">Custom Form (Dynamic MForm Simulation)</div>
        <CustomForm
          id={0}
          formConfig={{
            originModelName: "Employee",
            colCount: 2,
            labelLocation: "top",
            allowFormActionButton: true
          }}
          columns={demoFormFields}
          onSaveSuccess={(data) => console.log("Form Saved successfully:", data)}
          onClose={() => alert("Form closed")}
        />
      </section> */}
    </div>
  );
}

export default App;
