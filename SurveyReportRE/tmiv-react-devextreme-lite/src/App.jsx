import React, { useRef, useState } from 'react';
import Form from './components/Form';
import DataGrid from './components/DataGrid';

const departments = [
  { code: 'FO', name: 'Front Office' },
  { code: 'TS', name: 'Technical Survey' },
  { code: 'UW', name: 'Underwriting' }
];

const initialRows = [
  { id: 1, quotationNo: 'QT-001', customer: 'Alpha Co.', department: 'FO', premium: 1200, status: 'Draft' },
  { id: 2, quotationNo: 'QT-002', customer: 'Beta Ltd.', department: 'TS', premium: 2800, status: 'Review' },
  { id: 3, quotationNo: 'QT-003', customer: 'Gamma Corp.', department: 'UW', premium: 4600, status: 'Approved' }
];

export default function App() {
  const formRef = useRef();
  const gridRef = useRef();
  const [log, setLog] = useState('Ready.');
  const [formData] = useState({ quotationNo: 'QT-100', customer: 'TMIV Demo', department: 'FO', inceptionDate: '2026-07-14', premium: 1500, active: true });

  const formItems = [
    { dataField: 'quotationNo', label: { text: 'Quotation No.' }, validationRules: [{ type: 'required' }] },
    { dataField: 'customer', label: { text: 'Customer' }, validationRules: [{ type: 'required' }] },
    { dataField: 'department', label: { text: 'Department' }, editorType: 'dxSelectBox', editorOptions: { dataSource: departments, valueExpr: 'code', displayExpr: 'name' } },
    { dataField: 'inceptionDate', label: { text: 'Inception Date' }, editorType: 'dxDateBox' },
    { dataField: 'premium', label: { text: 'Premium' }, editorType: 'dxNumberBox', editorOptions: { min: 0 } },
    { dataField: 'active', label: { text: 'Active' }, editorType: 'dxCheckBox' },
    {
      itemType: 'group',
      name: 'decisionGroup',
      caption: 'Decision',
      colSpan: 2,
      colCount: 2,
      items: [
        { itemType: 'button', name: 'acceptButton', buttonOptions: { text: 'Accept', onClick: () => setLog('Accepted from Form button.') } },
        { itemType: 'button', name: 'rejectButton', buttonOptions: { text: 'Reject', onClick: () => setLog('Rejected from Form button.') } }
      ]
    }
  ];

  const columns = [
    { dataField: 'quotationNo', caption: 'Quotation No.', width: 140 },
    { dataField: 'customer', caption: 'Customer' },
    { dataField: 'department', caption: 'Department', lookup: { dataSource: departments, valueExpr: 'code', displayExpr: 'name' } },
    { dataField: 'premium', caption: 'Premium', dataType: 'number' },
    { dataField: 'status', caption: 'Status' }
  ];

  return (
    <main className="app-shell">
      <header>
        <h1>TMIV React DevExtreme Lite</h1>
        <p>Prototype replacement for dxForm and dxDataGrid.</p>
      </header>

      <section className="panel">
        <div className="panel-title"><h2>Form.jsx</h2><div className="actions"><button onClick={() => setLog(JSON.stringify(formRef.current.option('formData'), null, 2))}>Read formData</button><button onClick={() => setLog(JSON.stringify(formRef.current.validate(), null, 2))}>Validate</button><button onClick={() => formRef.current.itemOption('decisionGroup', 'visible', false)}>Hide Decision</button><button onClick={() => formRef.current.itemOption('decisionGroup', 'visible', true)}>Show Decision</button></div></div>
        <Form ref={formRef} formData={formData} items={formItems} colCount={2} onFieldDataChanged={(e) => setLog(`${e.dataField} = ${e.value}`)} />
      </section>

      <section className="panel">
        <div className="panel-title"><h2>DataGrid.jsx</h2><div className="actions"><button onClick={() => gridRef.current.addRow()}>Add row via instance</button><button onClick={() => setLog(JSON.stringify(gridRef.current.getSelectedRowsData(), null, 2))}>Selected data</button><button onClick={() => gridRef.current.refresh()}>Refresh</button></div></div>
        <DataGrid ref={gridRef} dataSource={initialRows} columns={columns} keyExpr="id" paging={{ pageSize: 5 }} selection={{ mode: 'multiple' }} editing={{ allowAdding: true, allowUpdating: true, allowDeleting: true }} onRowUpdated={(e) => setLog(`Updated row ${e.key}`)} />
      </section>

      <section className="panel log-panel"><h2>Event / API log</h2><pre>{log}</pre></section>
    </main>
  );
}
