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

export const Pager = ({
  pageIndex,
  pageSize,
  pageCount,
  totalCount,
  allowedPageSizes,
  showPageSizeSelector,
  showNavigationButtons,
  showInfo,
  messages,
  onPageIndexChange,
  onPageSizeChange,
}: PagerProps) => (
  <div className="tmiv-grid__pager" role="navigation" aria-label="Grid pagination">
    <div className="tmiv-grid__pager-navigation">
      {showNavigationButtons && (
        <>
          <button type="button" aria-label="First page" disabled={pageIndex <= 0} onClick={() => onPageIndexChange(0)}>«</button>
          <button type="button" aria-label="Previous page" disabled={pageIndex <= 0} onClick={() => onPageIndexChange(pageIndex - 1)}>‹</button>
        </>
      )}
      <span>{messages.page}</span>
      <input
        aria-label="Page number"
        type="number"
        min={1}
        max={pageCount}
        value={pageIndex + 1}
        onChange={(event) => onPageIndexChange(Math.min(pageCount - 1, Math.max(0, Number(event.target.value) - 1)))}
      />
      <span>{messages.of} {pageCount}</span>
      {showNavigationButtons && (
        <>
          <button type="button" aria-label="Next page" disabled={pageIndex >= pageCount - 1} onClick={() => onPageIndexChange(pageIndex + 1)}>›</button>
          <button type="button" aria-label="Last page" disabled={pageIndex >= pageCount - 1} onClick={() => onPageIndexChange(pageCount - 1)}>»</button>
        </>
      )}
      {showPageSizeSelector && (
        <label>
          {messages.rowsPerPage}
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {allowedPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      )}
    </div>
    {showInfo && <span className="tmiv-grid__pager-info">{totalCount} {messages.records}</span>}
  </div>
);
