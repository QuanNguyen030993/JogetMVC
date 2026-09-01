# TMIV DataGrid

`DataGrid` is the modular TypeScript grid engine. `CustomGrid` remains the compatibility entry point used by existing TMIV pages; pass `architecture="modular"` (or `engine="v2"`) to opt into this engine while migration is in progress.

## Architecture

- `core/GridEngine.ts`: pure column, value, formatting, sorting and paging logic.
- `data/`: array and asynchronous custom-store abstractions.
- `hooks/`: data loading and controlled/uncontrolled grid state.
- `columns/`, `rows/`, `cells/`, `paging/`: focused render components.
- `compat/`: translates familiar `dataField`, `gridOption`, selection and pager configuration.
- `filtering/`: search panel, typed filter row and distinct-value header filters.
- `grouping/`: drag-to-group panel, nested collapsible group rows and group summaries.
- `summary/`: total summary footer.
- `types/`: the public generic TypeScript contract. Internal types are not exported accidentally.

Plugins can transform columns or rows without coupling future workflow, AI or metadata features to the core.

## Usage

```tsx
import { DataGrid, GridCustomStore, type GridColumn } from 'tmivcom-react-core';

type Order = { id: number; customerName: string; amount: number };

const columns: GridColumn<Order>[] = [
  { field: 'id', caption: 'ID', width: 80 },
  { field: 'customerName', caption: 'Customer' },
  { field: 'amount', caption: 'Amount', dataType: 'number', format: 'currency' },
];

<DataGrid<Order>
  dataSource={orders}
  keyExpr="id"
  columns={columns}
  sorting={{ mode: 'multiple' }}
  searchPanel={{ visible: true, debounce: 250, highlightSearchText: true }}
  filterRow={{ visible: true }}
  headerFilter={{ visible: true, searchable: true }}
  groupPanel={{ visible: true, allowColumnDragging: true }}
  grouping={{ autoExpandAll: true }}
  allowColumnReordering
  summary={{ totalItems: [{ type: 'count', displayFormat: 'Total: {0}' }] }}
  editing={{
    mode: 'batch',
    allowAdding: true,
    allowUpdating: true,
    allowDeleting: true,
    confirmDelete: true
  }}
  selection={{ mode: 'multiple', showCheckBoxes: true }}
  paging={{ pageSize: 20 }}
  pager={{ allowedPageSizes: [10, 20, 50, 100] }}
/>
```

For server data, `GridCustomStore.load` receives normalized `{ skip, take, sort, filter, search, group, summary }` options and returns `{ data, totalCount }`.

```tsx
const store = new GridCustomStore<Order>({
  key: 'id',
  async load(options) {
    const response = await fetch('/api/orders/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return response.json();
  },
});
```

## Phase 1 capabilities

Column definition/auto-generation, lookup display, calculated values, formatting, stable single/multiple sorting, controlled or uncontrolled selection, Ctrl/Shift selection, paging, remote paging/sorting request shape, loading/error/empty states, responsive fixed-height scrolling, focused cell/row, keyboard navigation, ARIA grid roles, custom renderers, plugins, and imperative APIs.

## Phase 2 capabilities

Case-insensitive global search with debounce and highlighting; typed filter-row editors and operators; searchable distinct-value header filters; multi-level grouping by dragging headers to the Group Panel; collapse/expand and group direction controls; group and total summaries (`count`, `sum`, `avg`, `min`, `max`, `custom`); normalized remote data-shaping requests; and imperative search/filter/group APIs.

Column header drag/drop reordering is included early because it is required by the ITAdmin migration. Width resizing/fixing/chooser/banded columns remain Phase 4 layout work.

## Phase 3 capabilities

Editing modes: `cell`, `row`, `batch`, `form` and `popup`. Editors are selected from column data type or `editorType`, including text, textarea, number, checkbox, date/datetime and lookup/select. The change tracker supports insert/update/remove, modified-cell markers, Save All/Cancel All and array or `GridCustomStore` persistence.

Validation rules include `required`, `numeric`, `stringLength`, `range`, `email`, `pattern`, `compare`, `custom` and `async`. Server errors shaped as `{ errors: { field: [...] } }` are mapped back to fields. Permission callbacks can enable update/delete per row.

Imperative editing APIs:

```ts
grid.addRow();
grid.editRow(key);
grid.editCell(key, 'name');
await grid.deleteRow(key);
grid.getChanges();
await grid.saveChanges();
grid.cancelChanges();
```
