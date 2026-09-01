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
});
