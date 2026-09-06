import React, { useEffect, useRef, useState } from 'react';
import CustomGrid from './components/CustomGrid';
import HandsomGrid from './components/HandsomGrid';
import HtmlEditor from './components/HtmlEditor';
import DateBox from './components/DateBox';
import TimeBox from './components/TimeBox';
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
import { startTour, exportTour } from './components/TourGuide';
  

          


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
  { dataField: 'name', caption: 'Name', dataType: 'string', width: 170, minWidth: 120, fixed: true, bandPath: ['Identity'], validationRules: [{ type: 'required', message: 'Name is required' }, { type: 'stringLength', min: 2, max: 80 }] },
  { dataField: 'role', caption: 'Role', dataType: 'string', width: 150, bandPath: ['Identity'], hidingPriority: 3 },
  { dataField: 'age', caption: 'Age', dataType: 'number', width: 100, bandPath: ['Profile'], hidingPriority: 1, validationRules: [{ type: 'range', min: 18, max: 100, message: 'Age must be between 18 and 100' }] },
  { dataField: 'active', caption: 'Active', dataType: 'boolean', width: 100, bandPath: ['Profile'], hidingPriority: 2 },
  { 
    dataField: 'deptId', 
    caption: 'Department (Enum)', 
    dataType: 'enum',
    width: 210,
    bandPath: ['Organization'],
    hidingPriority: 4,
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
          content: "Countdown timer reached <b>0 seconds</b>!<br/>A <b>Success</b> toast notification has been dispatched.",
          type: "success",
          position: "bottom-right",
          duration: 6000,
          onClick: () => {
            notify("You clicked the countdown toast! 🌟", "info");
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
    notify("Event countdown timer reset to 5 seconds! ⏱️", "info", 2000);
  };

  const tourSteps = [
    {
      element: '.header h1',
      title: 'Welcome to TMIVCom! 👋',
      content: 'This is the reusable controls library customized for the SurveyReportRE project (HTML Format).',
      position: 'bottom'
    },
    {
      element: '#tour-timer-widget',
      title: 'Event Countdown Widget ⏱️',
      content: 'A live timer that automatically triggers a status notification toast after 5 seconds.',
      position: 'bottom'
    },
    {
      element: '#tour-customgrid-section',
      title: 'Modern CustomGrid 📊',
      content: 'An advanced data grid supporting row reordering, column selection, paging, and inline editing.',
      position: 'top'
    },
    {
      element: '#tour-handsomgrid-section',
      title: 'HandsomGrid (Spreadsheet Excel Style) 📝',
      content: 'A lightweight spreadsheet grid supporting:\n- Arrow keys navigation\n- Direct cell editing using `Enter` or `F2`\n- Copy & Paste from/to Excel using `Ctrl+C` and `Ctrl+V` keyboard shortcuts',
      position: 'top'
    },
    {
      element: '#tour-uploader-section',
      title: 'File Uploader Dropzone 📎',
      content: 'Supports drag-and-drop, custom file type icons, previews, downloading, and file deletion.',
      position: 'top'
    },
    {
      element: '#tour-comments-section',
      title: 'Comment Editor & Route 💬',
      content: 'Enables typing feedback and routing task workflow to next designated departments.',
      position: 'top'
    }
  ];

  const runTourGuide = () => {
    startTour(tourSteps, {
      isAdmin: true,
      onComplete: () => notify("Congratulations! You have completed the walkthrough. 🎉", "success"),
      onExit: () => notify("Exited the walkthrough.", "info")
    });
  };

  const runTourGuideJQuery = () => {
    if (typeof $ !== "undefined" || window.jQuery) {
      const jQueryInstance = typeof $ !== "undefined" ? $ : window.jQuery;
      jQueryInstance(document).tmivtourguide(tourSteps, {
        isAdmin: true,
        onExit: () => notify("Exited JQuery Tour.", "info")
      });
    } else {
      notify("JQuery has not been loaded on this page!", "error");
    }
  };

  const handleExport = (format) => {
    exportTour(tourSteps, format, 'system-onboarding-guide');
    notify(`Exported user guide in <b>${format.toUpperCase()}</b> format successfully! 💾`, "success");
  };


    const uploaderRef = useRef(null);

    const demoDepartments = [
        { id: 'UW', name: 'Underwriting Department (UW)' },
        { id: 'CLAIM', name: 'Claims Department (CLAIM)' },
        { id: 'IT', name: 'IT Department (IT)' },
        { id: 'FIN', name: 'Finance Department (FIN)' }
    ];

    const [routeComments, setRouteComments] = useState([
        {
            id: 1,
            author: 'Nguyen Van A',
            role: 'Underwriting Specialist',
            text: 'Preliminary underwriting completed. Recommend routing to Claims to review loss history.',
            time: '14:20',
            toDepartment: 'Claims Department'
        },
        {
            id: 2,
            author: 'Tran Thi B',
            role: 'Claims Lead',
            text: 'Checked loss history. Routing to IT to configure custom premium calculations.',
            time: '15:45',
            toDepartment: 'IT Department'
        }
    ]);

    const [formData] = useState({
        ModuleName: "PolicyIssuance",
        code: "POL001",
        SectionName: "Underwriting"
    });

    const handsomGridColumns = [
        { dataField: 'code', caption: 'Mã số', dataType: 'string', width: '100px' },
        { dataField: 'name', caption: 'Tên nhân sự', dataType: 'string', width: '180px' },
        { dataField: 'salary', caption: 'Lương (USD)', dataType: 'number', width: '120px' },
        { dataField: 'active', caption: 'Đang hoạt động', dataType: 'boolean', width: '120px' },
        { 
            dataField: 'deptId', 
            caption: 'Phòng ban', 
            dataType: 'lookup',
            width: '200px',
            lookup: {
                dataSource: [
                    { id: 'UW', name: 'Phòng Bảo hiểm' },
                    { id: 'CLAIM', name: 'Phòng Bồi thường' },
                    { id: 'IT', name: 'Phòng CNTT' }
                ],
                valueExpr: 'id',
                displayExpr: 'name'
            }
        }
    ];

    const [handsomRows, setHandsomRows] = useState([
        { code: 'NV-001', name: 'Nguyễn Văn UW', salary: 1200, active: true, deptId: 'UW' },
        { code: 'NV-002', name: 'Trần Thị Claim', salary: 1400, active: false, deptId: 'CLAIM' },
        { code: 'NV-003', name: 'Lê Văn IT', salary: 1800, active: true, deptId: 'IT' }
    ]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div>
            <h1>TMIVCom Reusable Controls</h1>
            <p>Custom React controls for ASP.NET integration: grid and HTML editor.</p>
          </div>
          <button
            type="button"
            onClick={runTourGuide}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🚀 Start Tour
          </button>
          <button
            type="button"
            onClick={runTourGuideJQuery}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔌 Run Tour (JQuery)
          </button>
        </div>

        {/* Live Countdown Timer Widget */}
        <div id="tour-timer-widget" style={{
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
              Toast Event Timer
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {countdown > 0 ? (
                <span>Counting down: <span style={{ color: '#fbbf24', fontSize: '18px' }}>{countdown}s</span></span>
              ) : (
                <span>🎉 Toast triggered successfully!</span>
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
            {countdown > 0 ? "Reset 5s" : "Reactivate (5s)"}
          </button>
        </div>
      </header>

      {/* Onboarding Exporter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '12px 20px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '25px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
          📦 Export User Manual:
        </span>
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #ef4444',
            background: '#fef2f2',
            color: '#dc2626',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📕 In/Tải PDF
        </button>
        <button
          type="button"
          onClick={() => handleExport('html-slides')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #f59e0b',
            background: '#fffbeb',
            color: '#d97706',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🖥️ Tải Slide Trình chiếu (PPTX/HTML)
        </button>
        <button
          type="button"
          onClick={() => handleExport('docx')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            background: '#f0f9ff',
            color: '#0369a1',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📘 Tải DOCX (Word)
        </button>
        <button
          type="button"
          onClick={() => handleExport('markdown')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #22c55e',
            background: '#f0fdf4',
            color: '#16a34a',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📄 Tải Markdown (.md)
        </button>
        <button
          type="button"
          onClick={() => handleExport('html-doc')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #3b82f6',
            background: '#eff6ff',
            color: '#2563eb',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🌐 Tải HTML Manual
        </button>
      </div>

      <section className="section" id="tour-customgrid-section">
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
        <div className="section-title">CustomGrid Modular Engine — Phase 4 (Advanced Column Layout)</div>
        <CustomGrid
          architecture="modular"
          columns={gridColumns}
          rows={rows}
          keyExpr="id"
          height={320}
          showBorders
          rowAlternationEnabled
          hoverStateEnabled
          columnAutoWidth
          allowColumnReordering
          allowColumnResizing
          columnResizingMode="widget"
          columnChooser={{ enabled: true, mode: 'dragAndDrop', searchable: true, allowSelectAll: true, title: 'Choose columns' }}
          responsive={{ enabled: true, padding: 254 }}
          sorting={{ mode: 'multiple' }}
          searchPanel={{ visible: true, placeholder: 'Search all columns...', debounce: 200, highlightSearchText: true }}
          filterRow={{ visible: true }}
          headerFilter={{ visible: true, searchable: true }}
          groupPanel={{ visible: true, allowColumnDragging: true }}
          grouping={{ autoExpandAll: true, allowCollapsing: true }}
          summary={{ totalItems: [{ type: 'count', displayFormat: 'Total: {0} rows' }] }}
          editing={{ mode: 'batch', allowAdding: true, allowUpdating: true, allowDeleting: true, confirmDelete: false, newRowPosition: 'first' }}
          onRowsChange={setRows}
          selection={{ mode: 'multiple', showCheckBoxes: true, selectAllMode: 'allPages' }}
          paging={{ pageSize: 2 }}
          pager={{ allowedPageSizes: [2, 10, 20, 50], showPageSizeSelector: true, showInfo: true }}
          rowNumber={{ visible: true, mode: 'absolute' }}
        />
      </section>

      <section className="section" id="tour-handsomgrid-section">
        <div className="section-title">HandsomGrid (Spreadsheet Excel Style - Di chuyển phím mũi tên, Enter để sửa, Ctrl+C/V để copy paste)</div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <HandsomGrid
            columns={handsomGridColumns}
            rows={handsomRows}
            onRowsChange={setHandsomRows}
            theme="light"
            height="300px"
          />
        </div>
      </section>

      <section className="section" id="tour-handsomgrid-section">
        <div className="section-title">HandsomGrid (Spreadsheet Excel Style - Di chuyển phím mũi tên, Enter để sửa, Ctrl+C/V để copy paste)</div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <DateBox
          />
        </div>
      </section>

 <section className="section" id="tour-handsomgrid-section">
        <div className="section-title">HandsomGrid (Spreadsheet Excel Style - Di chuyển phím mũi tên, Enter để sửa, Ctrl+C/V để copy paste)</div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <TimeBox
          mode="range"
          />
        </div>
      </section>

      <section className="section" id="tour-uploader-section">
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


      <section className="section" id="tour-comments-section">
        <div className="section-title">Comment Editor & Route </div>
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <CommentEditorRoute
            items={routeComments}
            departments={demoDepartments}
            valueExpr="id"
            displayExpr="name"
            routePlaceholder="Select department for routing..."
            routeLabel="Route to:"
            recordGuid="99ED8E1D-635F-4FD8-AFA9-864150E363FB"
            fromDepartment="IT"
            currentDepartment="FO"
            createdBy="quan.nh"
            author="Nguyen Hong Quan IT"
            onSubmit={(newComment, nextComments) => {
              setRouteComments(nextComments);
              console.log("Created Routing Comment Data Payload:", newComment);
              notify(`Saved comment routed to <b>${newComment.toDepartment}</b>! Check console for data payload.`, "success");
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
