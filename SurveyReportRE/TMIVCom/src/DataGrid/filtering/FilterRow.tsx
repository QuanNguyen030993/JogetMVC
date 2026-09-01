import { columnField } from '../core/GridEngine';
import type { GridColumn, GridFilterDescriptor, GridFilterOperator } from '../types/grid.types';

interface FilterRowProps<T> {
  columns: GridColumn<T>[];
  filters: GridFilterDescriptor[];
  columnOffset: number;
  commandOffset?: number;
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

export const FilterRow = <T,>({ columns, filters, columnOffset, commandOffset = 0, onChange }: FilterRowProps<T>) => (
  <tr role="row" className="tmiv-grid__filter-row">
    {Array.from({ length: columnOffset }, (_, index) => <th key={index} className="tmiv-grid__filter-cell" />)}
    {columns.map((column) => {
      const field = columnField(column);
      const filter = filters.find((item) => item.field === field);
      const operator = filter?.operator ?? defaultOperator(column);
      if (column.allowFiltering === false || !field) return <th key={field} className="tmiv-grid__filter-cell" />;
      if (column.dataType === 'boolean') {
        return (
          <th key={field} className="tmiv-grid__filter-cell">
            <select aria-label={`Filter ${column.caption}`} value={String(filter?.value ?? '')} onChange={(event) => onChange(field, 'equals', event.target.value === '' ? '' : event.target.value === 'true')}>
              <option value="">All</option><option value="true">True</option><option value="false">False</option>
            </select>
          </th>
        );
      }
      const inputType = column.dataType === 'number' ? 'number' : column.dataType === 'date' || column.dataType === 'datetime' ? 'date' : 'search';
      const range = Array.isArray(filter?.value) ? filter.value : [filter?.value ?? '', ''];
      return (
        <th key={field} className="tmiv-grid__filter-cell">
          <div className="tmiv-grid__filter-editor">
            <select aria-label={`Filter operation ${column.caption}`} value={operator} onChange={(event) => {
              const nextOperator = event.target.value as GridFilterOperator;
              onChange(field, nextOperator, nextOperator === 'between' ? range : range[0]);
            }}>
              {operators(column).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
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
    {Array.from({ length: commandOffset }, (_, index) => <th key={`command-${index}`} className="tmiv-grid__filter-cell" />)}
  </tr>
);
