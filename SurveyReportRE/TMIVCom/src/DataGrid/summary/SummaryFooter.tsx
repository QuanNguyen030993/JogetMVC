import { calculateSummary, columnField, formatValue } from '../core/GridEngine';
import type { GridColumn, GridSummaryItem } from '../types/grid.types';

interface SummaryFooterProps<T> {
  rows: T[];
  columns: GridColumn<T>[];
  items: GridSummaryItem<T>[];
  columnOffset: number;
  commandOffset?: number;
  locale: string;
  columnStyles?: Record<string, CSSProperties>;
  offsetStyles?: CSSProperties[];
  commandStyle?: CSSProperties;
}

export const SummaryFooter = <T,>({ rows, columns, items, columnOffset, commandOffset = 0, locale, columnStyles = {}, offsetStyles = [], commandStyle }: SummaryFooterProps<T>) => (
  <tfoot className="tmiv-grid__summary">
    <tr role="row">
      {Array.from({ length: columnOffset }, (_, index) => <td key={index} className="tmiv-grid__cell--fixed-left" style={offsetStyles[index]} />)}
      {columns.map((column) => {
        const field = columnField(column);
        const matching = items.filter((item) => String(item.field ?? '') === field || !item.field && field === columnField(columns[0]));
        return (
          <td role="gridcell" key={field} className={column.fixed ? `tmiv-grid__cell--fixed-${column.fixedPosition === 'right' ? 'right' : 'left'}` : undefined} style={columnStyles[field]}>
            {matching.map((item, index) => {
              const value = calculateSummary(rows, item);
              const formatted = item.valueFormat instanceof Function
                ? item.valueFormat(value)
                : formatValue(value, rows[0], { ...column, format: item.valueFormat ?? column.format }, locale);
              return <div key={item.name ?? `${item.type}-${index}`}>{item.displayFormat?.replace('{0}', formatted) ?? `${item.type}: ${formatted}`}</div>;
            })}
          </td>
        );
      })}
      {Array.from({ length: commandOffset }, (_, index) => <td key={`command-${index}`} className="tmiv-grid__cell--fixed-right" style={commandStyle} />)}
    </tr>
  </tfoot>
);
import type { CSSProperties } from 'react';
