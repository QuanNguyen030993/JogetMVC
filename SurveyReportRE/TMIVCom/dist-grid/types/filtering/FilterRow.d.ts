import type { GridColumn, GridFilterDescriptor, GridFilterOperator } from '../types/grid.types';
interface FilterRowProps<T> {
    columns: GridColumn<T>[];
    filters: GridFilterDescriptor[];
    columnOffset: number;
    commandOffset?: number;
    onChange: (field: string, operator: GridFilterOperator, value: unknown) => void;
}
export declare const FilterRow: <T>({ columns, filters, columnOffset, commandOffset, onChange }: FilterRowProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FilterRow.d.ts.map