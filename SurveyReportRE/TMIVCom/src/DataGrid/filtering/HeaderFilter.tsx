import { useMemo, useState } from 'react';
import { getColumnValue, getDisplayValue } from '../core/GridEngine';
import type { GridColumn } from '../types/grid.types';

interface HeaderFilterProps<T> {
  column: GridColumn<T>;
  rows: T[];
  selected: unknown[];
  searchable: boolean;
  onChange: (values: unknown[]) => void;
}

export const HeaderFilter = <T,>({ column, rows, selected, searchable, onChange }: HeaderFilterProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const values = useMemo(() => {
    const unique = new Map<string, { value: unknown; label: unknown }>();
    rows.forEach((row) => {
      const value = getColumnValue(row, column);
      unique.set(`${typeof value}:${String(value ?? '')}`, { value, label: getDisplayValue(row, column) });
    });
    return [...unique.values()].filter((item) => String(item.label ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  }, [rows, column, search]);

  return (
    <span className="tmiv-grid__header-filter" onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-label={`Filter values ${column.caption}`} aria-expanded={open} className={selected.length ? 'is-active' : ''} onClick={() => setOpen((value) => !value)}>▽</button>
      {open && (
        <div className="tmiv-grid__header-filter-popover">
          {searchable && <input type="search" aria-label={`Search values ${column.caption}`} placeholder="Search values..." value={search} onChange={(event) => setSearch(event.target.value)} />}
          <label><input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} /> All</label>
          <div className="tmiv-grid__header-filter-values">
            {values.map(({ value, label }) => {
              const checked = selected.some((item) => Object.is(item, value) || String(item) === String(value));
              return <label key={`${typeof value}:${String(value)}`}><input type="checkbox" checked={checked} onChange={() => onChange(checked ? selected.filter((item) => !Object.is(item, value) && String(item) !== String(value)) : [...selected, value])} /> {String(label ?? '(Blank)')}</label>;
            })}
          </div>
          <button type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </span>
  );
};
