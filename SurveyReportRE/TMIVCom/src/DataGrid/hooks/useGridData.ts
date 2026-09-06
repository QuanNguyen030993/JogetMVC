import { useCallback, useEffect, useState } from 'react';
import type { GridDataSource, GridLoadOptions } from '../types/grid.types';

interface UseGridDataResult<T> {
  rows: T[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

const isDataSource = <T,>(value: T[] | GridDataSource<T>): value is GridDataSource<T> =>
  !Array.isArray(value) && typeof value?.load === 'function';

export const useGridData = <T,>(
  source: T[] | GridDataSource<T>,
  loadOptions: GridLoadOptions,
  onDataError?: (error: Error) => void,
): UseGridDataResult<T> => {
  const [rows, setRows] = useState<T[]>(Array.isArray(source) ? source : []);
  const [totalCount, setTotalCount] = useState(Array.isArray(source) ? source.length : 0);
  const [loading, setLoading] = useState(!Array.isArray(source));
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!isDataSource(source)) {
      setRows(source);
      setTotalCount(source.length);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await source.load(loadOptions);
      const nextRows = Array.isArray(result) ? result : result.data;
      setRows(nextRows);
      setTotalCount(Array.isArray(result) ? result.length : result.totalCount);
    } catch (reason) {
      const nextError = reason instanceof Error ? reason : new Error(String(reason));
      setError(nextError);
      onDataError?.(nextError);
    } finally {
      setLoading(false);
    }
  }, [source, loadOptions, onDataError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, totalCount, loading, error, reload };
};
