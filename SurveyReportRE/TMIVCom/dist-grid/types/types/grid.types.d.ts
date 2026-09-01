import type { CSSProperties, ReactNode } from 'react';
export type GridKey = string | number;
export type GridDataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'object';
export type SortDirection = 'asc' | 'desc';
export interface GridSortDescriptor {
    field: string;
    direction: SortDirection;
}
export type GridFilterOperator = 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' | '>' | '>=' | '<' | '<=' | 'between' | 'in';
export interface GridFilterDescriptor {
    field: string;
    operator: GridFilterOperator;
    value: unknown;
}
export interface GridGroupDescriptor {
    field: string;
    direction?: SortDirection;
}
export type GridSummaryType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'custom';
export interface GridSummaryItem<T> {
    field?: keyof T | string;
    type: GridSummaryType;
    name?: string;
    displayFormat?: string;
    valueFormat?: string | ((value: unknown) => string);
    calculate?: (rows: T[]) => unknown;
}
export interface GridLoadOptions {
    skip: number;
    take: number;
    sort: GridSortDescriptor[];
    filter?: GridFilterDescriptor[];
    search?: string;
    group?: GridGroupDescriptor[];
    summary?: GridSummaryItem<unknown>[];
}
export interface GridLoadResult<T> {
    data: T[];
    totalCount: number;
}
export interface GridDataSource<T> {
    key?: keyof T | string;
    load(options: GridLoadOptions): Promise<GridLoadResult<T> | T[]>;
    byKey?(key: GridKey): Promise<T | undefined>;
    insert?(values: Partial<T>): Promise<T>;
    update?(key: GridKey, values: Partial<T>): Promise<T | void>;
    remove?(key: GridKey): Promise<void>;
}
export interface GridLookup<TItem = Record<string, unknown>> {
    dataSource: TItem[];
    valueExpr: keyof TItem | string;
    displayExpr: keyof TItem | string;
}
export type GridValidationRuleType = 'required' | 'numeric' | 'stringLength' | 'range' | 'email' | 'pattern' | 'compare' | 'custom' | 'async';
export interface GridValidationContext<T> {
    value: unknown;
    row: T;
    column: GridColumn<T>;
}
export interface GridValidationRule<T> {
    type: GridValidationRuleType;
    message?: string;
    min?: number;
    max?: number;
    pattern?: string | RegExp;
    compareField?: keyof T | string;
    comparisonTarget?: () => unknown;
    validationCallback?: (context: GridValidationContext<T>) => boolean | string | Promise<boolean | string>;
}
export interface GridEditCellContext<T> extends GridCellContext<T> {
    setValue: (value: unknown) => void;
    error?: string;
    disabled: boolean;
}
export interface GridCellContext<T> {
    row: T;
    data: T;
    value: unknown;
    displayValue: unknown;
    column: GridColumn<T>;
    rowIndex: number;
    columnIndex: number;
}
export interface GridHeaderContext<T> {
    column: GridColumn<T>;
    columnIndex: number;
}
export interface GridColumn<T> {
    field?: keyof T | string;
    dataField?: keyof T | string;
    name?: string;
    caption?: string;
    dataType?: GridDataType;
    width?: number | string;
    minWidth?: number;
    maxWidth?: number;
    visible?: boolean;
    visibleIndex?: number;
    allowSorting?: boolean;
    allowFiltering?: boolean;
    allowGrouping?: boolean;
    allowEditing?: boolean;
    allowResizing?: boolean;
    allowReordering?: boolean;
    fixed?: boolean;
    fixedPosition?: 'left' | 'right';
    hidingPriority?: number;
    minScreenWidth?: number;
    columns?: GridColumn<T>[];
    bandPath?: string[];
    filterOperation?: GridFilterOperator;
    alignment?: 'left' | 'center' | 'right';
    format?: string | ((value: unknown, row: T) => string);
    valueGetter?: (row: T) => unknown;
    valueSetter?: (row: T, value: unknown) => T;
    calculateCellValue?: (row: T) => unknown;
    calculateDisplayValue?: (row: T) => unknown;
    sortComparator?: (left: unknown, right: unknown, leftRow: T, rightRow: T) => number;
    sortOrder?: SortDirection;
    sortIndex?: number;
    lookup?: GridLookup;
    editorType?: 'textbox' | 'textarea' | 'numberbox' | 'checkbox' | 'datebox' | 'datetimebox' | 'selectbox' | string;
    editorOptions?: Record<string, unknown>;
    validationRules?: GridValidationRule<T>[];
    defaultValue?: unknown | (() => unknown);
    renderCell?: (context: GridCellContext<T>) => ReactNode;
    renderHeader?: (context: GridHeaderContext<T>) => ReactNode;
    renderEditCell?: (context: GridEditCellContext<T>) => ReactNode;
    cellClassName?: string | ((context: GridCellContext<T>) => string);
}
export interface GridSelectionConfig {
    mode?: 'none' | 'single' | 'multiple';
    showCheckBoxes?: boolean;
    selectAllMode?: 'page' | 'allPages';
}
export interface GridSortingConfig {
    mode?: 'none' | 'single' | 'multiple';
}
export interface GridPagingConfig {
    enabled?: boolean;
    pageSize?: number;
    pageIndex?: number;
}
export interface GridPagerConfig {
    visible?: boolean;
    allowedPageSizes?: number[];
    showPageSizeSelector?: boolean;
    showNavigationButtons?: boolean;
    showInfo?: boolean;
}
export interface GridRemoteOperations {
    paging?: boolean;
    sorting?: boolean;
    filtering?: boolean;
    grouping?: boolean;
    summary?: boolean;
}
export interface GridFilterRowConfig {
    visible?: boolean;
    applyMode?: 'auto' | 'onClick';
}
export interface GridHeaderFilterConfig {
    visible?: boolean;
    searchable?: boolean;
}
export interface GridSearchPanelConfig {
    visible?: boolean;
    placeholder?: string;
    width?: number | string;
    debounce?: number;
    highlightSearchText?: boolean;
}
export interface GridGroupingConfig {
    autoExpandAll?: boolean;
    allowCollapsing?: boolean;
}
export interface GridGroupPanelConfig {
    visible?: boolean;
    allowColumnDragging?: boolean;
    emptyText?: string;
}
export interface GridSummaryConfig<T> {
    totalItems?: GridSummaryItem<T>[];
    groupItems?: GridSummaryItem<T>[];
}
export interface GridColumnReorderEvent<T> {
    column: GridColumn<T>;
    fromIndex: number;
    toIndex: number;
    columns: GridColumn<T>[];
}
export interface GridColumnResizeEvent<T> {
    column: GridColumn<T>;
    field: string;
    previousWidth: number;
    width: number;
}
export interface GridColumnChooserConfig {
    enabled?: boolean;
    mode?: 'select' | 'dragAndDrop';
    searchable?: boolean;
    allowSelectAll?: boolean;
    title?: string;
}
export interface GridResponsiveConfig {
    enabled?: boolean;
    padding?: number;
}
export type GridEditMode = 'cell' | 'row' | 'batch' | 'form' | 'popup';
export interface GridEditingConfig<T> {
    mode?: GridEditMode;
    allowAdding?: boolean;
    allowUpdating?: boolean | ((row: T) => boolean);
    allowDeleting?: boolean | ((row: T) => boolean);
    confirmDelete?: boolean;
    startEditAction?: 'click' | 'doubleClick';
    newRowPosition?: 'first' | 'last';
    newRowKey?: () => GridKey;
    form?: {
        colCount?: number;
    };
    popup?: {
        title?: string;
        width?: number | string;
        height?: number | string;
    };
    texts?: Partial<{
        add: string;
        edit: string;
        delete: string;
        save: string;
        cancel: string;
        saveAll: string;
        cancelAll: string;
    }>;
}
export interface GridChange<T> {
    type: 'insert' | 'update' | 'remove';
    key?: GridKey;
    data: Partial<T>;
    oldData?: T;
}
export interface GridRowMutationEvent<T> {
    key?: GridKey;
    data: Partial<T>;
    oldData?: T;
    cancel?: boolean;
}
export interface GridFocusedCell {
    rowIndex: number;
    columnIndex: number;
    rowKey?: GridKey;
    field?: string;
}
export interface GridRowEvent<T> {
    data: T;
    key: GridKey;
    rowIndex: number;
    event?: React.SyntheticEvent;
}
export interface GridCellEvent<T> extends GridRowEvent<T> {
    column: GridColumn<T>;
    columnIndex: number;
    value: unknown;
}
export interface GridSelectionChangedEvent<T> {
    selectedRowKeys: GridKey[];
    selectedRowsData: T[];
}
export interface DataGridHandle<T> {
    refresh(): Promise<void>;
    reload(): Promise<void>;
    repaint(): void;
    selectRows(keys: GridKey[], preserve?: boolean): void;
    deselectRows(keys: GridKey[]): void;
    selectAll(): void;
    deselectAll(): void;
    getSelectedRowKeys(): GridKey[];
    getSelectedRowsData(): T[];
    getVisibleRows(): T[];
    getVisibleColumns(): GridColumn<T>[];
    getRowIndexByKey(key: GridKey): number;
    getKeyByRowIndex(index: number): GridKey | undefined;
    pageIndex(value?: number): number;
    pageSize(value?: number): number;
    pageCount(): number;
    totalCount(): number;
    sort(value?: GridSortDescriptor[]): GridSortDescriptor[];
    search(value?: string): string;
    filter(value?: GridFilterDescriptor[]): GridFilterDescriptor[];
    clearFilter(): void;
    group(value?: GridGroupDescriptor[]): GridGroupDescriptor[];
    expandAllGroups(): void;
    collapseAllGroups(): void;
    addRow(): void;
    editRow(key: GridKey): void;
    editCell(key: GridKey, field: string): void;
    deleteRow(key: GridKey): Promise<void>;
    getChanges(): GridChange<T>[];
    saveChanges(): Promise<boolean>;
    cancelChanges(): void;
    autoFitColumn(field: string): void;
    autoFitColumns(): void;
    fixColumn(field: string, position?: 'left' | 'right'): void;
    unfixColumn(field: string): void;
    showColumn(field: string): void;
    hideColumn(field: string): void;
    resetColumnLayout(): void;
    navigateToCell(rowKey: GridKey, field: string): void;
    focus(): void;
    getDataSource(): T[] | GridDataSource<T>;
}
export interface GridPluginContext<T> {
    columns: GridColumn<T>[];
    rows: T[];
}
export interface GridPlugin<T> {
    name: string;
    transformColumns?(columns: GridColumn<T>[]): GridColumn<T>[];
    transformRows?(rows: T[], context: GridPluginContext<T>): T[];
}
export interface DataGridProps<T extends Record<string, unknown>> {
    dataSource?: T[] | GridDataSource<T>;
    rows?: T[];
    columns?: GridColumn<T>[];
    keyExpr?: keyof T | string | ((item: T) => GridKey);
    width?: number | string;
    height?: number | string;
    minHeight?: number | string;
    showBorders?: boolean;
    showRowLines?: boolean;
    showColumnLines?: boolean;
    rowAlternationEnabled?: boolean;
    hoverStateEnabled?: boolean;
    columnAutoWidth?: boolean;
    disabled?: boolean;
    visible?: boolean;
    className?: string;
    style?: CSSProperties;
    locale?: string;
    selection?: GridSelectionConfig;
    sorting?: GridSortingConfig;
    filterRow?: GridFilterRowConfig;
    headerFilter?: GridHeaderFilterConfig;
    searchPanel?: GridSearchPanelConfig;
    grouping?: GridGroupingConfig;
    groupPanel?: GridGroupPanelConfig;
    summary?: GridSummaryConfig<T>;
    editing?: GridEditingConfig<T>;
    allowColumnReordering?: boolean;
    allowColumnResizing?: boolean;
    columnResizingMode?: 'nextColumn' | 'widget';
    columnChooser?: GridColumnChooserConfig;
    responsive?: GridResponsiveConfig;
    paging?: GridPagingConfig;
    pager?: GridPagerConfig;
    remoteOperations?: boolean | GridRemoteOperations;
    selectedRowKeys?: GridKey[];
    defaultSelectedRowKeys?: GridKey[];
    onSelectedRowKeysChange?: (keys: GridKey[]) => void;
    onSelectionChanged?: (event: GridSelectionChangedEvent<T>) => void;
    onSortingChanged?: (sort: GridSortDescriptor[]) => void;
    onFilterChanged?: (filter: GridFilterDescriptor[]) => void;
    onSearchValueChanged?: (value: string) => void;
    onGroupingChanged?: (group: GridGroupDescriptor[]) => void;
    onColumnReorder?: (event: GridColumnReorderEvent<T>) => void;
    onColumnOrderChanged?: (columns: GridColumn<T>[]) => void;
    onColumnResized?: (event: GridColumnResizeEvent<T>) => void;
    onColumnVisibilityChanged?: (field: string, visible: boolean) => void;
    onColumnFixedChanged?: (field: string, position: 'left' | 'right' | null) => void;
    onRowsChange?: (rows: T[]) => void;
    onChangesChange?: (changes: GridChange<T>[]) => void;
    onRowInserting?: (event: GridRowMutationEvent<T>) => void | Promise<void>;
    onRowInserted?: (event: GridRowMutationEvent<T>) => void;
    onRowUpdating?: (event: GridRowMutationEvent<T>) => void | Promise<void>;
    onRowUpdated?: (event: GridRowMutationEvent<T>) => void;
    onRowRemoving?: (event: GridRowMutationEvent<T>) => void | Promise<void>;
    onRowRemoved?: (event: GridRowMutationEvent<T>) => void;
    onSaving?: (changes: GridChange<T>[]) => void | Promise<void>;
    onSaved?: (changes: GridChange<T>[]) => void;
    onEditCanceled?: () => void;
    onValidationError?: (errors: Record<string, string>) => void;
    onPageIndexChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onRowClick?: (event: GridRowEvent<T>) => void;
    onRowDoubleClick?: (event: GridRowEvent<T>) => void;
    onCellClick?: (event: GridCellEvent<T>) => void;
    onCellDoubleClick?: (event: GridCellEvent<T>) => void;
    onFocusedCellChanged?: (cell: GridFocusedCell) => void;
    onFocusedRowChanged?: (event: GridRowEvent<T>) => void;
    onInitialized?: (handle: DataGridHandle<T>) => void;
    onContentReady?: (handle: DataGridHandle<T>) => void;
    onDataError?: (error: Error) => void;
    noDataRender?: () => ReactNode;
    loadingRender?: () => ReactNode;
    errorRender?: (error: Error, retry: () => void) => ReactNode;
    rowNumber?: {
        visible?: boolean;
        mode?: 'page' | 'absolute';
    };
    plugins?: GridPlugin<T>[];
    messages?: Partial<{
        noData: string;
        loading: string;
        retry: string;
        page: string;
        of: string;
        records: string;
        rowsPerPage: string;
        selectAll: string;
        add: string;
        edit: string;
        delete: string;
        save: string;
        cancel: string;
        saveAll: string;
        cancelAll: string;
        columns: string;
        resetColumns: string;
    }>;
}
//# sourceMappingURL=grid.types.d.ts.map