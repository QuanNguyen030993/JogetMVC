import { useMemo } from 'react';

function CustomGrid({ columns, rows, onRowsChange, onAddRow }) {
  const headerLabels = useMemo(
    () => ({ id: 'ID', name: 'Name', role: 'Role', status: 'Status' }),
    [],
  );

  const handleCellChange = (rowId, field, value) => {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  return (
    <div className="custom-grid">
      <div className="grid-header">
        {columns.map((column) => (
          <div key={column} className="grid-header-cell">
            {headerLabels[column] || column}
          </div>
        ))}
      </div>
      <div className="grid-body">
        {rows.map((row) => (
          <div key={row.id} className="grid-row">
            {columns.map((column) => (
              <div key={column} className="grid-cell">
                <input
                  type="text"
                  value={row[column] ?? ''}
                  onChange={(event) => handleCellChange(row.id, column, event.target.value)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid-footer">
        <button type="button" onClick={onAddRow}>
          Add row
        </button>
      </div>
    </div>
  );
}

export default CustomGrid;
