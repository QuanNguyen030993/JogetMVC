import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { CONFIG } from '../config';
import DropDownBox from './DropDownBox';
import SelectBox from './SelectBox';
import CheckBox from './CheckBox';

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

const getAvatarBgColor = (name) => {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
  editMode: initialEditMode = 'batch',
  toolbarItems = [],
  rowTemplate,
  theme: propTheme,
  allowRowReordering = true,
  showSelectionCheckbox = true,
  showCommandsColumn = true,
}, ref) => {
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
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);

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

  // Extract grid reference / parameter properties similar to mGrid.js & _AppUtil.cshtml
  const refKey = gridOption?.refKey ?? gridOption?.mGridDetailOption?.refKey ?? null;
  const refField = gridOption?.refField ?? gridOption?.mGridDetailOption?.refField ?? 'Id';
  const refOperator = gridOption?.refOperator ?? gridOption?.mGridDetailOption?.refOperator ?? '=';
  const refKey2 = gridOption?.refKey2 ?? gridOption?.mGridDetailOption?.refKey2 ?? null;
  const refField2 = gridOption?.refField2 ?? gridOption?.mGridDetailOption?.refField2 ?? null;
  const refOperator2 = gridOption?.refOperator2 ?? gridOption?.mGridDetailOption?.refOperator2 ?? null;
  const overrideGetUrl = gridOption?.overrideGetUrl ?? gridOption?.mGridDetailOption?.overrideGetUrl ?? null;

  // Imperative handle to allow jQuery or parent components to get data or call options
  useImperativeHandle(ref, () => ({
    getData: () => draftRows,
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
    },
    value: () => draftRows
  }));

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

      return {
        field: column.field ?? column.dataField,
        caption: column.caption || column.field || column.dataField,
        width: column.width || '1fr',
        sortable: column.sortable !== false,
        groupable: column.groupable !== false,
        editable: column.editable !== false,
        template: column.template,
        cellTemplate: column.cellTemplate,
        actions: column.actions,
        editorType: editorType,
        dataType: column.dataType,
        lookup: column.lookup,
        headerIcon: column.headerIcon || column.icon,
      };
    });
  }, [columns]);

  // Columns specifically used for grid rendering structure
  const renderingColumns = useMemo(() => {
    const list = [...normalizedColumns];

    // Drag handle gripper column on the left
    if (allowRowReordering && groupColumns.length === 0) {
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
    if (showSelectionCheckbox) {
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
    if (showCommandsColumn) {
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
  }, [normalizedColumns, allowRowReordering, showSelectionCheckbox, showCommandsColumn, groupColumns.length]);

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
  const handleRowDragStart = (event, index) => {
    setDraggedRowIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleRowDragOver = (event, index) => {
    event.preventDefault();
  };

  const handleRowDrop = (event, index) => {
    event.preventDefault();
    if (draggedRowIndex === null || draggedRowIndex === index) return;
    
    const reordered = [...draftRows];
    const draggedRow = reordered[draggedRowIndex];
    reordered.splice(draggedRowIndex, 1);
    reordered.splice(index, 0, draggedRow);
    
    setDraggedRowIndex(null);
    commitRows(reordered);
  };

  // Checkbox selection handlers
  const handleSelectRowCheckbox = (event, rowId) => {
    event.stopPropagation();
    setSelectedRowKeys((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handleSelectAllCheckbox = () => {
    const allIds = draftRows.map((r) => r.id || r.Id);
    if (selectedRowKeys.length === allIds.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(allIds);
    }
  };

  // Sorting & Filtering
  const filteredRows = useMemo(() => {
    return draftRows.filter((row) =>
      normalizedColumns.every((column) => {
        if (column.actions) return true;
        const value = row[column.field];
        const filterValue = filters[column.field];
        if (filterValue === undefined || filterValue === null || filterValue === '') return true;

        if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox' || column.dataType === 'boolean') {
          const targetBool = filterValue === 'true';
          return !!value === targetBool;
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
      const left = a[sortInfo.field];
      const right = b[sortInfo.field];

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
  }, [filteredRows, sortInfo]);

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
      const key = item[field] ?? '(Blanks)';
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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPageIndex(0);
  };

  const handleDragStart = (event, column) => {
    event.dataTransfer.setData('text/plain', column.field);
    event.dataTransfer.effectAllowed = 'copy';
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

  // Rendering Helper Methods
  const renderCellValue = (row, column) => {
    const rowId = row.id || row.Id;
    const isEditing = isCellEditable(rowId, column.field);
    const value = row[column.field];

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
          <input
            type="date"
            value={value ? value.substring(0, 10) : ''}
            onChange={(event) => handleCellChange(rowId, column.field, event.target.value)}
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
          <input
            type="number"
            value={value ?? ''}
            onChange={(event) => handleCellChange(rowId, column.field, Number(event.target.value))}
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
        <input
          type="text"
          value={value ?? ''}
          onChange={(event) => handleCellChange(rowId, column.field, event.target.value)}
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

    if (column.editorType === 'dxCheckBox' || column.editorType === 'checkbox') {
      return (
        <CheckBox
          value={value}
          readOnly={true}
          disabled={true}
        />
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
    const rowIndex = draftRows.findIndex((r) => (r.id || r.Id) === rowId);
    const rowClasses = `grid-row dx-data-row ${selectedRowId === rowId ? 'dx-selection' : ''} ${draggedRowIndex === rowIndex ? 'row-dragging' : ''}`;
    const rowProps = {
      key: rowId,
      className: rowClasses,
      style: { gridTemplateColumns: templateColumns },
      onClick: () => handleSelectRow(rowId),
      onDragOver: (e) => handleRowDragOver(e, rowIndex),
      onDrop: (e) => handleRowDrop(e, rowIndex),
    };

    if (rowTemplate) {
      return rowTemplate({
        row: node,
        columns: renderingColumns,
        defaultRowProps: rowProps,
        isEditing: editingRowId === rowId || (editMode === 'form' && selectedRowId === rowId),
        onCellChange: handleCellChange,
        onEditRow: handleRowEdit,
        onDeleteRow: handleDeleteRow,
      });
    }

    return (
      <div {...rowProps}>
        {renderingColumns.map((column) => {
          if (column.field === 'row-drag-handle') {
            return (
              <div 
                key="cell-drag" 
                className="grid-cell drag-handle-cell" 
                draggable={true} 
                onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="drag-gripper">⁞⁞</span>
              </div>
            );
          }
          if (column.field === 'row-selection-checkbox') {
            return (
              <div key="cell-select" className="grid-cell selection-cell" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedRowKeys.includes(rowId)}
                  onChange={(e) => handleSelectRowCheckbox(e, rowId)}
                />
              </div>
            );
          }
          if (column.field === 'row-commands') {
            const isEditing = editingRowId === rowId;
            return (
              <div key="cell-commands" className="grid-cell commands-cell" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <>
                    <button type="button" className="command-btn save-btn" onClick={saveChanges} title="Lưu">
                      <span className="btn-text">Lưu</span>
                    </button>
                    <button type="button" className="command-btn cancel-btn" onClick={cancelChanges} title="Hủy">
                      <span className="btn-text">Hủy</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="command-btn view-btn" onClick={() => handleViewRow(node)} title="Xem chi tiết">
                      <span className="btn-text">Xem</span>
                    </button>
                    <button type="button" className="command-btn edit-btn" onClick={() => handleRowEdit(rowId)} title="Sửa dòng">
                      <span className="btn-text">Sửa</span>
                    </button>
                    <button type="button" className="command-btn delete-btn" onClick={() => handleDeleteRow(rowId)} title="Xóa dòng">
                      <span className="btn-text">Xóa</span>
                    </button>
                  </>
                )}
              </div>
            );
          }

          const isEditing = isCellEditable(rowId, column.field);
          return (
            <div 
              key={column.field || `col-${column.caption}`} 
              className={`grid-cell dx-cell ${isEditing ? 'editing-cell' : ''}`} 
              onClick={() => {
                if (editMode === 'cell' && column.editable) {
                  setActiveCell({ rowId, field: column.field });
                }
              }}
            >
              {renderCellValue(node, column)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupNodes = (nodes) => {
    if (!Array.isArray(nodes)) return null;

    return nodes.map((node) => {
      if (node.type === 'group') {
        const isExpanded = expandedGroups[node.groupKey] !== false;

        return (
          <div key={node.groupKey} className="group-block">
            <div className="group-header" onClick={() => toggleGroup(node.groupKey)}>
              <span className="group-toggle">{isExpanded ? '▾' : '▸'}</span>
              <span>
                {node.field}: {node.key} ({node.count})
              </span>
            </div>
            {isExpanded ? <div className="group-children">{renderGroupNodes(node.items)}</div> : null}
          </div>
        );
      }

      return renderRow(node);
    });
  };

  const templateColumns = renderingColumns.map((column) => column.width).join(' ');

  const defaultToolbarItems = [
    {
      location: 'before',
      text: 'Refresh',
      onClick: loadData,
      disabled: loading,
    },
    {
      location: 'before',
      text: 'Save',
      onClick: saveChanges,
      disabled: !isDirty && editingRowId === null,
    },
    {
      location: 'before',
      text: 'Cancel',
      onClick: cancelChanges,
      disabled: !isDirty && editingRowId === null,
    },
    {
      location: 'after',
      text: 'Add Row',
      onClick: handleAddRow,
    },
  ];

  const renderedToolbarItems = [...defaultToolbarItems, ...toolbarItems];

  const showingStart = filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const showingEnd = Math.min(filteredRows.length, (pageIndex + 1) * pageSize);

  return (
    <div className={`custom-grid dx-datagrid custom-grid-${theme}`} style={{ '--grid-template-columns': templateColumns }}>
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
              >
                {item.icon ? <span className="toolbar-icon">{item.icon}</span> : null}
                {item.text}
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
              >
                {item.icon ? <span className="toolbar-icon">{item.icon}</span> : null}
                {item.text}
              </button>
            ))}
        </div>
      </div>

      <div className="grid-group-panel" onDragOver={(event) => event.preventDefault()} onDrop={handleGroupDrop}>
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
      </div>

      <div className="grid-header dx-header-row" style={{ gridTemplateColumns: templateColumns }}>
        {renderingColumns.map((column) => {
          if (column.field === 'row-selection-checkbox') {
            return (
              <div key="header-select-all" className="grid-header-cell selection-header-cell">
                <input 
                  type="checkbox" 
                  checked={draftRows.length > 0 && selectedRowKeys.length === draftRows.length}
                  onChange={handleSelectAllCheckbox}
                />
              </div>
            );
          }
          if (column.field === 'row-drag-handle') {
            return (
              <div key="header-drag-handle" className="grid-header-cell drag-header-cell">
              </div>
            );
          }
          if (column.field === 'row-commands') {
            return (
              <div key="header-commands" className="grid-header-cell commands-header-cell">
                <span>Actions</span>
              </div>
            );
          }

          return (
            <button
              key={column.field || `header-${column.caption}`}
              type="button"
              draggable={column.groupable}
              onDragStart={(event) => handleDragStart(event, column)}
              className={`grid-header-cell dx-header-cell ${column.sortable ? 'sortable' : ''} ${sortInfo.field === column.field ? 'sorted' : ''}`}
              onClick={() => handleHeaderClick(column)}
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
            </button>
          );
        })}
      </div>

      <div className="grid-filter-row" style={{ gridTemplateColumns: templateColumns }}>
        {renderingColumns.map((column) => (
          <div key={column.field || `filter-${column.caption}`} className="grid-filter-cell">
            {column.isCommand ? null : column.lookup && Array.isArray(column.lookup.dataSource) ? (
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
                <button type="button" className="filter-operator-btn">
                  <i className="fa fa-filter"></i>
                </button>
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
                <button type="button" className="filter-operator-btn">
                  <i className="fa fa-filter"></i>
                </button>
              </div>
            ) : (
              <div className="filter-input-wrap">
                <input
                  type="text"
                  value={filters[column.field] ?? ''}
                  placeholder={`Filter ${column.caption}`}
                  onChange={(event) => handleFilterChange(column.field, event.target.value)}
                />
                {column.editorType === 'dxDateBox' || column.editorType === 'datebox' || column.dataType === 'date' ? (
                  <i className="fa fa-calendar filter-field-icon"></i>
                ) : null}
                <button type="button" className="filter-operator-btn">
                  <i className="fa fa-filter"></i>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid-loading" style={{ padding: '20px', textAlign: 'center' }}>
          Loading data...
        </div>
      ) : error ? (
        <div className="grid-error" style={{ padding: '20px', textAlign: 'center', color: '#b91c1c' }}>
          {String(error)}
        </div>
      ) : (
        <div className="grid-body">
          {filteredRows.length === 0 ? (
            <div className="grid-row no-data" style={{ gridTemplateColumns: templateColumns }}>
              <div className="grid-cell" style={{ gridColumn: `span ${renderingColumns.length}` }}>
                No data available
              </div>
            </div>
          ) : (
            renderGroupNodes(groupedRows)
          )}
        </div>
      )}

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
            &lt;&lt;
          </button>
          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))} 
            disabled={pageIndex === 0}
            title="Previous page"
          >
            &lt;
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
            &gt;
          </button>
          <button 
            type="button" 
            className="pager-btn" 
            onClick={() => setPageIndex(pageCount - 1)} 
            disabled={pageIndex >= pageCount - 1}
            title="Last page"
          >
            &gt;&gt;
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