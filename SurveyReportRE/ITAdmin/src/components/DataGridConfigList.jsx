import { useEffect, useMemo, useState } from 'react';
import appsettings from '../../../host.json';
import CustomGrid from '../../../TMIVCom/src/components/CustomGrid';
import { DataGrid, GridCustomStore } from '../../../TMIVCom/src/DataGrid';

const API_BASE_URL = appsettings.UrlConfig.Host;

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

const mapSchemaColumn = (column) => {
  const validationRules = parseJsonOption(column.validationRules, []);
  return {
    field: column.dataField || column.field,
    caption: column.caption || column.dataField || column.field,
    dataType: String(column.dataType || 'string').toLowerCase(),
    width: column.width || undefined,
    minWidth: column.minWidth || 90,
    visible: column.visible !== false,
    visibleIndex: column.visibleIndex ?? column.gridVisibleIndex,
    allowSorting: column.allowSorting !== false,
    allowFiltering: column.allowFiltering !== false,
    allowGrouping: column.allowGrouping !== false,
    allowReordering: column.allowReordering !== false,
    allowEditing: column.allowEditing !== false,
    alignment: column.alignment,
    format: column.format,
    lookup: parseJsonOption(column.lookup, column.lookup),
    editorType: column.editorType || column.editor,
    editorOptions: parseJsonOption(column.editorOptions, {}),
    validationRules: Array.isArray(validationRules) ? validationRules : [],
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
          <p>{engine === 'modular' ? 'TMIV modular DataGrid — Phase 3 batch editing & validation' : 'Legacy CustomGrid — batch editing'}</p>
        </div>
        <div className="itadmin-grid-list__engine" role="group" aria-label="Grid engine">
          <button type="button" className={engine === 'modular' ? 'is-active' : ''} onClick={() => setEngine('modular')}>
            Modular
          </button>
          <button type="button" className={engine === 'legacy' ? 'is-active' : ''} onClick={() => setEngine('legacy')}>
            Legacy edit
          </button>
        </div>
      </header>

      {engine === 'legacy' ? (
        <CustomGrid modelName="DataGridConfig" gridType="System" apiBaseUrl={API_BASE_URL} editMode="batch" />
      ) : schemaError ? (
        <div className="itadmin-grid-list__error">{schemaError.message}</div>
      ) : (
        <DataGrid
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
          sorting={{ mode: 'multiple' }}
          searchPanel={{ visible: true, placeholder: 'Tìm trong DataGrid List...', width: 320, debounce: 250, highlightSearchText: true }}
          filterRow={{ visible: true, applyMode: 'auto' }}
          headerFilter={{ visible: true, searchable: true }}
          groupPanel={{ visible: true, allowColumnDragging: true, emptyText: 'Kéo cột vào đây để nhóm dữ liệu' }}
          grouping={{ autoExpandAll: true, allowCollapsing: true }}
          summary={{ totalItems: [{ type: 'count', displayFormat: 'Tổng: {0} bản ghi' }] }}
          editing={{
            mode: 'batch',
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
          messages={{ noData: 'Không có cấu hình DataGrid', loading: 'Đang tải DataGrid List...', retry: 'Tải lại' }}
        />
      )}
    </section>
  );
}
