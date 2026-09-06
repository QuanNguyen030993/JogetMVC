import type { GridDataSource, GridLoadOptions } from '../types/grid.types';
interface UseGridDataResult<T> {
    rows: T[];
    totalCount: number;
    loading: boolean;
    error: Error | null;
    reload: () => Promise<void>;
}
export declare const useGridData: <T>(source: T[] | GridDataSource<T>, loadOptions: GridLoadOptions, onDataError?: (error: Error) => void) => UseGridDataResult<T>;
export {};
//# sourceMappingURL=useGridData.d.ts.map