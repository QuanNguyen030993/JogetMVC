import type {
  GridColumn,
  GridFilterDescriptor,
  GridGroupDescriptor,
  GridKey,
  GridSortDescriptor,
  GridSummaryItem,
} from '../types/grid.types';

export const columnField = <T>(column: GridColumn<T>): string =>
  String(column.field ?? column.dataField ?? column.name ?? '');

export const getPathValue = (source: unknown, path: string): unknown => {
  if (!source || !path) return undefined;
  return path.split('.').reduce<unknown>((value, part) => {
    if (value === null || value === undefined || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[part];
  }, source);
};

export const getColumnValue = <T>(row: T, column: GridColumn<T>): unknown => {
  if (column.valueGetter) return column.valueGetter(row);
  if (column.calculateCellValue) return column.calculateCellValue(row);
  return getPathValue(row, columnField(column));
};

export const getDisplayValue = <T>(row: T, column: GridColumn<T>): unknown => {
  if (column.calculateDisplayValue) return column.calculateDisplayValue(row);
  const value = getColumnValue(row, column);
  if (!column.lookup) return value;
  const item = column.lookup.dataSource.find((candidate) =>
    String(getPathValue(candidate, String(column.lookup?.valueExpr)) ?? '') === String(value ?? ''));
  return item ? getPathValue(item, String(column.lookup.displayExpr)) : value;
};

export const resolveKey = <T extends Record<string, unknown>>(
  row: T,
  keyExpr: keyof T | string | ((item: T) => GridKey),
): GridKey => {
  const value = typeof keyExpr === 'function' ? keyExpr(row) : getPathValue(row, String(keyExpr));
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`DataGrid keyExpr "${String(keyExpr)}" must resolve to a string or number.`);
  }
  return value;
};

export const normalizeColumns = <T extends Record<string, unknown>>(
  columns: GridColumn<T>[] | undefined,
  rows: T[],
): GridColumn<T>[] => {
  const source = columns?.length
    ? columns
    : Object.keys(rows[0] ?? {}).map((field) => ({ field, caption: field } as GridColumn<T>));

  const flatten = (items: GridColumn<T>[], path: string[] = []): GridColumn<T>[] => items.flatMap((column) => {
    const caption = column.caption ?? String(column.field ?? column.dataField ?? column.name ?? '');
    if (column.columns?.length) return flatten(column.columns, [...path, caption]);
    return [{ ...column, bandPath: column.bandPath ?? path }];
  });

  return flatten(source)
    .map((column, index) => ({
      ...column,
      field: column.field ?? column.dataField,
      caption: column.caption ?? String(column.field ?? column.dataField ?? column.name ?? ''),
      visibleIndex: column.visibleIndex ?? index,
      allowSorting: column.allowSorting !== false,
    }))
    .filter((column) => column.visible !== false)
    .sort((left, right) => (left.visibleIndex ?? 0) - (right.visibleIndex ?? 0));
};

export const normalizeAllColumns = <T extends Record<string, unknown>>(
  columns: GridColumn<T>[] | undefined,
  rows: T[],
): GridColumn<T>[] => {
  const source = columns?.length
    ? columns
    : Object.keys(rows[0] ?? {}).map((field) => ({ field, caption: field } as GridColumn<T>));
  const flatten = (items: GridColumn<T>[], path: string[] = []): GridColumn<T>[] => items.flatMap((column) => {
    const caption = column.caption ?? String(column.field ?? column.dataField ?? column.name ?? '');
    if (column.columns?.length) return flatten(column.columns, [...path, caption]);
    return [{ ...column, bandPath: column.bandPath ?? path }];
  });
  return flatten(source).map((column, index) => ({
    ...column,
    field: column.field ?? column.dataField,
    caption: column.caption ?? String(column.field ?? column.dataField ?? column.name ?? ''),
    visibleIndex: column.visibleIndex ?? index,
    allowSorting: column.allowSorting !== false,
  })).sort((left, right) => (left.visibleIndex ?? 0) - (right.visibleIndex ?? 0));
};

const compareValues = (left: unknown, right: unknown): number => {
  if (Object.is(left, right)) return 0;
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
};

export const sortRows = <T>(rows: T[], columns: GridColumn<T>[], sort: GridSortDescriptor[]): T[] => {
  if (!sort.length) return rows;
  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((leftItem, rightItem) => {
    for (const descriptor of sort) {
      const column = columns.find((candidate) => columnField(candidate) === descriptor.field);
      if (!column) continue;
      const left = getColumnValue(leftItem.row, column);
      const right = getColumnValue(rightItem.row, column);
      const result = column.sortComparator
        ? column.sortComparator(left, right, leftItem.row, rightItem.row)
        : compareValues(left, right);
      if (result !== 0) return descriptor.direction === 'desc' ? -result : result;
    }
    return leftItem.index - rightItem.index;
  });
  return indexed.map((item) => item.row);
};

export const pageRows = <T>(rows: T[], pageIndex: number, pageSize: number): T[] =>
  rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

const normalizeText = (value: unknown): string => String(value ?? '').toLocaleLowerCase();

export const matchesFilter = <T>(row: T, column: GridColumn<T>, filter: GridFilterDescriptor): boolean => {
  const value = getColumnValue(row, column);
  const expected = filter.value;
  if (expected === '' || expected === undefined || expected === null || Array.isArray(expected) && !expected.length) return true;
  if (filter.operator === 'in') return Array.isArray(expected) && expected.some((item) => Object.is(item, value) || String(item) === String(value));
  if (filter.operator === 'between' && Array.isArray(expected)) {
    const [from, to] = expected;
    return (from === '' || compareValues(value, from) >= 0) && (to === '' || compareValues(value, to) <= 0);
  }
  const left = normalizeText(value);
  const right = normalizeText(expected);
  if (filter.operator === 'contains') return left.includes(right);
  if (filter.operator === 'notContains') return !left.includes(right);
  if (filter.operator === 'startsWith') return left.startsWith(right);
  if (filter.operator === 'endsWith') return left.endsWith(right);
  if (filter.operator === 'equals') return left === right;
  if (filter.operator === 'notEquals') return left !== right;
  const result = compareValues(value, expected);
  if (filter.operator === '>') return result > 0;
  if (filter.operator === '>=') return result >= 0;
  if (filter.operator === '<') return result < 0;
  if (filter.operator === '<=') return result <= 0;
  return true;
};

export const filterRows = <T>(rows: T[], columns: GridColumn<T>[], filters: GridFilterDescriptor[]): T[] => {
  if (!filters.length) return rows;
  return rows.filter((row) => filters.every((filter) => {
    const column = columns.find((candidate) => columnField(candidate) === filter.field);
    return column ? matchesFilter(row, column, filter) : true;
  }));
};

export const searchRows = <T>(rows: T[], columns: GridColumn<T>[], search: string): T[] => {
  const term = normalizeText(search).trim();
  if (!term) return rows;
  const searchable = columns.filter((column) => column.allowFiltering !== false);
  return rows.filter((row) => searchable.some((column) => normalizeText(getDisplayValue(row, column)).includes(term)));
};

export interface GridGroupNode<T> {
  id: string;
  field: string;
  value: unknown;
  level: number;
  rows: T[];
  children: GridGroupNode<T>[];
}

export const groupRows = <T>(rows: T[], columns: GridColumn<T>[], groups: GridGroupDescriptor[], level = 0, path = ''): GridGroupNode<T>[] => {
  const descriptor = groups[level];
  if (!descriptor) return [];
  const column = columns.find((candidate) => columnField(candidate) === descriptor.field);
  if (!column) return [];
  const buckets = new Map<string, { value: unknown; rows: T[] }>();
  rows.forEach((row) => {
    const value = getDisplayValue(row, column);
    const key = `${typeof value}:${String(value ?? '')}`;
    const bucket = buckets.get(key) ?? { value, rows: [] };
    bucket.rows.push(row);
    buckets.set(key, bucket);
  });
  return [...buckets.values()]
    .sort((left, right) => compareValues(left.value, right.value) * (descriptor.direction === 'desc' ? -1 : 1))
    .map((bucket) => {
      const id = `${path}/${descriptor.field}:${String(bucket.value ?? '')}`;
      return {
        id,
        field: descriptor.field,
        value: bucket.value,
        level,
        rows: bucket.rows,
        children: groupRows(bucket.rows, columns, groups, level + 1, id),
      };
    });
};

export const calculateSummary = <T>(rows: T[], item: GridSummaryItem<T>): unknown => {
  if (item.type === 'custom') return item.calculate?.(rows);
  if (item.type === 'count') return item.field
    ? rows.filter((row) => getPathValue(row, String(item.field)) !== undefined).length
    : rows.length;
  const values = rows
    .map((row) => getPathValue(row, String(item.field ?? '')))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!values.length) return undefined;
  if (item.type === 'sum') return values.reduce((sum, value) => sum + value, 0);
  if (item.type === 'avg') return values.reduce((sum, value) => sum + value, 0) / values.length;
  if (item.type === 'min') return Math.min(...values);
  if (item.type === 'max') return Math.max(...values);
  return undefined;
};

export const nextSort = (
  current: GridSortDescriptor[],
  field: string,
  multiple: boolean,
): GridSortDescriptor[] => {
  const existing = current.find((item) => item.field === field);
  const remaining = current.filter((item) => item.field !== field);
  if (!existing) return multiple ? [...remaining, { field, direction: 'asc' }] : [{ field, direction: 'asc' }];
  if (existing.direction === 'asc') {
    const next = { field, direction: 'desc' as const };
    return multiple ? [...remaining, next] : [next];
  }
  return multiple ? remaining : [];
};

export const formatValue = <T>(value: unknown, row: T, column: GridColumn<T>, locale = 'en'): string => {
  if (column.format instanceof Function) return column.format(value, row);
  if (value === null || value === undefined) return '';
  const format = column.format ?? column.dataType;
  if (format === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);
  }
  if (format === 'percent' && typeof value === 'number') {
    return new Intl.NumberFormat(locale, { style: 'percent' }).format(value);
  }
  if ((format === 'decimal' || column.dataType === 'number') && typeof value === 'number') {
    return new Intl.NumberFormat(locale).format(value);
  }
  if (format === 'date' || format === 'datetime' || column.dataType === 'date' || column.dataType === 'datetime') {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(locale, format === 'datetime' || column.dataType === 'datetime'
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { dateStyle: 'medium' }).format(date);
    }
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
