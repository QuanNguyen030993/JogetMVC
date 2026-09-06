import { describe, expect, it } from 'vitest';
import { calculateSummary, filterRows, formatValue, groupRows, nextSort, normalizeColumns, pageRows, searchRows, sortRows } from './GridEngine';
import type { GridColumn } from '../types/grid.types';

type Row = { id: number; name: string; team: string; score: number };
const rows: Row[] = [
  { id: 1, name: 'Beta', team: 'B', score: 10 },
  { id: 2, name: 'Alpha', team: 'A', score: 10 },
  { id: 3, name: 'Gamma', team: 'A', score: 20 },
];
const columns: GridColumn<Row>[] = [
  { field: 'team' },
  { field: 'score', dataType: 'number' },
  { field: 'name' },
];

describe('GridEngine', () => {
  it('sorts by multiple descriptors and keeps a stable fallback', () => {
    const result = sortRows(rows, columns, [
      { field: 'team', direction: 'asc' },
      { field: 'score', direction: 'desc' },
    ]);
    expect(result.map((row) => row.id)).toEqual([3, 2, 1]);
  });

  it('cycles sort state through asc, desc and clear', () => {
    const asc = nextSort([], 'name', false);
    const desc = nextSort(asc, 'name', false);
    expect(asc).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(desc).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(nextSort(desc, 'name', false)).toEqual([]);
  });

  it('paginates without mutating data', () => {
    expect(pageRows(rows, 1, 2).map((row) => row.id)).toEqual([3]);
    expect(rows).toHaveLength(3);
  });

  it('auto-generates columns and formats numbers', () => {
    expect(normalizeColumns(undefined, rows).map((column) => column.field)).toEqual(['id', 'name', 'team', 'score']);
    expect(formatValue(1234, rows[0], { field: 'score', dataType: 'number' }, 'en-US')).toBe('1,234');
  });

  it('filters and searches across filterable columns', () => {
    expect(filterRows(rows, columns, [{ field: 'score', operator: '>=', value: 20 }]).map((row) => row.id)).toEqual([3]);
    expect(searchRows(rows, columns, 'alpha').map((row) => row.id)).toEqual([2]);
  });

  it('builds nested groups and calculates summaries', () => {
    const groups = groupRows(rows, columns, [{ field: 'team', direction: 'asc' }]);
    expect(groups.map((group) => [group.value, group.rows.length])).toEqual([['A', 2], ['B', 1]]);
    expect(calculateSummary(rows, { field: 'score', type: 'sum' })).toBe(40);
    expect(calculateSummary(rows, { field: 'score', type: 'avg' })).toBeCloseTo(40 / 3);
  });
});
