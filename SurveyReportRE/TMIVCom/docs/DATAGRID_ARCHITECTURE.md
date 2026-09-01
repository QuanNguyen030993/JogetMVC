# DataGrid architecture and delivery roadmap

## Boundary

The new grid is an independent implementation. It does not import DevExtreme or depend on its runtime. Familiar concepts are translated by `DxCompatibleDataGrid` into TMIV's public types.

`CustomGrid.jsx` is now the migration boundary:

- Existing callers continue to use the legacy implementation by default.
- `architecture="modular"` or `engine="v2"` selects the new engine.
- New TypeScript applications should import `DataGrid` directly.

This prevents an all-at-once migration and keeps existing metadata-driven ASP.NET pages operational.

## Runtime layers

1. Public API: generic props, events and `DataGridHandle<T>`.
2. Compatibility: maps `dataField`, `gridOption`, familiar selection, sorting and pager options.
3. Controller hooks: own controlled/uncontrolled UI state and asynchronous loading.
4. Pure engine: value access, lookup projection, formatting, stable sorting and paging.
5. Data adapters: arrays and `GridCustomStore` with a normalized load request.
6. Rendering: isolated header, row, cell and pager components.
7. Extensions: plugins transform rows or columns before shaping/rendering.

State that will eventually be persisted is kept separate from temporary DOM state. Server requests contain transport-oriented descriptors (`skip`, `take`, `sort`) rather than React details.

## Completed — Phase 1

- Explicit and auto-generated columns.
- Nested field lookup, calculated/display values, lookup display and Intl formatting.
- Stable single and multiple sorting with Shift-click priority.
- None/single/multiple selection, Ctrl toggle, Shift range, page/all-page imperative selection.
- Local paging and normalized remote paging/sorting requests.
- Loading, error/retry and empty states.
- Dynamic dimensions, fixed-height scrolling, basic auto width and auto-fit APIs.
- Focused cell/row, arrows, Tab, Shift+Tab, Home, End, PageUp/PageDown, Space and Ctrl+A.
- ARIA grid/row/cell/header roles and visible focus.
- Generic custom cell/header rendering and conditional cell classes.
- Array/custom stores, plugin hooks and an imperative ref API.
- ESM, CJS, external React peer dependency, CSS and TypeScript declarations.
- Pure unit tests and React component tests.

## Planned phases

### Phase 2 — data shaping

Filter engine and AST, filter row operators, header filter, debounced search/highlight, filter panel/builder, grouping and total/group summaries.

### Phase 3 — editing

Cell/row/batch/form/popup editing controllers, change sets, lookup/editor registry, sync/async validation, server error mapping and optimistic CRUD rollback.

### Phase 4 — layout

Pointer/touch resize, reorder indicators, frozen columns, chooser, nested bands, adaptive hiding and persisted column state.

### Phase 5 — performance

Virtual rows/columns, infinite loading, overscan, page cache, repaint-only updates and benchmark instrumentation.

### Phase 6 — enterprise

State storage/saved views, full remote query serialization, export/print, master-detail, row drag/drop, metadata factories and trusted renderer/editor registries.

### Phase 7 — quality

RTL, full i18n, density/dark themes, keyboard/accessibility audits, expanded component/E2E coverage, Storybook-style demos and performance notes.

Each phase must keep `typecheck`, `lint`, `test`, application build, package build and backend bundle build green before the next phase starts.
