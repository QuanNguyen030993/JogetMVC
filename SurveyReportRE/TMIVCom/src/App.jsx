import { useState } from 'react';
import CustomGrid from './components/CustomGrid';
import HtmlEditor from './components/HtmlEditor';
import DateBox from './components/DateBox';
import CommentEditor from './components/CommentEditor';
import TextBox from './components/TextBox';
import NumberBox from './components/NumberBox';
import CheckBox from './components/CheckBox';
import './css/com.all.css';

const defaultRows = [
  { id: 1, name: 'Alice', role: 'Developer', age: 28, active: true },
  { id: 2, name: 'Bob', role: 'Designer', age: 34, active: false },
  { id: 3, name: 'Charlie', role: 'QA', age: 25, active: true },
];

const gridColumns = [
  { dataField: 'id', caption: 'ID', dataType: 'number', visible: false, width: '60px' },
  { dataField: 'name', caption: 'Name', dataType: 'string' },
  { dataField: 'role', caption: 'Role', dataType: 'string' },
  { dataField: 'age', caption: 'Age', dataType: 'number' },
  { dataField: 'active', caption: 'Active', dataType: 'boolean' }
];

function App() {
  const [rows, setRows] = useState(defaultRows);
  const [editorValue, setEditorValue] = useState('');
  const [textValue, setTextValue] = useState('Hello World');
  const [numberValue, setNumberValue] = useState(42);
  const [checkValue, setCheckValue] = useState(true);

  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([...rows, { id: nextId, name: '', role: '', age: 18, active: false }]);
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
        <div className="section-title">Custom Grid (DataType Mappings: string to textbox, number to numberbox, boolean to checkbox)</div>
        <CustomGrid
          columns={gridColumns}
          rows={rows}
          onRowsChange={setRows}
          onAddRow={addRow}
        />
      </section>

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
