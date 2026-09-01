import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { columnField } from '../core/GridEngine';
import type { GridColumn, GridFilterDescriptor, GridFilterOperator } from '../types/grid.types';

interface FilterRowProps<T> {
  columns: GridColumn<T>[];
  filters: GridFilterDescriptor[];
  columnOffset: number;
  commandOffset?: number;
  columnStyles?: Record<string, CSSProperties>;
  offsetStyles?: CSSProperties[];
  commandStyle?: CSSProperties;
  onChange: (field: string, operator: GridFilterOperator, value: unknown) => void;
}

const defaultOperator = <T,>(column: GridColumn<T>): GridFilterOperator =>
  column.filterOperation ?? (column.dataType === 'number' || column.dataType === 'date' || column.dataType === 'datetime' ? 'equals' : 'contains');

const operators = <T,>(column: GridColumn<T>): Array<[GridFilterOperator, string]> => {
  if (column.dataType === 'number' || column.dataType === 'date' || column.dataType === 'datetime') {
    return [['equals', '='], ['notEquals', '≠'], ['>', '>'], ['>=', '≥'], ['<', '<'], ['<=', '≤'], ['between', 'Between']];
  }
  return [['contains', 'Contains'], ['notContains', 'Not contains'], ['startsWith', 'Starts with'], ['endsWith', 'Ends with'], ['equals', '='], ['notEquals', '≠']];
};

interface FilterOperationMenuProps {
  caption: string;
  operator: GridFilterOperator;
  items: Array<[GridFilterOperator, string]>;
  active: boolean;
  onChange: (operator: GridFilterOperator) => void;
}

const FilterOperationMenu = ({ caption, operator, items, active, onChange }: FilterOperationMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLabel = items.find(([value]) => value === operator)?.[1] ?? operator;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="tmiv-grid__filter-operation" ref={rootRef} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); }
    }}>
      <button
        type="button"
        aria-label={`Filter operation ${caption}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={active ? 'is-active' : ''}
        title={`${caption}: ${currentLabel}`}
        onClick={() => setOpen((value) => !value)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div role="menu" aria-label={`Filter operations ${caption}`} className="tmiv-grid__filter-operation-menu">
        {items.map(([value, label]) => <button
          type="button"
          role="menuitemradio"
          aria-checked={value === operator}
          className={value === operator ? 'is-selected' : ''}
          key={value}
          onClick={() => { onChange(value); setOpen(false); }}
        ><span>{label}</span>{value === operator && <span aria-hidden="true">✓</span>}</button>)}
      </div>}
    </div>
  );
};

export const FilterRow = <T,>({ columns, filters, columnOffset, commandOffset = 0, columnStyles = {}, offsetStyles = [], commandStyle, onChange }: FilterRowProps<T>) => {
  const [operatorOverrides, setOperatorOverrides] = useState<Record<string, GridFilterOperator>>({});
  return <tr role="row" className="tmiv-grid__filter-row">
    {Array.from({ length: columnOffset }, (_, index) => <th key={index} className="tmiv-grid__filter-cell tmiv-grid__cell--fixed-left" style={offsetStyles[index]} />)}
    {columns.map((column) => {
      const field = columnField(column);
      const filter = filters.find((item) => item.field === field);
      const operator = filter?.operator ?? operatorOverrides[field] ?? defaultOperator(column);
      const fixedClass = column.fixed ? `tmiv-grid__cell--fixed-${column.fixedPosition === 'right' ? 'right' : 'left'}` : '';
      if (column.allowFiltering === false || !field) return <th key={field} className={`tmiv-grid__filter-cell ${fixedClass}`} style={columnStyles[field]} />;
      if (column.dataType === 'boolean') {
        return (
          <th key={field} className={`tmiv-grid__filter-cell ${fixedClass}`} style={columnStyles[field]}>
            <select aria-label={`Filter ${column.caption}`} value={String(filter?.value ?? '')} onChange={(event) => onChange(field, 'equals', event.target.value === '' ? '' : event.target.value === 'true')}>
              <option value="">All</option><option value="true">True</option><option value="false">False</option>
            </select>
          </th>
        );
      }
      const inputType = column.dataType === 'number' ? 'number' : column.dataType === 'date' || column.dataType === 'datetime' ? 'date' : 'search';
      const range = Array.isArray(filter?.value) ? filter.value : [filter?.value ?? '', ''];
      return (
        <th key={field} className={`tmiv-grid__filter-cell ${fixedClass}`} style={columnStyles[field]}>
          <div className="tmiv-grid__filter-editor">
            <FilterOperationMenu caption={String(column.caption ?? field)} operator={operator} items={operators(column)} active={Boolean(filter)} onChange={(nextOperator) => {
              setOperatorOverrides((current) => ({ ...current, [field]: nextOperator }));
              onChange(field, nextOperator, nextOperator === 'between' ? range : range[0]);
            }} />
            {operator === 'between' ? (
              <span className="tmiv-grid__filter-range">
                <input aria-label={`Filter ${column.caption} from`} type={inputType} value={String(range[0] ?? '')} onChange={(event) => onChange(field, operator, [event.target.value, range[1]])} />
                <input aria-label={`Filter ${column.caption} to`} type={inputType} value={String(range[1] ?? '')} onChange={(event) => onChange(field, operator, [range[0], event.target.value])} />
              </span>
            ) : (
              <input aria-label={`Filter ${column.caption}`} type={inputType} value={String(Array.isArray(filter?.value) ? filter?.value[0] ?? '' : filter?.value ?? '')} onChange={(event) => onChange(field, operator, event.target.value)} />
            )}
          </div>
        </th>
      );
    })}
    {Array.from({ length: commandOffset }, (_, index) => <th key={`command-${index}`} className="tmiv-grid__filter-cell tmiv-grid__cell--fixed-right" style={commandStyle} />)}
  </tr>;
};
