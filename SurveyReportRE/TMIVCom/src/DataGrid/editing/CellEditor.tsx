import { getPathValue } from '../core/GridEngine';
import type { GridColumn } from '../types/grid.types';
import { coerceEditorValue } from './validation';

interface CellEditorProps<T> {
  row: T;
  column: GridColumn<T>;
  value: unknown;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: unknown) => void;
  onCommit?: () => void;
  onCancel?: () => void;
}

export const CellEditor = <T,>({ row, column, value, error, disabled = false, autoFocus, onChange, onCommit, onCancel }: CellEditorProps<T>) => {
  const common = {
    disabled,
    autoFocus,
    'aria-invalid': Boolean(error),
    'aria-label': `Edit ${column.caption ?? String(column.field ?? '')}`,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel?.(); }
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onCommit?.(); }
      if (event.key === 'Tab') onCommit?.();
    },
    onBlur: onCommit,
  };
  const setValue = (next: unknown) => onChange(coerceEditorValue(next, column));
  const context = { row, data: row, value, displayValue: value, column, rowIndex: -1, columnIndex: -1, setValue, error, disabled };
  if (column.renderEditCell) return <>{column.renderEditCell(context)}</>;
  const editorType = column.editorType?.toLocaleLowerCase();
  if (column.lookup || editorType === 'selectbox') {
    const items = column.lookup?.dataSource ?? (column.editorOptions?.dataSource as Record<string, unknown>[] | undefined) ?? [];
    const valueExpr = String(column.lookup?.valueExpr ?? column.editorOptions?.valueExpr ?? 'value');
    const displayExpr = String(column.lookup?.displayExpr ?? column.editorOptions?.displayExpr ?? 'text');
    return <select {...common} value={String(value ?? '')} onChange={(event) => {
      const match = items.find((item) => String(getPathValue(item, valueExpr) ?? '') === event.target.value);
      setValue(match ? getPathValue(match, valueExpr) : event.target.value);
    }}><option value="">--</option>{items.map((item, index) => <option key={String(getPathValue(item, valueExpr) ?? index)} value={String(getPathValue(item, valueExpr) ?? '')}>{String(getPathValue(item, displayExpr) ?? '')}</option>)}</select>;
  }
  if (column.dataType === 'boolean' || editorType === 'checkbox') {
    return <input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} />;
  }
  if (editorType === 'textarea') {
    return <textarea {...common} value={String(value ?? '')} onChange={(event) => setValue(event.target.value)} />;
  }
  const type = column.dataType === 'number' || editorType === 'numberbox' ? 'number'
    : column.dataType === 'date' || editorType === 'datebox' ? 'date'
      : column.dataType === 'datetime' || editorType === 'datetimebox' ? 'datetime-local' : 'text';
  return <input {...common} type={type} value={String(value ?? '')} onChange={(event) => setValue(event.target.value)} />;
};
