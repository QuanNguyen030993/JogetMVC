import type { GridColumn } from '../types/grid.types';
export declare const validateValue: <T>(value: unknown, row: T, column: GridColumn<T>) => Promise<string | undefined>;
export declare const validateRow: <T>(row: T, columns: GridColumn<T>[]) => Promise<Record<string, string>>;
export declare const coerceEditorValue: <T>(value: unknown, column: GridColumn<T>) => unknown;
//# sourceMappingURL=validation.d.ts.map