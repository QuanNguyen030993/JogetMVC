import { columnField, getPathValue } from '../core/GridEngine';
import type { GridColumn } from '../types/grid.types';
import { CellEditor } from './CellEditor';

interface EditFormProps<T> {
  row: T;
  columns: GridColumn<T>[];
  errors: Record<string, string>;
  colCount: number;
  title?: string;
  saving: boolean;
  popup?: boolean;
  width?: number | string;
  onChange: (field: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditForm = <T,>({ row, columns, errors, colCount, title, saving, popup, width, onChange, onSave, onCancel }: EditFormProps<T>) => {
  const content = (
    <div className={`tmiv-grid__edit-form ${popup ? 'tmiv-grid__edit-form--popup' : ''}`} style={{ width }} role={popup ? 'dialog' : 'form'} aria-modal={popup || undefined} aria-label={title ?? 'Edit row'}>
      {title && <h3>{title}</h3>}
      <div className="tmiv-grid__edit-form-fields" style={{ gridTemplateColumns: `repeat(${Math.max(1, colCount)}, minmax(0, 1fr))` }}>
        {columns.filter((column) => column.allowEditing !== false && columnField(column)).map((column) => {
          const field = columnField(column);
          return <label key={field}><span>{column.caption ?? field}</span><CellEditor row={row} column={column} value={getPathValue(row, field)} error={errors[field]} disabled={saving} onChange={(value) => onChange(field, value)} />{errors[field] && <small role="alert">{errors[field]}</small>}</label>;
        })}
      </div>
      <div className="tmiv-grid__edit-form-actions"><button type="button" disabled={saving} onClick={onSave}>Save</button><button type="button" disabled={saving} onClick={onCancel}>Cancel</button></div>
    </div>
  );
  return popup ? <div className="tmiv-grid__popup-backdrop">{content}</div> : content;
};
