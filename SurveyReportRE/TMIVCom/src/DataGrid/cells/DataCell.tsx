import { memo, type CSSProperties } from 'react';
import type { GridCellContext } from '../types/grid.types';
import { formatValue } from '../core/GridEngine';
import { CellEditor } from '../editing/CellEditor';

interface DataCellProps<T> extends GridCellContext<T> {
  locale: string;
  focused: boolean;
  onClick: (event: React.MouseEvent<HTMLTableCellElement>) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLTableCellElement>) => void;
  onFocus: () => void;
  searchText?: string;
  highlightSearchText?: boolean;
  editing?: boolean;
  changed?: boolean;
  error?: string;
  saving?: boolean;
  onValueChange?: (value: unknown) => void;
  onCommitEdit?: () => void;
  onCancelEdit?: () => void;
  layoutStyle?: CSSProperties;
}

const highlightText = (text: string, search: string) => {
  const term = search.trim();
  if (!term) return text;
  const parts = [];
  const lower = text.toLocaleLowerCase();
  const needle = term.toLocaleLowerCase();
  let cursor = 0;
  let index = lower.indexOf(needle);
  while (index >= 0) {
    parts.push(text.slice(cursor, index));
    parts.push(<mark key={`${index}-${parts.length}`}>{text.slice(index, index + term.length)}</mark>);
    cursor = index + term.length;
    index = lower.indexOf(needle, cursor);
  }
  parts.push(text.slice(cursor));
  return parts;
};

const DataCellInner = <T,>({
  row,
  value,
  displayValue,
  column,
  rowIndex,
  columnIndex,
  locale,
  focused,
  onClick,
  onDoubleClick,
  onFocus,
  searchText = '',
  highlightSearchText = false,
  editing = false,
  changed = false,
  error,
  saving = false,
  onValueChange,
  onCommitEdit,
  onCancelEdit,
  layoutStyle,
}: DataCellProps<T>) => {
  const context = { row, data: row, value, displayValue, column, rowIndex, columnIndex };
  const className = typeof column.cellClassName === 'function'
    ? column.cellClassName(context)
    : column.cellClassName ?? '';
  const rawContent = column.renderCell
    ? column.renderCell(context)
    : formatValue(displayValue, row, column, locale);
  const content = highlightSearchText && typeof rawContent === 'string' ? highlightText(rawContent, searchText) : rawContent;

  return (
    <td
      role="gridcell"
      aria-colindex={columnIndex + 1}
      tabIndex={focused ? 0 : -1}
      data-grid-row={rowIndex}
      data-grid-column={columnIndex}
      className={`tmiv-grid__cell ${focused ? 'tmiv-grid__cell--focused' : ''} ${editing ? 'tmiv-grid__cell--editing' : ''} ${changed ? 'tmiv-grid__cell--modified' : ''} ${error ? 'tmiv-grid__cell--invalid' : ''} ${column.fixed ? `tmiv-grid__cell--fixed-${column.fixedPosition === 'right' ? 'right' : 'left'}` : ''} ${className}`.trim()}
      style={{ textAlign: column.alignment, ...layoutStyle }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onFocus={onFocus}
      title={typeof rawContent === 'string' ? rawContent : undefined}
    >
      {editing ? <div className="tmiv-grid__cell-editor" onClick={(event) => event.stopPropagation()}><CellEditor row={row} column={column} value={value} error={error} disabled={saving} autoFocus onChange={(next) => onValueChange?.(next)} onCommit={onCommitEdit} onCancel={onCancelEdit} />{error && <small role="alert">{error}</small>}</div> : <div className="tmiv-grid__cell-content">{content}</div>}
    </td>
  );
};

export const DataCell = memo(DataCellInner) as typeof DataCellInner;
