import { useEffect, useMemo, useState } from 'react';
import appsettings from '../../../host.json';
import CustomGrid from '../../../TMIVCom/src/components/CustomGrid';
import { DataGrid, GridCustomStore } from '../../../TMIVCom/src/DataGrid';

const API_BASE_URL = appsettings.UrlConfig.Host;

const normalizeDataType = (value) => {
  const type = String(value || 'string').toLowerCase();
  if (type.includes('datetime') || type.includes('timestamp')) return 'datetime';
  if (type === 'date' || type.endsWith('.date')) return 'date';
  if (type.includes('int') || type.includes('number') || type.includes('decimal') || type.includes('double') || type.includes('float')) return 'number';
  if (type.includes('bool')) return 'boolean';
  return 'string';
};

const formatBadgeValue = (value, dataType) => {
  if (value === null || value === undefined || value === '') return '—';
  if (dataType === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('vi-VN').format(number) : String(value);
  }
  if (dataType === 'date' || dataType === 'datetime') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('vi-VN', dataType === 'datetime'
      ? { dateStyle: 'short', timeStyle: 'short' }
      : { dateStyle: 'short' }).format(date);
  }
  return String(value);
};

const parseJsonOption = (value, fallback = undefined) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    try {
      const decoded = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
      return JSON.parse(new TextDecoder('utf-8').decode(decoded));
    } catch {
      return fallback;
    }
  }
};

const mapSchemaColumn = (column, index) => {
  const validationRules = parseJsonOption(column.validationRules, []);
  const dataType = normalizeDataType(column.dataType);
  return {
    field: column.dataField || column.field,
    caption: column.caption || column.dataField || column.field,
    dataType,
    width: column.width || undefined,
    minWidth: column.minWidth || 90,
    visible: column.visible !== false,
    visibleIndex: column.visibleIndex ?? column.gridVisibleIndex,
    allowSorting: column.allowSorting !== false,
    allowFiltering: column.allowFiltering !== false,
    allowGrouping: column.allowGrouping !== false,
    allowReordering: column.allowReordering !== false,
    allowResizing: column.allowResizing !== false,
    allowEditing: column.allowEditing !== false,
    fixed: column.fixed === true,
    fixedPosition: column.fixedPosition === 'right' ? 'right' : 'left',
    hidingPriority: column.hidingPriority ?? 1000 - index,
    minScreenWidth: column.minScreenWidth || undefined,
    bandPath: parseJsonOption(column.bandPath, column.bandPath),
    alignment: column.alignment,
    format: column.format,
    lookup: parseJsonOption(column.lookup, column.lookup),
    editorType: column.editorType || column.editor,
    editorOptions: parseJsonOption(column.editorOptions, {}),
    validationRules: Array.isArray(validationRules) ? validationRules : [],
    renderCell: ({ displayValue, value }) => {
      if (!['string', 'date', 'datetime', 'number'].includes(dataType)) return String(displayValue ?? value ?? '');
      const badgeType = dataType === 'date' ? 'datetime' : dataType;
      const text = formatBadgeValue(displayValue ?? value, dataType);
      return <span className={`itadmin-grid-value-badge itadmin-grid-value-badge--${badgeType}`} title={text}>{text}</span>;
    },
  };
};

const mutateDataGridConfig = async (path, method, key, values) => {
  const formData = new FormData();
  if (key !== undefined) formData.append('key', key);
  if (values !== undefined) formData.append('values', JSON.stringify(values));
  const response = await fetch(`${API_BASE_URL}/api/DataGridConfig/${path}`, { method, body: formData });
  if (!response.ok) {
    const error = new Error(`Không thể lưu DataGridConfig (${response.status})`);
    try { error.errors = (await response.json()).errors; } catch { /* response has no validation payload */ }
    throw error;
  }
  const text = await response.text();
  if (!text) return values;
  try { return JSON.parse(text); } catch { return values; }
};

export default function DataGridConfigList() {
  const [engine, setEngine] = useState('modular');
  const [editMode, setEditMode] = useState('batch');
  const [columns, setColumns] = useState([]);
  const [schemaError, setSchemaError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSchema = async () => {
      try {
        setSchemaError(null);
        const response = await fetch(`${API_BASE_URL}/api/DataGridConfig/GetSystemScheme`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Không thể tải schema (${response.status})`);
        const result = await response.json();
        const schema = Array.isArray(result) ? result : result?.data || [];
        setColumns(schema.map(mapSchemaColumn).filter((column) => column.field));
      } catch (error) {
        if (error.name !== 'AbortError') setSchemaError(error);
      }
    };

    loadSchema();
    return () => controller.abort();
  }, []);

  const store = useMemo(() => new GridCustomStore({
    key: 'id',
    async load() {
      const response = await fetch(`${API_BASE_URL}/api/DataGridConfig/GetAll`);
      if (!response.ok) throw new Error(`Không thể tải DataGridConfig (${response.status})`);
      const result = await response.json();
      const data = Array.isArray(result) ? result : result?.data || [];
      return { data, totalCount: result?.totalCount ?? data.length };
    },
    async insert(values) {
      return await mutateDataGridConfig('InsertData', 'POST', undefined, values) || values;
    },
    async update(key, values) {
      return mutateDataGridConfig('UpdateData', 'PUT', key, values);
    },
    async remove(key) {
      await mutateDataGridConfig('DeleteData', 'DELETE', key);
    },
  }), []);

  return (
    <section className="itadmin-grid-list">
      <header className="itadmin-grid-list__header">
        <div>
          <h2>DataGrid List</h2>
          <p>{engine === 'modular' ? `TMIV modular DataGrid — ${editMode} editing` : 'Legacy CustomGrid — batch editing'}</p>
        </div>
        <div className="itadmin-grid-list__engine" role="group" aria-label="Grid engine">
          <button type="button" className={engine === 'modular' ? 'is-active' : ''} onClick={() => setEngine('modular')}>
            Modular
          </button>
          <button type="button" className={engine === 'legacy' ? 'is-active' : ''} onClick={() => setEngine('legacy')}>
            Legacy edit
          </button>
        </div>
        {engine === 'modular' && <div className="itadmin-grid-list__engine" role="group" aria-label="Editing mode">
          {['batch', 'row', 'cell'].map((mode) => <button type="button" key={mode} className={editMode === mode ? 'is-active' : ''} onClick={() => setEditMode(mode)}>
            {mode[0].toUpperCase() + mode.slice(1)}
          </button>)}
        </div>}
      </header>

      {engine === 'legacy' ? (
        <CustomGrid modelName="DataGridConfig" gridType="System" apiBaseUrl={API_BASE_URL} editMode="batch" />
      ) : schemaError ? (
        <div className="itadmin-grid-list__error">{schemaError.message}</div>
      ) : (
        <DataGrid
          key={`modular-${editMode}`}
          dataSource={store}
          keyExpr="id"
          columns={columns}
          height="calc(100vh - 210px)"
          showBorders
          showRowLines
          showColumnLines
          rowAlternationEnabled
          hoverStateEnabled
          columnAutoWidth
          allowColumnReordering
          allowColumnResizing
          columnResizingMode="widget"
          columnChooser={{ enabled: true, mode: 'dragAndDrop', searchable: true, allowSelectAll: true, title: 'Tùy chọn cột' }}
          responsive={{ enabled: true, padding: 254 }}
          sorting={{ mode: 'multiple' }}
          searchPanel={{ visible: true, placeholder: 'Tìm trong DataGrid List...', width: 320, debounce: 250, highlightSearchText: true }}
          filterRow={{ visible: true, applyMode: 'auto' }}
          headerFilter={{ visible: true, searchable: true }}
          groupPanel={{ visible: true, allowColumnDragging: true, emptyText: 'Kéo cột vào đây để nhóm dữ liệu' }}
          grouping={{ autoExpandAll: true, allowCollapsing: true }}
          editing={{
            mode: editMode,
            allowAdding: true,
            allowUpdating: true,
            allowDeleting: true,
            confirmDelete: true,
            newRowPosition: 'first',
            texts: { add: 'Thêm', edit: 'Sửa', delete: 'Xóa', save: 'Lưu', cancel: 'Hủy', saveAll: 'Lưu thay đổi', cancelAll: 'Hoàn tác' },
          }}
          selection={{ mode: 'multiple', showCheckBoxes: true, selectAllMode: 'allPages' }}
          paging={{ enabled: true, pageSize: 50 }}
          pager={{
            visible: true,
            allowedPageSizes: [25, 50, 100, 200],
            showPageSizeSelector: true,
            showNavigationButtons: true,
            showInfo: true,
          }}
          rowNumber={{ visible: true, mode: 'absolute' }}
          messages={{ noData: 'Không có cấu hình DataGrid', loading: 'Đang tải DataGrid List...', retry: 'Tải lại', columns: 'Cột', resetColumns: 'Đặt lại cột' }}
        />
      )}
    </section>
  );
}
