import { useState } from 'react';
import { columnField } from '../core/GridEngine';
import type { GridColumn, GridColumnChooserConfig } from '../types/grid.types';

interface ColumnChooserProps<T> {
  config: GridColumnChooserConfig;
  columns: GridColumn<T>[];
  visibleFields: Set<string>;
  buttonText: string;
  resetText: string;
  onVisibilityChange: (field: string, visible: boolean) => void;
  onOrderChange: (fields: string[]) => void;
  onReset: () => void;
}

export const ColumnChooser = <T,>({ config, columns, visibleFields, buttonText, resetText, onVisibilityChange, onOrderChange, onReset }: ColumnChooserProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dragged, setDragged] = useState<string | null>(null);
  const filtered = columns.filter((column) => String(column.caption ?? columnField(column)).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const reorder = (target: string) => {
    if (!dragged || dragged === target) return;
    const fields = columns.map(columnField);
    const from = fields.indexOf(dragged);
    const to = fields.indexOf(target);
    const [field] = fields.splice(from, 1);
    fields.splice(to, 0, field);
    onOrderChange(fields);
    setDragged(null);
  };
  return <div className="tmiv-grid__column-chooser">
    <button type="button" aria-label={buttonText} aria-expanded={open} onClick={() => setOpen((value) => !value)}>☷ {buttonText}</button>
    {open && <div role="dialog" aria-label={config.title ?? buttonText} className="tmiv-grid__column-chooser-popover">
      <div className="tmiv-grid__column-chooser-title"><strong>{config.title ?? buttonText}</strong><button type="button" aria-label="Close column chooser" onClick={() => setOpen(false)}>×</button></div>
      {config.searchable !== false && <input type="search" aria-label="Search columns" placeholder="Search columns..." value={search} onChange={(event) => setSearch(event.target.value)} />}
      {config.allowSelectAll !== false && <label><input type="checkbox" checked={columns.every((column) => visibleFields.has(columnField(column)))} onChange={(event) => columns.forEach((column) => onVisibilityChange(columnField(column), event.target.checked))} /> Select all</label>}
      <div className="tmiv-grid__column-chooser-list">
        {filtered.map((column) => {
          const field = columnField(column);
          return <label key={field} draggable={config.mode === 'dragAndDrop'} onDragStart={() => setDragged(field)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(field)}>
            {config.mode === 'dragAndDrop' && <span aria-hidden="true">⋮⋮</span>}<input type="checkbox" checked={visibleFields.has(field)} onChange={(event) => onVisibilityChange(field, event.target.checked)} /> {column.caption ?? field}
          </label>;
        })}
      </div>
      <button type="button" onClick={onReset}>{resetText}</button>
    </div>}
  </div>;
};
