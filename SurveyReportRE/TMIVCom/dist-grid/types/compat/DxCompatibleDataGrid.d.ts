import { type ReactElement, type RefAttributes } from 'react';
import type { DataGridHandle, DataGridProps, GridColumn } from '../types/grid.types';
export interface DxCompatibleDataGridProps<T extends Record<string, unknown>> extends Omit<DataGridProps<T>, 'columns' | 'dataSource'> {
    dataSource?: DataGridProps<T>['dataSource'];
    rows?: T[];
    columns?: Array<GridColumn<T> & {
        dataField?: keyof T | string;
        allowSorting?: boolean;
    }>;
    gridOption?: Partial<DataGridProps<T>> & {
        editing?: unknown;
        filterRow?: unknown;
        headerFilter?: unknown;
    };
    showSelectionCheckbox?: boolean;
}
export declare const DxCompatibleDataGrid: <T extends Record<string, unknown>>(props: DxCompatibleDataGridProps<T> & RefAttributes<DataGridHandle<T>>) => ReactElement | null;
//# sourceMappingURL=DxCompatibleDataGrid.d.ts.map