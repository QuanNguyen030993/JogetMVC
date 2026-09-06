import type { GridColumn, GridSummaryItem } from '../types/grid.types';
interface SummaryFooterProps<T> {
    rows: T[];
    columns: GridColumn<T>[];
    items: GridSummaryItem<T>[];
    columnOffset: number;
    commandOffset?: number;
    locale: string;
    columnStyles?: Record<string, CSSProperties>;
    offsetStyles?: CSSProperties[];
    commandStyle?: CSSProperties;
}
export declare const SummaryFooter: <T>({ rows, columns, items, columnOffset, commandOffset, locale, columnStyles, offsetStyles, commandStyle }: SummaryFooterProps<T>) => import("react/jsx-runtime").JSX.Element;
import type { CSSProperties } from 'react';
export {};
//# sourceMappingURL=SummaryFooter.d.ts.map