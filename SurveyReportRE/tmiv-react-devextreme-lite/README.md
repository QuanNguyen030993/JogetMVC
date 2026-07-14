# TMIV React DevExtreme Lite

Prototype React replacements for a practical subset of DevExtreme `dxForm` and `dxDataGrid` behavior.

## Run

```bash
npm install
npm run dev
```

## Included

- `src/components/Form.jsx`
  - simple, group, button, empty, tabbed and imperative template items
  - text, number, date, checkbox, textarea and select editors
  - `option`, `updateData`, `itemOption`, `getEditor`, `validate`, `repaint`
- `src/components/DataGrid.jsx`
  - local array data source
  - sorting, search, filter row, paging and selection
  - adding, editing and deleting rows
  - lookup columns and `renderCell`
  - common instance methods
- jQuery compatibility bridge:
  - `$(element).dxFormLite(options)`
  - `$(element).dxFormLite('instance')`
  - `$(element).dxDataGridLite(options)`
  - `$(element).dxDataGridLite('instance')`

## Important limitation

This is a clean-room prototype based on public behavior and observed usage patterns. It is not the original DevExtreme source code and is not API-complete.
