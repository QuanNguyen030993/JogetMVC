import type { GridColumn, GridColumnChooserConfig } from '../types/grid.types';
interface ColumnChooserProps<T> {
    config: GridColumnChooserConfig;
    columns: GridColumn<T>[];
    visibleFields: Set<string>;
    buttonText: string;
    resetText: string;
    onVisibilityChange: (field: string, visible: boolean) => void;
    onOrderChange: (fields: string[]) => void;
    onReset: () => void;
}
export declare const ColumnChooser: <T>({ config, columns, visibleFields, buttonText, resetText, onVisibilityChange, onOrderChange, onReset }: ColumnChooserProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ColumnChooser.d.ts.map