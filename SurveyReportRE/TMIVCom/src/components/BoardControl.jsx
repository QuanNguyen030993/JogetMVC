import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";

const UNASSIGNED_KEY = "__tmiv_board_unassigned__";
const DEFAULT_COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4"];

const getValue = (item, path) => {
    if (!item || !path) return undefined;
    const parts = String(path).split(".");
    let current = item;
    for (const part of parts) {
        if (current == null) return undefined;
        if (Object.prototype.hasOwnProperty.call(current, part)) {
            current = current[part];
            continue;
        }
        const actualKey = Object.keys(current).find(key => key.toLowerCase() === part.toLowerCase());
        current = actualKey ? current[actualKey] : undefined;
    }
    return current;
};

const setValue = (item, path, value) => {
    const parts = String(path).split(".");
    if (parts.length === 1) {
        const actualKey = Object.keys(item || {}).find(key => key.toLowerCase() === parts[0].toLowerCase());
        return { ...item, [actualKey || parts[0]]: value };
    }

    const [head, ...tail] = parts;
    const actualKey = Object.keys(item || {}).find(key => key.toLowerCase() === head.toLowerCase()) || head;
    return {
        ...item,
        [actualKey]: setValue(item?.[actualKey] || {}, tail.join("."), value)
    };
};

const statusKey = value => value == null || value === "" ? UNASSIGNED_KEY : String(value);
const statusValue = value => value === UNASSIGNED_KEY ? null : value;

const resolveStore = dataSource => {
    if (!dataSource || Array.isArray(dataSource)) return null;
    if (typeof dataSource.store === "function") return dataSource.store();
    if (dataSource.store && typeof dataSource.store === "object") return dataSource.store;
    return dataSource;
};

const normalizeLoadResult = result => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.items)) return result.items;
    return [];
};

const loadRows = async (dataSource, take) => {
    if (Array.isArray(dataSource)) return dataSource;
    if (!dataSource) return [];

    if (typeof dataSource.load === "function") {
        const result = await dataSource.load({ skip: 0, take, sort: [], filter: [], group: [] });
        return normalizeLoadResult(result);
    }

    const store = resolveStore(dataSource);
    if (Array.isArray(store)) return store;
    if (store && typeof store.load === "function") {
        const result = await store.load({ skip: 0, take, sort: [], filter: [], group: [] });
        return normalizeLoadResult(result);
    }

    if (typeof dataSource.items === "function") return dataSource.items() || [];
    return [];
};

const normalizeLane = (lane, index, valueExpr, displayExpr) => {
    if (lane == null || typeof lane !== "object") {
        return { key: lane, title: String(lane ?? "Unassigned"), color: DEFAULT_COLORS[index % DEFAULT_COLORS.length] };
    }

    const key = getValue(lane, valueExpr) ?? lane.key ?? lane.value ?? lane.id ?? lane.status;
    return {
        ...lane,
        key,
        title: getValue(lane, displayExpr) ?? lane.title ?? lane.text ?? lane.name ?? String(key ?? "Unassigned"),
        color: lane.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    };
};

const getInitials = value => String(value || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("");

const BoardControl = forwardRef(({
    dataSource = [],
    columns = [],
    laneDataSource,
    keyExpr = "id",
    statusExpr = "status",
    laneValueExpr = "value",
    laneDisplayExpr = "text",
    titleExpr = "title",
    descriptionExpr = "description",
    subtitleExpr,
    assigneeExpr = "assignee",
    avatarExpr,
    dueDateExpr = "dueDate",
    priorityExpr = "priority",
    tagsExpr = "tags",
    orderExpr,
    title = "Board",
    emptyColumnText = "Drop items here",
    noDataText = "No items",
    loadingText = "Loading board...",
    allowDragging = true,
    showSearch = true,
    showRefresh = true,
    searchPlaceholder = "Search cards...",
    searchValue = "",
    pageSize = 10000,
    height,
    minColumnWidth = 280,
    cardRender,
    cardTemplate,
    onCardClick,
    onCardMoving,
    onCardMoved,
    onRowUpdated,
    onDataChange,
    onDataError,
    className = ""
}, ref) => {
    const [rows, setRows] = useState(Array.isArray(dataSource) ? dataSource : []);
    const [loading, setLoading] = useState(!Array.isArray(dataSource));
    const [error, setError] = useState(null);
    const [query, setQuery] = useState(searchValue || "");
    const [dragState, setDragState] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const rowsRef = useRef(rows);

    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    useEffect(() => {
        setQuery(searchValue || "");
    }, [searchValue]);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const loadedRows = await loadRows(dataSource, pageSize);
            setRows([...loadedRows]);
            rowsRef.current = [...loadedRows];
        } catch (reason) {
            const nextError = reason instanceof Error ? reason : new Error(String(reason));
            setError(nextError);
            onDataError?.(nextError);
        } finally {
            setLoading(false);
        }
    }, [dataSource, pageSize, onDataError]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const gridStatusColumn = useMemo(() => (
        (columns || []).find(column => column?.dataField === statusExpr || column?.field === statusExpr)
    ), [columns, statusExpr]);

    const configuredLaneSource = laneDataSource
        || gridStatusColumn?.lookup?.dataSource
        || ((columns || []).some(column => column?.dataField || column?.field) ? null : columns);
    const lookupValueExpr = gridStatusColumn?.lookup?.valueExpr || laneValueExpr;
    const lookupDisplayExpr = gridStatusColumn?.lookup?.displayExpr || laneDisplayExpr;

    const lanes = useMemo(() => {
        const source = Array.isArray(configuredLaneSource) && configuredLaneSource.length
            ? configuredLaneSource
            : Array.from(new Map(rows.map(item => {
                const rawStatus = getValue(item, statusExpr);
                return [statusKey(rawStatus), rawStatus];
            })).values());

        return source.map((lane, index) => normalizeLane(lane, index, lookupValueExpr, lookupDisplayExpr));
    }, [configuredLaneSource, rows, statusExpr, lookupValueExpr, lookupDisplayExpr]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return rows;
        return rows.filter(item => {
            const fields = [
                getValue(item, titleExpr),
                getValue(item, descriptionExpr),
                subtitleExpr ? getValue(item, subtitleExpr) : "",
                getValue(item, assigneeExpr),
                getValue(item, priorityExpr),
                ...(Array.isArray(getValue(item, tagsExpr)) ? getValue(item, tagsExpr) : [])
            ];
            return fields.some(value => String(value ?? "").toLowerCase().includes(normalizedQuery));
        });
    }, [rows, query, titleExpr, descriptionExpr, subtitleExpr, assigneeExpr, priorityExpr, tagsExpr]);

    const itemsByLane = useMemo(() => {
        const grouped = new Map(lanes.map(lane => [statusKey(lane.key), []]));
        filteredRows.forEach(item => {
            const key = statusKey(getValue(item, statusExpr));
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(item);
        });
        if (orderExpr) {
            grouped.forEach(items => items.sort((left, right) => (
                Number(getValue(left, orderExpr) ?? Number.MAX_SAFE_INTEGER)
                - Number(getValue(right, orderExpr) ?? Number.MAX_SAFE_INTEGER)
            )));
        }
        return grouped;
    }, [filteredRows, lanes, statusExpr, orderExpr]);

    const persistChanges = async (previousRows, nextRows, movedKey, eventPayload) => {
        const store = resolveStore(dataSource);
        if (store && typeof store.update === "function") {
            const changedRows = nextRows.filter(nextItem => {
                const previousItem = previousRows.find(item => String(getValue(item, keyExpr)) === String(getValue(nextItem, keyExpr)));
                return previousItem && (
                    getValue(previousItem, statusExpr) !== getValue(nextItem, statusExpr)
                    || (orderExpr && getValue(previousItem, orderExpr) !== getValue(nextItem, orderExpr))
                );
            });
            await Promise.all(changedRows.map(item => {
                const patch = { [statusExpr]: getValue(item, statusExpr) };
                if (orderExpr) patch[orderExpr] = getValue(item, orderExpr);
                return store.update(getValue(item, keyExpr), patch);
            }));
            if (typeof dataSource?.reload === "function") await dataSource.reload();
        }

        const movedItem = nextRows.find(item => String(getValue(item, keyExpr)) === String(movedKey));
        onRowUpdated?.({ key: movedKey, data: movedItem, oldData: eventPayload.item });
        onDataChange?.(nextRows);
    };

    const moveCard = async (toLane, toIndex) => {
        if (!dragState) return;
        const previousRows = rowsRef.current;
        const movedIndex = previousRows.findIndex(item => String(getValue(item, keyExpr)) === String(dragState.key));
        if (movedIndex < 0) return;

        const originalItem = previousRows[movedIndex];
        const fromStatus = getValue(originalItem, statusExpr);
        const toStatus = statusValue(toLane.key);
        const eventPayload = {
            key: getValue(originalItem, keyExpr),
            item: originalItem,
            fromStatus,
            toStatus,
            fromIndex: dragState.fromIndex,
            toIndex,
            cancel: false
        };

        try {
            const movingResult = await onCardMoving?.(eventPayload);
            if (movingResult === false || eventPayload.cancel) return;

            let movedItem = setValue(originalItem, statusExpr, toStatus);
            const withoutMoved = previousRows.filter((_, index) => index !== movedIndex);
            const targetItems = withoutMoved.filter(item => statusKey(getValue(item, statusExpr)) === statusKey(toStatus));
            const boundedIndex = Math.max(0, Math.min(toIndex, targetItems.length));
            const anchor = targetItems[boundedIndex];
            let insertIndex;
            if (anchor) {
                insertIndex = withoutMoved.findIndex(item => String(getValue(item, keyExpr)) === String(getValue(anchor, keyExpr)));
            } else if (targetItems.length) {
                const lastTarget = targetItems[targetItems.length - 1];
                insertIndex = withoutMoved.findIndex(item => String(getValue(item, keyExpr)) === String(getValue(lastTarget, keyExpr))) + 1;
            } else {
                insertIndex = withoutMoved.length;
            }

            const reordered = [...withoutMoved];
            reordered.splice(insertIndex, 0, movedItem);

            let nextRows = reordered;
            if (orderExpr) {
                const targetKey = statusKey(toStatus);
                let order = 0;
                nextRows = reordered.map(item => {
                    if (statusKey(getValue(item, statusExpr)) !== targetKey) return item;
                    const orderedItem = setValue(item, orderExpr, order);
                    order += 1;
                    return orderedItem;
                });
                movedItem = nextRows.find(item => String(getValue(item, keyExpr)) === String(eventPayload.key));
            }

            setRows(nextRows);
            rowsRef.current = nextRows;
            await persistChanges(previousRows, nextRows, eventPayload.key, eventPayload);
            onCardMoved?.({ ...eventPayload, item: movedItem, data: movedItem });
        } catch (reason) {
            setRows(previousRows);
            rowsRef.current = previousRows;
            const nextError = reason instanceof Error ? reason : new Error(String(reason));
            setError(nextError);
            onDataError?.(nextError);
        } finally {
            setDragState(null);
            setDropTarget(null);
        }
    };

    useImperativeHandle(ref, () => ({
        reload,
        refresh: reload,
        getDataSource: () => rowsRef.current,
        getVisibleItems: () => filteredRows,
        option(name) {
            if (name === "dataSource") return dataSource;
            if (name === "searchValue") return query;
            return undefined;
        }
    }), [reload, filteredRows, dataSource, query]);

    const renderDefaultCard = item => {
        const cardTitle = getValue(item, titleExpr) ?? getValue(item, "name") ?? getValue(item, "subject") ?? `#${getValue(item, keyExpr)}`;
        const description = getValue(item, descriptionExpr);
        const subtitle = subtitleExpr ? getValue(item, subtitleExpr) : null;
        const assignee = getValue(item, assigneeExpr);
        const avatar = avatarExpr ? getValue(item, avatarExpr) : null;
        const dueDate = getValue(item, dueDateExpr);
        const priority = getValue(item, priorityExpr);
        const tags = getValue(item, tagsExpr);

        return (
            <>
                {(priority || subtitle) && (
                    <div className="tmiv-board-card-kicker">
                        {priority && <span className={`tmiv-board-priority is-${String(priority).toLowerCase().replace(/\s+/g, "-")}`}>{priority}</span>}
                        {subtitle && <span>{subtitle}</span>}
                    </div>
                )}
                <div className="tmiv-board-card-title">{cardTitle}</div>
                {description && <div className="tmiv-board-card-description">{description}</div>}
                {Array.isArray(tags) && tags.length > 0 && (
                    <div className="tmiv-board-tags">
                        {tags.slice(0, 4).map(tag => <span key={String(tag)}>{String(tag)}</span>)}
                    </div>
                )}
                {(assignee || dueDate) && (
                    <div className="tmiv-board-card-footer">
                        {assignee ? (
                            <span className="tmiv-board-assignee" title={String(assignee)}>
                                {avatar ? <img src={avatar} alt="" /> : <span>{getInitials(assignee)}</span>}
                                <em>{String(assignee)}</em>
                            </span>
                        ) : <span />}
                        {dueDate && <time>{String(dueDate).slice(0, 10)}</time>}
                    </div>
                )}
            </>
        );
    };

    return (
        <section className={`tmiv-board ${dragState ? "is-dragging" : ""} ${className}`.trim()} style={height ? { height } : undefined}>
            <header className="tmiv-board-toolbar">
                <div className="tmiv-board-heading">
                    <h3>{title}</h3>
                    <span>{rows.length} items</span>
                </div>
                <div className="tmiv-board-toolbar-actions">
                    {showSearch && (
                        <label className="tmiv-board-search">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
                            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={searchPlaceholder} />
                            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
                        </label>
                    )}
                    {showRefresh && (
                        <button type="button" className="tmiv-board-refresh" onClick={() => void reload()} disabled={loading} title="Refresh board">↻</button>
                    )}
                </div>
            </header>

            {error && <div className="tmiv-board-error"><span>{error.message}</span><button type="button" onClick={() => void reload()}>Retry</button></div>}
            {loading && <div className="tmiv-board-loading"><span className="tmiv-board-spinner" />{loadingText}</div>}

            {!loading && !error && (
                <div className="tmiv-board-columns" style={{ gridAutoColumns: `minmax(${minColumnWidth}px, 1fr)` }}>
                    {lanes.map(lane => {
                        const laneKey = statusKey(lane.key);
                        const laneItems = itemsByLane.get(laneKey) || [];
                        return (
                            <article
                                className={`tmiv-board-column ${dropTarget?.laneKey === laneKey ? "is-drop-target" : ""}`}
                                key={laneKey}
                                style={{ "--tmiv-board-lane-color": lane.color }}
                                onDragOver={event => {
                                    if (!allowDragging || !dragState) return;
                                    event.preventDefault();
                                    if (!event.target.closest?.(".tmiv-board-card")) setDropTarget({ laneKey, index: laneItems.length });
                                }}
                                onDrop={event => {
                                    event.preventDefault();
                                    void moveCard(lane, dropTarget?.laneKey === laneKey ? dropTarget.index : laneItems.length);
                                }}
                            >
                                <header className="tmiv-board-column-header">
                                    <span className="tmiv-board-column-dot" />
                                    <h4>{lane.title}</h4>
                                    <span className="tmiv-board-count">{laneItems.length}</span>
                                    {lane.wipLimit != null && <span className={`tmiv-board-wip ${laneItems.length > lane.wipLimit ? "is-over" : ""}`}>/ {lane.wipLimit}</span>}
                                </header>
                                <div className="tmiv-board-column-body">
                                    {laneItems.map((item, index) => {
                                        const itemKey = getValue(item, keyExpr);
                                        const isDropBefore = dropTarget?.laneKey === laneKey && dropTarget.index === index;
                                        return (
                                            <React.Fragment key={String(itemKey)}>
                                                {isDropBefore && <div className="tmiv-board-drop-indicator" />}
                                                <div
                                                    className={`tmiv-board-card ${dragState?.key === itemKey ? "is-drag-source" : ""}`}
                                                    draggable={allowDragging}
                                                    onDragStart={event => {
                                                        event.dataTransfer.effectAllowed = "move";
                                                        event.dataTransfer.setData("text/plain", String(itemKey));
                                                        setDragState({ key: itemKey, fromStatus: getValue(item, statusExpr), fromIndex: index });
                                                    }}
                                                    onDragEnd={() => {
                                                        setDragState(null);
                                                        setDropTarget(null);
                                                    }}
                                                    onDragOver={event => {
                                                        if (!allowDragging || !dragState) return;
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        const rect = event.currentTarget.getBoundingClientRect();
                                                        const targetIndex = index + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
                                                        setDropTarget({ laneKey, index: targetIndex });
                                                    }}
                                                    onDrop={event => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        void moveCard(lane, dropTarget?.laneKey === laneKey ? dropTarget.index : index);
                                                    }}
                                                    onClick={event => onCardClick?.({ item, data: item, key: itemKey, event })}
                                                >
                                                    {allowDragging && <span className="tmiv-board-drag-handle" aria-hidden="true">⋮⋮</span>}
                                                    {(cardRender || cardTemplate)
                                                        ? (cardRender || cardTemplate)({ item, data: item, key: itemKey })
                                                        : renderDefaultCard(item)}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {dropTarget?.laneKey === laneKey && dropTarget.index >= laneItems.length && <div className="tmiv-board-drop-indicator" />}
                                    {laneItems.length === 0 && <div className="tmiv-board-column-empty">{emptyColumnText}</div>}
                                </div>
                            </article>
                        );
                    })}
                    {lanes.length === 0 && <div className="tmiv-board-no-data">{noDataText}</div>}
                </div>
            )}
        </section>
    );
});

BoardControl.displayName = "BoardControl";

export default BoardControl;
