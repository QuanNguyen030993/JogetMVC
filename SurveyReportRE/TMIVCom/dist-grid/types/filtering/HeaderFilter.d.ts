import type { GridColumn } from '../types/grid.types';
interface HeaderFilterProps<T> {
    column: GridColumn<T>;
    rows: T[];
    selected: unknown[];
    searchable: boolean;
    onChange: (values: unknown[]) => void;
}
export declare const HeaderFilter: <T>({ column, rows, selected, searchable, onChange }: HeaderFilterProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderFilter.d.ts.map