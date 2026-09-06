import type { GridDataSource, GridKey, GridLoadOptions, GridLoadResult } from '../types/grid.types';
export interface GridCustomStoreOptions<T> {
    key?: keyof T | string;
    load(options: GridLoadOptions): Promise<GridLoadResult<T> | T[]>;
    byKey?(key: GridKey): Promise<T | undefined>;
    insert?(values: Partial<T>): Promise<T>;
    update?(key: GridKey, values: Partial<T>): Promise<T | void>;
    remove?(key: GridKey): Promise<void>;
}
export declare class GridCustomStore<T> implements GridDataSource<T> {
    readonly key?: keyof T | string;
    private readonly options;
    constructor(options: GridCustomStoreOptions<T>);
    load(options: GridLoadOptions): Promise<GridLoadResult<T> | T[]>;
    byKey(key: GridKey): Promise<T | undefined>;
    insert(values: Partial<T>): Promise<T>;
    update(key: GridKey, values: Partial<T>): Promise<T | void>;
    remove(key: GridKey): Promise<void>;
}
//# sourceMappingURL=CustomStore.d.ts.map