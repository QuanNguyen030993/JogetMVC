import { type GridGroupNode } from '../core/GridEngine';
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
export declare const GroupRow: <T>({ node, column, colSpan, expanded, collapsible, summaries, onToggle }: GroupRowProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=GroupRow.d.ts.map