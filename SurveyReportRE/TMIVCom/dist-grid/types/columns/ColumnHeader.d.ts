import type { CSSProperties } from 'react';
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
    resizable: boolean;
    resizing: boolean;
    layoutStyle?: CSSProperties;
    onHeaderFilterChange: (values: unknown[]) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: () => void;
    onDrop: () => void;
    onResizeStart: (clientX: number) => void;
    onAutoFit: () => void;
}
export declare const ColumnHeader: <T>({ column, columnIndex, sort, onSort, rows, headerFilterVisible, headerFilterSearchable, headerFilterValues, reorderable, dragEnabled, dragging, dropTarget, onHeaderFilterChange, onDragStart, onDragEnd, onDragOver, onDrop, resizable, resizing, layoutStyle, onResizeStart, onAutoFit, }: ColumnHeaderProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ColumnHeader.d.ts.map