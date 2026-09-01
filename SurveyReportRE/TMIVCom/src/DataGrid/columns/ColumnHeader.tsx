import type { GridColumn, GridSortDescriptor } from '../types/grid.types';
import { columnField } from '../core/GridEngine';
import { HeaderFilter } from '../filtering/HeaderFilter';

interface ColumnHeaderProps<T> {
  column: GridColumn<T>;
  columnIndex: number;
  sort: GridSortDescriptor[];
  onSort: (field: string, multiple: boolean) => void;
  rows: T[];
  headerFilterVisible: boolean;
  headerFilterSearchable: boolean;
  headerFilterValues: unknown[];
  reorderable: boolean;
  dragEnabled: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onHeaderFilterChange: (values: unknown[]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}

export const ColumnHeader = <T,>({
  column, columnIndex, sort, onSort, rows, headerFilterVisible, headerFilterSearchable,
  headerFilterValues, reorderable, dragEnabled, dragging, dropTarget, onHeaderFilterChange,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: ColumnHeaderProps<T>) => {
  const field = columnField(column);
  const descriptorIndex = sort.findIndex((item) => item.field === field);
  const descriptor = descriptorIndex >= 0 ? sort[descriptorIndex] : undefined;
  const sortable = column.allowSorting !== false && Boolean(field);

  return (
    <th
      role="columnheader"
      aria-colindex={columnIndex + 1}
      aria-sort={descriptor ? (descriptor.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      draggable={dragEnabled}
      className={`tmiv-grid__header-cell ${sortable ? 'tmiv-grid__header-cell--sortable' : ''} ${dragging ? 'tmiv-grid__header-cell--dragging' : ''} ${dropTarget ? 'tmiv-grid__header-cell--drop-target' : ''}`}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        textAlign: column.alignment,
      }}
      onClick={(event) => sortable && onSort(field, event.shiftKey)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-tmiv-grid-column', field);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => { if (reorderable) { event.preventDefault(); onDragOver(); } }}
      onDrop={(event) => { event.preventDefault(); onDrop(); }}
    >
      <div className="tmiv-grid__header-content">
        {column.renderHeader ? column.renderHeader({ column, columnIndex }) : column.caption}
        {descriptor && (
          <span className="tmiv-grid__sort" aria-hidden="true">
            {descriptor.direction === 'asc' ? '▲' : '▼'}
            {sort.length > 1 && <small>{descriptorIndex + 1}</small>}
          </span>
        )}
        {headerFilterVisible && column.allowFiltering !== false && (
          <HeaderFilter column={column} rows={rows} selected={headerFilterValues} searchable={headerFilterSearchable} onChange={onHeaderFilterChange} />
        )}
      </div>
    </th>
  );
};
