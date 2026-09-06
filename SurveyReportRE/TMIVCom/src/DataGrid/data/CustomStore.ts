import type { GridDataSource, GridKey, GridLoadOptions, GridLoadResult } from '../types/grid.types';

export interface GridCustomStoreOptions<T> {
  key?: keyof T | string;
  load(options: GridLoadOptions): Promise<GridLoadResult<T> | T[]>;
  byKey?(key: GridKey): Promise<T | undefined>;
  insert?(values: Partial<T>): Promise<T>;
  update?(key: GridKey, values: Partial<T>): Promise<T | void>;
  remove?(key: GridKey): Promise<void>;
}

export class GridCustomStore<T> implements GridDataSource<T> {
  readonly key?: keyof T | string;
  private readonly options: GridCustomStoreOptions<T>;

  constructor(options: GridCustomStoreOptions<T>) {
    this.options = options;
    this.key = options.key;
  }

  load(options: GridLoadOptions): Promise<GridLoadResult<T> | T[]> {
    return this.options.load(options);
  }

  byKey(key: GridKey): Promise<T | undefined> {
    return this.options.byKey ? this.options.byKey(key) : Promise.resolve(undefined);
  }

  insert(values: Partial<T>): Promise<T> {
    if (!this.options.insert) return Promise.reject(new Error('Insert is not supported by this data source.'));
    return this.options.insert(values);
  }

  update(key: GridKey, values: Partial<T>): Promise<T | void> {
    if (!this.options.update) return Promise.reject(new Error('Update is not supported by this data source.'));
    return this.options.update(key, values);
  }

  remove(key: GridKey): Promise<void> {
    if (!this.options.remove) return Promise.reject(new Error('Remove is not supported by this data source.'));
    return this.options.remove(key);
  }
}
