import type { GridColumn, GridFilterDescriptor, GridGroupDescriptor, GridKey, GridSortDescriptor, GridSummaryItem } from '../types/grid.types';
export declare const columnField: <T>(column: GridColumn<T>) => string;
export declare const getPathValue: (source: unknown, path: string) => unknown;
export declare const getColumnValue: <T>(row: T, column: GridColumn<T>) => unknown;
export declare const getDisplayValue: <T>(row: T, column: GridColumn<T>) => unknown;
export declare const resolveKey: <T extends Record<string, unknown>>(row: T, keyExpr: keyof T | string | ((item: T) => GridKey)) => GridKey;
export declare const normalizeColumns: <T extends Record<string, unknown>>(columns: GridColumn<T>[] | undefined, rows: T[]) => GridColumn<T>[];
export declare const normalizeAllColumns: <T extends Record<string, unknown>>(columns: GridColumn<T>[] | undefined, rows: T[]) => GridColumn<T>[];
export declare const sortRows: <T>(rows: T[], columns: GridColumn<T>[], sort: GridSortDescriptor[]) => T[];
export declare const pageRows: <T>(rows: T[], pageIndex: number, pageSize: number) => T[];
export declare const matchesFilter: <T>(row: T, column: GridColumn<T>, filter: GridFilterDescriptor) => boolean;
export declare const filterRows: <T>(rows: T[], columns: GridColumn<T>[], filters: GridFilterDescriptor[]) => T[];
export declare const searchRows: <T>(rows: T[], columns: GridColumn<T>[], search: string) => T[];
export interface GridGroupNode<T> {
    id: string;
    field: string;
    value: unknown;
    level: number;
    rows: T[];
    children: GridGroupNode<T>[];
}
export declare const groupRows: <T>(rows: T[], columns: GridColumn<T>[], groups: GridGroupDescriptor[], level?: number, path?: string) => GridGroupNode<T>[];
export declare const calculateSummary: <T>(rows: T[], item: GridSummaryItem<T>) => unknown;
export declare const nextSort: (current: GridSortDescriptor[], field: string, multiple: boolean) => GridSortDescriptor[];
export declare const formatValue: <T>(value: unknown, row: T, column: GridColumn<T>, locale?: string) => string;
//# sourceMappingURL=GridEngine.d.ts.map