import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { getByPath, setByPath } from '../core/path';

function resolveLookup(column, value) {
  const lookup = column.lookup;
  if (!lookup) return value;
  const data = lookup.dataSource || [];
  const valueExpr = lookup.valueExpr || 'value';
  const displayExpr = lookup.displayExpr || 'text';
  const found = data.find((entry) => (typeof entry === 'object' ? entry[valueExpr] : entry) == value);
  return found && typeof found === 'object' ? found[displayExpr] : found ?? value;
}

const DataGrid = forwardRef(function DataGrid({
  dataSource = [],
  columns = [],
  keyExpr = 'id',
  paging = { pageSize: 10 },
  selection = { mode: 'none' },
  editing = {},
  filterRow = { visible: true },
  searchPanel = { visible: true },
  onRowUpdated,
  onRowInserted,
  onRowRemoved,
  onSelectionChanged,
  onContentReady
}, ref) {
  const [rows, setRows] = useState(Array.isArray(dataSource) ? dataSource : []);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(paging.pageSize || 10);
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editingRowKey, setEditingRowKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const rootRef = useRef(null);

  const processedRows = useMemo(() => {
    let result = [...rows];
    const searchable = columns.filter((column) => column.dataField);
    if (search) {
      const needle = search.toLowerCase();
      result = result.filter((row) => searchable.some((column) => String(resolveLookup(column, getByPath(row, column.dataField)) ?? '').toLowerCase().includes(needle)));
    }
    result = result.filter((row) => Object.entries(filters).every(([field, term]) => !term || String(getByPath(row, field) ?? '').toLowerCase().includes(String(term).toLowerCase())));
    if (sort) {
      result.sort((a, b) => {
        const av = getByPath(a, sort.field); const bv = getByPath(b, sort.field);
        if (av === bv) return 0;
        const direction = sort.desc ? -1 : 1;
        return av > bv ? direction : -direction;
      });
    }
    return result;
  }, [rows, columns, filters, search, sort]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const visibleRows = processedRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const setSelection = (keys) => {
    setSelectedKeys(keys);
    onSelectionChanged?.({ selectedRowKeys: keys, selectedRowsData: rows.filter((row) => keys.includes(row[keyExpr])) });
  };

  const saveEdit = () => {
    if (!draft) return;
    if (editingRowKey === '__new__') {
      setRows((current) => [...current, draft]);
      onRowInserted?.({ data: draft });
    } else {
      setRows((current) => current.map((row) => row[keyExpr] === editingRowKey ? draft : row));
      onRowUpdated?.({ key: editingRowKey, data: draft });
    }
    setEditingRowKey(null); setDraft(null);
  };

  const apiRef = useRef(null);
  const api = useMemo(() => ({
    option(name, value) {
      if (arguments.length === 0) return { dataSource: rows, columns, paging, selection, editing };
      if (arguments.length === 1) {
        if (name === 'dataSource') return rows;
        if (name === 'columns') return columns;
        if (name === 'pageIndex') return pageIndex;
        if (name === 'pageSize') return pageSize;
      }
      if (name === 'dataSource') setRows(Array.isArray(value) ? value : []);
      if (name === 'pageIndex') setPageIndex(value);
      if (name === 'pageSize') setPageSize(value);
      return apiRef.current;
    },
    getDataSource() { return { items: () => rows, load: async () => rows, reload: async () => rows }; },
    refresh() { setRows((current) => [...current]); return Promise.resolve(); },
    repaint() { setRows((current) => [...current]); return apiRef.current; },
    getSelectedRowKeys() { return selectedKeys; },
    getSelectedRowsData() { return rows.filter((row) => selectedKeys.includes(row[keyExpr])); },
    selectRows(keys, preserve = false) { setSelection(preserve ? [...new Set([...selectedKeys, ...keys])] : keys); return Promise.resolve(); },
    deselectRows(keys) { setSelection(selectedKeys.filter((key) => !keys.includes(key))); return Promise.resolve(); },
    clearSelection() { setSelection([]); },
    pageIndex(value) { if (arguments.length === 0) return pageIndex; setPageIndex(value); return Promise.resolve(); },
    pageSize(value) { if (arguments.length === 0) return pageSize; setPageSize(value); return apiRef.current; },
    cellValue(rowIndex, field, value) {
      const row = rows[rowIndex];
      if (!row) return undefined;
      if (arguments.length === 2) return getByPath(row, field);
      setRows((current) => current.map((entry, index) => index === rowIndex ? setByPath(entry, field, value) : entry));
      return apiRef.current;
    },
    addRow() {
      const blank = Object.fromEntries(columns.filter((column) => column.dataField).map((column) => [column.dataField, undefined]));
      blank[keyExpr] = `new_${Date.now()}`;
      setEditingRowKey('__new__'); setDraft(blank); return Promise.resolve();
    },
    editRow(rowIndex) { const row = visibleRows[rowIndex]; if (row) { setEditingRowKey(row[keyExpr]); setDraft({ ...row }); } },
    saveEditData() { saveEdit(); return Promise.resolve(); },
    cancelEditData() { setEditingRowKey(null); setDraft(null); },
    deleteRow(rowIndex) {
      const row = visibleRows[rowIndex]; if (!row) return Promise.resolve();
      setRows((current) => current.filter((entry) => entry[keyExpr] !== row[keyExpr]));
      onRowRemoved?.({ key: row[keyExpr], data: row }); return Promise.resolve();
    },
    element() { return rootRef.current; }
  }), [rows, columns, paging, selection, editing, pageIndex, pageSize, selectedKeys, keyExpr, visibleRows]);
  apiRef.current = api;
  useImperativeHandle(ref, () => api, [api]);

  React.useEffect(() => { onContentReady?.({ component: api, element: rootRef.current }); }, []);

  const renderEditor = (column, value, setValue) => {
    if (column.lookup) {
      const lookup = column.lookup; const source = lookup.dataSource || [];
      return <select value={value ?? ''} onChange={(e) => setValue(e.target.value)}>{source.map((entry, i) => <option key={i} value={typeof entry === 'object' ? entry[lookup.valueExpr || 'value'] : entry}>{typeof entry === 'object' ? entry[lookup.displayExpr || 'text'] : entry}</option>)}</select>;
    }
    return <input type={column.dataType === 'number' ? 'number' : column.dataType === 'date' ? 'date' : 'text'} value={value ?? ''} onChange={(e) => setValue(e.target.value)} />;
  };

  return (
    <div ref={rootRef} className="dxlite-grid">
      <div className="dxlite-grid-toolbar">
        {searchPanel.visible !== false && <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} />}
        {editing.allowAdding && <button onClick={() => api.addRow()}>Add row</button>}
        {editingRowKey && <><button onClick={saveEdit}>Save</button><button onClick={() => { setEditingRowKey(null); setDraft(null); }}>Cancel</button></>}
      </div>
      <div className="dxlite-table-wrap">
        <table>
          <thead>
            <tr>
              {selection.mode !== 'none' && <th>Select</th>}
              {columns.filter((column) => column.visible !== false).map((column) => <th key={column.dataField || column.caption} style={{ width: column.width }} onClick={() => column.allowSorting === false || !column.dataField ? null : setSort((current) => ({ field: column.dataField, desc: current?.field === column.dataField ? !current.desc : false }))}>{column.caption || column.dataField}{sort?.field === column.dataField ? (sort.desc ? ' ▼' : ' ▲') : ''}</th>)}
              {(editing.allowUpdating || editing.allowDeleting) && <th>Actions</th>}
            </tr>
            {filterRow.visible !== false && <tr>{selection.mode !== 'none' && <th />}{columns.filter((column) => column.visible !== false).map((column) => <th key={column.dataField || column.caption}>{column.dataField && <input value={filters[column.dataField] || ''} onChange={(e) => { setFilters((current) => ({ ...current, [column.dataField]: e.target.value })); setPageIndex(0); }} />}</th>)}{(editing.allowUpdating || editing.allowDeleting) && <th />}</tr>}
          </thead>
          <tbody>
            {editingRowKey === '__new__' && draft && <EditableRow columns={columns} draft={draft} setDraft={setDraft} renderEditor={renderEditor} selectionMode={selection.mode} actions />}
            {visibleRows.map((row, rowIndex) => {
              const key = row[keyExpr]; const isEditing = editingRowKey === key;
              return (
                <tr key={key}>
                  {selection.mode !== 'none' && <td><input type={selection.mode === 'single' ? 'radio' : 'checkbox'} checked={selectedKeys.includes(key)} onChange={(e) => setSelection(selection.mode === 'single' ? (e.target.checked ? [key] : []) : e.target.checked ? [...selectedKeys, key] : selectedKeys.filter((entry) => entry !== key))} /></td>}
                  {columns.filter((column) => column.visible !== false).map((column) => {
                    const value = getByPath(isEditing ? draft : row, column.dataField);
                    return <td key={column.dataField || column.caption}>{isEditing && column.allowEditing !== false ? renderEditor(column, value, (next) => setDraft((current) => setByPath(current, column.dataField, next))) : column.renderCell ? column.renderCell({ value, data: row, rowIndex }) : resolveLookup(column, value)}</td>;
                  })}
                  {(editing.allowUpdating || editing.allowDeleting) && <td>{editing.allowUpdating && <button onClick={() => api.editRow(rowIndex)}>Edit</button>} {editing.allowDeleting && <button onClick={() => api.deleteRow(rowIndex)}>Delete</button>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="dxlite-pager"><button disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => p - 1)}>Previous</button><span>Page {pageIndex + 1} / {totalPages}</span><button disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex((p) => p + 1)}>Next</button><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}>{[5, 10, 20, 50].map((size) => <option key={size}>{size}</option>)}</select></div>
    </div>
  );
});

function EditableRow({ columns, draft, setDraft, renderEditor, selectionMode, actions }) {
  return <tr>{selectionMode !== 'none' && <td />}{columns.filter((column) => column.visible !== false).map((column) => <td key={column.dataField || column.caption}>{column.dataField ? renderEditor(column, getByPath(draft, column.dataField), (value) => setDraft((current) => setByPath(current, column.dataField, value))) : null}</td>)}{actions && <td>New row</td>}</tr>;
}

export default DataGrid;
