import type { GridFilterDescriptor, GridFocusedCell, GridGroupDescriptor, GridKey, GridSortDescriptor } from '../types/grid.types';
interface GridStateOptions {
    selectedRowKeys?: GridKey[];
    defaultSelectedRowKeys?: GridKey[];
    pageIndex: number;
    pageSize: number;
    sort: GridSortDescriptor[];
    onSelectedRowKeysChange?: (keys: GridKey[]) => void;
}
export declare const useGridState: (options: GridStateOptions) => {
    selection: GridKey[];
    setSelection: (next: GridKey[] | ((current: GridKey[]) => GridKey[])) => void;
    pageIndex: number;
    setPageIndex: import("react").Dispatch<import("react").SetStateAction<number>>;
    pageSize: number;
    setPageSize: import("react").Dispatch<import("react").SetStateAction<number>>;
    sort: GridSortDescriptor[];
    setSort: import("react").Dispatch<import("react").SetStateAction<GridSortDescriptor[]>>;
    filters: GridFilterDescriptor[];
    setFilters: import("react").Dispatch<import("react").SetStateAction<GridFilterDescriptor[]>>;
    search: string;
    setSearch: import("react").Dispatch<import("react").SetStateAction<string>>;
    groups: GridGroupDescriptor[];
    setGroups: import("react").Dispatch<import("react").SetStateAction<GridGroupDescriptor[]>>;
    focusedCell: GridFocusedCell | null;
    setFocusedCell: import("react").Dispatch<import("react").SetStateAction<GridFocusedCell | null>>;
};
export {};
//# sourceMappingURL=useGridState.d.ts.map