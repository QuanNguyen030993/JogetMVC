import type { GridColumn, GridSummaryItem } from '../types/grid.types';
interface SummaryFooterProps<T> {
    rows: T[];
    columns: GridColumn<T>[];
    items: GridSummaryItem<T>[];
    columnOffset: number;
    commandOffset?: number;
    locale: string;
}
export declare const SummaryFooter: <T>({ rows, columns, items, columnOffset, commandOffset, locale }: SummaryFooterProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SummaryFooter.d.ts.map