import { useEffect, useState } from 'react';
import type { GridSearchPanelConfig } from '../types/grid.types';

interface SearchPanelProps {
  config: GridSearchPanelConfig;
  value: string;
  onChange: (value: string) => void;
}

export const SearchPanel = ({ config, value, onChange }: SearchPanelProps) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const timer = window.setTimeout(() => onChange(draft), config.debounce ?? 250);
    return () => window.clearTimeout(timer);
  }, [draft, config.debounce, onChange]);

  return (
    <label className="tmiv-grid__search" style={{ width: config.width }}>
      <span aria-hidden="true">⌕</span>
      <input
        type="search"
        aria-label={config.placeholder ?? 'Search'}
        placeholder={config.placeholder ?? 'Search...'}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </label>
  );
};
