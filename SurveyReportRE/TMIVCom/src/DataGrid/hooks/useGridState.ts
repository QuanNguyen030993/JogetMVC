import { useCallback, useState } from 'react';
import type { GridFilterDescriptor, GridFocusedCell, GridGroupDescriptor, GridKey, GridSortDescriptor } from '../types/grid.types';

interface GridStateOptions {
  selectedRowKeys?: GridKey[];
  defaultSelectedRowKeys?: GridKey[];
  pageIndex: number;
  pageSize: number;
  sort: GridSortDescriptor[];
  onSelectedRowKeysChange?: (keys: GridKey[]) => void;
}

export const useGridState = (options: GridStateOptions) => {
  const { selectedRowKeys, defaultSelectedRowKeys, onSelectedRowKeysChange } = options;
  const [internalSelection, setInternalSelection] = useState<GridKey[]>(defaultSelectedRowKeys ?? []);
  const [pageIndex, setPageIndex] = useState(options.pageIndex);
  const [pageSize, setPageSize] = useState(options.pageSize);
  const [sort, setSort] = useState(options.sort);
  const [filters, setFilters] = useState<GridFilterDescriptor[]>([]);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<GridGroupDescriptor[]>([]);
  const [focusedCell, setFocusedCell] = useState<GridFocusedCell | null>(null);
  const selection = selectedRowKeys ?? internalSelection;

  const setSelection = useCallback((next: GridKey[] | ((current: GridKey[]) => GridKey[])) => {
    const value = typeof next === 'function' ? next(selection) : next;
    if (selectedRowKeys === undefined) setInternalSelection(value);
    onSelectedRowKeysChange?.(value);
  }, [selection, selectedRowKeys, onSelectedRowKeysChange]);

  return {
    selection,
    setSelection,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    sort,
    setSort,
    filters,
    setFilters,
    search,
    setSearch,
    groups,
    setGroups,
    focusedCell,
    setFocusedCell,
  };
};
