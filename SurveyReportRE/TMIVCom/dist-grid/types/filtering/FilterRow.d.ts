import { type CSSProperties } from 'react';
import type { GridColumn, GridFilterDescriptor, GridFilterOperator } from '../types/grid.types';
interface FilterRowProps<T> {
    columns: GridColumn<T>[];
    filters: GridFilterDescriptor[];
    columnOffset: number;
    commandOffset?: number;
    columnStyles?: Record<string, CSSProperties>;
    offsetStyles?: CSSProperties[];
    commandStyle?: CSSProperties;
    onChange: (field: string, operator: GridFilterOperator, value: unknown) => void;
}
export declare const FilterRow: <T>({ columns, filters, columnOffset, commandOffset, columnStyles, offsetStyles, commandStyle, onChange }: FilterRowProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FilterRow.d.ts.map