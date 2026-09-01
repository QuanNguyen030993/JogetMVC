import type { GridCellContext } from '../types/grid.types';
interface DataCellProps<T> extends GridCellContext<T> {
    locale: string;
    focused: boolean;
    onClick: (event: React.MouseEvent<HTMLTableCellElement>) => void;
    onDoubleClick: (event: React.MouseEvent<HTMLTableCellElement>) => void;
    onFocus: () => void;
    searchText?: string;
    highlightSearchText?: boolean;
    editing?: boolean;
    changed?: boolean;
    error?: string;
    saving?: boolean;
    onValueChange?: (value: unknown) => void;
    onCommitEdit?: () => void;
    onCancelEdit?: () => void;
}
declare const DataCellInner: <T>({ row, value, displayValue, column, rowIndex, columnIndex, locale, focused, onClick, onDoubleClick, onFocus, searchText, highlightSearchText, editing, changed, error, saving, onValueChange, onCommitEdit, onCancelEdit, }: DataCellProps<T>) => import("react/jsx-runtime").JSX.Element;
export declare const DataCell: typeof DataCellInner;
export {};
//# sourceMappingURL=DataCell.d.ts.map