import type { GridDataSource, GridKey, GridLoadOptions, GridLoadResult } from '../types/grid.types';
export declare class GridArrayStore<T extends Record<string, unknown>> implements GridDataSource<T> {
    readonly key: keyof T | string;
    private items;
    constructor(items: T[], key?: keyof T | string);
    load(options: GridLoadOptions): Promise<GridLoadResult<T>>;
    byKey(key: GridKey): Promise<T | undefined>;
    insert(values: Partial<T>): Promise<T>;
    update(key: GridKey, values: Partial<T>): Promise<T>;
    remove(key: GridKey): Promise<void>;
}
//# sourceMappingURL=ArrayStore.d.ts.map