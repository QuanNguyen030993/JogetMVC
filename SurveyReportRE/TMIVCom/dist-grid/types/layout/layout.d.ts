import type { CSSProperties } from 'react';
import type { GridColumn } from '../types/grid.types';
export declare const numericColumnWidth: <T>(column: GridColumn<T>, override?: number) => number;
export declare const responsiveHiddenFields: <T>(columns: GridColumn<T>[], containerWidth: number, widths: Record<string, number>, padding?: number) => Set<string>;
export declare const stickyColumnStyles: <T>(columns: GridColumn<T>[], widths: Record<string, number>, leftBase?: number, rightBase?: number) => Record<string, CSSProperties>;
export interface GridBandCell {
    caption: string;
    colSpan: number;
}
export declare const buildBandRows: <T>(columns: GridColumn<T>[]) => GridBandCell[][];
//# sourceMappingURL=layout.d.ts.map