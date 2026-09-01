import { memo, type CSSProperties } from 'react';
import { DataCell } from '../cells/DataCell';
import { getColumnValue, getDisplayValue } from '../core/GridEngine';
import type { GridColumn, GridFocusedCell, GridKey } from '../types/grid.types';

interface DataRowProps<T> {
  row: T;
  rowKey: GridKey;
  rowIndex: number;
  absoluteRowIndex: number;
  columns: GridColumn<T>[];
  locale: string;
  selected: boolean;
  focusedCell: GridFocusedCell | null;
  showSelection: boolean;
  showRowNumber: boolean;
  searchText?: string;
  highlightSearchText?: boolean;
  editingFields?: Set<string>;
  changedFields?: Set<string>;
  errors?: Record<string, string>;
  saving?: boolean;
  showCommands?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  rowEditing?: boolean;
  onValueChange?: (field: string, value: unknown) => void;
  onCommitCell?: (field: string) => void;
  onCancelCell?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  commandTexts?: { edit: string; delete: string; save: string; cancel: string };
  onSelect: (event: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
  onRowClick: (event: React.MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick: (event: React.MouseEvent<HTMLTableRowElement>) => void;
  onCellClick: (columnIndex: number, event: React.MouseEvent<HTMLTableCellElement>) => void;
  onCellDoubleClick: (columnIndex: number, event: React.MouseEvent<HTMLTableCellElement>) => void;
  onCellFocus: (columnIndex: number) => void;
  columnStyles?: Record<string, CSSProperties>;
  selectionStyle?: CSSProperties;
  rowNumberStyle?: CSSProperties;
  commandStyle?: CSSProperties;
}

const DataRowInner = <T,>({
  row,
  rowKey,
  rowIndex,
  absoluteRowIndex,
  columns,
  locale,
  selected,
  focusedCell,
  showSelection,
  showRowNumber,
  searchText,
  highlightSearchText,
  editingFields = new Set(),
  changedFields = new Set(),
  errors = {},
  saving,
  showCommands,
  canEdit,
  canDelete,
  rowEditing,
  onValueChange,
  onCommitCell,
  onCancelCell,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  commandTexts = { edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel' },
  onSelect,
  onRowClick,
  onRowDoubleClick,
  onCellClick,
  onCellDoubleClick,
  onCellFocus,
  columnStyles = {},
  selectionStyle,
  rowNumberStyle,
  commandStyle,
}: DataRowProps<T>) => (
  <tr
    role="row"
    aria-rowindex={absoluteRowIndex + 2}
    aria-selected={selected}
    data-row-key={String(rowKey)}
    className={`tmiv-grid__row ${selected ? 'tmiv-grid__row--selected' : ''}`}
    onClick={onRowClick}
    onDoubleClick={onRowDoubleClick}
  >
    {showSelection && (
      <td role="gridcell" className="tmiv-grid__cell tmiv-grid__cell--selection tmiv-grid__cell--fixed-left" style={selectionStyle}>
        <input
          type="checkbox"
          aria-label={`Select row ${absoluteRowIndex + 1}`}
          checked={selected}
          onClick={(event) => event.stopPropagation()}
          onChange={onSelect}
        />
      </td>
    )}
    {showRowNumber && (
      <td role="gridcell" className="tmiv-grid__cell tmiv-grid__cell--row-number tmiv-grid__cell--fixed-left" style={rowNumberStyle}>
        {absoluteRowIndex + 1}
      </td>
    )}
    {columns.map((column, columnIndex) => (
      <DataCell
        key={String(column.field ?? column.dataField ?? column.name ?? columnIndex)}
        row={row}
        data={row}
        value={getColumnValue(row, column)}
        displayValue={getDisplayValue(row, column)}
        column={column}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        locale={locale}
        focused={focusedCell?.rowIndex === rowIndex && focusedCell.columnIndex === columnIndex}
        searchText={searchText}
        highlightSearchText={highlightSearchText}
        editing={editingFields.has(String(column.field ?? column.dataField ?? column.name ?? ''))}
        changed={changedFields.has(String(column.field ?? column.dataField ?? column.name ?? ''))}
        error={errors[String(column.field ?? column.dataField ?? column.name ?? '')]}
        saving={saving}
        onValueChange={(value) => onValueChange?.(String(column.field ?? column.dataField ?? column.name ?? ''), value)}
        onCommitEdit={() => onCommitCell?.(String(column.field ?? column.dataField ?? column.name ?? ''))}
        onCancelEdit={onCancelCell}
        onClick={(event) => onCellClick(columnIndex, event)}
        onDoubleClick={(event) => onCellDoubleClick(columnIndex, event)}
        onFocus={() => onCellFocus(columnIndex)}
        layoutStyle={columnStyles[String(column.field ?? column.dataField ?? column.name ?? '')]}
      />
    ))}
    {showCommands && <td role="gridcell" className="tmiv-grid__cell tmiv-grid__cell--commands tmiv-grid__cell--fixed-right" style={commandStyle} onClick={(event) => event.stopPropagation()}>
      {rowEditing ? <><button type="button" disabled={saving} onClick={onSave}>{commandTexts.save}</button><button type="button" disabled={saving} onClick={onCancel}>{commandTexts.cancel}</button></> : <>{canEdit && <button type="button" disabled={saving} onClick={onEdit}>{commandTexts.edit}</button>}{canDelete && <button type="button" disabled={saving} onClick={onDelete}>{commandTexts.delete}</button>}</>}
    </td>}
  </tr>
);

export const DataRow = memo(DataRowInner) as typeof DataRowInner;
