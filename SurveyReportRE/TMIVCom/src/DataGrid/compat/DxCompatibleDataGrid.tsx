import { forwardRef, type ForwardedRef, type ReactElement, type RefAttributes } from 'react';
import { DataGrid } from '../DataGrid';
import type { DataGridHandle, DataGridProps, GridColumn } from '../types/grid.types';

export interface DxCompatibleDataGridProps<T extends Record<string, unknown>> extends Omit<DataGridProps<T>, 'columns' | 'dataSource'> {
  dataSource?: DataGridProps<T>['dataSource'];
  rows?: T[];
  columns?: Array<GridColumn<T> & { dataField?: keyof T | string; allowSorting?: boolean }>;
  gridOption?: Partial<DataGridProps<T>> & { editing?: unknown; filterRow?: unknown; headerFilter?: unknown };
  showSelectionCheckbox?: boolean;
}

function DxCompatibleDataGridInner<T extends Record<string, unknown>>(
  props: DxCompatibleDataGridProps<T>,
  ref: ForwardedRef<DataGridHandle<T>>,
) {
  const { gridOption = {}, showSelectionCheckbox, ...directProps } = props;
  const columns = (props.columns ?? []).map((column) => ({
    ...column,
    field: column.field ?? column.dataField,
    allowSorting: column.allowSorting !== false,
  }));
  const selection = {
    ...(gridOption.selection ?? {}),
    ...(props.selection ?? {}),
    showCheckBoxes: showSelectionCheckbox ?? props.selection?.showCheckBoxes ?? gridOption.selection?.showCheckBoxes,
  };

  return (
    <DataGrid
      {...gridOption}
      {...directProps}
      ref={ref}
      dataSource={props.dataSource ?? props.rows ?? []}
      columns={columns}
      selection={selection}
      sorting={props.sorting ?? gridOption.sorting ?? { mode: 'multiple' }}
      paging={props.paging ?? gridOption.paging}
      pager={props.pager ?? gridOption.pager}
    />
  );
}

export const DxCompatibleDataGrid = forwardRef(DxCompatibleDataGridInner) as <T extends Record<string, unknown>>(
  props: DxCompatibleDataGridProps<T> & RefAttributes<DataGridHandle<T>>,
) => ReactElement | null;
