import { useEffect, useMemo, useState } from 'react';

function CustomGrid({
  columns,
  rows,
  onRowsChange,
  onAddRow,
  dataSource,
  editMode = 'batch',
  toolbarItems = [],
  rowTemplate,
}) 
{
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [draftRows, setDraftRows] = useState(rows ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortInfo, setSortInfo] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [groupColumns, setGroupColumns] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const loadRows = async () => {
      if (dataSource && typeof dataSource.load === 'function') {
        setLoading(true);
        setError(null);
        try {
          const loaded = await dataSource.load();
          setDraftRows(Array.isArray(loaded) ? loaded : loaded?.data ?? []);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      } else {
        setDraftRows(rows ?? []);
      }
    };

    loadRows();
    if (editMode !== 'batch') {
      setIsDirty(false);
    }
  }, [rows, dataSource, editMode]);

  const refreshData = async () => {
    if (dataSource && typeof dataSource.load === 'function') {
      setLoading(true);
      setError(null);
      try {
        const loaded = await dataSource.load();
        setDraftRows(Array.isArray(loaded) ? loaded : loaded?.data ?? []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const normalizedColumns = useMemo(
    () =>
      columns.map((column) => {
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
          field: column.field,
          caption: column.caption || column.field,
          width: column.width || '1fr',
          sortable: column.sortable !== false,
          groupable: column.groupable !== false,
          editable: column.editable !== false,
          template: column.template,
          actions: column.actions,
          editorType: column.editorType || 'text',
          lookup: column.lookup,
        };
      }),
    [columns],
  );

  const commitRows = (nextRows) => {
    setDraftRows(nextRows);
    if (editMode !== 'batch') {
      onRowsChange?.(nextRows);
    } else {
      setIsDirty(true);
    }
  };

  const saveChanges = async () => {
    if (isDirty) {
      if (dataSource && typeof dataSource.update === 'function') {
        try {
          await Promise.all(
            draftRows.map((row) => dataSource.update(row.id, row)).filter(Boolean),
          );
        } catch (err) {
          setError(err);
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
    const nextRows = draftRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row));
    commitRows(nextRows);
  };

  const handleRowEdit = (rowId) => {
    setEditingRowId(rowId);
    setSelectedRowId(rowId);
  };

  const handleRowSave = () => {
    saveChanges();
  };

  const handleRowCancel = () => {
    cancelChanges();
  };

  const handleSelectRow = (rowId) => {
    setSelectedRowId(rowId === selectedRowId ? null : rowId);
    if (editMode === 'form') {
      setActiveCell(null);
    }
  };

  const handleDeleteRow = (rowId) => {
    const nextRows = draftRows.filter((row) => row.id !== rowId);
    commitRows(nextRows);
    if (selectedRowId === rowId) {
      setSelectedRowId(null);
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

  const renderCellValue = (row, column) => {
    const isEditing = isCellEditable(row.id, column.field);
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
      const inputType = column.editorType === 'number' ? 'number' : 'text';
      if (column.lookup && Array.isArray(column.lookup.dataSource)) {
        return (
          <select
            value={value ?? ''}
            onChange={(event) => handleCellChange(row.id, column.field, event.target.value)}
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
          type={inputType}
          value={value ?? ''}
          onChange={(event) => handleCellChange(row.id, column.field, event.target.value)}
          onFocus={() => {
            if (editMode === 'cell') {
              setActiveCell({ rowId: row.id, field: column.field });
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
      return column.template({ row, value, onChange: (nextValue) => handleCellChange(row.id, column.field, nextValue) });
    }

    return <span>{value ?? ''}</span>;
  };

  const renderRow = (node) => {
    const rowClasses = `grid-row dx-data-row ${selectedRowId === node.id ? 'dx-selection' : ''}`;
    const rowProps = {
      key: node.id,
      className: rowClasses,
      style: { gridTemplateColumns: normalizedColumns.map((column) => column.width).join(' ') },
      onClick: () => handleSelectRow(node.id),
    };

    if (rowTemplate) {
      return rowTemplate({
        row: node,
        columns: normalizedColumns,
        defaultRowProps: rowProps,
        isEditing: editingRowId === node.id || (editMode === 'form' && selectedRowId === node.id),
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
              setActiveCell({ rowId: node.id, field: column.field });
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
      onClick: refreshData,
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
      onClick: onAddRow,
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
}
export default CustomGrid;  