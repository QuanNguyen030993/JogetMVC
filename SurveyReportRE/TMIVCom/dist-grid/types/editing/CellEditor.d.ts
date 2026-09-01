import type { GridColumn } from '../types/grid.types';
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
export declare const CellEditor: <T>({ row, column, value, error, disabled, autoFocus, onChange, onCommit, onCancel }: CellEditorProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CellEditor.d.ts.map