import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { ColumnHeader } from './columns/ColumnHeader';
import {
  columnField,
  filterRows,
  getColumnValue,
  groupRows,
  nextSort,
  normalizeColumns,
  pageRows,
  resolveKey,
  searchRows,
  sortRows,
} from './core/GridEngine';
import { FilterRow } from './filtering/FilterRow';
import { SearchPanel } from './filtering/SearchPanel';
import { GroupPanel } from './grouping/GroupPanel';
import { GroupRow } from './grouping/GroupRow';
import { EditForm } from './editing/EditForm';
import { validateRow } from './editing/validation';
import { useGridData } from './hooks/useGridData';
import { useGridState } from './hooks/useGridState';
import { Pager } from './paging/Pager';
import { DataRow } from './rows/DataRow';
import { SummaryFooter } from './summary/SummaryFooter';
import type {
  DataGridHandle,
  DataGridProps,
  GridFocusedCell,
  GridFilterOperator,
  GridChange,
  GridKey,
  GridLoadOptions,
  GridSortDescriptor,
} from './types/grid.types';
import './DataGrid.css';

const DEFAULT_MESSAGES = {
  noData: 'No data',
  loading: 'Loading...',
  retry: 'Retry',
  page: 'Page',
  of: 'of',
  records: 'records',
  rowsPerPage: 'Rows per page',
  selectAll: 'Select all rows',
  groupPanel: 'Drag a column here to group',
  add: 'Add row', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', saveAll: 'Save all', cancelAll: 'Cancel all',
};

const sizeStyle = (value: number | string | undefined) => value === undefined ? undefined : value;

function DataGridInner<T extends Record<string, unknown>>(
  props: DataGridProps<T>,
  ref: ForwardedRef<DataGridHandle<T>>,
) {
  const {
    dataSource: explicitDataSource,
    rows,
    columns: columnDefinitions,
    keyExpr: requestedKeyExpr,
    selection: selectionConfig = {},
    sorting: sortingConfig = {},
    paging: pagingConfig = {},
    pager: pagerConfig = {},
    filterRow: filterRowConfig = {},
    headerFilter: headerFilterConfig = {},
    searchPanel: searchPanelConfig = {},
    grouping: groupingConfig = {},
    groupPanel: groupPanelConfig = {},
    summary: summaryConfig = {},
    editing: editingConfig = {},
    remoteOperations = false,
    plugins = [],
    locale = 'en',
  } = props;
  const dataSource = explicitDataSource ?? rows ?? [];
  const dataSourceKey = Array.isArray(dataSource) ? undefined : dataSource.key;
  const keyExpr = requestedKeyExpr ?? dataSourceKey ?? 'id';
  const pagingEnabled = pagingConfig.enabled !== false;
  const remote = typeof remoteOperations === 'boolean'
    ? { paging: remoteOperations, sorting: remoteOperations, filtering: remoteOperations, grouping: remoteOperations, summary: remoteOperations }
    : remoteOperations;
  const initialSort = useMemo<GridSortDescriptor[]>(() =>
    (columnDefinitions ?? [])
      .filter((column) => column.sortOrder)
      .sort((left, right) => (left.sortIndex ?? 0) - (right.sortIndex ?? 0))
      .map((column) => ({ field: columnField(column), direction: column.sortOrder! })),
  [columnDefinitions]);
  const state = useGridState({
    selectedRowKeys: props.selectedRowKeys,
    defaultSelectedRowKeys: props.defaultSelectedRowKeys,
    pageIndex: pagingConfig.pageIndex ?? 0,
    pageSize: pagingConfig.pageSize ?? 20,
    sort: initialSort,
    onSelectedRowKeysChange: props.onSelectedRowKeysChange,
  });
  const loadOptions = useMemo<GridLoadOptions>(() => ({
    skip: pagingEnabled && remote.paging ? state.pageIndex * state.pageSize : 0,
    take: pagingEnabled && remote.paging ? state.pageSize : Number.MAX_SAFE_INTEGER,
    sort: remote.sorting ? state.sort : [],
    filter: remote.filtering ? state.filters : undefined,
    search: remote.filtering ? state.search : undefined,
    group: remote.grouping ? state.groups : undefined,
    summary: remote.summary ? summaryConfig.totalItems as never : undefined,
  }), [pagingEnabled, remote.paging, remote.sorting, remote.filtering, remote.grouping, remote.summary, state.pageIndex, state.pageSize, state.sort, state.filters, state.search, state.groups, summaryConfig.totalItems]);
  const data = useGridData(dataSource, loadOptions, props.onDataError);
  const rootRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const newRowKeysRef = useRef<Set<GridKey>>(new Set());
  const lastSelectedIndexRef = useRef<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [localRows, setLocalRows] = useState<T[] | null>(null);
  const [changes, setChanges] = useState<GridChange<T>[]>([]);
  const [editingRowKey, setEditingRowKey] = useState<GridKey | null>(null);
  const [editingCell, setEditingCell] = useState<{ key: GridKey; field: string } | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<T>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<Error | null>(null);
  const editingMode = editingConfig.mode ?? 'row';
  const editingEnabled = editingConfig.allowAdding === true || editingConfig.allowUpdating === true || typeof editingConfig.allowUpdating === 'function' || editingConfig.allowDeleting === true || typeof editingConfig.allowDeleting === 'function';

  useEffect(() => { setLocalRows(null); setChanges([]); newRowKeysRef.current.clear(); }, [dataSource]);

  const baseColumns = useMemo(() => normalizeColumns(columnDefinitions, data.rows), [columnDefinitions, data.rows]);
  const pluginColumns = useMemo(() => plugins.reduce(
    (current, plugin) => plugin.transformColumns ? plugin.transformColumns(current) : current,
    baseColumns,
  ), [baseColumns, plugins]);
  const columns = useMemo(() => {
    if (!columnOrder.length) return pluginColumns;
    const positions = new Map(columnOrder.map((field, index) => [field, index]));
    return [...pluginColumns].sort((left, right) =>
      (positions.get(columnField(left)) ?? Number.MAX_SAFE_INTEGER) - (positions.get(columnField(right)) ?? Number.MAX_SAFE_INTEGER));
  }, [pluginColumns, columnOrder]);
  useEffect(() => {
    setColumnOrder((current) => {
      const fields = pluginColumns.map(columnField);
      const next = [...current.filter((field) => fields.includes(field)), ...fields.filter((field) => !current.includes(field))];
      return next.join('|') === current.join('|') ? current : next;
    });
  }, [pluginColumns]);
  const workingRows = localRows ?? data.rows;
  const pluginRows = useMemo(() => plugins.reduce(
    (current, plugin) => plugin.transformRows ? plugin.transformRows(current, { columns, rows: current }) : current,
    workingRows,
  ), [workingRows, columns, plugins]);
  const filteredRows = useMemo(() => remote.filtering
    ? pluginRows
    : searchRows(filterRows(pluginRows, columns, state.filters), columns, state.search),
  [pluginRows, columns, state.filters, state.search, remote.filtering]);
  const sortedRows = useMemo(
    () => remote.sorting ? filteredRows : sortRows(filteredRows, columns, state.sort),
    [filteredRows, columns, state.sort, remote.sorting],
  );
  const visibleRows = useMemo(
    () => pagingEnabled && !remote.paging ? pageRows(sortedRows, state.pageIndex, state.pageSize) : sortedRows,
    [pagingEnabled, remote.paging, sortedRows, state.pageIndex, state.pageSize],
  );
  const totalCount = remote.paging ? data.totalCount : sortedRows.length;
  const pageCount = pagingEnabled ? Math.max(1, Math.ceil(totalCount / state.pageSize)) : 1;
  const selectionMode = selectionConfig.mode ?? 'single';
  const showSelection = selectionMode !== 'none' && (selectionConfig.showCheckBoxes ?? selectionMode === 'multiple');
  const showRowNumber = props.rowNumber?.visible === true;
  const messages = { ...DEFAULT_MESSAGES, ...props.messages };
  const editingTexts = { ...messages, ...editingConfig.texts };

  const keysForRows = useCallback((items: T[]) => items.map((row) => resolveKey(row, keyExpr)), [keyExpr]);
  const selectedRowsData = useMemo(() => {
    const selected = new Set(state.selection);
    return data.rows.filter((row) => selected.has(resolveKey(row, keyExpr)));
  }, [data.rows, state.selection, keyExpr]);

  const updateSelection = useCallback((keys: GridKey[]) => {
    state.setSelection(keys);
    props.onSelectionChanged?.({ selectedRowKeys: keys, selectedRowsData: data.rows.filter((row) => keys.includes(resolveKey(row, keyExpr))) });
  }, [state.setSelection, props.onSelectionChanged, data.rows, keyExpr]);

  const publishRows = useCallback((next: T[]) => {
    setLocalRows(next);
  }, []);

  const publishChanges = useCallback((next: GridChange<T>[]) => {
    setChanges(next);
    props.onChangesChange?.(next);
  }, [props.onChangesChange]);

  const canUpdateRow = useCallback((row: T) => typeof editingConfig.allowUpdating === 'function'
    ? editingConfig.allowUpdating(row) : editingConfig.allowUpdating === true, [editingConfig.allowUpdating]);
  const canDeleteRow = useCallback((row: T) => typeof editingConfig.allowDeleting === 'function'
    ? editingConfig.allowDeleting(row) : editingConfig.allowDeleting === true, [editingConfig.allowDeleting]);

  const resetEdit = useCallback(() => {
    setEditingRowKey(null);
    setEditingCell(null);
    setEditDraft({});
    setValidationErrors({});
    setEditError(null);
  }, []);

  const startEditRow = useCallback((key: GridKey, field?: string) => {
    const row = workingRows.find((item) => resolveKey(item, keyExpr) === key);
    if (!row || !canUpdateRow(row)) return;
    setEditingRowKey(key);
    setEditingCell(field ? { key, field } : null);
    setEditDraft(field ? { [field]: getColumnValue(row, columns.find((column) => columnField(column) === field)!) } as Partial<T> : { ...row });
    setValidationErrors({});
    setEditError(null);
  }, [workingRows, keyExpr, canUpdateRow, columns]);

  const addRow = useCallback(() => {
    if (editingConfig.allowAdding !== true) return;
    const existingKeys = workingRows.map((row) => resolveKey(row, keyExpr));
    const key = editingConfig.newRowKey?.() ?? (existingKeys.every((item) => typeof item === 'number')
      ? Math.max(0, ...(existingKeys as number[])) + 1
      : `__new_${Date.now()}`);
    newRowKeysRef.current.add(key);
    const draft = columns.reduce<Record<string, unknown>>((item, column) => {
      const field = columnField(column);
      if (!field) return item;
      const value = typeof column.defaultValue === 'function' ? column.defaultValue() : column.defaultValue;
      if (value !== undefined) item[field] = value;
      return item;
    }, {});
    if (typeof keyExpr === 'string') draft[keyExpr] = key;
    const row = draft as T;
    publishRows(editingConfig.newRowPosition === 'first' ? [row, ...workingRows] : [...workingRows, row]);
    publishChanges([...changes, { type: 'insert', key, data: row }]);
    setEditingRowKey(key);
    setEditingCell(null);
    setEditDraft({ ...row });
    setValidationErrors({});
  }, [editingConfig.allowAdding, editingConfig.newRowPosition, editingConfig.newRowKey, columns, keyExpr, publishRows, workingRows, publishChanges, changes]);

  const applyDraftToRows = useCallback((key: GridKey, draft: Partial<T>) => workingRows.map((item) =>
    resolveKey(item, keyExpr) === key ? ({ ...item, ...draft } as T) : item), [workingRows, keyExpr]);

  const queueUpdate = useCallback((key: GridKey, draft: Partial<T>) => {
    const existing = changes.find((change) => change.key === key);
    const oldData = workingRows.find((item) => resolveKey(item, keyExpr) === key);
    const next = existing?.type === 'insert'
      ? changes.map((change) => change === existing ? { ...change, data: { ...change.data, ...draft } } : change)
      : existing?.type === 'update'
        ? changes.map((change) => change === existing ? { ...change, data: { ...change.data, ...draft } } : change)
        : [...changes, { type: 'update' as const, key, data: draft, oldData }];
    publishChanges(next);
    publishRows(applyDraftToRows(key, draft));
  }, [changes, workingRows, keyExpr, publishChanges, publishRows, applyDraftToRows]);

  const persistChanges = useCallback(async (pending: GridChange<T>[], committedRows?: T[]): Promise<boolean> => {
    if (!pending.length) return true;
    setSaving(true);
    setEditError(null);
    try {
      for (const change of pending) {
        if (change.type === 'remove') continue;
        const candidate = change.type === 'insert' ? change.data as T : ({ ...change.oldData, ...change.data } as T);
        const errors = await validateRow(candidate, columns);
        if (Object.keys(errors).length) {
          setValidationErrors(errors);
          props.onValidationError?.(errors);
          return false;
        }
      }
      await props.onSaving?.(pending);
      for (const change of pending) {
        const event = { key: change.key, data: change.data, oldData: change.oldData, cancel: false };
        if (change.type === 'insert') {
          await props.onRowInserting?.(event);
          if (event.cancel) continue;
          if (!Array.isArray(dataSource)) {
            if (!dataSource.insert) throw new Error('Insert is not supported by this data source.');
            const values = { ...change.data } as Record<string, unknown>;
            if (typeof keyExpr === 'string' && change.key !== undefined && newRowKeysRef.current.has(change.key)) delete values[keyExpr];
            await dataSource.insert(values as Partial<T>);
          }
          props.onRowInserted?.(event);
          if (change.key !== undefined) newRowKeysRef.current.delete(change.key);
        } else if (change.type === 'update') {
          await props.onRowUpdating?.(event);
          if (event.cancel) continue;
          if (!Array.isArray(dataSource) && change.key !== undefined) {
            if (!dataSource.update) throw new Error('Update is not supported by this data source.');
            await dataSource.update(change.key, change.data);
          }
          props.onRowUpdated?.(event);
        } else if (change.type === 'remove') {
          await props.onRowRemoving?.(event);
          if (event.cancel) continue;
          if (!Array.isArray(dataSource) && change.key !== undefined) {
            if (!dataSource.remove) throw new Error('Remove is not supported by this data source.');
            await dataSource.remove(change.key);
          }
          props.onRowRemoved?.(event);
        }
      }
      props.onSaved?.(pending);
      publishChanges([]);
      setValidationErrors({});
      resetEdit();
      if (Array.isArray(dataSource)) props.onRowsChange?.(committedRows ?? localRows ?? workingRows);
      else { setLocalRows(null); await data.reload(); }
      return true;
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const serverErrors = (reason as { errors?: Record<string, string[] | string> })?.errors;
      if (serverErrors) {
        const mapped = Object.fromEntries(Object.entries(serverErrors).map(([field, value]) => [field, Array.isArray(value) ? value.join(', ') : value]));
        setValidationErrors(mapped);
        props.onValidationError?.(mapped);
      }
      setEditError(error);
      props.onDataError?.(error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [columns, props.onValidationError, props.onSaving, props.onRowInserting, props.onRowInserted, props.onRowUpdating, props.onRowUpdated, props.onRowRemoving, props.onRowRemoved, props.onSaved, props.onRowsChange, props.onDataError, dataSource, keyExpr, publishChanges, resetEdit, localRows, workingRows, data.reload]);

  const saveCurrentRow = useCallback(async () => {
    if (editingRowKey === null) return false;
    const oldData = workingRows.find((row) => resolveKey(row, keyExpr) === editingRowKey);
    if (!oldData) return false;
    const row = { ...oldData, ...editDraft } as T;
    const nextRows = workingRows.map((item) => resolveKey(item, keyExpr) === editingRowKey ? row : item);
    setLocalRows(nextRows);
    const existing = changes.find((change) => change.key === editingRowKey && change.type === 'insert');
    const change: GridChange<T> = existing
      ? { ...existing, data: row }
      : { type: 'update', key: editingRowKey, data: editDraft, oldData };
    return persistChanges([change], nextRows);
  }, [editingRowKey, workingRows, keyExpr, editDraft, changes, persistChanges]);

  const commitCell = useCallback(async () => {
    if (!editingCell) return;
    const oldData = workingRows.find((row) => resolveKey(row, keyExpr) === editingCell.key);
    if (!oldData) return;
    const column = columns.find((item) => columnField(item) === editingCell.field);
    const nextRow = { ...oldData, ...editDraft } as T;
    if (column) {
      const errors = await validateRow(nextRow, [column]);
      if (Object.keys(errors).length) { setValidationErrors(errors); props.onValidationError?.(errors); return; }
    }
    const nextRows = applyDraftToRows(editingCell.key, editDraft);
    setLocalRows(nextRows);
    if (editingMode === 'batch') {
      queueUpdate(editingCell.key, editDraft);
      setEditingCell(null); setEditingRowKey(null); setEditDraft({}); setValidationErrors({});
    } else {
      await persistChanges([{ type: 'update', key: editingCell.key, data: editDraft, oldData }], nextRows);
    }
  }, [editingCell, workingRows, keyExpr, columns, editDraft, applyDraftToRows, editingMode, queueUpdate, persistChanges, props.onValidationError]);

  const cancelChanges = useCallback(() => {
    setLocalRows(null);
    newRowKeysRef.current.clear();
    publishChanges([]);
    resetEdit();
    props.onEditCanceled?.();
  }, [publishChanges, resetEdit, props.onEditCanceled]);

  const deleteRow = useCallback(async (key: GridKey) => {
    const row = workingRows.find((item) => resolveKey(item, keyExpr) === key);
    if (!row || !canDeleteRow(row)) return;
    if (editingConfig.confirmDelete !== false && typeof window !== 'undefined' && !window.confirm('Delete this row?')) return;
    const nextRows = workingRows.filter((item) => resolveKey(item, keyExpr) !== key);
    setLocalRows(nextRows);
    const inserted = changes.find((change) => change.key === key && change.type === 'insert');
    const nextChanges = inserted ? changes.filter((change) => change !== inserted) : [...changes, { type: 'remove' as const, key, data: {}, oldData: row }];
    if (editingMode === 'batch') publishChanges(nextChanges);
    else await persistChanges(inserted ? [] : [{ type: 'remove', key, data: {}, oldData: row }], nextRows);
  }, [workingRows, keyExpr, canDeleteRow, editingConfig.confirmDelete, editingMode, changes, publishChanges, persistChanges]);

  const selectRow = useCallback((rowIndex: number, event: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
    if (selectionMode === 'none') return;
    const key = resolveKey(visibleRows[rowIndex], keyExpr);
    if (selectionMode === 'single') {
      updateSelection(state.selection.includes(key) ? [] : [key]);
    } else if (event.shiftKey && lastSelectedIndexRef.current !== null) {
      const start = Math.min(lastSelectedIndexRef.current, rowIndex);
      const end = Math.max(lastSelectedIndexRef.current, rowIndex);
      updateSelection([...new Set([...state.selection, ...keysForRows(visibleRows.slice(start, end + 1))])]);
    } else if (event.ctrlKey || event.metaKey) {
      updateSelection(state.selection.includes(key)
        ? state.selection.filter((item) => item !== key)
        : [...state.selection, key]);
    } else {
      updateSelection([key]);
    }
    lastSelectedIndexRef.current = rowIndex;
  }, [selectionMode, visibleRows, keyExpr, updateSelection, state.selection, keysForRows]);

  const setPageIndex = useCallback((value: number) => {
    const next = Math.min(Math.max(0, value), pageCount - 1);
    state.setPageIndex(next);
    props.onPageIndexChange?.(next);
  }, [pageCount, state.setPageIndex, props.onPageIndexChange]);

  const setPageSize = useCallback((value: number) => {
    const next = Math.max(1, value);
    state.setPageSize(next);
    state.setPageIndex(0);
    props.onPageSizeChange?.(next);
  }, [state.setPageSize, state.setPageIndex, props.onPageSizeChange]);

  useEffect(() => {
    if (state.pageIndex >= pageCount) setPageIndex(pageCount - 1);
  }, [pageCount, state.pageIndex, setPageIndex]);

  const applySort = useCallback((field: string, shiftKey: boolean) => {
    if (sortingConfig.mode === 'none') return;
    const multiple = sortingConfig.mode === 'multiple' && shiftKey;
    const next = nextSort(state.sort, field, multiple);
    state.setSort(next);
    state.setPageIndex(0);
    props.onSortingChanged?.(next);
  }, [sortingConfig.mode, state.sort, state.setSort, state.setPageIndex, props.onSortingChanged]);

  const applyFilters = useCallback((filters: typeof state.filters) => {
    state.setFilters(filters);
    state.setPageIndex(0);
    props.onFilterChanged?.(filters);
  }, [state.setFilters, state.setPageIndex, props.onFilterChanged]);

  const updateFilter = useCallback((field: string, operator: GridFilterOperator, value: unknown) => {
    const remaining = state.filters.filter((item) => item.field !== field || item.operator === 'in');
    const empty = value === '' || value === undefined || Array.isArray(value) && value.every((item) => item === '' || item === undefined);
    applyFilters(empty ? remaining : [...remaining, { field, operator, value }]);
  }, [state.filters, applyFilters]);

  const updateHeaderFilter = useCallback((field: string, values: unknown[]) => {
    const remaining = state.filters.filter((item) => item.field !== field || item.operator !== 'in');
    applyFilters(values.length ? [...remaining, { field, operator: 'in', value: values }] : remaining);
  }, [state.filters, applyFilters]);

  const updateSearch = useCallback((value: string) => {
    state.setSearch(value);
    state.setPageIndex(0);
    props.onSearchValueChanged?.(value);
  }, [state.setSearch, state.setPageIndex, props.onSearchValueChanged]);

  const updateGroups = useCallback((groups: typeof state.groups) => {
    state.setGroups(groups);
    state.setPageIndex(0);
    setCollapsedGroups(groupingConfig.autoExpandAll === false
      ? new Set(groupRows(visibleRows, columns, groups).map((node) => node.id))
      : new Set());
    props.onGroupingChanged?.(groups);
  }, [state.setGroups, state.setPageIndex, props.onGroupingChanged, groupingConfig.autoExpandAll, visibleRows, columns]);

  const reorderColumn = useCallback((targetField: string) => {
    if (!draggedColumn || draggedColumn === targetField) return;
    const fromIndex = columns.findIndex((column) => columnField(column) === draggedColumn);
    const toIndex = columns.findIndex((column) => columnField(column) === targetField);
    if (fromIndex < 0 || toIndex < 0 || columns[fromIndex].allowReordering === false || columns[toIndex].allowReordering === false) return;
    const next = [...columns];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setColumnOrder(next.map(columnField));
    const event = { column: moved, fromIndex, toIndex, columns: next };
    props.onColumnReorder?.(event);
    props.onColumnOrderChanged?.(next);
    setDraggedColumn(null);
    setDropColumn(null);
  }, [draggedColumn, columns, props.onColumnReorder, props.onColumnOrderChanged]);

  const autoFitColumn = useCallback((field: string) => {
    const column = columns.find((item) => columnField(item) === field);
    if (!column) return;
    const values = visibleRows.slice(0, 100).map((row) => String(getColumnValue(row, column) ?? ''));
    const characterCount = Math.max(String(column.caption ?? field).length, ...values.map((value) => value.length));
    const width = Math.min(column.maxWidth ?? 520, Math.max(column.minWidth ?? 64, characterCount * 8 + 32));
    setColumnWidths((current) => ({ ...current, [field]: width }));
  }, [columns, visibleRows]);

  const navigateToCell = useCallback((rowKey: GridKey, field: string) => {
    const rowIndex = visibleRows.findIndex((row) => resolveKey(row, keyExpr) === rowKey);
    const columnIndex = columns.findIndex((column) => columnField(column) === field);
    if (rowIndex < 0 || columnIndex < 0) return;
    const next = { rowIndex, columnIndex, rowKey, field };
    state.setFocusedCell(next);
    requestAnimationFrame(() => rootRef.current
      ?.querySelector<HTMLElement>(`[data-grid-row="${rowIndex}"][data-grid-column="${columnIndex}"]`)
      ?.focus());
  }, [visibleRows, columns, keyExpr, state.setFocusedCell]);

  const cancelCurrentEdit = useCallback(() => {
    if (editingRowKey !== null && newRowKeysRef.current.has(editingRowKey)) {
      setLocalRows(workingRows.filter((row) => resolveKey(row, keyExpr) !== editingRowKey));
      publishChanges(changes.filter((change) => change.key !== editingRowKey));
      newRowKeysRef.current.delete(editingRowKey);
    }
    resetEdit();
    props.onEditCanceled?.();
  }, [editingRowKey, workingRows, keyExpr, publishChanges, changes, resetEdit, props.onEditCanceled]);

  const handle: DataGridHandle<T> = {
    refresh: data.reload,
    reload: data.reload,
    repaint: () => rootRef.current?.getBoundingClientRect(),
    selectRows: (keys, preserve = false) => updateSelection(preserve ? [...new Set([...state.selection, ...keys])] : keys),
    deselectRows: (keys) => updateSelection(state.selection.filter((key) => !keys.includes(key))),
    selectAll: () => updateSelection(keysForRows(selectionConfig.selectAllMode === 'page' ? visibleRows : data.rows)),
    deselectAll: () => updateSelection([]),
    getSelectedRowKeys: () => state.selection,
    getSelectedRowsData: () => selectedRowsData,
    getVisibleRows: () => visibleRows,
    getVisibleColumns: () => columns,
    getRowIndexByKey: (key) => visibleRows.findIndex((row) => resolveKey(row, keyExpr) === key),
    getKeyByRowIndex: (index) => visibleRows[index] ? resolveKey(visibleRows[index], keyExpr) : undefined,
    pageIndex: (value) => { if (value !== undefined) setPageIndex(value); return value ?? state.pageIndex; },
    pageSize: (value) => { if (value !== undefined) setPageSize(value); return value ?? state.pageSize; },
    pageCount: () => pageCount,
    totalCount: () => totalCount,
    sort: (value) => { if (value) { state.setSort(value); props.onSortingChanged?.(value); } return value ?? state.sort; },
    search: (value) => { if (value !== undefined) updateSearch(value); return value ?? state.search; },
    filter: (value) => { if (value) applyFilters(value); return value ?? state.filters; },
    clearFilter: () => { applyFilters([]); updateSearch(''); },
    group: (value) => { if (value) updateGroups(value); return value ?? state.groups; },
    expandAllGroups: () => setCollapsedGroups(new Set()),
    collapseAllGroups: () => {
      const nodes = groupRows(visibleRows, columns, state.groups);
      const ids: string[] = [];
      const collect = (items: typeof nodes) => items.forEach((item) => { ids.push(item.id); collect(item.children); });
      collect(nodes);
      setCollapsedGroups(new Set(ids));
    },
    addRow,
    editRow: (key) => startEditRow(key),
    editCell: (key, field) => startEditRow(key, field),
    deleteRow,
    getChanges: () => changes,
    saveChanges: () => persistChanges(changes, workingRows),
    cancelChanges,
    autoFitColumn,
    autoFitColumns: () => columns.forEach((column) => autoFitColumn(columnField(column))),
    navigateToCell,
    focus: () => rootRef.current?.focus(),
    getDataSource: () => dataSource,
  };
  useImperativeHandle(ref, () => handle);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    props.onInitialized?.(handle);
  }, [props.onInitialized]);

  useEffect(() => {
    if (!data.loading) props.onContentReady?.(handle);
  }, [data.loading, visibleRows]);

  const focusCell = useCallback((cell: GridFocusedCell) => {
    state.setFocusedCell(cell);
    props.onFocusedCellChanged?.(cell);
    const row = visibleRows[cell.rowIndex];
    if (row) props.onFocusedRowChanged?.({ data: row, key: resolveKey(row, keyExpr), rowIndex: cell.rowIndex });
  }, [state.setFocusedCell, props.onFocusedCellChanged, props.onFocusedRowChanged, visibleRows, keyExpr]);

  const columnOffset = Number(showSelection) + Number(showRowNumber);
  const commandOffset = Number(editingEnabled);
  const bodyColSpan = columns.length + columnOffset + commandOffset;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (props.disabled || !columns.length || !visibleRows.length) return;
    if ((event.target as HTMLElement).matches('input, select, textarea, button')) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && selectionMode === 'multiple') {
      event.preventDefault();
      handle.selectAll();
      return;
    }
    const current = state.focusedCell ?? { rowIndex: 0, columnIndex: 0 };
    let rowIndex = current.rowIndex;
    let columnIndex = current.columnIndex;
    if (event.key === 'ArrowDown') rowIndex++;
    else if (event.key === 'ArrowUp') rowIndex--;
    else if (event.key === 'ArrowRight' || event.key === 'Tab' && !event.shiftKey) columnIndex++;
    else if (event.key === 'ArrowLeft' || event.key === 'Tab' && event.shiftKey) columnIndex--;
    else if (event.key === 'Home') columnIndex = 0;
    else if (event.key === 'End') columnIndex = columns.length - 1;
    else if (event.key === 'PageDown') rowIndex += Math.max(1, Math.floor(visibleRows.length / 2));
    else if (event.key === 'PageUp') rowIndex -= Math.max(1, Math.floor(visibleRows.length / 2));
    else if (event.key === ' ' && selectionMode !== 'none') {
      event.preventDefault();
      selectRow(rowIndex, event);
      return;
    } else return;
    event.preventDefault();
    rowIndex = Math.max(0, Math.min(visibleRows.length - 1, rowIndex));
    columnIndex = Math.max(0, Math.min(columns.length - 1, columnIndex));
    const rowKey = resolveKey(visibleRows[rowIndex], keyExpr);
    const field = columnField(columns[columnIndex]);
    focusCell({ rowIndex, columnIndex, rowKey, field });
    requestAnimationFrame(() => rootRef.current
      ?.querySelector<HTMLElement>(`[data-grid-row="${rowIndex}"][data-grid-column="${columnIndex}"]`)
      ?.focus());
  };

  const renderDataRow = (row: T, rowIndex: number): ReactNode => {
    const rowKey = resolveKey(row, keyExpr);
    const rowEditing = editingRowKey === rowKey;
    const isNewRow = newRowKeysRef.current.has(rowKey);
    const renderedRow = rowEditing ? ({ ...row, ...editDraft } as T) : row;
    const editableFields = new Set(columns.filter((column) => column.allowEditing !== false).map(columnField));
    const activeFields = new Set<string>();
    if (rowEditing && (editingMode === 'row' || isNewRow)) editableFields.forEach((field) => activeFields.add(field));
    if (editingCell?.key === rowKey) activeFields.add(editingCell.field);
    const rowChange = changes.find((change) => change.key === rowKey);
    const changedFields = new Set(Object.keys(rowChange?.data ?? {}));
    const absoluteRowIndex = remote.paging
      ? state.pageIndex * state.pageSize + rowIndex
      : pagingEnabled ? state.pageIndex * state.pageSize + rowIndex : rowIndex;
    return (
      <DataRow
        key={rowKey}
        row={renderedRow}
        rowKey={rowKey}
        rowIndex={rowIndex}
        absoluteRowIndex={absoluteRowIndex}
        columns={columns}
        locale={locale}
        selected={state.selection.includes(rowKey)}
        focusedCell={state.focusedCell}
        showSelection={showSelection}
        showRowNumber={showRowNumber}
        searchText={state.search}
        highlightSearchText={searchPanelConfig.highlightSearchText === true}
        editingFields={activeFields}
        changedFields={changedFields}
        errors={rowEditing ? validationErrors : {}}
        saving={saving}
        showCommands={editingEnabled}
        canEdit={canUpdateRow(row) && editingMode !== 'cell' && editingMode !== 'batch'}
        canDelete={canDeleteRow(row)}
        rowEditing={rowEditing && (editingMode === 'row' || isNewRow && editingMode !== 'batch')}
        onValueChange={(field, value) => {
          const nextDraft = { ...editDraft, [field]: value } as Partial<T>;
          setEditDraft(nextDraft);
          if (editingMode === 'batch' && isNewRow) {
            publishRows(applyDraftToRows(rowKey, nextDraft));
            publishChanges(changes.map((change) => change.key === rowKey && change.type === 'insert' ? { ...change, data: nextDraft } : change));
          }
        }}
        onCommitCell={() => void commitCell()}
        onCancelCell={cancelCurrentEdit}
        onEdit={() => startEditRow(rowKey)}
        onSave={() => void saveCurrentRow()}
        onCancel={cancelCurrentEdit}
        onDelete={() => void deleteRow(rowKey)}
        commandTexts={{ edit: editingTexts.edit, delete: editingTexts.delete, save: editingTexts.save, cancel: editingTexts.cancel }}
        onSelect={() => selectRow(rowIndex, {})}
        onRowClick={(event) => {
          selectRow(rowIndex, event);
          props.onRowClick?.({ data: row, key: rowKey, rowIndex, event });
        }}
        onRowDoubleClick={(event) => props.onRowDoubleClick?.({ data: row, key: rowKey, rowIndex, event })}
        onCellClick={(columnIndex, event) => {
          const column = columns[columnIndex];
          focusCell({ rowIndex, columnIndex, rowKey, field: columnField(column) });
          props.onCellClick?.({ data: row, key: rowKey, rowIndex, column, columnIndex, value: getColumnValue(row, column), event });
          if ((editingMode === 'cell' || editingMode === 'batch') && editingConfig.startEditAction !== 'doubleClick' && column.allowEditing !== false) startEditRow(rowKey, columnField(column));
        }}
        onCellDoubleClick={(columnIndex, event) => {
          const column = columns[columnIndex];
          props.onCellDoubleClick?.({ data: row, key: rowKey, rowIndex, column, columnIndex, value: getColumnValue(row, column), event });
          if ((editingMode === 'cell' || editingMode === 'batch') && column.allowEditing !== false) startEditRow(rowKey, columnField(column));
        }}
        onCellFocus={(columnIndex) => focusCell({ rowIndex, columnIndex, rowKey, field: columnField(columns[columnIndex]) })}
      />
    );
  };

  const groupedNodes = groupRows(visibleRows, columns, state.groups);
  const renderGroupNodes = (nodes: typeof groupedNodes): ReactNode[] => nodes.flatMap((node) => {
    const expanded = !collapsedGroups.has(node.id);
    const groupColumn = columns.find((column) => columnField(column) === node.field);
    const output: ReactNode[] = [
      <GroupRow
        key={`group-${node.id}`}
        node={node}
        column={groupColumn}
        colSpan={bodyColSpan}
        expanded={expanded}
        collapsible={groupingConfig.allowCollapsing !== false}
        summaries={summaryConfig.groupItems ?? []}
        onToggle={() => setCollapsedGroups((current) => {
          const next = new Set(current);
          if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
          return next;
        })}
      />,
    ];
    if (!expanded) return output;
    if (node.children.length) output.push(...renderGroupNodes(node.children));
    else output.push(...node.rows.map((row) => renderDataRow(row, visibleRows.indexOf(row))));
    return output;
  });

  if (props.visible === false) return null;

  return (
    <div
      ref={rootRef}
      role="grid"
      aria-rowcount={totalCount}
      aria-colcount={bodyColSpan}
      aria-disabled={props.disabled}
      tabIndex={props.disabled ? -1 : 0}
      className={[
        'tmiv-grid',
        props.showBorders !== false && 'tmiv-grid--borders',
        props.showRowLines !== false && 'tmiv-grid--row-lines',
        props.showColumnLines !== false && 'tmiv-grid--column-lines',
        props.rowAlternationEnabled && 'tmiv-grid--alternating',
        props.hoverStateEnabled !== false && 'tmiv-grid--hover',
        props.disabled && 'tmiv-grid--disabled',
        props.className,
      ].filter(Boolean).join(' ')}
      style={{ width: sizeStyle(props.width), height: sizeStyle(props.height), minHeight: sizeStyle(props.minHeight), ...props.style }}
      onKeyDown={handleKeyDown}
    >
      {(searchPanelConfig.visible || groupPanelConfig.visible || editingEnabled) && (
        <div className="tmiv-grid__toolbar">
          {editingEnabled && <div className="tmiv-grid__editing-toolbar">
            {editingConfig.allowAdding === true && <button type="button" disabled={saving || editingRowKey !== null} onClick={addRow}>＋ {editingTexts.add}</button>}
            {editingMode === 'batch' && <><button type="button" disabled={saving || !changes.length} onClick={() => void persistChanges(changes, workingRows)}>{editingTexts.saveAll}</button><button type="button" disabled={saving || !changes.length} onClick={cancelChanges}>{editingTexts.cancelAll}</button></>}
            {editError && <span role="alert" className="tmiv-grid__edit-error">{editError.message}</span>}
          </div>}
          {groupPanelConfig.visible && (
            <GroupPanel
              columns={columns}
              groups={state.groups}
              emptyText={groupPanelConfig.emptyText ?? messages.groupPanel}
              allowDragging={groupPanelConfig.allowColumnDragging !== false}
              onChange={updateGroups}
            />
          )}
          {searchPanelConfig.visible && <SearchPanel config={searchPanelConfig} value={state.search} onChange={updateSearch} />}
        </div>
      )}
      {(editingMode === 'form' || editingMode === 'popup') && editingRowKey !== null && (
        <EditForm
          row={editDraft as T}
          columns={columns}
          errors={validationErrors}
          colCount={editingConfig.form?.colCount ?? 2}
          title={editingMode === 'popup' ? editingConfig.popup?.title ?? 'Edit row' : undefined}
          saving={saving}
          popup={editingMode === 'popup'}
          width={editingConfig.popup?.width}
          onChange={(field, value) => setEditDraft((current) => ({ ...current, [field]: value }))}
          onSave={() => void saveCurrentRow()}
          onCancel={cancelCurrentEdit}
        />
      )}
      <div className="tmiv-grid__viewport">
        <table className={`tmiv-grid__table ${props.columnAutoWidth ? 'tmiv-grid__table--auto' : ''}`}>
          <colgroup>
            {showSelection && <col style={{ width: 44 }} />}
            {showRowNumber && <col style={{ width: 60 }} />}
            {columns.map((column, index) => {
              const field = columnField(column);
              return <col key={field || index} style={{ width: columnWidths[field] ?? column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }} />;
            })}
            {editingEnabled && <col style={{ width: 150 }} />}
          </colgroup>
          <thead className="tmiv-grid__head">
            <tr role="row">
              {showSelection && (
                <th role="columnheader" className="tmiv-grid__header-cell tmiv-grid__header-cell--selection">
                  <input
                    type="checkbox"
                    aria-label={messages.selectAll}
                    checked={visibleRows.length > 0 && keysForRows(visibleRows).every((key) => state.selection.includes(key))}
                    onChange={() => {
                      const pageKeys = keysForRows(visibleRows);
                      const allSelected = pageKeys.every((key) => state.selection.includes(key));
                      updateSelection(allSelected
                        ? state.selection.filter((key) => !pageKeys.includes(key))
                        : [...new Set([...state.selection, ...pageKeys])]);
                    }}
                  />
                </th>
              )}
              {showRowNumber && <th role="columnheader" className="tmiv-grid__header-cell tmiv-grid__header-cell--row-number">#</th>}
              {columns.map((column, columnIndex) => (
                <ColumnHeader
                  key={columnField(column) || columnIndex}
                  column={{ ...column, width: columnWidths[columnField(column)] ?? column.width }}
                  columnIndex={columnIndex + columnOffset}
                  sort={state.sort}
                  onSort={applySort}
                  rows={data.rows}
                  headerFilterVisible={headerFilterConfig.visible === true}
                  headerFilterSearchable={headerFilterConfig.searchable !== false}
                  headerFilterValues={(state.filters.find((item) => item.field === columnField(column) && item.operator === 'in')?.value as unknown[]) ?? []}
                  reorderable={props.allowColumnReordering === true && column.allowReordering !== false}
                  dragEnabled={(props.allowColumnReordering === true && column.allowReordering !== false)
                    || (groupPanelConfig.visible === true && groupPanelConfig.allowColumnDragging !== false && column.allowGrouping !== false)}
                  dragging={draggedColumn === columnField(column)}
                  dropTarget={dropColumn === columnField(column)}
                  onHeaderFilterChange={(values) => updateHeaderFilter(columnField(column), values)}
                  onDragStart={() => setDraggedColumn(columnField(column))}
                  onDragEnd={() => { setDraggedColumn(null); setDropColumn(null); }}
                  onDragOver={() => setDropColumn(columnField(column))}
                  onDrop={() => reorderColumn(columnField(column))}
                />
              ))}
              {editingEnabled && <th role="columnheader" className="tmiv-grid__header-cell tmiv-grid__header-cell--commands">Actions</th>}
            </tr>
            {filterRowConfig.visible && (
              <FilterRow columns={columns} filters={state.filters.filter((item) => item.operator !== 'in')} columnOffset={columnOffset} commandOffset={commandOffset} onChange={updateFilter} />
            )}
          </thead>
          <tbody className="tmiv-grid__body">
            {data.loading && (
              <tr role="row"><td role="gridcell" colSpan={bodyColSpan} className="tmiv-grid__state">
                {props.loadingRender?.() ?? messages.loading}
              </td></tr>
            )}
            {!data.loading && data.error && (
              <tr role="row"><td role="gridcell" colSpan={bodyColSpan} className="tmiv-grid__state tmiv-grid__state--error">
                {props.errorRender?.(data.error, data.reload) ?? <><span>{data.error.message}</span><button type="button" onClick={() => void data.reload()}>{messages.retry}</button></>}
              </td></tr>
            )}
            {!data.loading && !data.error && visibleRows.length === 0 && (
              <tr role="row"><td role="gridcell" colSpan={bodyColSpan} className="tmiv-grid__state">
                {props.noDataRender?.() ?? messages.noData}
              </td></tr>
            )}
            {!data.loading && !data.error && (state.groups.length ? renderGroupNodes(groupedNodes) : visibleRows.map(renderDataRow))}
          </tbody>
          {!!summaryConfig.totalItems?.length && <SummaryFooter rows={sortedRows} columns={columns} items={summaryConfig.totalItems} columnOffset={columnOffset} commandOffset={commandOffset} locale={locale} />}
        </table>
      </div>
      {pagingEnabled && pagerConfig.visible !== false && (
        <Pager
          pageIndex={state.pageIndex}
          pageSize={state.pageSize}
          pageCount={pageCount}
          totalCount={totalCount}
          allowedPageSizes={pagerConfig.allowedPageSizes ?? [10, 20, 50, 100]}
          showPageSizeSelector={pagerConfig.showPageSizeSelector !== false}
          showNavigationButtons={pagerConfig.showNavigationButtons !== false}
          showInfo={pagerConfig.showInfo !== false}
          messages={messages}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

export const DataGrid = forwardRef(DataGridInner) as <T extends Record<string, unknown>>(
  props: DataGridProps<T> & RefAttributes<DataGridHandle<T>>,
) => ReactElement | null;
