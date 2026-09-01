interface PagerProps {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    totalCount: number;
    allowedPageSizes: number[];
    showPageSizeSelector: boolean;
    showNavigationButtons: boolean;
    showInfo: boolean;
    messages: {
        page: string;
        of: string;
        records: string;
        rowsPerPage: string;
    };
    onPageIndexChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
}
export declare const Pager: ({ pageIndex, pageSize, pageCount, totalCount, allowedPageSizes, showPageSizeSelector, showNavigationButtons, showInfo, messages, onPageIndexChange, onPageSizeChange, }: PagerProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Pager.d.ts.map