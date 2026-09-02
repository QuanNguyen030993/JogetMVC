import React, { useEffect, useMemo, useRef, useState } from 'react';
import appsettings from '../../../host.json';
import { notify } from '../../../TMIVCom/src/components/Notification';
import '../styles/reportbuilder.css';

const FALLBACK_MODELS = {
  MailTemplate: {
    columns: [
      ['EventName', 'Sự kiện chính'], ['Department', 'Mail đi đến phòng'], ['Flow', 'Flow'],
      ['Subject', 'Tiêu đề'], ['Content', 'Nội dung'], ['Code', 'Code'], ['IsActive', 'Kích hoạt'],
    ],
    rows: [
      { EventName: 'Có request mới từ khách hàng', Department: 'MKT-TS', Flow: 'Báo giá' },
      { EventName: 'Đã làm xong báo giá', Department: 'MKT-FO', Flow: 'Báo giá' },
      { EventName: 'Ý chí refer từ FO', Department: 'UW', Flow: 'Báo giá' },
      { EventName: 'UW xác nhận', Department: 'All PIC', Flow: 'Báo giá' },
      { EventName: 'Có request mới từ MKT', Department: 'PM', Flow: 'Cấp đơn' },
    ],
  },
  EnumData: {
    columns: [
      ['EventName', 'Sự kiện'], ['Value', 'Value'], ['EnumKey', 'Enum Key'],
      ['DisplayText', 'Tên hiển thị'], ['SortOrder', 'Thứ tự'], ['IsActive', 'Kích hoạt'],
    ],
    rows: ['Asking signature', 'Quotation confirmed', 'Signing on system', 'No need to refer', 'Need more information']
      .map(Value => ({ EventName: '', Value })),
  },
  NotificationTemplate: {
    columns: [
      ['EventName', 'Sự kiện'], ['Flow', 'Flow'], ['Code', 'Code'], ['Title', 'Title'],
      ['Content', 'Content'], ['Channel', 'Kênh'], ['IsActive', 'Kích hoạt'],
    ],
    rows: [
      { EventName: 'Khởi tạo báo giá', Code: 'InitializeMessage', Title: 'New Quotation @@QuotationCode has been initialized.', Content: '{{Subject}} - @@QuotationCode' },
      { EventName: 'Gắn tác vụ cho người phụ trách', Code: 'AssignNotification', Title: 'Task Assigned: {0}', Content: 'A new workflow task has been assigned to you.' },
      { EventName: 'Thông báo của cấp đơn', Code: 'PolicyIssuanceNotification', Title: 'Policy Issuance Update: {0}', Content: 'The policy issuance status has been updated.' },
      { EventName: 'Thông báo của báo giá', Code: 'QuotationNotification', Title: '{0} {1} - {2} from {3}', Content: 'The quotation has transitioned to the next step.' },
    ],
  },
};

const createColumn = ([field, caption]) => ({ field, caption, dataType: 'string' });
const defaultSheets = [
  { id: 'mail', name: 'Mail', tableName: 'MailTemplate', color: '#2563eb', selected: FALLBACK_MODELS.MailTemplate.columns.slice(0, 5).map(createColumn) },
  { id: 'status', name: 'Status', tableName: 'EnumData', color: '#d97706', selected: FALLBACK_MODELS.EnumData.columns.slice(0, 2).map(createColumn) },
  { id: 'notification', name: 'Notification', tableName: 'NotificationTemplate', color: '#7c3aed', selected: FALLBACK_MODELS.NotificationTemplate.columns.slice(0, 5).map(createColumn) },
];

const tableNameOf = row => String(row?.name ?? row?.Name ?? row?.tableName ?? row?.TableName ?? '').trim();
const normalizeColumn = col => ({
  field: String(col?.dataField ?? col?.DataField ?? col?.field ?? col?.Field ?? '').trim(),
  caption: String(col?.caption ?? col?.Caption ?? col?.dataField ?? col?.DataField ?? '').trim(),
  dataType: String(col?.dataType ?? col?.DataType ?? 'string').toLowerCase(),
});
const resolveValue = (row, field) => {
  if (!row || !field) return '';
  if (Object.prototype.hasOwnProperty.call(row, field)) return row[field] ?? '';
  const key = Object.keys(row).find(item => item.toLowerCase() === field.toLowerCase());
  return key ? row[key] ?? '' : '';
};
const sanitizeSheetName = (name, fallback) => (String(name || fallback).replace(/[\\/?*:[\]]/g, ' ').trim() || fallback).slice(0, 31);

export default function ReportBuilder() {
  const [sheets, setSheets] = useState(defaultSheets);
  const [activeId, setActiveId] = useState(defaultSheets[0].id);
  const [tables, setTables] = useState(Object.keys(FALLBACK_MODELS));
  const [loadingIds, setLoadingIds] = useState([]);
  const [query, setQuery] = useState('');
  const [previewCount, setPreviewCount] = useState(10);
  const [exporting, setExporting] = useState(false);
  const cacheRef = useRef(new Map());

  const activeSheet = sheets.find(item => item.id === activeId) || sheets[0];
  const activeFallback = FALLBACK_MODELS[activeSheet?.tableName];
  const activeData = cacheRef.current.get(activeSheet?.tableName) || (activeFallback ? {
    columns: activeFallback.columns.map(createColumn),
    rows: activeFallback.rows,
  } : { columns: [], rows: [] });
  const availableColumns = useMemo(() => {
    const selected = new Set((activeSheet?.selected || []).map(col => col.field.toLowerCase()));
    return (activeData.columns || []).filter(col => !selected.has(col.field.toLowerCase()) && (
      !query || `${col.field} ${col.caption}`.toLowerCase().includes(query.toLowerCase())
    ));
  }, [activeData, activeSheet, query]);

  const fetchTableData = async tableName => {
    if (cacheRef.current.has(tableName)) return cacheRef.current.get(tableName);
    const fallback = FALLBACK_MODELS[tableName] || { columns: [], rows: [] };
    let columns = [];
    let rows = [];
    for (const endpoint of ['GetSystemScheme', 'GetScheme']) {
      try {
        const response = await fetch(`${appsettings.UrlConfig.Host}/api/${encodeURIComponent(tableName)}/${endpoint}`);
        if (response.ok) {
          columns = (await response.json()).map(normalizeColumn).filter(col => col.field);
          if (columns.length) break;
        }
      } catch { /* use next endpoint or reference fallback */ }
    }
    try {
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/${encodeURIComponent(tableName)}/GetAll`);
      if (response.ok) {
        const payload = await response.json();
        rows = Array.isArray(payload) ? payload : payload?.data || [];
      }
    } catch { /* preview remains available from the reference workbook */ }
    const value = {
      columns: columns.length ? columns : fallback.columns.map(createColumn),
      rows: rows.length ? rows : fallback.rows,
    };
    cacheRef.current.set(tableName, value);
    return value;
  };

  const loadSheet = async (sheetId, tableName) => {
    setLoadingIds(ids => [...new Set([...ids, sheetId])]);
    try {
      await fetchTableData(tableName);
      setSheets(items => items.map(item => item.id === sheetId ? { ...item } : item));
    } finally {
      setLoadingIds(ids => ids.filter(id => id !== sheetId));
    }
  };

  useEffect(() => {
    fetch(`${appsettings.UrlConfig.Host}/api/SysTable/GetAll`)
      .then(response => response.ok ? response.json() : [])
      .then(rows => setTables(existing => [...new Set([...existing, ...(rows || []).map(tableNameOf).filter(Boolean)])]))
      .catch(() => {});
    defaultSheets.forEach(sheet => loadSheet(sheet.id, sheet.tableName));
  }, []);

  const updateActive = patch => setSheets(items => items.map(item => item.id === activeId ? { ...item, ...patch } : item));
  const changeTable = tableName => {
    const fallbackColumns = (FALLBACK_MODELS[tableName]?.columns || []).map(createColumn);
    updateActive({ tableName, selected: fallbackColumns.slice(0, Math.min(5, fallbackColumns.length)) });
    loadSheet(activeId, tableName);
  };
  const addColumn = field => {
    const column = (activeData.columns || []).find(item => item.field === field);
    if (column && !activeSheet.selected.some(item => item.field === field)) updateActive({ selected: [...activeSheet.selected, { ...column }] });
  };
  const reorderOrAdd = (payload, targetIndex) => {
    if (!payload?.field) return;
    const current = [...activeSheet.selected];
    const fromIndex = current.findIndex(item => item.field === payload.field);
    const column = fromIndex >= 0 ? current.splice(fromIndex, 1)[0] : (activeData.columns || []).find(item => item.field === payload.field);
    if (!column) return;
    const adjustedIndex = fromIndex >= 0 && fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    current.splice(Math.max(0, Math.min(adjustedIndex, current.length)), 0, { ...column });
    updateActive({ selected: current });
  };
  const readDrag = event => {
    try { return JSON.parse(event.dataTransfer.getData('application/report-column')); } catch { return null; }
  };
  const setDrag = (event, field) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/report-column', JSON.stringify({ field }));
  };
  const renameColumn = (field, caption) => updateActive({
    selected: activeSheet.selected.map(item => item.field === field ? { ...item, caption } : item),
  });
  const removeColumn = field => updateActive({ selected: activeSheet.selected.filter(item => item.field !== field) });

  const addSheet = () => {
    const id = `sheet-${Date.now()}`;
    const tableName = tables[0] || 'MailTemplate';
    const newSheet = { id, name: `Sheet ${sheets.length + 1}`, tableName, color: '#0891b2', selected: [] };
    setSheets(items => [...items, newSheet]);
    setActiveId(id);
    loadSheet(id, tableName);
  };
  const removeSheet = id => {
    if (sheets.length === 1) return;
    const next = sheets.filter(item => item.id !== id);
    setSheets(next);
    if (activeId === id) setActiveId(next[0].id);
  };

  const exportWorkbook = async () => {
    if (!window.XLSX) {
      notify({ content: 'Thư viện xuất Excel chưa sẵn sàng.', type: 'error', position: 'bottom-right' });
      return;
    }
    const invalid = sheets.find(sheet => !sheet.selected.length);
    if (invalid) {
      notify({ content: `Sheet “${invalid.name}” chưa có cột báo cáo.`, type: 'warning', position: 'bottom-right' });
      return;
    }
    setExporting(true);
    try {
      const datasets = await Promise.all(sheets.map(sheet => fetchTableData(sheet.tableName)));
      const workbook = window.XLSX.utils.book_new();
      const usedNames = new Set();
      sheets.forEach((sheet, index) => {
        const baseName = sanitizeSheetName(sheet.name, `Sheet${index + 1}`);
        let uniqueName = baseName;
        let suffix = 2;
        while (usedNames.has(uniqueName.toLowerCase())) uniqueName = `${baseName.slice(0, 27)} (${suffix++})`;
        usedNames.add(uniqueName.toLowerCase());
        const data = datasets[index];
        const aoa = [sheet.selected.map(column => column.caption || column.field)];
        (data.rows || []).forEach(row => aoa.push(sheet.selected.map(column => resolveValue(row, column.field))));
        const worksheet = window.XLSX.utils.aoa_to_sheet(aoa);
        worksheet['!cols'] = sheet.selected.map((column, columnIndex) => ({
          wch: Math.min(55, Math.max(12, ...aoa.slice(0, 40).map(row => String(row[columnIndex] ?? '').length + 2))),
        }));
        worksheet['!autofilter'] = { ref: `A1:${window.XLSX.utils.encode_col(sheet.selected.length - 1)}1` };
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
        window.XLSX.utils.book_append_sheet(workbook, worksheet, uniqueName);
      });
      const fileName = `Custom_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const bytes = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify({ content: `Đã export ${sheets.length} sheet thành công.`, type: 'success', position: 'bottom-right' });
    } catch (error) {
      notify({ content: `Export thất bại: ${error.message}`, type: 'error', position: 'bottom-right' });
    } finally {
      setExporting(false);
    }
  };

  if (!activeSheet) return null;
  const previewRows = (activeData.rows || []).slice(0, previewCount);

  return (
    <section className="report-builder">
      <header className="report-builder__header">
        <div>
          <span className="report-builder__eyebrow">REPORT DESIGNER</span>
          <h1>Thiết kế báo cáo Excel</h1>
          <p>Chọn bảng dữ liệu, kéo thả cột, đổi tên và xuất một workbook nhiều sheet.</p>
        </div>
        <div className="report-builder__actions">
          <span className="report-builder__summary"><b>{sheets.length}</b> sheet · <b>{sheets.reduce((total, sheet) => total + sheet.selected.length, 0)}</b> cột</span>
          <button className="report-button report-button--primary" type="button" onClick={exportWorkbook} disabled={exporting}>
            <i className="fa-solid fa-file-arrow-down" /> {exporting ? 'Đang export...' : 'Export Excel'}
          </button>
        </div>
      </header>

      <div className="report-tabs" role="tablist" aria-label="Danh sách sheet báo cáo">
        {sheets.map((sheet, index) => (
          <button key={sheet.id} type="button" role="tab" aria-selected={sheet.id === activeId} className={`report-tab ${sheet.id === activeId ? 'is-active' : ''}`} style={{ '--sheet-color': sheet.color }} onClick={() => { setActiveId(sheet.id); setQuery(''); }}>
            <span className="report-tab__index">{index + 1}</span>
            <span><b>{sheet.name}</b><small>{sheet.tableName}</small></span>
            {sheets.length > 1 && <span className="report-tab__close" role="button" tabIndex="0" title="Xóa sheet" onClick={event => { event.stopPropagation(); removeSheet(sheet.id); }}>×</span>}
          </button>
        ))}
        <button className="report-tabs__add" type="button" onClick={addSheet}><i className="fa-solid fa-plus" /> Thêm sheet</button>
      </div>

      <div className="report-builder__workspace">
        <aside className="report-card report-source">
          <div className="report-card__title"><span><i className="fa-solid fa-database" /> Nguồn dữ liệu</span><small>Bước 1</small></div>
          <label>Tên sheet<input value={activeSheet.name} maxLength={31} onChange={event => updateActive({ name: event.target.value })} /></label>
          <label>Bảng nguồn<select value={activeSheet.tableName} onChange={event => changeTable(event.target.value)}>{tables.map(table => <option key={table} value={table}>{table}</option>)}</select></label>
          <div className="report-search"><i className="fa-solid fa-magnifying-glass" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên cột..." /></div>
          <div className="report-column-list">
            {loadingIds.includes(activeId) && <div className="report-empty"><i className="fa-solid fa-circle-notch fa-spin" /> Đang tải cấu trúc bảng...</div>}
            {!loadingIds.includes(activeId) && availableColumns.map(column => (
              <button className="report-source-column" type="button" key={column.field} draggable onDragStart={event => setDrag(event, column.field)} onDoubleClick={() => addColumn(column.field)} title="Kéo sang phải hoặc nhấp đúp để thêm">
                <i className="fa-solid fa-grip-vertical" /><span><b>{column.caption}</b><small>{column.field} · {column.dataType}</small></span><i className="fa-solid fa-plus" onClick={() => addColumn(column.field)} />
              </button>
            ))}
            {!loadingIds.includes(activeId) && !availableColumns.length && <div className="report-empty"><i className="fa-regular fa-circle-check" /> Không còn cột phù hợp</div>}
          </div>
        </aside>

        <section className="report-card report-layout">
          <div className="report-card__title"><span><i className="fa-solid fa-table-columns" /> Cột trong báo cáo</span><small>Bước 2 · kéo để sắp xếp</small></div>
          <div className="report-drop-list" onDragOver={event => event.preventDefault()} onDrop={event => reorderOrAdd(readDrag(event), activeSheet.selected.length)}>
            {activeSheet.selected.map((column, index) => (
              <React.Fragment key={column.field}>
                <div className="report-drop-gap" onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); reorderOrAdd(readDrag(event), index); }} />
                <article className="report-selected-column" draggable onDragStart={event => setDrag(event, column.field)}>
                  <span className="report-selected-column__order">{String(index + 1).padStart(2, '0')}</span>
                  <i className="fa-solid fa-grip-vertical report-grip" />
                  <label><small>Tên cột xuất ra</small><input value={column.caption} onChange={event => renameColumn(column.field, event.target.value)} /></label>
                  <span className="report-selected-column__field"><small>Data field</small><b>{column.field}</b></span>
                  <button type="button" title="Bỏ cột" onClick={() => removeColumn(column.field)}><i className="fa-solid fa-xmark" /></button>
                </article>
              </React.Fragment>
            ))}
            <div className="report-drop-gap report-drop-gap--last" />
            {!activeSheet.selected.length && <div className="report-drop-empty"><i className="fa-solid fa-arrow-right-long" /><b>Kéo cột vào đây</b><span>Cột sẽ xuất hiện trong Excel theo đúng thứ tự này.</span></div>}
          </div>
        </section>

        <section className="report-card report-preview">
          <div className="report-card__title"><span><i className="fa-regular fa-eye" /> Xem trước</span><small>Bước 3</small></div>
          <div className="report-preview__meta"><span><i className="fa-solid fa-circle" style={{ color: activeSheet.color }} /> {activeSheet.name}</span><label>Hiện <select value={previewCount} onChange={event => setPreviewCount(Number(event.target.value))}><option value="5">5 dòng</option><option value="10">10 dòng</option><option value="20">20 dòng</option></select></label></div>
          <div className="report-table-wrap">
            <table><thead><tr>{activeSheet.selected.map(column => <th key={column.field}>{column.caption || column.field}</th>)}</tr></thead>
              <tbody>{previewRows.map((row, rowIndex) => <tr key={row.id ?? row.Id ?? rowIndex}>{activeSheet.selected.map(column => <td key={column.field} title={String(resolveValue(row, column.field))}>{String(resolveValue(row, column.field))}</td>)}</tr>)}</tbody>
            </table>
            {!activeSheet.selected.length && <div className="report-preview__empty">Chọn ít nhất một cột để xem preview.</div>}
            {!!activeSheet.selected.length && !previewRows.length && <div className="report-preview__empty">Chưa có dữ liệu để xem trước. Cấu hình vẫn có thể export.</div>}
          </div>
          <footer><span><i className="fa-solid fa-link" /> {activeSheet.tableName}</span><span>{activeData.rows?.length || 0} bản ghi</span></footer>
        </section>
      </div>
    </section>
  );
}
