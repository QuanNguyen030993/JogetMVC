import { useEffect, useMemo, useState } from 'react';

function CustomGrid({ columns, rows, onRowsChange, onAddRow }) {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [sortInfo, setSortInfo] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [groupColumns, setGroupColumns] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({});

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
          };
        }

        return {
          field: column.field,
          caption: column.caption || column.field,
          width: column.width || '1fr',
          sortable: column.sortable !== false,
          groupable: column.groupable !== false,
        };
      }),
    [columns],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      normalizedColumns.every((column) => {
        const value = row[column.field];
        const filterValue = filters[column.field];
        if (!filterValue) return true;
        return String(value ?? '')
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      }),
    );
  }, [rows, filters, normalizedColumns]);

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

  const handleCellChange = (rowId, field, value) => {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleHeaderClick = (column) => {
    if (!column.sortable) return;

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

      return (
        <div
          key={node.id}
          className={`grid-row dx-data-row ${selectedRowId === node.id ? 'dx-selection' : ''}`}
          style={{ gridTemplateColumns: normalizedColumns.map((column) => column.width).join(' ') }}
          onClick={() => setSelectedRowId(node.id === selectedRowId ? null : node.id)}
        >
          {normalizedColumns.map((column) => (
            <div key={column.field} className="grid-cell dx-cell">
              <input
                type="text"
                value={node[column.field] ?? ''}
                onChange={(event) => handleCellChange(node.id, column.field, event.target.value)}
              />
            </div>
          ))}
        </div>
      );
    });
  };

  const templateColumns = normalizedColumns.map((column) => column.width).join(' ');

  return (
    <div className="custom-grid dx-datagrid" style={{ '--grid-template-columns': templateColumns }}>
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
            key={column.field}
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
          <div key={column.field} className="grid-filter-cell">
            <input
              type="text"
              value={filters[column.field] ?? ''}
              placeholder={`Filter ${column.caption}`}
              onChange={(event) => handleFilterChange(column.field, event.target.value)}
            />
          </div>
        ))}
      </div>

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
        <button type="button" onClick={onAddRow} className="add-row-button">
          Add row
        </button>
      </div>
    </div>
  );
}

export default CustomGrid;
