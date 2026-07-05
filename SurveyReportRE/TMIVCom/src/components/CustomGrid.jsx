import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { CONFIG } from '../config';

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

const safeStringifyBinaryJson = (obj) => {
  if (!obj) return "";
  try {
    const jsonStr = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error("Failed to stringify binary JSON:", e);
    return "";
  }
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
}, ref) => {
  const [columns, setColumns] = useState(initialColumns ?? []);
  const [rows, setRows] = useState(initialRows ?? []);
  const [draftRows, setDraftRows] = useState(initialRows ?? []);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [displayExpr, setDisplayExpr] = useState('name');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [sortInfo, setSortInfo] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [groupColumns, setGroupColumns] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

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
        // 1. Fetch SysTable Config
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

        // Apply editing mode from database stConfig
        if (parsedGridOptions?.editing?.mode) {
          setEditMode(parsedGridOptions.editing.mode);
        }

        // 2. Fetch Columns Scheme
        const schemeUrl = gridType === 'System' 
          ? `${API_BASE_URL}/api/${modelName}/GetSystemScheme` 
          : `${API_BASE_URL}/api/${modelName}/GetScheme`;
        
        const schemeRes = await fetch(schemeUrl);
        if (!schemeRes.ok) throw new Error("Load scheme config failed");
        const schemeData = await schemeRes.json();

        const mappedColumns = (schemeData || []).map((col) => ({
          field: col.dataField,
          caption: col.caption || col.dataField,
          dataType: col.dataType || 'string',
          sortable: col.allowSorting !== false,
          groupable: col.allowGrouping !== false,
          editable: col.visible !== false,
          visible: col.visible !== false,
          editorType: col.editor || 'dxTextBox',
          lookup: col.lookup,
          validationRules: col.validationRules ? safeParseBinaryJson(col.validationRules) : [],
          editorOptions: col.editorOptions ? safeParseBinaryJson(col.editorOptions) : {},
          formItem: col.formItem ? safeParseBinaryJson(col.formItem) : {}
        }));

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
          width: column === 'id' ? '90px' : column === 'status' ? '140px' : '1fr',
          sortable: true,
          groupable: true,
          editable: true,
        };
      }

      return {
        field: column.field ?? column.dataField,
        caption: column.caption || column.field || column.dataField,
        width: column.width || '1fr',
        sortable: column.sortable !== false,
        groupable: column.groupable !== false,
        editable: column.editable !== false,
        template: column.template,
        actions: column.actions,
        editorType: column.editorType || column.editor || 'dxTextBox',
        lookup: column.lookup,
      };
    });
  }, [columns]);

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
    if (isDirty) {
      if (modelName) {
        const modifiedRows = draftRows.filter((row) => {
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
            draftRows.map((row) => dataSource.update(row.id || row.Id, row)).filter(Boolean),
          );
        } catch (err) {
          setError(err.message);
        }
      }
      onRowsChange?.(draftRows);
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
    if (!modelName) {
      const nextRows = draftRows.filter((row) => (row.id || row.Id) !== rowId);
      commitRows(nextRows);
      if (selectedRowId === rowId) {
        setSelectedRowId(null);
      }
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa dòng này không?")) return;

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

  // Sorting & Filtering
  const filteredRows = useMemo(() => {
    return draftRows.filter((row) =>
      normalizedColumns.every((column) => {
        if (column.actions) return true;
        const value = row[column.field];
        const filterValue = filters[column.field];
        if (!filterValue) return true;
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

    if (isEditing) {
      // Mimic DevExtreme editors dynamically
      if (column.editorType === 'dxCheckBox') {
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(event) => handleCellChange(rowId, column.field, event.target.checked)}
          />
        );
      }

      if (column.editorType === 'dxDateBox') {
        return (
          <input
            type="date"
            value={value ? value.substring(0, 10) : ''}
            onChange={(event) => handleCellChange(rowId, column.field, event.target.value)}
          />
        );
      }

      if (column.editorType === 'dxNumberBox') {
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

    if (column.template) {
      return column.template({ row, value, onChange: (nextValue) => handleCellChange(rowId, column.field, nextValue) });
    }

    // dxCheckBox boolean display
    if (column.editorType === 'dxCheckBox') {
      return <span>{value ? '✅' : '❌'}</span>;
    }

    return <span>{value ?? ''}</span>;
  };

  const renderRow = (node) => {
    const rowId = node.id || node.Id;
    const rowClasses = `grid-row dx-data-row ${selectedRowId === rowId ? 'dx-selection' : ''}`;
    const rowProps = {
      key: rowId,
      className: rowClasses,
      style: { gridTemplateColumns: normalizedColumns.map((column) => column.width).join(' ') },
      onClick: () => handleSelectRow(rowId),
    };

    if (rowTemplate) {
      return rowTemplate({
        row: node,
        columns: normalizedColumns,
        defaultRowProps: rowProps,
        isEditing: editingRowId === rowId || (editMode === 'form' && selectedRowId === rowId),
        onCellChange: handleCellChange,
        onEditRow: handleRowEdit,
        onDeleteRow: handleDeleteRow,
      });
    }

    return (
      <div {...rowProps}>
        {normalizedColumns.map((column) => (
          <div key={column.field || `col-${column.caption}`} className="grid-cell dx-cell" onClick={() => {
            if (editMode === 'cell' && column.editable) {
              setActiveCell({ rowId, field: column.field });
            }
          }}>
            {renderCellValue(node, column)}
          </div>
        ))}
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

  const templateColumns = normalizedColumns.map((column) => column.width).join(' ');

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
      disabled: !isDirty,
    },
    {
      location: 'before',
      text: 'Cancel',
      onClick: cancelChanges,
      disabled: !isDirty,
    },
    {
      location: 'after',
      text: 'Add Row',
      onClick: handleAddRow,
    },
  ];

  const renderedToolbarItems = [...defaultToolbarItems, ...toolbarItems];

  return (
    <div className="custom-grid dx-datagrid" style={{ '--grid-template-columns': templateColumns }}>
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
            const column = normalizedColumns.find((col) => col.field === field);
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
        {normalizedColumns.map((column) => (
          <button
            key={column.field || `header-${column.caption}`}
            type="button"
            draggable={column.groupable}
            onDragStart={(event) => handleDragStart(event, column)}
            className={`grid-header-cell dx-header-cell ${column.sortable ? 'sortable' : ''} ${sortInfo.field === column.field ? 'sorted' : ''}`}
            onClick={() => handleHeaderClick(column)}
          >
            <span>{column.caption}</span>
            {column.sortable && (
              <span className="sort-indicator">
                {sortInfo.field === column.field ? (sortInfo.direction === 'asc' ? '▲' : '▼') : '⇅'}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid-filter-row" style={{ gridTemplateColumns: templateColumns }}>
        {normalizedColumns.map((column) => (
          <div key={column.field || `filter-${column.caption}`} className="grid-filter-cell">
            {column.actions ? null : (
              <input
                type="text"
                value={filters[column.field] ?? ''}
                placeholder={`Filter ${column.caption}`}
                onChange={(event) => handleFilterChange(column.field, event.target.value)}
              />
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
              <div className="grid-cell" style={{ gridColumn: `span ${normalizedColumns.length}` }}>
                No data available
              </div>
            </div>
          ) : (
            renderGroupNodes(groupedRows)
          )}
        </div>
      )}

      <div className="grid-footer dx-toolbar">
        <div className="pager-info">
          {`Showing ${Math.min(filteredRows.length, pageIndex * pageSize + 1)} - ${Math.min(
            filteredRows.length,
            (pageIndex + 1) * pageSize,
          )} of ${filteredRows.length}`}
        </div>
        <div className="pager-controls">
          <button type="button" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>
            First
          </button>
          <button type="button" onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))} disabled={pageIndex === 0}>
            Prev
          </button>
          <span className="page-label">Page {pageIndex + 1} of {pageCount}</span>
          <button
            type="button"
            onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            Last
          </button>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

export default CustomGrid;