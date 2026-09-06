import { describe, expect, it } from 'vitest';
import { buildBandRows, responsiveHiddenFields, stickyColumnStyles } from './layout';
import type { GridColumn } from '../types/grid.types';

type Row = { name: string; role: string; age: number };

describe('column layout engine', () => {
  const columns: GridColumn<Row>[] = [
    { field: 'name', width: 180, fixed: true, bandPath: ['Identity'] },
    { field: 'role', width: 160, hidingPriority: 2, bandPath: ['Identity'] },
    { field: 'age', width: 100, hidingPriority: 1, bandPath: ['Profile'] },
  ];

  it('hides lower-priority adaptive columns first and keeps fixed columns', () => {
    const hidden = responsiveHiddenFields(columns, 300, {});
    expect([...hidden]).toEqual(['age', 'role']);
    expect(hidden.has('name')).toBe(false);
  });

  it('calculates frozen offsets from both sides', () => {
    const styles = stickyColumnStyles([
      ...columns,
      { field: 'age', width: 100, fixed: true, fixedPosition: 'right' },
    ], {}, 44, 150);
    expect(styles.name.left).toBe(44);
    expect(styles.age.right).toBe(150);
  });

  it('builds contiguous band spans', () => {
    expect(buildBandRows(columns)).toEqual([[{ caption: 'Identity', colSpan: 2 }, { caption: 'Profile', colSpan: 1 }]]);
  });
});
