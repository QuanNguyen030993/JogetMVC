import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { CONFIG } from '../config';
import DropDownBox from './DropDownBox';
import SelectBox from './SelectBox';
import CheckBox from './CheckBox';
import * as XLSX from 'xlsx';

const API_BASE_URL = CONFIG.API_URL || 'https://localhost:7254';

const safeParseBinaryJson = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      try {
        const decoded = decodeURIComponent(escape(atob(val)));
        return JSON.parse(decoded);
      } catch (e2) {
        console.error("Failed to parse binary JSON:", e2);
        return null;
      }
    }
  }
  return null;
};

// Helper for case-insensitive row value lookup
const getCellValue = (row, fieldName) => {
  if (!row || !fieldName) return undefined;
  if (fieldName in row) return row[fieldName];
  
  const lowerField = fieldName.toLowerCase();
  const matchingKey = Object.keys(row).find(key => key.toLowerCase() === lowerField);
  return matchingKey ? row[matchingKey] : undefined;
};

const getAvatarBgColor = (name) => {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const normalizeExportConfig = (gridOption) => {
  const config = gridOption?.export || gridOption?.exportConfig || gridOption?.sysTableConfig?.export || {};

  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }

  return config || {};
};

const sanitizeFileName = (value) => {
  const text = String(value || 'GridData').trim();
  return (text || 'GridData').replace(/[\\/:*?"<>|]/g, '_');
};

const normalizeStatus = (raw) => {
  const text = String(raw ?? '').trim();
  const key = text.toLowerCase().replace(/\s+/g, ' ');

  if (key === '' || key === 'new') return { css: 'new', text: text || 'New' };
  if (key === 'pending' || key.includes('pending')) return { css: 'pending', text };
  if (key === 'in progress') return { css: 'in-progress', text };
  if (key === 'accept' || key.includes('accept')) return { css: 'accepted', text };
  if (key === 'approved') return { css: 'approved', text };
  if (key === 'reject' || key === 'quotation refused') return { css: 'rejected', text };
  if (key === 'decline' || key === 'declined') return { css: 'declined', text };
  if (key === 'quotation confirmed') return { css: 'accepted', text };
  if (key === 'done') return { css: 'done', text };
  if (key === 'complete' || key.includes('complete')) return { css: 'complete', text };
  if (key === 'dispose') return { css: 'dispose', text };
  if (key === 'archive') return { css: 'archive', text };
  if (key === '?' || key === 'unknown') return { css: 'unknown', text: '?' };
  return { css: 'unknown', text: text || '?' };
};

const parsePicObject = (picJson) => {
  try {
    return typeof picJson === 'string'
      ? JSON.parse(picJson || '{}')
      : (picJson || {});
  } catch {
    return {};
  }
};

const formatPicValue = (value, dept) => {
  if (!value) return '-';

  if (dept === 'FO' && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, itemValue]) => itemValue)
      .map(([key, itemValue]) => `${key}:${itemValue}`);
    return entries.length ? entries.join(' | ') : '-';
  }

  return String(value);
};

const buildPicCategorySearchText = (picJson) => {
  const obj = parsePicObject(picJson);
  const deptOrder = ['FO', 'TS', 'UW', 'LMKT', 'PM'];
  const parts = [];

  deptOrder.forEach((dept) => {
    const value = formatPicValue(obj[dept], dept);
    parts.push(dept);
    if (value && value !== '-') {
      parts.push(`${dept}:${value}`, `${dept}: ${value}`, `${dept} ${value}`, value);
    }
  });

  return parts.join(' ');
};

const renderPicItems = (picJson) => {
  const obj = parsePicObject(picJson);
  return ['FO', 'TS', 'UW', 'LMKT', 'PM'].map((dept) => ({
    dept,
    value: formatPicValue(obj[dept], dept)
  }));
};

const InlineCellEditor = ({ value, onChange, onFocus, onBlur }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const nextText = value == null ? '' : String(value);
    if (editorRef.current.textContent !== nextText) {
      editorRef.current.textContent = nextText;
    }
  }, [value]);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  return (
    <div
      ref={editorRef}
      className="grid-inline-editor"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      onInput={(event) => onChange?.(event.currentTarget.textContent ?? '')}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={(event) => event.stopPropagation()}
    />
  );
};

const CustomGrid = forwardRef(({
  modelName,
  gridType = 'User',
  gridOption = {},
  dataSource,
  columns: initialColumns,
  rows: initialRows,
  onRowsChange,
  onAddRow,
  onRowClick,
  onDesignFlow,
  apiBaseUrl,
  editMode: initialEditMode = 'batch',
  toolbarItems = [],
  rowTemplate,
  theme: propTheme,
  allowRowReordering = true,
  showSelectionCheckbox = true,
  showCommandsColumn = true,
  selectionMode: propSelectionMode,
}, ref) => {
  const API_BASE_URL = apiBaseUrl || CONFIG.API_URL || 'https://localhost:7254';
  const [columns, setColumns] = useState(initialColumns ?? []);
  const [rows, setRows] = useState(initialRows ?? []);
  const [draftRows, setDraftRows] = useState(initialRows ?? []);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [displayExpr, setDisplayExpr] = useState('name');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sortInfo, setSortInfo] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [groupColumns, setGroupColumns] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Drag row reorder state
  const [draggedRowKey, setDraggedRowKey] = useState(null);
  const [draggedColumnField, setDraggedColumnField] = useState(null);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const exportConfig = useMemo(() => normalizeExportConfig(gridOption), [gridOption]);
  const exportEnabled = exportConfig.enabled !== false;
  const editingConfig = gridOption?.editing || gridOption?.gridEditorOptions?.editing || {};
  const allowAdding = editingConfig.allowAdding !== false;
  const allowUpdating = editingConfig.allowUpdating !== false;
  const allowDeleting = editingConfig.allowDeleting !== false;
  const filterRowVisible = gridOption?.filterRow?.visible !== false;
  const groupPanelVisible = gridOption?.groupPanel?.visible !== false;

  // Theme support
  const [theme, setTheme] = useState(propTheme || 'light');
  useEffect(() => {
    if (propTheme) {
      setTheme(propTheme);
    } else {
      const isDark = document.body.classList.contains('dark') || 
                     document.body.classList.contains('dark-theme') || 
                     document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, [propTheme]);

  useEffect(() => {
    if (editingConfig.mode) {
      setEditMode(editingConfig.mode);
    }
  }, [editingConfig.mode]);

  // Extract grid reference / parameter properties similar to mGrid.js & _AppUtil.cshtml
  const refKey = gridOption?.refKey ?? gridOption?.mGridDetailOption?.refKey ?? null;
  const refField = gridOption?.refField ?? gridOption?.mGridDetailOption?.refField ?? 'Id';
  const refOperator = gridOption?.refOperator ?? gridOption?.mGridDetailOption?.refOperator ?? '=';
  const refKey2 = gridOption?.refKey2 ?? gridOption?.mGridDetailOption?.refKey2 ?? null;
  const refField2 = gridOption?.refField2 ?? gridOption?.mGridDetailOption?.refField2 ?? null;
  const refOperator2 = gridOption?.refOperator2 ?? gridOption?.mGridDetailOption?.refOperator2 ?? null;
  const overrideGetUrl = gridOption?.overrideGetUrl ?? gridOption?.mGridDetailOption?.overrideGetUrl ?? null;

  // Resolve selection mode
  const selectionMode = gridOption?.selection?.mode ?? gridOption?.selectionMode ?? propSelectionMode ?? (showSelectionCheckbox ? 'multiple' : 'single');
  const effectiveShowCommandsColumn = gridOption?.isAllowRowMenu ?? showCommandsColumn;
  const effectiveAllowRowReordering = gridOption?.rowDragging?.allowReordering ?? allowRowReordering;
  const effectiveShowSelectionCheckbox = selectionMode !== 'none' && showSelectionCheckbox;
  const isQuotationGrid = String(modelName || gridOption?.ModelName || '').toLowerCase() === 'quotation' || gridOption?.gridProfile === 'quotation';

  // Trigger onSelectionChanged callback when selectedRowKeys changes
  useEffect(() => {
    const callback = gridOption?.onSelectionChanged || gridOption?.mGridOption?.onSelectionChanged;
    if (callback) {
      callback({
        selectedRowKeys,
        selectedRowsData: draftRows.filter(r => selectedRowKeys.includes(r.id || r.Id))
      });
    }
  }, [selectedRowKeys, draftRows, gridOption]);

  // Fetch Table Metadata & Columns Schema
  useEffect(() => {
    if (!modelName) {
      if (initialColumns) {
        setColumns(initialColumns);
      }
      return;
    }

    const loadConfigAndScheme = async () => {
      setLoading(true);
      setError(null);
      try {
        let stConfig = null;
        try {
          const stRes = await fetch(`${API_BASE_URL}/api/Utility/GetSTConfig/${modelName}`);
          if (stRes.ok) {
            stConfig = await stRes.json();
          }
        } catch (e) {
          console.warn("Fetch ST Config failed", e);
        }

        let parsedGridOptions = {};
        if (stConfig) {
          const stItem = Array.isArray(stConfig) ? stConfig.find(x => x.name === modelName) : stConfig;
          if (stItem) {
            if (stItem.displayExpr) {
              setDisplayExpr(stItem.displayExpr);
            }
            if (stItem.gridEditorOptions) {
              parsedGridOptions = safeParseBinaryJson(stItem.gridEditorOptions) || {};
            }
          }
        }

        if (parsedGridOptions?.editing?.mode) {
          setEditMode(parsedGridOptions.editing.mode);
        }

        const schemeUrl = gridType === 'System' 
          ? `${API_BASE_URL}/api/${modelName}/GetSystemScheme` 
          : `${API_BASE_URL}/api/${modelName}/GetScheme`;
        
        const schemeRes = await fetch(schemeUrl);
        if (!schemeRes.ok) throw new Error("Load scheme config failed");
        const schemeData = await schemeRes.json();

        const mappedColumns = (schemeData || []).map((col) => {
          let editorType = col.editor;
          if (!editorType) {
            const dt = (col.dataType || 'string').toLowerCase();
            if (dt === 'number') {
              editorType = 'numberbox';
            } else if (dt === 'enum') {
              editorType = 'selectbox';
            } else if (dt === 'table') {
              editorType = 'dropdownbox';
            } else if (dt === 'boolean' || dt === 'customenum') {
              editorType = 'checkbox';
            } else {
              editorType = 'textbox';
            }
          }
          return {
            field: col.dataField,
            caption: col.caption || col.dataField,
            dataType: col.dataType || 'string',
            sortable: col.allowSorting !== false,
            groupable: col.allowGrouping !== false,
            editable: col.visible !== false,
            visible: col.visible !== false,
            editorType: editorType,
            lookup: col.lookup,
            validationRules: col.validationRules ? safeParseBinaryJson(col.validationRules) : [],
            editorOptions: col.editorOptions ? safeParseBinaryJson(col.editorOptions) : {},
            formItem: col.formItem ? safeParseBinaryJson(col.formItem) : {}
          };
        });

        setColumns(mappedColumns);
      } catch (err) {
        console.error("Load config and scheme failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfigAndScheme();
  }, [modelName, gridType, initialColumns]);

  // Fetch Rows Data
  const loadData = async () => {
    if (!modelName) {
      if (dataSource && typeof dataSource.load === 'function') {
        setLoading(true);
        setError(null);
        try {
          const loaded = await dataSource.load();
          const loadedRows = Array.isArray(loaded) ? loaded : loaded?.data ?? [];
          setRows(loadedRows);
          setDraftRows(loadedRows);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (initialRows) {
        setRows(initialRows);
        setDraftRows(initialRows);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (refKey) params.set("refKey", refKey);
      if (refField) params.set("refField", refField);
      if (refOperator) params.set("refOperator", refOperator);
      if (refKey2) params.set("refKey2", refKey2);
      if (refField2) params.set("refField2", refField2);
      if (refOperator2) params.set("refOperator2", refOperator2);

      let url = `${API_BASE_URL}/api/${modelName}/GetAll`;
      if (overrideGetUrl) {
        url = overrideGetUrl.startsWith("http") ? overrideGetUrl : `${API_BASE_URL}/${overrideGetUrl}`;
      }

      const separator = url.includes("?") ? "&" : "?";
      const fetchUrl = params.toString() ? `${url}${separator}${params.toString()}` : url;

      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Load rows data failed");
      const data = await res.json();
      const loadedRows = Array.isArray(data) ? data : data?.data ?? [];
      setRows(loadedRows);
      setDraftRows(loadedRows);
    } catch (err) {
      console.error("Load rows failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modelName, refKey, refField, refOperator, refKey2, refField2, refOperator2, overrideGetUrl, initialRows, dataSource]);

  // Normalize Columns Definitions for Rendering
  const normalizedColumns = useMemo(() => {
    return columns.map((column) => {
      if (typeof column === 'string') {
        const captions = { id: 'ID', name: 'Name', role: 'Role', status: 'Status' };
        return {
          field: column,
          caption: captions[column] || column,
          width: column === 'id' ? '60px' : column === 'status' ? '120px' : '1fr',
          visible: true,
          sortable: true,
          groupable: true,
          editable: true,
          editorType: 'textbox',
        };
      }

      let editorType = column.editorType || column.editor;
      if (!editorType) {
        const dt = (column.dataType || 'string').toLowerCase();
        if (dt === 'number') {
          editorType = 'numberbox';
        } else if (dt === 'enum') {
          editorType = 'selectbox';
        } else if (dt === 'table') {
          editorType = 'dropdownbox';
        } else if (dt === 'boolean' || dt === 'customenum') {
          editorType = 'checkbox';
        } else {
          editorType = 'textbox';
        }
      }

      const fieldName = column.field ?? column.dataField;
      const isPicColumn = ['pic', 'leaderPIC', 'hodpic'].includes(fieldName);
      const isWorkflowStatusColumn = fieldName === 'workflowStatus';
      const isQuotationCodeColumn = fieldName === 'quotationCode';
      const quotationStatusLookup = window._enums?.OverallStatus || window._enums?.overallStatus;
      const nextLookup = isQuotationGrid && isWorkflowStatusColumn && Array.isArray(quotationStatusLookup)
        ? {
          ...(column.lookup || {}),
          dataSource: quotationStatusLookup,
          valueExpr: column.lookup?.valueExpr || 'id',
          displayExpr: column.lookup?.displayExpr || 'value'
        }
        : column.lookup;

      return {
        field: fieldName,
        caption: column.caption || column.field || column.dataField,
        width: (isQuotationGrid && isPicColumn ? 500 : column.width) || '1fr',
        visible: column.visible !== false,
        sortable: column.sortable !== false && column.allowSorting !== false && !(isQuotationGrid && isPicColumn),
        groupable: column.groupable !== false,
        editable: column.editable !== false && column.allowEditing !== false,
        template: column.template,
        cellTemplate: column.cellTemplate,
        actions: column.actions,
        editorType: editorType,
        dataType: column.dataType,
        lookup: nextLookup,
        editorOptions: column.editorOptions,
        headerIcon: column.headerIcon || column.icon,
        cssClass: column.cssClass || (isQuotationGrid && isPicColumn ? 'col-pic-rows' : ''),
        sortOrder: column.sortOrder || (isQuotationGrid && fieldName === 'requestedDate' ? 'desc' : undefined),
        calculateCellValue: column.calculateCellValue || (isQuotationGrid && isPicColumn ? (rowData) => buildPicCategorySearchText(getCellValue(rowData, fieldName)) : undefined),
        calculateDisplayValue: column.calculateDisplayValue,
        linkConfig: column.linkConfig || (isQuotationGrid && isQuotationCodeColumn ? {
          moduleName: 'Business/Form',
          controllerName: 'Quotation',
          keyField: 'id',
          guidField: 'guid'
        } : undefined),
        statusColumn: isQuotationGrid && isWorkflowStatusColumn,
        picColumn: isQuotationGrid && isPicColumn,
      };
    });
  }, [columns, isQuotationGrid]);

  const getColumnValue = (row, column) => {
    if (!column) return undefined;

    if (typeof column.calculateCellValue === 'function') {
      try {
        return column.calculateCellValue(row);
      } catch (err) {
        console.warn('calculateCellValue failed:', column.field, err);
      }
    }

    if (typeof column.calculateDisplayValue === 'function') {
      try {
        return column.calculateDisplayValue(row);
      } catch (err) {
        console.warn('calculateDisplayValue failed:', column.field, err);
      }
    }

    return getCellValue(row, column.field);
  };

  useEffect(() => {
    if (sortInfo.field) return;

    const defaultSortColumn = normalizedColumns.find((column) => column.sortOrder);
    if (defaultSortColumn?.field) {
      setSortInfo({
        field: defaultSortColumn.field,
        direction: String(defaultSortColumn.sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc'
      });
    }
  }, [normalizedColumns, sortInfo.field]);

  // Columns specifically used for grid rendering structure
  const renderingColumns = useMemo(() => {
    const list = normalizedColumns.filter((column) => column.visible !== false);

    // Drag handle gripper column on the left
    if (effectiveAllowRowReordering && groupColumns.length === 0) {
      list.unshift({
        field: 'row-drag-handle',
        caption: '',
        width: '40px',
        sortable: false,
        groupable: false,
        editable: false,
        isCommand: true,
      });
    }

    // Checkbox selector column
    if (effectiveShowSelectionCheckbox) {
      list.unshift({
        field: 'row-selection-checkbox',
        caption: '',
        width: '40px',
        sortable: false,
        groupable: false,
        editable: false,
        isCommand: true,
      });
    }

    // Row command actions (Edit, Delete, View) on the right
    if (effectiveShowCommandsColumn) {
      list.push({
        field: 'row-commands',
        caption: 'Actions',
        width: '120px',
        sortable: false,
        groupable: false,
        editable: false,
        isCommand: true,
      });
    }

    return list;
  }, [normalizedColumns, effectiveAllowRowReordering, effectiveShowSelectionCheckbox, effectiveShowCommandsColumn, groupColumns.length]);

  const resolveColumnWidth = (column) => {
    const key = column.field || column.caption;
    if (columnWidths[key]) {
      return `${columnWidths[key]}px`;
    }

    const rawWidth = column.width;
    if (typeof rawWidth === 'number') {
      return `${rawWidth}px`;
    }
    if (typeof rawWidth === 'string') {
      const value = rawWidth.trim();
      if (value.endsWith('px') || value.endsWith('%') || value.endsWith('rem') || value.endsWith('em')) {
        return value;
      }
      if (/^\d+$/.test(value)) {
        return `${value}px`;
      }
    }
    if (column.field === 'row-selection-checkbox' || column.field === 'row-drag-handle') {
      return '40px';
    }
    if (column.field === 'row-commands') {
      return '120px';
    }
    return '160px';
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (event) => {
      const delta = event.clientX - resizingColumn.startX;
      const nextWidth = Math.max(48, resizingColumn.startWidth + delta);
      setColumnWidths((current) => ({
        ...current,
        [resizingColumn.key]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.body.classList.remove('tmivcom-column-resizing');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('tmivcom-column-resizing');
    };
  }, [resizingColumn]);

  // Row Manipulation & Saving
  const commitRows = (nextRows) => {
    setDraftRows(nextRows);
    if (editMode !== 'batch') {
      onRowsChange?.(nextRows);
    } else {
      setIsDirty(true);
    }
  };

  const handleAddRow = async () => {
    if (onAddRow) {
      onAddRow();
      return;
    }

    const nextId = draftRows.length ? Math.max(...draftRows.map((row) => row.id || row.Id || 0)) + 1 : 1;
    const newRow = { id: nextId, Id: nextId };
    normalizedColumns.forEach(col => {
      if (col.field && col.field !== 'id' && col.field !== 'Id') {
        newRow[col.field] = '';
      }
    });

    if (!modelName) {
      const nextRows = [...draftRows, newRow];
      commitRows(nextRows);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("values", JSON.stringify(newRow));

      const res = await fetch(`${API_BASE_URL}/api/${modelName}/InsertData`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Insert row failed");
      alert("Thêm dòng mới thành công! ✅");
      loadData();
    } catch (err) {
      console.error("Insert failed", err);
      alert("Thêm dòng thất bại! ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRow = async (rowId, updatedRow) => {
    if (!modelName) {
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("key", rowId);
      formData.append("values", JSON.stringify(updatedRow));

      const res = await fetch(`${API_BASE_URL}/api/${modelName}/UpdateData`, {
        method: "PUT",
        body: formData
      });
      if (!res.ok) throw new Error("Update row failed");
      loadData();
    } catch (err) {
      console.error("Update failed", err);
      alert("Cập nhật dòng thất bại! ❌");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (isDirty || editingRowId !== null) {
      const targetRows = draftRows;
      if (modelName) {
        const modifiedRows = targetRows.filter((row) => {
          const original = rows.find(r => (r.id || r.Id) === (row.id || row.Id));
          return !original || JSON.stringify(original) !== JSON.stringify(row);
        });

        setLoading(true);
        try {
          for (const row of modifiedRows) {
            const rowId = row.id || row.Id;
            const formData = new FormData();
            formData.append("key", rowId);
            formData.append("values", JSON.stringify(row));
            await fetch(`${API_BASE_URL}/api/${modelName}/UpdateData`, {
              method: "PUT",
              body: formData
            });
          }
          alert("Lưu tất cả thay đổi thành công! ✅");
          loadData();
        } catch (e) {
          console.error("Batch save failed", e);
          alert("Lưu thay đổi thất bại! ❌");
        } finally {
          setLoading(false);
        }
      } else if (dataSource && typeof dataSource.update === 'function') {
        try {
          await Promise.all(
            targetRows.map((row) => dataSource.update(row.id || row.Id, row)).filter(Boolean),
          );
        } catch (err) {
          setError(err.message);
        }
      }
      onRowsChange?.(targetRows);
      setIsDirty(false);
    }
    setEditingRowId(null);
    setActiveCell(null);
  };

  const cancelChanges = () => {
    setDraftRows(rows);
    setIsDirty(false);
    setEditingRowId(null);
    setActiveCell(null);
  };

  const handleDeleteRow = async (rowId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dòng này không?")) return;

    if (!modelName) {
      const nextRows = draftRows.filter((row) => (row.id || row.Id) !== rowId);
      commitRows(nextRows);
      if (selectedRowId === rowId) {
        setSelectedRowId(null);
      }
      setSelectedRowKeys(prev => prev.filter(k => k !== rowId));
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("key", rowId);

      const res = await fetch(`${API_BASE_URL}/api/${modelName}/DeleteData`, {
        method: "DELETE",
        body: formData
      });
      if (!res.ok) throw new Error("Delete row failed");
      alert("Xóa dòng thành công! ✅");
      loadData();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Xóa dòng thất bại! ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRow = (row) => {
    if (gridOption?.onViewRow) {
      gridOption.onViewRow(row);
    } else {
      alert("Chi tiết dòng:\n" + JSON.stringify(row, null, 2));
    }
  };

  // Drag and drop handlers
  const handleRowDragStart = (event, row) => {
    const rowKey = row.id || row.Id;
    setDraggedRowKey(rowKey);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-tmivcom-row-key', String(rowKey));
  };

  const handleRowDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleRowDrop = (event, targetRow) => {
    event.preventDefault();
    const sourceKey = event.dataTransfer.getData('application/x-tmivcom-row-key') || draggedRowKey;
    const targetKey = targetRow.id || targetRow.Id;
    if (!sourceKey || String(sourceKey) === String(targetKey)) {
      setDraggedRowKey(null);
      return;
    }

    const reordered = [...draftRows];
    const sourceIndex = reordered.findIndex((row) => String(row.id || row.Id) === String(sourceKey));
    const targetIndex = reordered.findIndex((row) => String(row.id || row.Id) === String(targetKey));
    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggedRowKey(null);
      return;
    }

    const [draggedRow] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, draggedRow);

    setDraggedRowKey(null);
    setSortInfo({ field: null, direction: 'asc' });
    commitRows(reordered);
  };

  // Checkbox selection handlers
  const handleSelectRowCheckbox = (event, rowId) => {
    event.stopPropagation();
    if (selectionMode === 'single') {
      setSelectedRowKeys((prev) =>
        prev.includes(rowId) ? [] : [rowId]
      );
      setSelectedRowId((prev) => (prev === rowId ? null : rowId));
    } else {
      setSelectedRowKeys((prev) =>
        prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
      );
    }
  };

  const handleSelectAllCheckbox = () => {
    const allIds = draftRows.map((r) => r.id || r.Id);
    if (selectedRowKeys.length === allIds.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(allIds);
    }
  };

  // Sorting & Filtering (Case-Insensitive getCellValue fixes filters not working)
  const filteredRows = useMemo(() => {
    return draftRows.filter((row) =>
      normalizedColumns.every((column) => {
        if (column.actions) return true;
        const value = getColumnValue(row, column);
        const filterValue = filters[column.field];
        if (filterValue === undefined || filterValue === null || filterValue === '') return true;

        if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') {
          const targetBool = filterValue === 'true';
          const valBool = value === true || value === 'true' || Number(value) === 1;
          return valBool === targetBool;
        }

        if (column.statusColumn && column.lookup && Array.isArray(column.lookup.dataSource)) {
          const valExpr = column.lookup.valueExpr || 'id';
          const dispExpr = column.lookup.displayExpr || 'value';
          const selectedItem = column.lookup.dataSource.find((item) => String(item[valExpr] ?? item.id ?? item.Id) === String(filterValue));
          const selectedText = selectedItem ? (selectedItem[dispExpr] ?? selectedItem.value ?? selectedItem.text ?? selectedItem.name ?? '') : filterValue;
          return String(value ?? '').toLowerCase().includes(String(selectedText).toLowerCase());
        }

        if (column.lookup && Array.isArray(column.lookup.dataSource)) {
          return String(value) === String(filterValue);
        }

        return String(value ?? '')
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      }),
    );
  }, [draftRows, filters, normalizedColumns]);

  const sortedRows = useMemo(() => {
    if (!sortInfo.field) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const sortColumn = normalizedColumns.find((column) => column.field === sortInfo.field);
      const left = getColumnValue(a, sortColumn || { field: sortInfo.field });
      const right = getColumnValue(b, sortColumn || { field: sortInfo.field });

      if (left === right) return 0;
      if (left == null) return 1;
      if (right == null) return -1;

      if (typeof left === 'number' && typeof right === 'number') {
        return sortInfo.direction === 'asc' ? left - right : right - left;
      }

      return sortInfo.direction === 'asc'
        ? String(left).localeCompare(String(right), undefined, { numeric: true })
        : String(right).localeCompare(String(left), undefined, { numeric: true });
    });
  }, [filteredRows, sortInfo, normalizedColumns]);

  const exportColumns = useMemo(() => (
    renderingColumns.filter((column) =>
      column.visible !== false &&
      !column.isCommand &&
      !column.actions &&
      column.field !== 'row-selection-checkbox' &&
      column.field !== 'row-drag-handle' &&
      column.field !== 'row-commands'
    )
  ), [renderingColumns]);

  const getExportCellValue = (row, column) => {
    const rawValue = getCellValue(row, column.field);
    const value = getColumnValue(row, column);

    if (column.picColumn) {
      return buildPicCategorySearchText(rawValue);
    }

    if (column.statusColumn) {
      return rawValue ?? value ?? '';
    }

    if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') {
      const boolValue = rawValue === true || rawValue === 'true' || Number(rawValue) === 1;
      return boolValue ? 'Yes' : 'No';
    }

    if ((column.editorType === 'dxSelectBox' || column.editorType === 'selectbox') && Array.isArray(column.lookup?.dataSource || column.editorOptions?.dataSource)) {
      const ds = column.lookup?.dataSource || column.editorOptions?.dataSource || [];
      const valExpr = column.lookup?.valueExpr || column.editorOptions?.valueExpr || 'id';
      const dispExpr = column.lookup?.displayExpr || column.editorOptions?.displayExpr || 'name';
      const selectedItem = ds.find((item) => {
        const itemVal = typeof item === 'object' ? (item[valExpr] ?? item.id ?? item.key ?? '') : item;
        return String(itemVal) === String(value);
      });

      if (selectedItem) {
        return typeof selectedItem === 'object'
          ? (selectedItem[dispExpr] ?? selectedItem.value ?? selectedItem.text ?? selectedItem.name ?? value)
          : selectedItem;
      }
    }

    if ((column.editorType === 'dxDropDownBox' || column.editorType === 'dropdownbox') && Array.isArray(column.lookup?.dataSource || column.editorOptions?.dataSource)) {
      const ds = column.lookup?.dataSource || column.editorOptions?.dataSource || [];
      const valExpr = column.lookup?.valueExpr || column.editorOptions?.valueExpr || 'Id';
      const dispExpr = column.lookup?.displayExpr || column.editorOptions?.displayExpr || 'name';
      const selectedItem = ds.find((item) => String(item[valExpr] ?? item.id ?? item.Id) === String(value));
      if (selectedItem) {
        return selectedItem[dispExpr] ?? selectedItem.name ?? value;
      }
    }

    return value ?? '';
  };

  const exportToExcel = (options = {}) => {
    const selectedOnly = options.selectedOnly ?? options.exportSelectedRows ?? false;
    const sourceRows = selectedOnly
      ? sortedRows.filter((row) => selectedRowKeys.includes(row.id || row.Id))
      : sortedRows;

    const headers = exportColumns.map((column) => column.caption || column.field);
    const dataRows = sourceRows.map((row) =>
      exportColumns.map((column) => getExportCellValue(row, column))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const columnWidthsForExport = exportColumns.map((column) => {
      const key = column.field || column.caption;
      const width = columnWidths[key] || parseInt(resolveColumnWidth(column), 10) || 160;
      return { wch: Math.max(10, Math.min(60, Math.round(width / 8))) };
    });
    worksheet['!cols'] = columnWidthsForExport;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const fileName = sanitizeFileName(options.fileName || exportConfig.fileName || modelName || gridOption?.ModelName || 'GridData');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Imperative handle to allow jQuery or parent components to get data or call options
  useImperativeHandle(ref, () => ({
    getData: () => draftRows,
    getSelectedRowKeys: () => selectedRowKeys,
    getSelectedRowsData: () => draftRows.filter(r => selectedRowKeys.includes(r.id || r.Id)),
    exportToExcel,
    selectRows: (keys, preserveExisting = false) => {
      if (preserveExisting) {
        setSelectedRowKeys(prev => [...new Set([...prev, ...keys])]);
      } else {
        setSelectedRowKeys(keys);
      }
    },
    deselectAll: () => setSelectedRowKeys([]),
    option: (name, value) => {
      if (name === 'value') {
        if (value !== undefined) {
          setDraftRows(value || []);
          setRows(value || []);
        } else {
          return draftRows;
        }
      }
      if (name === 'theme') {
        if (value !== undefined) {
          setTheme(value);
        } else {
          return theme;
        }
      }
      if (name === 'selectedRowKeys') {
        if (value !== undefined) {
          setSelectedRowKeys(value || []);
        } else {
          return selectedRowKeys;
        }
      }
    },
    value: () => draftRows
  }));

  const pageCount = useMemo(() => {
    if (groupColumns.length > 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredRows.length / pageSize));
  }, [filteredRows.length, pageSize, groupColumns.length]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  const pagedRows = useMemo(() => {
    if (groupColumns.length > 0) {
      return sortedRows;
    }
    const start = pageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, pageIndex, pageSize, groupColumns.length]);

  // Grouping
  const buildGroups = (items, groupIndex = 0, parentPath = []) => {
    if (groupIndex >= groupColumns.length) {
      return items;
    }

    const field = groupColumns[groupIndex];
    const groups = {};

    items.forEach((item) => {
      const key = getCellValue(item, field) ?? '(Blanks)';
      const path = [...parentPath, key];
      const groupKey = `${field}:${path.join('>')}`;

      if (!groups[key]) {
        groups[key] = { type: 'group', field, key, groupKey, level: groupIndex, count: 0, items: [], path };
      }

      groups[key].count += 1;
      groups[key].items.push(item);
    });

    return Object.values(groups).map((group) => ({
      ...group,
      items: buildGroups(group.items, groupIndex + 1, group.path),
    }));
  };

  const groupedRows = useMemo(() => {
    return groupColumns.length ? buildGroups(pagedRows) : pagedRows;
  }, [pagedRows, groupColumns]);

  const isCellEditable = (rowId, field) => {
    if (!field) return false;
    if (!allowUpdating) return false;
    if (editMode === 'batch') return true;
    if (editMode === 'row') return editingRowId === rowId;
    if (editMode === 'cell') return activeCell?.rowId === rowId && activeCell?.field === field;
    if (editMode === 'form') return selectedRowId === rowId;
    return false;
  };

  const handleCellChange = (rowId, field, value) => {
    const nextRows = draftRows.map((row) => ((row.id || row.Id) === rowId ? { ...row, [field]: value } : row));
    commitRows(nextRows);
  };

  const handleRowEdit = (rowId) => {
    setEditingRowId(rowId);
    setSelectedRowId(rowId);
  };

  const handleSelectRow = (rowId) => {
    setSelectedRowId(rowId === selectedRowId ? null : rowId);
    if (selectionMode === 'single') {
      setSelectedRowKeys(rowId === selectedRowId ? [] : [rowId]);
    }
    if (editMode === 'form') {
      setActiveCell(null);
    }
  };

  const handleHeaderClick = (column) => {
    if (!column.sortable || column.actions) return;

    setSortInfo((current) => {
      if (current.field === column.field) {
        return {
          field: column.field,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { field: column.field, direction: 'asc' };
    });
  };

  const handleColumnResizeStart = (event, column) => {
    event.preventDefault();
    event.stopPropagation();

    const key = column.field || column.caption;
    const headerCell = event.currentTarget.closest('th');
    const currentWidth = columnWidths[key] || headerCell?.offsetWidth || 160;
    document.body.classList.add('tmivcom-column-resizing');
    setResizingColumn({
      key,
      startX: event.clientX,
      startWidth: currentWidth,
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPageIndex(0);
  };

  const handleColumnDragStart = (event, column) => {
    setDraggedColumnField(column.field);
    event.dataTransfer.setData('text/plain', column.field);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (event) => {
    event.preventDefault();
  };

  const handleColumnDrop = async (event, targetColumn) => {
    event.preventDefault();
    const sourceField = event.dataTransfer.getData('text/plain') || draggedColumnField;
    if (!sourceField || sourceField === targetColumn.field) return;

    const sourceIndex = columns.findIndex(c => (c.field ?? c.dataField) === sourceField);
    const targetIndex = columns.findIndex(c => (c.field ?? c.dataField) === targetColumn.field);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const reorderedColumns = [...columns];
    const [draggedCol] = reorderedColumns.splice(sourceIndex, 1);
    reorderedColumns.splice(targetIndex, 0, draggedCol);

    const updatedColumns = reorderedColumns.map((col, index) => ({
      ...col,
      gridVisibleIndex: index,
      visibleIndex: index,
      order: index
    }));

    setColumns(updatedColumns);
    setDraggedColumnField(null);

    const modelId = gridOption?.ModelId ?? gridOption?.sysTableId ?? gridOption?.mGridOption?.ModelId ?? gridOption?.mGridDetailOption?.sysTableId ?? null;
    if (modelId && modelName) {
      try {
        const idsPayload = {};
        updatedColumns.forEach((col, idx) => {
          const fieldName = col.field ?? col.dataField;
          if (fieldName) {
            idsPayload[fieldName] = idx;
          }
        });

        const res = await fetch(`${API_BASE_URL}/api/DataGridConfig/UpdateGridVisibleIndex`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Ids: idsPayload,
            ModelName: modelName,
            ModelId: Number(modelId)
          })
        });

        if (res.ok) {
          console.log("Successfully updated column visible index on server.");
        } else {
          console.error("Failed to update column visible index:", await res.text());
        }
      } catch (err) {
        console.error("Error updating column visible index:", err);
      }
    }
  };

  const handleGroupDrop = (event) => {
    event.preventDefault();
    const field = event.dataTransfer.getData('text/plain');
    if (field && !groupColumns.includes(field)) {
      setGroupColumns((prev) => [...prev, field]);
      setExpandedGroups((prev) => ({ ...prev, [`${field}:${field}`]: true }));
    }
  };

  const handleRemoveGroup = (field) => {
    setGroupColumns((prev) => prev.filter((item) => item !== field));
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const openLinkedRow = (row, column) => {
    const linkConfig = column.linkConfig;
    if (!linkConfig) return;

    const keyValue = getCellValue(row, linkConfig.keyField || 'id') ?? getCellValue(row, 'Id');
    const guidValue = getCellValue(row, linkConfig.guidField || 'guid');
    const controllerName = linkConfig.controllerName || modelName;
    const moduleName = linkConfig.moduleName || 'Business/Form';
    const displayText = getCellValue(row, column.field) ?? '';
    const url = `/${moduleName}/${controllerName}_Form/${keyValue}${guidValue ? `/${guidValue}` : ''}`;
    const viewId = `form_${controllerName}_Form_${keyValue}`;
    const title = `${controllerName} ${displayText}`;

    if (typeof window.callElementView === 'function') {
      window.callElementView(url, viewId, title);
    } else {
      window.location.href = url;
    }
  };

  // Rendering Helper Methods
  const renderCellValue = (row, column) => {
    const rowId = row.id || row.Id;
    const isEditing = isCellEditable(rowId, column.field);
    const value = getCellValue(row, column.field);

    if (column.actions) {
      return (
        <div className="grid-action-cell">
          {column.actions.map((action) => (
            <button
              key={action.text}
              type="button"
              className="action-button"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(row);
              }}
            >
              {action.icon ? <span className="action-icon">{action.icon}</span> : null}
              {action.text}
            </button>
          ))}
        </div>
      );
    }

    // Avatar Column Rendering
    if (column.dataType === 'avatar' || column.editorType === 'avatar' || column.field === 'avatar' || column.field === 'photo') {
      const isUrl = value && (value.startsWith('http') || value.startsWith('/') || value.includes('.'));
      if (isUrl) {
        return (
          <div className="avatar-cell-wrap">
            <img className="grid-avatar-img" src={value} alt="" />
          </div>
        );
      } else {
        const initials = value ? value.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        const bgColor = getAvatarBgColor(value || '');
        return (
          <div className="avatar-cell-wrap">
            <div className="grid-avatar-initials" style={{ backgroundColor: bgColor }}>
              {initials}
            </div>
          </div>
        );
      }
    }

    if (column.cellTemplate) {
      return column.cellTemplate({ value, rowData: row });
    }

    if (column.template) {
      return column.template({ row, value, onChange: (nextValue) => handleCellChange(rowId, column.field, nextValue) });
    }

    if (isEditing) {
      if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox') {
        return (
          <CheckBox
            value={value}
            onChange={(nextVal) => handleCellChange(rowId, column.field, nextVal)}
          />
        );
      }

      if (column.editorType === 'dxDateBox' || column.editorType === 'datebox') {
        return (
          <InlineCellEditor
            value={value ? value.substring(0, 10) : ''}
            onChange={(nextValue) => handleCellChange(rowId, column.field, nextValue)}
            onFocus={() => {
              if (editMode === 'cell') {
                setActiveCell({ rowId, field: column.field });
              }
            }}
            onBlur={() => {
              if (editMode === 'cell') {
                setActiveCell(null);
              }
            }}
          />
        );
      }

      if (column.editorType === 'dxSelectBox' || column.editorType === 'selectbox') {
        const ds = column.lookup?.dataSource || column.editorOptions?.dataSource || [];
        const valExpr = column.lookup?.valueExpr || column.editorOptions?.valueExpr || 'id';
        const dispExpr = column.lookup?.displayExpr || column.editorOptions?.displayExpr || 'name';
        const itemTemplate = column.lookup?.itemTemplate || column.editorOptions?.itemTemplate;

        return (
          <SelectBox
            value={value}
            dataSource={ds}
            valueExpr={valExpr}
            displayExpr={dispExpr}
            placeholder="Select..."
            itemTemplate={itemTemplate}
            onChange={(nextVal) => handleCellChange(rowId, column.field, nextVal)}
          />
        );
      }

      if (column.editorType === 'dxDropDownBox' || column.editorType === 'dropdownbox') {
        const gridModelName = column.editorOptions?.modelName || column.editorOptions?.gridOption?.modelName || column.field;
        const ds = column.lookup?.dataSource || column.editorOptions?.dataSource;
        const cols = column.editorOptions?.columns || column.lookup?.columns;
        return (
          <DropDownBox
            value={value}
            modelName={gridModelName}
            dataSource={ds}
            columns={cols}
            valueExpr={column.editorOptions?.valueExpr || column.lookup?.valueExpr || 'Id'}
            displayExpr={column.editorOptions?.displayExpr || column.lookup?.displayExpr || 'name'}
            onChange={(nextVal) => handleCellChange(rowId, column.field, nextVal)}
          />
        );
      }

      if (column.editorType === 'dxNumberBox' || column.editorType === 'numberbox') {
        return (
          <InlineCellEditor
            value={value ?? ''}
            onChange={(nextValue) => handleCellChange(rowId, column.field, Number(nextValue))}
            onFocus={() => {
              if (editMode === 'cell') {
                setActiveCell({ rowId, field: column.field });
              }
            }}
            onBlur={() => {
              if (editMode === 'cell') {
                setActiveCell(null);
              }
            }}
          />
        );
      }

      if (column.lookup && Array.isArray(column.lookup.dataSource)) {
        return (
          <select
            value={value ?? ''}
            onChange={(event) => handleCellChange(rowId, column.field, event.target.value)}
          >
            <option value="">--</option>
            {column.lookup.dataSource.map((item) => (
              <option key={item[column.lookup.valueExpr]} value={item[column.lookup.valueExpr]}>
                {item[column.lookup.displayExpr]}
              </option>
            ))}
          </select>
        );
      }

      return (
        <InlineCellEditor
          value={value ?? ''}
          onChange={(nextValue) => handleCellChange(rowId, column.field, nextValue)}
          onFocus={() => {
            if (editMode === 'cell') {
              setActiveCell({ rowId, field: column.field });
            }
          }}
          onBlur={() => {
            if (editMode === 'cell') {
              setActiveCell(null);
            }
          }}
        />
      );
    }

    if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') {
      const valBool = value === true || value === 'true' || Number(value) === 1;
      return (
        <CheckBox
          value={valBool}
          readOnly={true}
          disabled={true}
        />
      );
    }

    if (column.linkConfig) {
      return (
        <button
          type="button"
          className="tmivcom-grid-link"
          title={String(value ?? '')}
          onClick={(event) => {
            event.stopPropagation();
            openLinkedRow(row, column);
          }}
        >
          {value ?? ''}
        </button>
      );
    }

    if (column.statusColumn) {
      const status = normalizeStatus(value);
      return (
        <span className={`statusTag ${status.css}`} title={status.text}>
          {status.text}
        </span>
      );
    }

    if (column.picColumn) {
      return (
        <div className="pic-inline-wrap" title={buildPicCategorySearchText(value)}>
          {renderPicItems(value).map((item) => (
            <div key={item.dept} className={`pic-inline pic-inline--${item.dept.toLowerCase()}`}>
              <span className="pic-inline-head">{item.dept}</span>
              <span className="pic-inline-val" title={item.value}>{item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    if (column.editorType === 'dxSelectBox' || column.editorType === 'selectbox') {
      const ds = column.lookup?.dataSource || column.editorOptions?.dataSource || [];
      const valExpr = column.lookup?.valueExpr || column.editorOptions?.valueExpr || 'id';
      const dispExpr = column.lookup?.displayExpr || column.editorOptions?.displayExpr || 'name';
      const selectedItem = ds.find(item => {
        const itemVal = typeof item === 'object' ? (item[valExpr] ?? item.id ?? item.key ?? '') : item;
        return String(itemVal) === String(value);
      });
      if (selectedItem) {
        const itemTemplate = column.lookup?.itemTemplate || column.editorOptions?.itemTemplate;
        if (itemTemplate) {
          return <div className="tmivcom-selectbox-item-templated">{itemTemplate(selectedItem)}</div>;
        }
        const displayVal = typeof selectedItem === 'object' ? (selectedItem[dispExpr] ?? selectedItem.value ?? selectedItem.text ?? selectedItem.name ?? '') : selectedItem;
        return <span>{displayVal}</span>;
      }
    }

    if (column.editorType === 'dxDropDownBox' || column.editorType === 'dropdownbox') {
      const ds = column.lookup?.dataSource || column.editorOptions?.dataSource;
      if (Array.isArray(ds)) {
        const valExpr = column.lookup?.valueExpr || column.editorOptions?.valueExpr || 'Id';
        const dispExpr = column.lookup?.displayExpr || column.editorOptions?.displayExpr || 'name';
        const selectedItem = ds.find(item => String(item[valExpr] ?? item.id ?? item.Id) === String(value));
        if (selectedItem) {
          return <span>{selectedItem[dispExpr] ?? selectedItem.name}</span>;
        }
      }
    }

    return <span>{value ?? ''}</span>;
  };

  const renderRow = (node) => {
    const rowId = node.id || node.Id;
    const rowClasses = `grid-row dx-data-row ${selectedRowId === rowId ? 'dx-selection' : ''} ${String(draggedRowKey) === String(rowId) ? 'row-dragging' : ''}`;
    const rowProps = {
      key: rowId,
      className: rowClasses,
      onClick: () => {
        handleSelectRow(rowId);
        gridOption?.onRowClick?.({ data: node, key: rowId, rowType: 'data' });
        onRowClick?.(node);
      },
      onDragOver: handleRowDragOver,
      onDrop: (e) => handleRowDrop(e, node),
    };

    return (
      <tr {...rowProps}>
        {renderingColumns.map((column) => {
          if (column.field === 'row-drag-handle') {
            return (
              <td 
                key="cell-drag" 
                className="grid-cell drag-handle-cell" 
                draggable={true} 
                onDragStart={(e) => handleRowDragStart(e, node)}
                onDragEnd={() => setDraggedRowKey(null)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <span className="drag-gripper">⁞⁞</span>
                </div>
              </td>
            );
          }
          if (column.field === 'row-selection-checkbox') {
            return (
              <td key="cell-select" className="grid-cell selection-cell" onClick={(e) => e.stopPropagation()}>
                <div className="grid-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedRowKeys.includes(rowId)}
                    onChange={(e) => handleSelectRowCheckbox(e, rowId)}
                  />
                </div>
              </td>
            );
          }
          if (column.field === 'row-commands') {
            const isEditing = editingRowId === rowId;
            return (
              <td key="cell-commands" className="grid-cell commands-cell" onClick={(e) => e.stopPropagation()}>
                <div className="grid-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', height: '100%' }}>
                  {isEditing ? (
                    <>
                      <button type="button" className="command-btn save-btn" onClick={saveChanges} title="Lưu">
                        <i className="fa fa-check"></i>
                      </button>
                      <button type="button" className="command-btn cancel-btn" onClick={cancelChanges} title="Hủy">
                        <i className="fa fa-times"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="command-btn view-btn" onClick={() => handleViewRow(node)} title="Xem chi tiết">
                        <i className="fa fa-eye"></i>
                      </button>
                      {onDesignFlow && (
                        <button type="button" className="command-btn design-btn" onClick={() => onDesignFlow(node)} title="Thiết kế Quy trình">
                          <i className="fa fa-sitemap"></i>
                        </button>
                      )}
                      {allowUpdating && (
                        <button type="button" className="command-btn edit-btn" onClick={() => handleRowEdit(rowId)} title="Sửa dòng">
                          <i className="fa fa-pencil"></i>
                        </button>
                      )}
                      {allowDeleting && (
                        <button type="button" className="command-btn delete-btn" onClick={() => handleDeleteRow(rowId)} title="Xóa dòng">
                          <i className="fa fa-trash-o"></i>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            );
          }

          const isEditing = isCellEditable(rowId, column.field);
          return (
            <td 
              key={column.field || `col-${column.caption}`} 
              className={`grid-cell dx-cell ${column.cssClass || ''} ${isEditing ? 'editing-cell' : ''}`}
              onClick={() => {
                if (editMode === 'cell' && column.editable) {
                  setActiveCell({ rowId, field: column.field });
                }
              }}
            >
              <div className="grid-cell-content" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: '100%' }}>
                {renderCellValue(node, column)}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  const renderGroupNodes = (nodes) => {
    if (!Array.isArray(nodes)) return null;

    const list = [];
    nodes.forEach((node) => {
      if (node.type === 'group') {
        const isExpanded = expandedGroups[node.groupKey] !== false;
        list.push(
          <tr 
            key={node.groupKey} 
            className="group-header-row" 
            onClick={() => toggleGroup(node.groupKey)}
            style={{ cursor: 'pointer', background: 'var(--grid-header-bg)' }}
          >
            <td colSpan={renderingColumns.length} className="group-header-cell" style={{ padding: '8px 12px', paddingLeft: `${node.level * 16 + 12}px`, fontWeight: '600', borderBottom: '1px solid var(--grid-border-cells)' }}>
              <span className="group-toggle" style={{ marginRight: '6px' }}>{isExpanded ? '▾' : '▸'}</span>
              <span>
                {node.field}: {node.key} ({node.count})
              </span>
            </td>
          </tr>
        );
        if (isExpanded) {
          list.push(...renderGroupNodes(node.items));
        }
      } else {
        list.push(renderRow(node));
      }
    });
    return list;
  };

  const defaultToolbarItems = [
    {
      location: 'before',
      text: 'Refresh',
      icon: 'fa-refresh',
      onClick: loadData,
      disabled: loading,
    },
    {
      location: 'before',
      text: 'Save',
      icon: 'fa-save',
      onClick: saveChanges,
      disabled: !allowUpdating || (!isDirty && editingRowId === null),
    },
    {
      location: 'before',
      text: 'Cancel',
      icon: 'fa-undo',
      onClick: cancelChanges,
      disabled: !isDirty && editingRowId === null,
    },
    ...(exportEnabled ? [{
      location: 'before',
      text: 'Export Excel',
      icon: 'fa-file-excel-o',
      onClick: () => exportToExcel({
        selectedOnly: exportConfig.allowExportSelectedData && selectedRowKeys.length > 0
      }),
      disabled: exportColumns.length === 0 || sortedRows.length === 0,
    }] : []),
    ...(allowAdding ? [{
      location: 'after',
      text: 'Add Row',
      icon: 'fa-plus',
      onClick: handleAddRow,
    }] : []),
  ];

  const renderedToolbarItems = [...defaultToolbarItems, ...toolbarItems];

  const showingStart = filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const showingEnd = Math.min(filteredRows.length, (pageIndex + 1) * pageSize);

  return (
    <div className={`custom-grid dx-datagrid custom-grid-${theme}`}>
      <div className="grid-toolbar">
        <div className="toolbar-group toolbar-group-before">
          {renderedToolbarItems
            .filter((item) => item.location !== 'after')
            .map((item) => (
              <button
                key={item.text}
                type="button"
                className="toolbar-item"
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.text}
              >
                {item.icon ? <span className="toolbar-icon"><i className={`fa ${item.icon}`}></i></span> : null}
              </button>
            ))}
        </div>
        <div className="toolbar-group toolbar-group-after">
          {renderedToolbarItems
            .filter((item) => item.location === 'after')
            .map((item) => (
              <button
                key={item.text}
                type="button"
                className="toolbar-item"
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.text}
              >
                {item.icon ? <span className="toolbar-icon"><i className={`fa ${item.icon}`}></i></span> : null}
              </button>
            ))}
        </div>
      </div>

      {groupPanelVisible && <div className="grid-group-panel" onDragOver={(event) => event.preventDefault()} onDrop={handleGroupDrop}>
        {groupColumns.length === 0 ? (
          <span className="group-placeholder">Drag a column header here to group by that column</span>
        ) : (
          groupColumns.map((field) => {
            const column = renderingColumns.find((col) => col.field === field);
            return (
              <span key={field} className="group-chip">
                {column?.caption || field}
                <button type="button" onClick={() => handleRemoveGroup(field)}>
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>}

      {/* Styled Grid using native HTML <table> structure for perfect alignment */}
      <div className="grid-table-container" style={{ overflowX: 'auto', width: '100%' }}>
        <table className="grid-table">
          <colgroup>
            {renderingColumns.map((column, idx) => (
              <col key={idx} style={{ width: resolveColumnWidth(column) }} />
            ))}
          </colgroup>

          <thead className="grid-header">
            <tr className="dx-header-row">
              {renderingColumns.map((column) => {
                if (column.field === 'row-selection-checkbox') {
                  return (
                    <th key="header-select-all" className="grid-header-cell selection-header-cell">
                      <div className="grid-header-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <input 
                          type="checkbox" 
                          checked={draftRows.length > 0 && selectedRowKeys.length === draftRows.length}
                          onChange={handleSelectAllCheckbox}
                        />
                      </div>
                    </th>
                  );
                }
                if (column.field === 'row-drag-handle') {
                  return (
                    <th key="header-drag-handle" className="grid-header-cell drag-header-cell">
                      <div className="grid-header-cell-content" style={{ width: '100%', height: '100%' }}></div>
                    </th>
                  );
                }
                if (column.field === 'row-commands') {
                  return (
                    <th key="header-commands" className="grid-header-cell commands-header-cell">
                      <div className="grid-header-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontWeight: '600' }}>
                        <span>Actions</span>
                      </div>
                    </th>
                  );
                }

                return (
                  <th
                    key={column.field || `header-${column.caption}`}
                    className={`grid-header-cell dx-header-cell sortable resizable ${sortInfo.field === column.field ? 'sorted' : ''}`}
                    onClick={() => handleHeaderClick(column)}
                  >
                    <div 
                      className="grid-header-cell-content" 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: '100%', fontWeight: '600', cursor: 'grab' }}
                      draggable={column.sortable !== false}
                      onDragStart={(event) => handleColumnDragStart(event, column)}
                      onDragOver={handleColumnDragOver}
                      onDrop={(event) => handleColumnDrop(event, column)}
                    >
                      {column.headerIcon ? (
                        <span className="header-icon-wrap">
                          <i className={`fa ${column.headerIcon}`}></i>
                        </span>
                      ) : column.dataType === 'avatar' || column.editorType === 'avatar' || column.field === 'avatar' || column.field === 'photo' ? (
                        <span className="header-icon-wrap">
                          <i className="fa fa-picture-o"></i>
                        </span>
                      ) : null}
                      <span>{column.caption}</span>
                      {column.sortable && (
                        <span className="sort-indicator">
                          {sortInfo.field === column.field ? (sortInfo.direction === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </div>
                    <span
                      className="grid-column-resizer"
                      onMouseDown={(event) => handleColumnResizeStart(event, column)}
                      title="Resize column"
                    />
                  </th>
                );
              })}
            </tr>

            {filterRowVisible && <tr className="grid-filter-row">
              {renderingColumns.map((column) => (
                <th key={column.field || `filter-${column.caption}`} className="grid-filter-cell">
                  {column.isCommand || column.field === 'row-commands' || column.field === 'row-selection-checkbox' || column.field === 'row-drag-handle' ? null : column.lookup && Array.isArray(column.lookup.dataSource) ? (
                    <div className="filter-input-wrap">
                      <select
                        value={filters[column.field] ?? ''}
                        onChange={(event) => handleFilterChange(column.field, event.target.value)}
                      >
                        <option value="">All</option>
                        {column.lookup.dataSource.map((item) => (
                          <option key={item[column.lookup.valueExpr]} value={item[column.lookup.valueExpr]}>
                            {item[column.lookup.displayExpr]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') ? (
                    <div className="filter-input-wrap">
                      <select
                        value={filters[column.field] ?? ''}
                        onChange={(event) => handleFilterChange(column.field, event.target.value)}
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  ) : (
                    <div className="filter-input-wrap">
                      <input
                        type="text"
                        value={filters[column.field] ?? ''}
                        placeholder={`Filter ${column.caption}`}
                        onChange={(event) => handleFilterChange(column.field, event.target.value)}
                      />
                    </div>
                  )}
                </th>
              ))}
            </tr>}
          </thead>

          <tbody className="grid-body">
            {loading ? (
              <tr>
                <td colSpan={renderingColumns.length} className="grid-loading" style={{ padding: '20px', textAlign: 'center' }}>
                  Loading data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={renderingColumns.length} className="grid-error" style={{ padding: '20px', textAlign: 'center', color: '#b91c1c' }}>
                  {String(error)}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr className="grid-row no-data">
                <td colSpan={renderingColumns.length} className="grid-cell" style={{ textAlign: 'center', padding: '20px' }}>
                  No data available
                </td>
              </tr>
            ) : (
              renderGroupNodes(groupedRows)
            )}
          </tbody>
        </table>
      </div>

      {/* Styled Footer to match mockup exactly */}
      <div className="grid-footer dx-toolbar">
        <div className="pager-controls">
          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex(0)} 
            disabled={pageIndex === 0}
            title="First page"
          >
            <i className="fa fa-angle-double-left"></i>
          </button>
          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))} 
            disabled={pageIndex === 0}
            title="Previous page"
          >
            <i className="fa fa-angle-left"></i>
          </button>
          
          <span className="pager-nav-text">Page</span>
          <input 
            type="number" 
            className="pager-page-input"
            value={pageIndex + 1}
            min={1}
            max={pageCount}
            onChange={(e) => {
              const val = Number(e.target.value) - 1;
              if (val >= 0 && val < pageCount) {
                setPageIndex(val);
              }
            }}
          />
          <span className="pager-nav-text">of {pageCount}</span>

          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))} 
            disabled={pageIndex >= pageCount - 1}
            title="Next page"
          >
            <i className="fa fa-angle-right"></i>
          </button>
          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex(pageCount - 1)} 
            disabled={pageIndex >= pageCount - 1}
            title="Last page"
          >
            <i className="fa fa-angle-double-right"></i>
          </button>

          <span className="pager-separator">|</span>

          <span className="pager-nav-text">Results per page</span>
          <select 
            className="pager-size-select"
            value={pageSize} 
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <span className="pager-separator">|</span>

          <button 
            type="button" 
            className="pager-refresh-btn" 
            onClick={loadData}
            title="Refresh grid data"
            disabled={loading}
          >
            <i className="fa fa-refresh"></i>
          </button>
        </div>

        <div className="pager-info">
          {`Showing ${showingStart} - ${showingEnd} of ${filteredRows.length}`}
        </div>
      </div>
    </div>
  );
});

export default CustomGrid;
