import type { GridColumn, GridGroupDescriptor } from '../types/grid.types';
interface GroupPanelProps<T> {
    columns: GridColumn<T>[];
    groups: GridGroupDescriptor[];
    emptyText: string;
    allowDragging: boolean;
    onChange: (groups: GridGroupDescriptor[]) => void;
}
export declare const GroupPanel: <T>({ columns, groups, emptyText, allowDragging, onChange }: GroupPanelProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=GroupPanel.d.ts.map