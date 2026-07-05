import { useState } from 'react';
import CustomGrid from './components/CustomGrid';
import HtmlEditor from './components/HtmlEditor';
import DateBox from './components/DateBox';
import CommentEditor from './components/CommentEditor';
import TextBox from './components/TextBox';
import NumberBox from './components/NumberBox';
import CheckBox from './components/CheckBox';
import SelectBox from './components/SelectBox';
import DropDownBox from './components/DropDownBox';
import './css/com.all.css';

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
  {
    dataField: 'projectId',
    caption: 'Project (Table)',
    dataType: 'table',
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
  }
];

function App() {
  const [rows, setRows] = useState(defaultRows);
  const [editorValue, setEditorValue] = useState('');
  const [textValue, setTextValue] = useState('Hello World');
  const [numberValue, setNumberValue] = useState(42);
  const [checkValue, setCheckValue] = useState(true);
  const [selectValue, setSelectValue] = useState(2);
  const [dropValue, setDropValue] = useState(101);

  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([...rows, { id: nextId, name: '', role: '', age: 18, active: false, deptId: 1, projectId: 101 }]);
  };

  return (
    <div className="tmivcom-app">
      <header className="header">
        <div>
          <h1>TMIVCom Reusable Controls</h1>
          <p>Custom React controls for ASP.NET integration: grid and HTML editor.</p>
        </div>
      </header>

      <section className="section">
        <div className="section-title">Custom Grid (DataType Mappings: string to textbox, number to numberbox, boolean to checkbox, enum to selectbox, table to dropdownbox)</div>
        <CustomGrid
          columns={gridColumns}
          rows={rows}
          onRowsChange={setRows}
          onAddRow={addRow}
        />
      </section>

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
    </div>
  );
}

export default App;
