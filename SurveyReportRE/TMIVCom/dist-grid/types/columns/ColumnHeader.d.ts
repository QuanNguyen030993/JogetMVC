import type { GridColumn, GridSortDescriptor } from '../types/grid.types';
interface ColumnHeaderProps<T> {
    column: GridColumn<T>;
    columnIndex: number;
    sort: GridSortDescriptor[];
    onSort: (field: string, multiple: boolean) => void;
    rows: T[];
    headerFilterVisible: boolean;
    headerFilterSearchable: boolean;
    headerFilterValues: unknown[];
    reorderable: boolean;
    dragEnabled: boolean;
    dragging: boolean;
    dropTarget: boolean;
    onHeaderFilterChange: (values: unknown[]) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: () => void;
    onDrop: () => void;
}
export declare const ColumnHeader: <T>({ column, columnIndex, sort, onSort, rows, headerFilterVisible, headerFilterSearchable, headerFilterValues, reorderable, dragEnabled, dragging, dropTarget, onHeaderFilterChange, onDragStart, onDragEnd, onDragOver, onDrop, }: ColumnHeaderProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ColumnHeader.d.ts.map