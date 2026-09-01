import type { GridColumn, GridFocusedCell, GridKey } from '../types/grid.types';
interface DataRowProps<T> {
    row: T;
    rowKey: GridKey;
    rowIndex: number;
    absoluteRowIndex: number;
    columns: GridColumn<T>[];
    locale: string;
    selected: boolean;
    focusedCell: GridFocusedCell | null;
    showSelection: boolean;
    showRowNumber: boolean;
    searchText?: string;
    highlightSearchText?: boolean;
    editingFields?: Set<string>;
    changedFields?: Set<string>;
    errors?: Record<string, string>;
    saving?: boolean;
    showCommands?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    rowEditing?: boolean;
    onValueChange?: (field: string, value: unknown) => void;
    onCommitCell?: (field: string) => void;
    onCancelCell?: () => void;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onDelete?: () => void;
    commandTexts?: {
        edit: string;
        delete: string;
        save: string;
        cancel: string;
    };
    onSelect: (event: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
    onRowClick: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    onRowDoubleClick: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    onCellClick: (columnIndex: number, event: React.MouseEvent<HTMLTableCellElement>) => void;
    onCellDoubleClick: (columnIndex: number, event: React.MouseEvent<HTMLTableCellElement>) => void;
    onCellFocus: (columnIndex: number) => void;
}
declare const DataRowInner: <T>({ row, rowKey, rowIndex, absoluteRowIndex, columns, locale, selected, focusedCell, showSelection, showRowNumber, searchText, highlightSearchText, editingFields, changedFields, errors, saving, showCommands, canEdit, canDelete, rowEditing, onValueChange, onCommitCell, onCancelCell, onEdit, onSave, onCancel, onDelete, commandTexts, onSelect, onRowClick, onRowDoubleClick, onCellClick, onCellDoubleClick, onCellFocus, }: DataRowProps<T>) => import("react/jsx-runtime").JSX.Element;
export declare const DataRow: typeof DataRowInner;
export {};
//# sourceMappingURL=DataRow.d.ts.map