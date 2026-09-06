import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { CONFIG } from '../config';
import DropDownBox from './DropDownBox';
import SelectBox from './SelectBox';
import CheckBox from './CheckBox';
import TextBox from './TextBox';
import NumberBox from './NumberBox';
import DateBox from './Datebox';
import { notify } from './Notification';
import * as XLSX from 'xlsx';
import { DxCompatibleDataGrid } from '../DataGrid';

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

const getRowKey = (row, keyExpr = 'id') => {
  if (!row) return undefined;
  return getCellValue(row, keyExpr) ?? getCellValue(row, 'id') ?? getCellValue(row, 'Id');
};

const coerceClipboardValue = (value, column) => {
  const text = String(value ?? '');
  const dataType = String(column?.dataType || '').toLowerCase();
  const editorType = String(column?.editorType || '').toLowerCase();

  if (dataType === 'number' || editorType.includes('number')) {
    if (!text.trim()) return null;
    const normalized = text.trim().replace(/,/g, '');
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) ? numberValue : value;
  }

  if (dataType === 'boolean' || editorType.includes('checkbox')) {
    if (!text.trim()) return null;
    return ['true', '1', 'yes', 'y', 'x'].includes(text.trim().toLowerCase());
  }

  if (dataType === 'date' || dataType === 'datetime' || editorType.includes('date')) {
    if (!text.trim()) return null;
    const dateValue = new Date(text.trim());
    return Number.isNaN(dateValue.getTime()) ? value : dateValue.toISOString();
  }

  return text;
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

const LegacyCustomGrid = forwardRef(({
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
  const gridElementRef = useRef(null);
  const initializedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getColumnId = (col) => {
    if (!col) return '';
    if (typeof col === 'string') return col;
    return col.field ?? col.dataField ?? col.caption ?? '';
  };

  const getIconClass = (iconName) => {
    if (!iconName) return '';
    if (iconName.includes('fa-solid') || iconName.includes('fa-regular') || iconName.includes('fa-brands') || iconName.startsWith('fas ') || iconName.startsWith('far ') || iconName.startsWith('fa ')) {
      return iconName;
    }
    if (iconName.startsWith('fa-')) {
      return `fa-solid ${iconName}`;
    }
    return `fa-solid fa-${iconName}`;
  };
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sortInfo, setSortInfo] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [groupColumns, setGroupColumns] = useState([]);
  const pagingConfig = gridOption?.paging || {};
  const pagerConfig = gridOption?.pager || {};
  const pagingEnabled = pagingConfig.enabled !== false;
  const allowedPageSizes = Array.isArray(pagerConfig.allowedPageSizes) && pagerConfig.allowedPageSizes.length
    ? pagerConfig.allowedPageSizes
    : [25, 50, 100, 200];
  const initialPageSize = Number(pagingConfig.pageSize) || 50;
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);
  const [searchText, setSearchText] = useState(gridOption?.searchPanel?.text || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isEditLayoutMode, setIsEditLayoutMode] = useState(false);

  // Excel filter states
  const [excelFilters, setExcelFilters] = useState({});
  const [openFilterField, setOpenFilterField] = useState(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [tempSelectedValues, setTempSelectedValues] = useState([]);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const getColumnUniqueValues = (field) => {
    const uniqueMap = new Map();
    const column = columns.find(c => getColumnId(c) === field);
    draftRows.forEach(r => {
      const rawVal = getCellValue(r, field);
      let displayVal = rawVal;
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        uniqueMap.set('', '(Blanks)');
      } else {
        if (column && column.lookup && Array.isArray(column.lookup.dataSource)) {
          const lookupItem = column.lookup.dataSource.find(item => String(item[column.lookup.valueExpr]) === String(rawVal));
          displayVal = lookupItem ? lookupItem[column.lookup.displayExpr] : rawVal;
        }
        uniqueMap.set(rawVal, String(displayVal));
      }
    });
    return Array.from(uniqueMap.entries()).map(([raw, disp]) => ({ raw, disp })).sort((a, b) => a.disp.localeCompare(b.disp));
  };

  const handleFilterIconClick = (e, column) => {
    e.stopPropagation();
    e.preventDefault();
    if (openFilterField === column.field) {
      setOpenFilterField(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 5}px`,
      left: `${rect.left}px`,
      zIndex: 9999,
      background: 'var(--grid-bg, #fff)',
      border: '1px solid var(--grid-border-cells, #ddd)',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '10px',
      minWidth: '220px',
      maxHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });
    const activeVals = excelFilters[column.field] || [];
    setOpenFilterField(column.field);
    setTempSelectedValues([...activeVals]);
    setFilterSearchQuery('');
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openFilterField && !e.target.closest('.excel-filter-dropdown') && !e.target.closest('.header-filter-btn')) {
        setOpenFilterField(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openFilterField]);

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
  const searchPanelVisible = gridOption?.searchPanel?.visible === true;
  const pagerVisible = pagerConfig.visible !== false && pagingEnabled;
  const showPageSizeSelector = pagerConfig.showPageSizeSelector !== false;
  const showNavigationButtons = pagerConfig.showNavigationButtons !== false;
  const showPagerInfo = pagerConfig.showInfo !== false;
  const keyExpr = gridOption?.keyExpr || 'id';

  useEffect(() => {
    const configuredPageSize = Number(pagingConfig.pageSize);
    if (configuredPageSize > 0) {
      setPageSize(configuredPageSize);
      setPageIndex(0);
    }
  }, [pagingConfig.pageSize]);

  // Theme support
  const [theme, setTheme] = useState(propTheme || 'light');
  useEffect(() => {
    if (propTheme) {
      setTheme(propTheme);
    } else {
      setTheme('light');
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
        selectedRowsData: draftRows.filter(r => selectedRowKeys.includes(getRowKey(r, keyExpr)))
      });
    }
  }, [selectedRowKeys, draftRows, gridOption]);

  // Fetch Table Metadata & Columns Schema
  useEffect(() => {
    if (!modelName) {
      if (initialColumns && Array.isArray(initialColumns)) {
        const storageKey = `customgrid_colorder_${gridType || 'default'}_${initialColumns.map(getColumnId).join('_')}`;
        try {
          const savedOrder = localStorage.getItem(storageKey);
          if (savedOrder) {
            const orderArr = JSON.parse(savedOrder);
            if (Array.isArray(orderArr) && orderArr.length > 0) {
              const reordered = [];
              orderArr.forEach((fieldId) => {
                const col = initialColumns.find(c => getColumnId(c) === fieldId);
                if (col) reordered.push(col);
              });
              initialColumns.forEach((col) => {
                const fieldId = getColumnId(col);
                if (!orderArr.includes(fieldId)) {
                  reordered.push(col);
                }
              });
              if (reordered.length > 0) {
                setColumns(reordered);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("Failed to load column order from localStorage", e);
        }
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

  useEffect(() => {
    if (!gridElementRef.current || initializedRef.current) return;
    initializedRef.current = true;
    gridOption?.onInitialized?.({
      component: ref?.current,
      element: gridElementRef.current,
    });
  }, [gridOption, ref]);

  useEffect(() => {
    if (loading || !gridElementRef.current) return;
    gridOption?.onContentReady?.({
      component: ref?.current,
      element: gridElementRef.current,
    });
  }, [loading, draftRows.length, columns.length]);

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
      let nextLookup = column.lookup;
      if (editorType === 'selectbox' || nextLookup) {
        let ds = nextLookup?.dataSource || column.editorOptions?.dataSource;
        let valueExpr = nextLookup?.valueExpr || column.editorOptions?.valueExpr || 'id';
        let displayExpr = nextLookup?.displayExpr || column.editorOptions?.displayExpr || 'name';

        if (typeof ds === 'string' && window._enums && Array.isArray(window._enums[ds])) {
          ds = window._enums[ds];
        }

        if ((!ds || !Array.isArray(ds) || ds.length === 0) && window._enums) {
          const cleanField = fieldName.replace(/Id$/i, '');
          const enumKey = Object.keys(window._enums).find(
            key => key.toLowerCase() === cleanField.toLowerCase() || key.toLowerCase() === fieldName.toLowerCase()
          );
          if (enumKey && Array.isArray(window._enums[enumKey])) {
            ds = window._enums[enumKey];
          }
        }

        if ((!ds || !Array.isArray(ds) || ds.length === 0) && isWorkflowStatusColumn) {
          const overallStatusDS = window._enums?.OverallStatus || window._enums?.overallStatus;
          if (Array.isArray(overallStatusDS)) {
            ds = overallStatusDS;
            displayExpr = 'value';
          }
        }

        if (Array.isArray(ds) && ds.length > 0) {
          const firstItem = ds[0];
          if (firstItem && typeof firstItem === 'object') {
            if (!nextLookup?.valueExpr && !column.editorOptions?.valueExpr) {
              valueExpr = firstItem.id !== undefined ? 'id' : (firstItem.code !== undefined ? 'code' : (firstItem.value !== undefined ? 'value' : valueExpr));
            }
            if (!nextLookup?.displayExpr && !column.editorOptions?.displayExpr) {
              displayExpr = firstItem.value !== undefined ? 'value' : (firstItem.text !== undefined ? 'text' : (firstItem.name !== undefined ? 'key' : (firstItem.key !== undefined ? 'key' : displayExpr)));
            }
          }

          nextLookup = {
            ...(nextLookup || {}),
            dataSource: ds,
            valueExpr,
            displayExpr
          };
        }
      }

      return {
        field: fieldName,
        caption: column.caption || column.field || column.dataField,
        width: (isQuotationGrid && isPicColumn ? 500 : column.width) || '1fr',
        visible: column.visible !== false,
        allowSearch: column.allowSearch !== false,
        sortable: column.sortable !== false && column.allowSorting !== false && !(isQuotationGrid && isPicColumn),
        groupable: column.groupable !== false,
        editable: column.editable !== false && column.allowEditing !== false,
        template: column.template,
        cellTemplate: column.cellTemplate,
        actions: column.actions,
        editorType: editorType,
        dataType: column.dataType,
        lookup: nextLookup,
        editorOptions: nextLookup ? { ...(column.editorOptions || {}), dataSource: nextLookup.dataSource, valueExpr: nextLookup.valueExpr, displayExpr: nextLookup.displayExpr } : column.editorOptions,
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

  const getSearchableCellText = (row, column) => {
    const value = getColumnValue(row, column);
    const lookup = column?.lookup;
    if (lookup && Array.isArray(lookup.dataSource)) {
      const valueExpr = lookup.valueExpr || 'id';
      const displayExpr = lookup.displayExpr || 'name';
      const item = lookup.dataSource.find((candidate) => {
        const candidateValue = typeof candidate === 'object' ? candidate[valueExpr] : candidate;
        return String(candidateValue ?? '') === String(value ?? '');
      });
      if (item !== undefined) {
        return typeof item === 'object' ? (item[displayExpr] ?? value ?? '') : item;
      }
    }
    return value ?? '';
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
        let filterVal = '';
        if (filters[col.field] !== undefined && filters[col.field] !== null && filters[col.field] !== '') {
          filterVal = filters[col.field];
        } else if (excelFilters[col.field] && excelFilters[col.field].length === 1) {
          filterVal = excelFilters[col.field][0];
        }
        newRow[col.field] = filterVal;
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
      notify("Thêm dòng mới thành công! ✅", "success");
      loadData();
    } catch (err) {
      console.error("Insert failed", err);
      notify("Thêm dòng thất bại! ❌", "error");
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
      notify("Cập nhật dòng thất bại! ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (isDirty || editingRowId !== null) {
      const targetRows = draftRows;
      if (modelName) {
        const modifiedRows = targetRows.filter((row) => {
          const original = rows.find(r => getRowKey(r, keyExpr) === getRowKey(row, keyExpr));
          return !original || JSON.stringify(original) !== JSON.stringify(row);
        });

        setLoading(true);
        try {
          for (const row of modifiedRows) {
            const rowId = getRowKey(row, keyExpr);
            const formData = new FormData();
            formData.append("key", rowId);
            formData.append("values", JSON.stringify(row));
            await fetch(`${API_BASE_URL}/api/${modelName}/UpdateData`, {
              method: "PUT",
              body: formData
            });
          }
          notify("Lưu tất cả thay đổi thành công! ✅", "success");
          loadData();
        } catch (e) {
          console.error("Batch save failed", e);
          notify("Lưu thay đổi thất bại! ❌", "error");
        } finally {
          setLoading(false);
        }
      } else if (dataSource && typeof dataSource.update === 'function') {
        try {
          await Promise.all(
            targetRows.map((row) => dataSource.update(getRowKey(row, keyExpr), row)).filter(Boolean),
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
      const nextRows = draftRows.filter((row) => getRowKey(row, keyExpr) !== rowId);
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
      notify("Xóa dòng thành công! ✅", "success");
      loadData();
    } catch (err) {
      console.error("Delete failed", err);
      notify("Xóa dòng thất bại! ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRow = (row) => {
    if (gridOption?.onViewRow) {
      gridOption.onViewRow(row);
    } else {
      notify(`Chi tiết dòng: ${row.id || row.Id || ''}`, "info");
    }
  };

  // Drag and drop handlers
  const handleRowDragStart = (event, row) => {
    const rowKey = getRowKey(row, keyExpr);
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
    const targetKey = getRowKey(targetRow, keyExpr);
    if (!sourceKey || String(sourceKey) === String(targetKey)) {
      setDraggedRowKey(null);
      return;
    }

    const reordered = [...draftRows];
    const sourceIndex = reordered.findIndex((row) => String(getRowKey(row, keyExpr)) === String(sourceKey));
    const targetIndex = reordered.findIndex((row) => String(getRowKey(row, keyExpr)) === String(targetKey));
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
    const selectableIds = filteredRows.map((row) => getRowKey(row, keyExpr)).filter((key) => key !== undefined);
    const allSelected = selectableIds.length > 0 && selectableIds.every((key) => selectedRowKeys.includes(key));
    if (allSelected) {
      setSelectedRowKeys((current) => current.filter((key) => !selectableIds.includes(key)));
    } else {
      setSelectedRowKeys((current) => [...new Set([...current, ...selectableIds])]);
    }
  };

  // Sorting & Filtering (Case-Insensitive getCellValue fixes filters not working)
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    return draftRows.filter((row) => {
      if (normalizedSearch) {
        const matchesSearch = normalizedColumns.some((column) => {
          if (column.visible === false || column.isCommand || column.allowSearch === false) return false;
          return String(getSearchableCellText(row, column)).toLocaleLowerCase().includes(normalizedSearch);
        });
        if (!matchesSearch) return false;
      }

      return normalizedColumns.every((column) => {
        if (column.actions) return true;
        const value = getColumnValue(row, column);
        
        // 1. Text filter row checks
        const filterValue = filters[column.field];
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') {
            const targetBool = filterValue === 'true';
            const valBool = value === true || value === 'true' || Number(value) === 1;
            if (valBool !== targetBool) return false;
          } else if (column.statusColumn && column.lookup && Array.isArray(column.lookup.dataSource)) {
            const valExpr = column.lookup.valueExpr || 'id';
            const dispExpr = column.lookup.displayExpr || 'value';
            const selectedItem = column.lookup.dataSource.find((item) => String(item[valExpr] ?? item.id ?? item.Id) === String(filterValue));
            const selectedText = selectedItem ? (selectedItem[dispExpr] ?? selectedItem.value ?? selectedItem.text ?? selectedItem.name ?? '') : filterValue;
            if (!String(value ?? '').toLowerCase().includes(String(selectedText).toLowerCase())) return false;
          } else if (column.lookup && Array.isArray(column.lookup.dataSource)) {
            if (String(value) !== String(filterValue)) return false;
          } else {
            if (!String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase())) return false;
          }
        }

        // 2. Excel multi-select filters checks
        const excelSelectedVals = excelFilters[column.field];
        if (excelSelectedVals && Array.isArray(excelSelectedVals) && excelSelectedVals.length > 0) {
          const rawVal = value === undefined || value === null || value === '' ? '' : value;
          if (!excelSelectedVals.includes(rawVal)) {
            return false;
          }
        }

        return true;
      });
    });
  }, [draftRows, filters, excelFilters, normalizedColumns, searchText]);

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
      ? sortedRows.filter((row) => selectedRowKeys.includes(getRowKey(row, keyExpr)))
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
    getVisibleRows: () => pagedRows.map((data, rowIndex) => ({ data, key: getRowKey(data, keyExpr), rowIndex, rowType: 'data' })),
    getSelectedRowKeys: () => selectedRowKeys,
    getSelectedRowsData: () => draftRows.filter(r => selectedRowKeys.includes(getRowKey(r, keyExpr))),
    exportToExcel,
    refresh: loadData,
    saveEditData: saveChanges,
    cancelEditData: cancelChanges,
    clearFilter: () => {
      setFilters({});
      setExcelFilters({});
      setSearchText('');
      setPageIndex(0);
    },
    pageIndex: (value) => {
      if (value === undefined) return pageIndex;
      setPageIndex(Math.max(0, Number(value) || 0));
    },
    pageSize: (value) => {
      if (value === undefined) return pageSize;
      setPageSize(Math.max(1, Number(value) || initialPageSize));
      setPageIndex(0);
    },
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
      if (name === 'searchPanel.text') {
        if (value !== undefined) {
          setSearchText(String(value ?? ''));
          setPageIndex(0);
        } else {
          return searchText;
        }
      }
    },
    value: () => draftRows
  }));

  const pageCount = useMemo(() => {
    if (!pagingEnabled || groupColumns.length > 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredRows.length / pageSize));
  }, [filteredRows.length, pageSize, groupColumns.length, pagingEnabled]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  const pagedRows = useMemo(() => {
    if (!pagingEnabled || groupColumns.length > 0) {
      return sortedRows;
    }
    const start = pageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, pageIndex, pageSize, groupColumns.length, pagingEnabled]);

  const handleGridPaste = (event) => {
    if (!focusedCell || !allowUpdating) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

    const clipboardText = event.clipboardData?.getData('text/plain');
    if (!clipboardText) return;

    const pastedRows = clipboardText
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.split('\t'));
    if (pastedRows.length > 1 && pastedRows[pastedRows.length - 1].every((value) => value === '')) {
      pastedRows.pop();
    }
    if (!pastedRows.length) return;

    const editableColumns = normalizedColumns.filter((column) => column.visible !== false && column.editable !== false && column.field);
    const startColumnIndex = editableColumns.findIndex((column) => column.field === focusedCell.field);
    const startRowIndex = pagedRows.findIndex((row) => getRowKey(row, keyExpr) === focusedCell.rowKey);
    if (startColumnIndex < 0 || startRowIndex < 0) return;

    event.preventDefault();
    const updates = new Map();
    pastedRows.forEach((values, rowOffset) => {
      const targetRow = pagedRows[startRowIndex + rowOffset];
      if (!targetRow) return;
      const targetKey = getRowKey(targetRow, keyExpr);
      const nextRow = { ...(updates.get(targetKey) || targetRow) };

      values.forEach((value, columnOffset) => {
        const targetColumn = editableColumns[startColumnIndex + columnOffset];
        if (!targetColumn) return;
        nextRow[targetColumn.field] = coerceClipboardValue(value, targetColumn);
      });
      updates.set(targetKey, nextRow);
    });

    if (!updates.size) return;
    const nextRows = draftRows.map((row) => updates.get(getRowKey(row, keyExpr)) || row);
    commitRows(nextRows);
    gridOption?.onCellValueChanged?.({
      component: ref?.current,
      data: updates.get(focusedCell.rowKey),
      key: focusedCell.rowKey,
      column: normalizedColumns.find((column) => column.field === focusedCell.field),
      value: updates.get(focusedCell.rowKey)?.[focusedCell.field],
    });
  };

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
    const nextRows = draftRows.map((row) => (getRowKey(row, keyExpr) === rowId ? { ...row, [field]: value } : row));
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
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', column.field || '');
      event.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleColumnDragOver = (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleColumnDrop = async (event, targetColumn) => {
    event.preventDefault();
    if (!isEditLayoutMode) return;
    const sourceField = (event.dataTransfer && event.dataTransfer.getData('text/plain')) || draggedColumnField;
    if (!sourceField || sourceField === targetColumn.field) return;

    const sourceIndex = columns.findIndex(c => getColumnId(c) === sourceField);
    const targetIndex = columns.findIndex(c => getColumnId(c) === getColumnId(targetColumn));

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

    if (!modelName && initialColumns && Array.isArray(initialColumns)) {
      const storageKey = `customgrid_colorder_${gridType || 'default'}_${initialColumns.map(getColumnId).join('_')}`;
      try {
        const orderArr = updatedColumns.map(getColumnId);
        localStorage.setItem(storageKey, JSON.stringify(orderArr));
      } catch (e) {
        console.warn("Failed to save column order to localStorage", e);
      }
    }

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
          <DateBox
            value={value ? value.substring(0, 10) : ''}
            onChange={(nextValue) => handleCellChange(rowId, column.field, nextValue)}
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
          <NumberBox
            value={value}
            onChange={(nextValue) => handleCellChange(rowId, column.field, nextValue)}
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
        <TextBox
          value={value ?? ''}
          onChange={(nextValue) => handleCellChange(rowId, column.field, nextValue)}
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
    const rowId = getRowKey(node, keyExpr);
    const rowClasses = `grid-row tmivcom-grid-row ${selectedRowId === rowId ? 'tmivcom-grid-selection' : ''} ${String(draggedRowKey) === String(rowId) ? 'row-dragging' : ''}`;
    const rowProps = {
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
      <tr key={rowId} {...rowProps}>
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
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button type="button" className="command-btn cancel-btn" onClick={cancelChanges} title="Hủy">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="command-btn view-btn" onClick={() => handleViewRow(node)} title="Xem chi tiết">
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {onDesignFlow && (
                        <button type="button" className="command-btn design-btn" onClick={() => onDesignFlow(node)} title="Thiết kế Quy trình">
                          <i className="fa-solid fa-sitemap"></i>
                        </button>
                      )}
                      {allowUpdating && (
                        <button type="button" className="command-btn edit-btn" onClick={() => handleRowEdit(rowId)} title="Sửa dòng">
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                      )}
                      {allowDeleting && (
                        <button type="button" className="command-btn delete-btn" onClick={() => handleDeleteRow(rowId)} title="Xóa dòng">
                          <i className="fa-solid fa-trash-can"></i>
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
              className={`grid-cell tmivcom-grid-cell ${column.cssClass || ''} ${isEditing ? 'editing-cell' : ''}`}
              tabIndex={0}
              onFocus={() => setFocusedCell({ rowKey: rowId, field: column.field })}
              onClick={(event) => {
                setFocusedCell({ rowKey: rowId, field: column.field });
                if (editMode === 'cell' && column.editable) {
                  setActiveCell({ rowId, field: column.field });
                }
                gridOption?.onCellClick?.({
                  column,
                  columnIndex: renderingColumns.findIndex((item) => item.field === column.field),
                  component: ref?.current,
                  data: node,
                  event,
                  key: rowId,
                  rowType: 'data',
                  value: getColumnValue(node, column),
                });
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
    {
      location: 'before',
      text: isEditLayoutMode ? 'Exit Layout Edit' : 'Edit Layout',
      icon: 'fa-edit',
      onClick: () => setIsEditLayoutMode(prev => !prev),
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

  const showingStart = filteredRows.length === 0 ? 0 : (pagingEnabled ? pageIndex * pageSize + 1 : 1);
  const showingEnd = pagingEnabled ? Math.min(filteredRows.length, (pageIndex + 1) * pageSize) : filteredRows.length;

  return (
    <div
      ref={gridElementRef}
      className={`tmivcom-custom-grid tmivcom-custom-grid-${theme}`}
      role="grid"
      aria-rowcount={filteredRows.length}
      aria-colcount={renderingColumns.length}
      onPaste={handleGridPaste}
    >
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
                {item.icon ? <span className="toolbar-icon"><i className={getIconClass(item.icon)}></i></span> : null}
              </button>
            ))}
        </div>
        <div className="toolbar-group toolbar-group-after">
          {searchPanelVisible && (
            <label className="grid-search-panel">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              <input
                type="search"
                value={searchText}
                placeholder={gridOption?.searchPanel?.placeholder || 'Search...'}
                aria-label={gridOption?.searchPanel?.placeholder || 'Search grid'}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setPageIndex(0);
                }}
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText('')} title="Clear search" aria-label="Clear search">
                  ×
                </button>
              )}
            </label>
          )}
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
                {item.icon ? <span className="toolbar-icon"><i className={getIconClass(item.icon)}></i></span> : null}
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
            <tr className="tmivcom-grid-header-row">
              {renderingColumns.map((column) => {
                if (column.field === 'row-selection-checkbox') {
                  return (
                    <th key="header-select-all" className="grid-header-cell selection-header-cell">
                      <div className="grid-header-cell-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredRows.length > 0 && filteredRows.every((row) => selectedRowKeys.includes(getRowKey(row, keyExpr)))}
                          onChange={handleSelectAllCheckbox}
                          aria-label="Select all filtered rows"
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
                    draggable={true}
                    onDragStart={(event) => handleColumnDragStart(event, column)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(event) => handleColumnDrop(event, column)}
                    style={{ cursor: 'grab' }}
                  >
                    <div 
                      className="grid-header-cell-content" 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: '100%', fontWeight: '600' }}
                    >
                      {column.headerIcon ? (
                        <span className="header-icon-wrap">
                          <i className={getIconClass(column.headerIcon)}></i>
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
                      {!isEditLayoutMode && column.sortable !== false && (
                        <span 
                          className="header-filter-btn" 
                          onClick={(e) => handleFilterIconClick(e, column)}
                          style={{ cursor: 'pointer', padding: '2px', marginLeft: '4px', opacity: (excelFilters[column.field] && excelFilters[column.field].length > 0) ? 1 : 0.4 }}
                          title="Filter values"
                        >
                          <i className="fa-solid fa-filter" style={{ color: (excelFilters[column.field] && excelFilters[column.field].length > 0) ? '#0284c7' : 'inherit', fontSize: '11px' }}></i>
                        </span>
                      )}
                    </div>
                    {isEditLayoutMode && (
                      <span
                        className="grid-column-resizer"
                        onMouseDown={(event) => handleColumnResizeStart(event, column)}
                        title="Resize column"
                      />
                    )}
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

      {pagerVisible && <div className="grid-footer dx-toolbar">
        <div className="pager-controls">
          {showNavigationButtons && <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex(0)} 
            disabled={pageIndex === 0}
            title="First page"
          >
            <i className="fa fa-angle-double-left"></i>
          </button>}
          {showNavigationButtons && <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))} 
            disabled={pageIndex === 0}
            title="Previous page"
          >
            <i className="fa fa-angle-left"></i>
          </button>}
          
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

          {showNavigationButtons && <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))} 
            disabled={pageIndex >= pageCount - 1}
            title="Next page"
          >
            <i className="fa fa-angle-right"></i>
          </button>}
          {showNavigationButtons && <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex(pageCount - 1)} 
            disabled={pageIndex >= pageCount - 1}
            title="Last page"
          >
            <i className="fa fa-angle-double-right"></i>
          </button>}

          {showPageSizeSelector && <span className="pager-separator">|</span>}
          {showPageSizeSelector && <span className="pager-nav-text">Results per page</span>}
          {showPageSizeSelector && <select 
            className="pager-size-select"
            value={pageSize} 
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          >
            {allowedPageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>}

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

        {showPagerInfo && <div className="pager-info">
          {`Showing ${showingStart} - ${showingEnd} of ${filteredRows.length}`}
        </div>}
      </div>}

      {openFilterField && (
        <div 
          className="excel-filter-dropdown" 
          style={dropdownStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="filter-search-box" style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', marginBottom: '4px' }}>
            <input 
              type="text" 
              placeholder="Search..." 
              value={filterSearchQuery} 
              onChange={(e) => setFilterSearchQuery(e.target.value)} 
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>

          <div className="filter-values-list" style={{ overflowY: 'auto', flex: 1, maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0', borderBottom: '1px solid #eee' }}>
            {(() => {
              const uniqueVals = getColumnUniqueValues(openFilterField);
              const filteredUnique = uniqueVals.filter(item => 
                item.disp.toLowerCase().includes(filterSearchQuery.toLowerCase())
              );
              
              const isAllChecked = filteredUnique.length > 0 && filteredUnique.every(item => tempSelectedValues.includes(item.raw));
              
              return (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    <input 
                      type="checkbox" 
                      checked={isAllChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelection = [...new Set([...tempSelectedValues, ...filteredUnique.map(i => i.raw)])];
                          setTempSelectedValues(newSelection);
                        } else {
                          const filteredRaws = filteredUnique.map(i => i.raw);
                          setTempSelectedValues(tempSelectedValues.filter(v => !filteredRaws.includes(v)));
                        }
                      }}
                    />
                    (Select All)
                  </label>
                  
                  {filteredUnique.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="checkbox" 
                        checked={tempSelectedValues.includes(item.raw)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedValues([...tempSelectedValues, item.raw]);
                          } else {
                            setTempSelectedValues(tempSelectedValues.filter(v => v !== item.raw));
                          }
                        }}
                      />
                      {item.disp}
                    </label>
                  ))}
                </>
              );
            })()}
          </div>

          <div className="filter-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', paddingTop: '4px' }}>
            <button 
              type="button" 
              onClick={() => {
                const newFilters = { ...excelFilters };
                delete newFilters[openFilterField];
                setExcelFilters(newFilters);
                setOpenFilterField(null);
              }}
              style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Clear Filter
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setExcelFilters({
                    ...excelFilters,
                    [openFilterField]: tempSelectedValues
                  });
                  setOpenFilterField(null);
                }}
                style={{ padding: '4px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                OK
              </button>
              <button 
                type="button" 
                onClick={() => setOpenFilterField(null)}
                style={{ padding: '4px 12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const CustomGrid = forwardRef((props, ref) => {
  if (props.architecture === 'modular' || props.engine === 'v2') {
    return <DxCompatibleDataGrid ref={ref} {...props} />;
  }

  return <LegacyCustomGrid ref={ref} {...props} />;
});

export { DxCompatibleDataGrid };
export default CustomGrid;
