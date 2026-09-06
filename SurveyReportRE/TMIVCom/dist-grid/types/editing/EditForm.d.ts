import type { GridColumn } from '../types/grid.types';
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
export declare const EditForm: <T>({ row, columns, errors, colCount, title, saving, popup, width, onChange, onSave, onCancel }: EditFormProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=EditForm.d.ts.map