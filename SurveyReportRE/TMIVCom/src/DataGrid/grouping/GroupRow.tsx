import { calculateSummary, type GridGroupNode } from '../core/GridEngine';
import type { GridColumn, GridSummaryItem } from '../types/grid.types';

interface GroupRowProps<T> {
  node: GridGroupNode<T>;
  column: GridColumn<T> | undefined;
  colSpan: number;
  expanded: boolean;
  collapsible: boolean;
  summaries: GridSummaryItem<T>[];
  onToggle: () => void;
}

export const GroupRow = <T,>({ node, column, colSpan, expanded, collapsible, summaries, onToggle }: GroupRowProps<T>) => (
  <tr role="row" className="tmiv-grid__group-row">
    <td role="gridcell" colSpan={colSpan} style={{ paddingLeft: 12 + node.level * 22 }}>
      <button type="button" disabled={!collapsible} aria-expanded={expanded} onClick={onToggle}>{expanded ? '▾' : '▸'}</button>
      <strong>{column?.caption ?? node.field}:</strong> {String(node.value ?? '(Blank)')}
      <span className="tmiv-grid__group-count">({node.rows.length})</span>
      {summaries.map((item, index) => {
        const value = calculateSummary(node.rows, item);
        const text = item.displayFormat?.replace('{0}', String(value ?? '')) ?? `${String(item.field ?? item.name ?? item.type)}: ${String(value ?? '')}`;
        return <span className="tmiv-grid__group-summary" key={item.name ?? `${String(item.field)}-${item.type}-${index}`}>{text}</span>;
      })}
    </td>
  </tr>
);
