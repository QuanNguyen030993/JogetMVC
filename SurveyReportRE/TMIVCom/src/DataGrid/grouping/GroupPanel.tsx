import type { DragEvent } from 'react';
import type { GridColumn, GridGroupDescriptor } from '../types/grid.types';
import { columnField } from '../core/GridEngine';

interface GroupPanelProps<T> {
  columns: GridColumn<T>[];
  groups: GridGroupDescriptor[];
  emptyText: string;
  allowDragging: boolean;
  onChange: (groups: GridGroupDescriptor[]) => void;
}

export const GroupPanel = <T,>({ columns, groups, emptyText, allowDragging, onChange }: GroupPanelProps<T>) => {
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!allowDragging) return;
    const field = event.dataTransfer.getData('application/x-tmiv-grid-column');
    const column = columns.find((item) => columnField(item) === field);
    if (field && column?.allowGrouping !== false && !groups.some((group) => group.field === field)) onChange([...groups, { field, direction: 'asc' }]);
  };
  return (
    <div className="tmiv-grid__group-panel" onDragOver={(event) => allowDragging && event.preventDefault()} onDrop={drop}>
      {!groups.length && <span>{emptyText}</span>}
      {groups.map((group) => {
        const column = columns.find((item) => columnField(item) === group.field);
        return (
          <span className="tmiv-grid__group-chip" key={group.field}>
            <button type="button" aria-label={`Toggle group direction ${column?.caption ?? group.field}`} onClick={() => onChange(groups.map((item) => item.field === group.field ? { ...item, direction: item.direction === 'desc' ? 'asc' : 'desc' } : item))}>
              {column?.caption ?? group.field} {group.direction === 'desc' ? '▼' : '▲'}
            </button>
            <button type="button" aria-label={`Remove group ${column?.caption ?? group.field}`} onClick={() => onChange(groups.filter((item) => item.field !== group.field))}>×</button>
          </span>
        );
      })}
    </div>
  );
};
