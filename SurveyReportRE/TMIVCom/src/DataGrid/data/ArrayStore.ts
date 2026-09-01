import type { GridDataSource, GridKey, GridLoadOptions, GridLoadResult } from '../types/grid.types';
import { getPathValue } from '../core/GridEngine';

export class GridArrayStore<T extends Record<string, unknown>> implements GridDataSource<T> {
  readonly key: keyof T | string;
  private items: T[];

  constructor(items: T[], key: keyof T | string = 'id') {
    this.items = [...items];
    this.key = key;
  }

  async load(options: GridLoadOptions): Promise<GridLoadResult<T>> {
    return {
      data: this.items.slice(options.skip, options.skip + options.take),
      totalCount: this.items.length,
    };
  }

  async byKey(key: GridKey): Promise<T | undefined> {
    return this.items.find((item) => getPathValue(item, String(this.key)) === key);
  }

  async insert(values: Partial<T>): Promise<T> {
    const item = values as T;
    this.items.push(item);
    return item;
  }

  async update(key: GridKey, values: Partial<T>): Promise<T> {
    const index = this.items.findIndex((item) => getPathValue(item, String(this.key)) === key);
    if (index < 0) throw new Error(`Row with key ${String(key)} was not found.`);
    this.items[index] = { ...this.items[index], ...values };
    return this.items[index];
  }

  async remove(key: GridKey): Promise<void> {
    this.items = this.items.filter((item) => getPathValue(item, String(this.key)) !== key);
  }
}
