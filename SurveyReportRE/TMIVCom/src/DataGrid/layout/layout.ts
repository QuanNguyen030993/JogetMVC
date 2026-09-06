import type { CSSProperties } from 'react';
import { columnField } from '../core/GridEngine';
import type { GridColumn } from '../types/grid.types';

export const numericColumnWidth = <T>(column: GridColumn<T>, override?: number): number => {
  if (override !== undefined) return override;
  if (typeof column.width === 'number') return column.width;
  if (typeof column.width === 'string') {
    const parsed = Number.parseFloat(column.width);
    if (Number.isFinite(parsed) && column.width.includes('px')) return parsed;
  }
  return Math.max(column.minWidth ?? 80, 140);
};

export const responsiveHiddenFields = <T>(columns: GridColumn<T>[], containerWidth: number, widths: Record<string, number>, padding = 0): Set<string> => {
  const hidden = new Set(columns.filter((column) => !column.fixed && column.minScreenWidth && containerWidth < column.minScreenWidth).map(columnField));
  let total = columns.filter((column) => !hidden.has(columnField(column))).reduce((sum, column) => sum + numericColumnWidth(column, widths[columnField(column)]), padding);
  const candidates = columns
    .filter((column) => column.hidingPriority !== undefined && !column.fixed && !hidden.has(columnField(column)))
    .sort((left, right) => (left.hidingPriority ?? 0) - (right.hidingPriority ?? 0));
  for (const column of candidates) {
    if (total <= containerWidth) break;
    hidden.add(columnField(column));
    total -= numericColumnWidth(column, widths[columnField(column)]);
  }
  return hidden;
};

export const stickyColumnStyles = <T>(columns: GridColumn<T>[], widths: Record<string, number>, leftBase = 0, rightBase = 0): Record<string, CSSProperties> => {
  const styles: Record<string, CSSProperties> = {};
  let left = leftBase;
  columns.forEach((column) => {
    if (column.fixed && column.fixedPosition !== 'right') {
      const field = columnField(column);
      styles[field] = { position: 'sticky', left, zIndex: 3 };
      left += numericColumnWidth(column, widths[field]);
    }
  });
  let right = rightBase;
  [...columns].reverse().forEach((column) => {
    if (column.fixed && column.fixedPosition === 'right') {
      const field = columnField(column);
      styles[field] = { position: 'sticky', right, zIndex: 3 };
      right += numericColumnWidth(column, widths[field]);
    }
  });
  return styles;
};

export interface GridBandCell { caption: string; colSpan: number }

export const buildBandRows = <T>(columns: GridColumn<T>[]): GridBandCell[][] => {
  const depth = Math.max(0, ...columns.map((column) => column.bandPath?.length ?? 0));
  return Array.from({ length: depth }, (_, level) => {
    const cells: GridBandCell[] = [];
    columns.forEach((column) => {
      const caption = column.bandPath?.[level] ?? '';
      const prefix = (column.bandPath ?? []).slice(0, level + 1).join('\u0000');
      const previousColumn = columns[cells.reduce((count, cell) => count + cell.colSpan, 0) - 1];
      const previousPrefix = previousColumn ? (previousColumn.bandPath ?? []).slice(0, level + 1).join('\u0000') : undefined;
      if (cells.length && prefix === previousPrefix) cells[cells.length - 1].colSpan += 1;
      else cells.push({ caption, colSpan: 1 });
    });
    return cells;
  });
};
