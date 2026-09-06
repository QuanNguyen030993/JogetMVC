import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataGrid } from './DataGrid';
import type { DataGridHandle } from './types/grid.types';

type Person = { id: number; name: string; age: number };
const people: Person[] = [
  { id: 1, name: 'Charlie', age: 31 },
  { id: 2, name: 'Alice', age: 28 },
  { id: 3, name: 'Bob', age: 35 },
];

describe('DataGrid', () => {
  it('renders, sorts and pages local data', () => {
    render(
      <DataGrid
        dataSource={people}
        keyExpr="id"
        columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age' }]}
        sorting={{ mode: 'single' }}
        paging={{ pageSize: 2 }}
      />,
    );
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('supports multiple selection and imperative APIs', () => {
    const ref = createRef<DataGridHandle<Person>>();
    const onSelectionChanged = vi.fn();
    render(
      <DataGrid
        ref={ref}
        dataSource={people}
        keyExpr="id"
        columns={[{ field: 'name', caption: 'Name' }]}
        selection={{ mode: 'multiple', showCheckBoxes: true }}
        paging={{ enabled: false }}
        onSelectionChanged={onSelectionChanged}
      />,
    );
    fireEvent.click(screen.getByLabelText('Select row 1'));
    expect(ref.current?.getSelectedRowKeys()).toEqual([1]);
    expect(onSelectionChanged).toHaveBeenCalled();
    act(() => ref.current?.selectAll());
    expect(ref.current?.getSelectedRowKeys()).toEqual([1, 2, 3]);
  });

  it('supports global search, filter row and grouping by drag/drop', async () => {
    render(
      <DataGrid
        dataSource={people}
        keyExpr="id"
        columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number' }]}
        searchPanel={{ visible: true, debounce: 0 }}
        filterRow={{ visible: true }}
        groupPanel={{ visible: true }}
        allowColumnReordering
        paging={{ enabled: false }}
      />,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'Alice' } });
    await screen.findByText('Alice');
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Filter Age'), { target: { value: '31' } });
    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter Age'), { target: { value: '' } });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    const groupPanel = screen.getByText('Drag a column here to group').parentElement!;
    fireEvent.dragStart(nameHeader, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } });
    fireEvent.drop(groupPanel, { dataTransfer: { getData: () => 'name' } });
    expect((await screen.findAllByText(/Name:/))).toHaveLength(3);
  });

  it('opens filter operators from a search icon menu', async () => {
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number' }]}
      filterRow={{ visible: true }}
      paging={{ enabled: false }}
    />);
    const trigger = screen.getByRole('button', { name: 'Filter operation Age' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: 'Filter operations Age' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitemradio', { name: '>' }));
    expect(trigger).toHaveAttribute('title', 'Age: >');
    fireEvent.change(screen.getByLabelText('Filter Age'), { target: { value: '30' } });
    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('reorders columns by dragging a header', () => {
    const onColumnReorder = vi.fn();
    render(
      <DataGrid
        dataSource={people}
        keyExpr="id"
        columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age' }]}
        allowColumnReordering
        paging={{ enabled: false }}
        onColumnReorder={onColumnReorder}
      />,
    );
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    const ageHeader = screen.getByRole('columnheader', { name: 'Age' });
    fireEvent.dragStart(nameHeader, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } });
    fireEvent.dragOver(ageHeader, { dataTransfer: {} });
    fireEvent.drop(ageHeader, { dataTransfer: {} });
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Age', 'Name']);
    expect(onColumnReorder).toHaveBeenCalledWith(expect.objectContaining({ fromIndex: 0, toIndex: 1 }));
  });

  it('edits and validates a row before committing local data', async () => {
    const onRowsChange = vi.fn();
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name', validationRules: [{ type: 'required', message: 'Required name' }] }, { field: 'age', caption: 'Age', dataType: 'number' }]}
      editing={{ mode: 'row', allowUpdating: true }}
      paging={{ enabled: false }}
      onRowsChange={onRowsChange}
    />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    fireEvent.change(screen.getByLabelText('Edit Name'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Required name')).toBeInTheDocument();
    expect(onRowsChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Edit Name'), { target: { value: 'Charles' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onRowsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Charles' })])));
  });

  it('tracks batch cell changes and saves them together', async () => {
    const ref = createRef<DataGridHandle<Person>>();
    const onRowsChange = vi.fn();
    render(<DataGrid
      ref={ref}
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number' }]}
      editing={{ mode: 'batch', allowUpdating: true, allowDeleting: true, confirmDelete: false }}
      paging={{ enabled: false }}
      onRowsChange={onRowsChange}
    />);
    fireEvent.click(screen.getByText('Charlie'));
    const editor = await screen.findByLabelText('Edit Name');
    fireEvent.change(editor, { target: { value: 'Charles' } });
    fireEvent.keyDown(editor, { key: 'Tab' });
    await waitFor(() => expect(ref.current?.getChanges()).toEqual([expect.objectContaining({ type: 'update', key: 1, data: { name: 'Charles' } })]));
    fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    await waitFor(() => expect(onRowsChange).toHaveBeenCalled());
    expect(ref.current?.getChanges()).toEqual([]);
  });

  it('keeps batch edits local across cells until Save all', async () => {
    const ref = createRef<DataGridHandle<Person>>();
    const onRowsChange = vi.fn();
    render(<DataGrid
      ref={ref}
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number' }]}
      editing={{ mode: 'batch', allowUpdating: true }}
      paging={{ enabled: false }}
      onRowsChange={onRowsChange}
    />);
    fireEvent.click(screen.getByText('Charlie'));
    fireEvent.change(await screen.findByLabelText('Edit Name'), { target: { value: 'Charles' } });
    fireEvent.click(screen.getByText('31'));
    const ageEditor = await screen.findByLabelText('Edit Age');
    await waitFor(() => expect(ref.current?.getChanges()).toEqual([expect.objectContaining({ data: { name: 'Charles' } })]));
    fireEvent.change(ageEditor, { target: { value: '32' } });
    fireEvent.keyDown(screen.getByLabelText('Edit Age'), { key: 'Enter' });
    await waitFor(() => expect(ref.current?.getChanges()).toEqual([expect.objectContaining({ data: { name: 'Charles', age: 32 } })]));
    expect(onRowsChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    await waitFor(() => expect(onRowsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Charles', age: 32 })])));
  });

  it('commits cell mode immediately on blur', async () => {
    const onRowsChange = vi.fn();
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number' }]}
      editing={{ mode: 'cell', allowUpdating: true }}
      paging={{ enabled: false }}
      onRowsChange={onRowsChange}
    />);
    fireEvent.click(screen.getByText('Charlie'));
    const editor = await screen.findByLabelText('Edit Name');
    fireEvent.change(editor, { target: { value: 'Charles' } });
    fireEvent.blur(editor);
    await waitFor(() => expect(onRowsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Charles' })])));
    expect(screen.queryByRole('button', { name: 'Save all' })).not.toBeInTheDocument();
  });

  it('uses insert rather than update when cell mode commits a new row', async () => {
    const insert = vi.fn(async (values: Partial<Person>) => ({ id: 4, name: String(values.name ?? ''), age: Number(values.age ?? 0) }));
    const update = vi.fn();
    const dataSource = {
      key: 'id',
      load: async () => ({ data: people, totalCount: people.length }),
      insert,
      update,
    };
    render(<DataGrid<Person>
      dataSource={dataSource}
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age', dataType: 'number', defaultValue: 18 }]}
      editing={{ mode: 'cell', allowAdding: true, allowUpdating: true }}
      paging={{ enabled: false }}
    />);
    await screen.findByText('Charlie');
    fireEvent.click(screen.getByRole('button', { name: /Add row/ }));
    const editor = await screen.findByLabelText('Edit Name');
    fireEvent.change(editor, { target: { value: 'Diana' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await waitFor(() => expect(insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Diana', age: 18 })));
    expect(update).not.toHaveBeenCalled();
  });

  it('opens popup editing through the imperative API', () => {
    const ref = createRef<DataGridHandle<Person>>();
    render(<DataGrid ref={ref} dataSource={people} keyExpr="id" columns={[{ field: 'name', caption: 'Name' }]} editing={{ mode: 'popup', allowUpdating: true, popup: { title: 'Edit person' } }} paging={{ enabled: false }} />);
    act(() => ref.current?.editRow(1));
    expect(screen.getByRole('dialog', { name: 'Edit person' })).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Name')).toHaveValue('Charlie');
  });

  it('adds and deletes rows through editing commands', async () => {
    const onRowsChange = vi.fn();
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name', validationRules: [{ type: 'required' }] }, { field: 'age', caption: 'Age', dataType: 'number', defaultValue: 18 }]}
      editing={{ mode: 'row', allowAdding: true, allowUpdating: true, allowDeleting: true, confirmDelete: false, newRowPosition: 'first' }}
      paging={{ enabled: false }}
      onRowsChange={onRowsChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: /Add row/ }));
    fireEvent.change(screen.getByLabelText('Edit Name'), { target: { value: 'Diana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onRowsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 4, name: 'Diana', age: 18 })])));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onRowsChange).toHaveBeenCalledTimes(2));
  });

  it('hides, reorders and resets columns through the column chooser', () => {
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age' }]}
      columnChooser={{ enabled: true, mode: 'dragAndDrop' }}
      paging={{ enabled: false }}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Age' }));
    expect(screen.queryByRole('columnheader', { name: 'Age' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset columns' }));
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
  });

  it('renders band headers and supports fixed-column imperative APIs', () => {
    const ref = createRef<DataGridHandle<Person>>();
    render(<DataGrid
      ref={ref}
      dataSource={people}
      keyExpr="id"
      columns={[
        { caption: 'Person', columns: [{ field: 'name', caption: 'Name' }, { field: 'age', caption: 'Age' }] },
      ]}
      columnChooser={{ enabled: true }}
      paging={{ enabled: false }}
    />);
    expect(screen.getByRole('columnheader', { name: 'Person' })).toHaveAttribute('colspan', '2');
    act(() => ref.current?.fixColumn('name'));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveStyle({ position: 'sticky', left: '0px' });
    act(() => ref.current?.hideColumn('age'));
    expect(screen.queryByRole('columnheader', { name: 'Age' })).not.toBeInTheDocument();
    act(() => ref.current?.resetColumnLayout());
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
  });

  it('resizes a column with pointer interaction and reports the final width', () => {
    const onColumnResized = vi.fn();
    render(<DataGrid
      dataSource={people}
      keyExpr="id"
      columns={[{ field: 'name', caption: 'Name', width: 120, minWidth: 80 }, { field: 'age', caption: 'Age', width: 100 }]}
      allowColumnResizing
      paging={{ enabled: false }}
      onColumnResized={onColumnResized}
    />);
    fireEvent(screen.getByRole('separator', { name: 'Resize Name' }), new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }));
    fireEvent(window, new MouseEvent('pointermove', { bubbles: true, clientX: 145 }));
    fireEvent(window, new MouseEvent('pointerup', { bubbles: true }));
    expect(onColumnResized).toHaveBeenCalledWith(expect.objectContaining({ field: 'name', previousWidth: 120, width: 165 }));
  });
});
