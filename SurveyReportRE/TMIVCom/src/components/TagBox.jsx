import React, {
    forwardRef,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";

const normalizeSource = (source) => {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (Array.isArray(source?.items)) return source.items;
    if (typeof source?.items === "function") {
        const result = source.items();
        return Array.isArray(result) ? result : [];
    }
    return [];
};

const readExpr = (item, expr, fallbacks = []) => {
    if (typeof expr === "function") return expr(item);
    if (expr === "this" || expr == null || expr === "") return item;
    if (item == null || typeof item !== "object") return item;

    if (Object.prototype.hasOwnProperty.call(item, expr)) return item[expr];
    for (const key of fallbacks) {
        if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
    }
    return "";
};

const sameValue = (left, right) => String(left ?? "") === String(right ?? "");
const uniqueValues = (values) => (Array.isArray(values) ? values : [])
    .filter((value, index, source) => source.findIndex(item => sameValue(item, value)) === index);

const TagBox = forwardRef(({
    value = [],
    defaultValue = [],
    dataSource = [],
    items,
    valueExpr = "id",
    displayExpr = "name",
    searchExpr,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    noDataText = "No data",
    selectAllText = "Select all",
    doneButtonText = "Done",
    cancelButtonText = "Cancel",
    disabled = false,
    readOnly = false,
    visible = true,
    searchEnabled = true,
    showClearButton = true,
    showDropDownButton = true,
    showSelectionControls = true,
    showSelectAll = false,
    acceptCustomValue = false,
    applyValueMode = "instantly",
    closeOnSelect = false,
    multiline = true,
    maxDisplayedTags,
    showMultiTagOnly = false,
    opened,
    name,
    width,
    className = "",
    inputAttr = {},
    elementAttr = {},
    itemTemplate,
    tagTemplate,
    onChange,
    onValueChanged,
    onSelectionChanged,
    onCustomItemCreating,
    onOpened,
    onClosed,
    onFocusIn,
    onFocusOut
}, ref) => {
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const popupId = useId();
    const apiRef = useRef(null);
    const isControlled = Array.isArray(value);
    const initialValue = isControlled ? value : defaultValue;

    const [selectedValues, setSelectedValues] = useState(uniqueValues(initialValue));
    const [draftValues, setDraftValues] = useState(uniqueValues(initialValue));
    const [sourceItems, setSourceItems] = useState(normalizeSource(items ?? dataSource));
    const [isOpen, setIsOpen] = useState(Boolean(opened));
    const [searchValue, setSearchValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [disabledState, setDisabledState] = useState(Boolean(disabled));
    const [readOnlyState, setReadOnlyState] = useState(Boolean(readOnly));

    useEffect(() => {
        if (!isControlled) return;
        const next = uniqueValues(value);
        setSelectedValues(next);
        if (!isOpen || applyValueMode !== "useButtons") setDraftValues(next);
    }, [value, isControlled, isOpen, applyValueMode]);

    useEffect(() => setSourceItems(normalizeSource(items ?? dataSource)), [items, dataSource]);
    useEffect(() => setDisabledState(Boolean(disabled)), [disabled]);
    useEffect(() => setReadOnlyState(Boolean(readOnly)), [readOnly]);
    useEffect(() => {
        if (typeof opened === "boolean") setIsOpen(opened && !disabledState && !readOnlyState);
    }, [opened, disabledState, readOnlyState]);

    const getValue = (item) => readExpr(item, valueExpr, ["id", "key", "value"]);
    const getText = (item) => String(readExpr(item, displayExpr, ["name", "text", "label", "value"]) ?? "");
    const findItem = (itemValue) => sourceItems.find(item => sameValue(getValue(item), itemValue));

    const searchFields = useMemo(() => {
        if (Array.isArray(searchExpr)) return searchExpr;
        if (searchExpr) return [searchExpr];
        return [displayExpr];
    }, [searchExpr, displayExpr]);

    const filteredItems = useMemo(() => {
        const term = searchValue.trim().toLocaleLowerCase();
        if (!term) return sourceItems;
        return sourceItems.filter(item => searchFields.some(expr =>
            String(readExpr(item, expr, ["name", "text", "label", "value"]) ?? "")
                .toLocaleLowerCase()
                .includes(term)
        ));
    }, [sourceItems, searchFields, searchValue]);

    const emitValue = (nextValue, event = null) => {
        const next = uniqueValues(nextValue);
        const previousValue = selectedValues;
        if (next.length === previousValue.length && next.every((item, index) => sameValue(item, previousValue[index]))) {
            return next;
        }

        const addedValues = next.filter(item => !previousValue.some(valueItem => sameValue(valueItem, item)));
        const removedValues = previousValue.filter(item => !next.some(valueItem => sameValue(valueItem, item)));
        setSelectedValues(next);
        setDraftValues(next);
        onChange?.(next);
        onValueChanged?.({ value: next, previousValue, event, component: apiRef.current });
        onSelectionChanged?.({
            addedItems: addedValues.map(item => findItem(item) ?? item),
            removedItems: removedValues.map(item => findItem(item) ?? item),
            component: apiRef.current
        });
        return next;
    };

    const changeOpen = (nextOpen) => {
        const allowed = Boolean(nextOpen) && !disabledState && !readOnlyState;
        if (allowed === isOpen) return;
        if (allowed) {
            setDraftValues(selectedValues);
            setSearchValue("");
            setActiveIndex(-1);
            onOpened?.({ component: apiRef.current });
        } else {
            setSearchValue("");
            setActiveIndex(-1);
            onClosed?.({ component: apiRef.current });
        }
        setIsOpen(allowed);
    };

    useEffect(() => {
        const handleOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) changeOpen(false);
        };
        document.addEventListener("mousedown", handleOutside, true);
        return () => document.removeEventListener("mousedown", handleOutside, true);
    });

    const displayedSelection = applyValueMode === "useButtons" && isOpen
        ? draftValues
        : selectedValues;

    const changeSelection = (next, event) => {
        if (applyValueMode === "useButtons" && isOpen) {
            setDraftValues(uniqueValues(next));
        } else {
            emitValue(next, event);
        }
    };

    const toggleItem = (item, event) => {
        if (disabledState || readOnlyState) return;
        const itemValue = getValue(item);
        const exists = displayedSelection.some(valueItem => sameValue(valueItem, itemValue));
        changeSelection(
            exists
                ? displayedSelection.filter(valueItem => !sameValue(valueItem, itemValue))
                : [...displayedSelection, itemValue],
            event
        );
        if (closeOnSelect && applyValueMode !== "useButtons") changeOpen(false);
        else inputRef.current?.focus();
    };

    const removeTag = (itemValue, event) => {
        event?.stopPropagation();
        if (disabledState || readOnlyState) return;
        emitValue(selectedValues.filter(valueItem => !sameValue(valueItem, itemValue)), event);
    };

    const createCustomItem = (event) => {
        const text = searchValue.trim();
        if (!acceptCustomValue || !text) return false;
        const args = { text, customItem: null, component: apiRef.current };
        onCustomItemCreating?.(args);
        const customItem = args.customItem ?? text;
        const customValue = typeof customItem === "object" ? getValue(customItem) : customItem;
        if (customItem && typeof customItem === "object"
            && !sourceItems.some(item => sameValue(getValue(item), customValue))) {
            setSourceItems(previous => [...previous, customItem]);
        }
        changeSelection([...displayedSelection, customValue], event);
        setSearchValue("");
        return true;
    };

    const handleKeyDown = (event) => {
        if (disabledState || readOnlyState) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) changeOpen(true);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex(previous => {
                if (!filteredItems.length) return -1;
                return (previous + direction + filteredItems.length) % filteredItems.length;
            });
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            if (isOpen && activeIndex >= 0 && filteredItems[activeIndex]) {
                toggleItem(filteredItems[activeIndex], event);
            } else if (!createCustomItem(event)) {
                changeOpen(true);
            }
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            changeOpen(false);
            return;
        }
        if (event.key === "Backspace" && !searchValue && selectedValues.length) {
            removeTag(selectedValues[selectedValues.length - 1], event);
        }
    };

    useImperativeHandle(ref, () => {
        const api = {
            option(name, nextValue) {
                if (arguments.length === 1) {
                    const options = {
                        value: selectedValues,
                        dataSource: sourceItems,
                        items: sourceItems,
                        disabled: disabledState,
                        readOnly: readOnlyState,
                        opened: isOpen,
                        searchValue
                    };
                    return options[name];
                }
                if (name === "value") emitValue(Array.isArray(nextValue) ? nextValue : []);
                else if (name === "dataSource" || name === "items") setSourceItems(normalizeSource(nextValue));
                else if (name === "disabled") {
                    setDisabledState(Boolean(nextValue));
                    if (nextValue) setIsOpen(false);
                } else if (name === "readOnly") {
                    setReadOnlyState(Boolean(nextValue));
                    if (nextValue) setIsOpen(false);
                } else if (name === "opened") changeOpen(Boolean(nextValue));
                else if (name === "searchValue") setSearchValue(String(nextValue ?? ""));
                return api;
            },
            value(nextValue) {
                if (arguments.length === 0) return selectedValues;
                emitValue(Array.isArray(nextValue) ? nextValue : []);
                return api;
            },
            open() { changeOpen(true); return api; },
            close() { changeOpen(false); return api; },
            focus() { inputRef.current?.focus(); return api; },
            clear() { emitValue([]); return api; }
        };
        apiRef.current = api;
        return api;
    });

    if (!visible) return null;

    const numericMax = Number(maxDisplayedTags);
    const hasTagLimit = Number.isFinite(numericMax) && numericMax >= 0;
    const visibleTagCount = hasTagLimit && selectedValues.length > numericMax
        ? (showMultiTagOnly ? 0 : numericMax)
        : selectedValues.length;
    const visibleValues = selectedValues.slice(0, visibleTagCount);
    const hiddenTagCount = selectedValues.length - visibleValues.length;
    const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(item =>
        displayedSelection.some(valueItem => sameValue(valueItem, getValue(item)))
    );

    return (
        <div
            {...elementAttr}
            ref={rootRef}
            className={[
                "tmivcom-tagbox",
                isOpen ? "is-open" : "",
                disabledState ? "is-disabled" : "",
                readOnlyState ? "is-readonly" : "",
                multiline ? "is-multiline" : "is-singleline",
                className,
                elementAttr.className
            ].filter(Boolean).join(" ")}
            style={{ width, ...elementAttr.style }}
        >
            <div
                className="tmivcom-tagbox-control"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={popupId}
                aria-disabled={disabledState}
                aria-readonly={readOnlyState}
                onClick={() => {
                    if (!disabledState && !readOnlyState) {
                        changeOpen(true);
                        inputRef.current?.focus();
                    }
                }}
            >
                <div className="tmivcom-tagbox-tags">
                    {visibleValues.map((itemValue, index) => {
                        const item = findItem(itemValue) ?? itemValue;
                        const text = typeof item === "object" ? getText(item) : String(item ?? "");
                        return tagTemplate ? (
                            <React.Fragment key={`${String(itemValue)}_${index}`}>
                                {tagTemplate(item, { value: itemValue, text, index, remove: event => removeTag(itemValue, event) })}
                            </React.Fragment>
                        ) : (
                            <span className="tmivcom-tagbox-tag" key={`${String(itemValue)}_${index}`}>
                                <span className="tmivcom-tagbox-tag-content">{text}</span>
                                {!disabledState && !readOnlyState && (
                                    <button
                                        type="button"
                                        className="tmivcom-tagbox-tag-remove"
                                        aria-label={`Remove ${text}`}
                                        onClick={event => removeTag(itemValue, event)}
                                    >×</button>
                                )}
                            </span>
                        );
                    })}

                    {hiddenTagCount > 0 && (
                        <span className="tmivcom-tagbox-multitag">+{hiddenTagCount} more</span>
                    )}

                    <input
                        {...inputAttr}
                        ref={inputRef}
                        className={`tmivcom-tagbox-input ${inputAttr.className || ""}`.trim()}
                        value={searchValue}
                        placeholder={selectedValues.length ? "" : placeholder}
                        disabled={disabledState}
                        readOnly={readOnlyState || !searchEnabled}
                        aria-autocomplete="list"
                        onFocus={event => onFocusIn?.({ event, component: apiRef.current })}
                        onBlur={event => onFocusOut?.({ event, component: apiRef.current })}
                        onChange={event => {
                            setSearchValue(event.target.value);
                            setActiveIndex(-1);
                            if (!isOpen) changeOpen(true);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {showClearButton && selectedValues.length > 0 && !disabledState && !readOnlyState && (
                    <button
                        type="button"
                        className="tmivcom-tagbox-clear"
                        aria-label="Clear selection"
                        title="Clear"
                        onClick={event => {
                            event.stopPropagation();
                            emitValue([], event);
                        }}
                    >×</button>
                )}

                {showDropDownButton && (
                    <button
                        type="button"
                        className="tmivcom-tagbox-dropdown-button"
                        disabled={disabledState}
                        tabIndex={-1}
                        aria-label={isOpen ? "Close" : "Open"}
                        onClick={event => {
                            event.stopPropagation();
                            changeOpen(!isOpen);
                            inputRef.current?.focus();
                        }}
                    >
                        <span aria-hidden="true" />
                    </button>
                )}
            </div>

            {name && <input type="hidden" name={name} value={JSON.stringify(selectedValues)} />}

            {isOpen && (
                <div className="tmivcom-tagbox-popup" id={popupId} role="listbox" aria-multiselectable="true">
                    {showSelectAll && filteredItems.length > 0 && (
                        <button
                            type="button"
                            className={`tmivcom-tagbox-select-all ${allFilteredSelected ? "is-selected" : ""}`}
                            onClick={event => {
                                const filteredValues = filteredItems.map(getValue);
                                changeSelection(
                                    allFilteredSelected
                                        ? displayedSelection.filter(valueItem => !filteredValues.some(item => sameValue(item, valueItem)))
                                        : uniqueValues([...displayedSelection, ...filteredValues]),
                                    event
                                );
                            }}
                        >
                            <span className="tmivcom-tagbox-checkbox" aria-hidden="true" />
                            <span>{selectAllText}</span>
                        </button>
                    )}

                    <div className="tmivcom-tagbox-list">
                        {filteredItems.length === 0 && !acceptCustomValue ? (
                            <div className="tmivcom-tagbox-empty">{noDataText}</div>
                        ) : filteredItems.map((item, index) => {
                            const itemValue = getValue(item);
                            const selected = displayedSelection.some(valueItem => sameValue(valueItem, itemValue));
                            return (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={[
                                        "tmivcom-tagbox-item",
                                        selected ? "is-selected" : "",
                                        activeIndex === index ? "is-active" : ""
                                    ].filter(Boolean).join(" ")}
                                    key={`${String(itemValue)}_${index}`}
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={event => toggleItem(item, event)}
                                >
                                    {showSelectionControls && <span className="tmivcom-tagbox-checkbox" aria-hidden="true" />}
                                    <span className="tmivcom-tagbox-item-content">
                                        {itemTemplate ? itemTemplate(item) : getText(item)}
                                    </span>
                                </button>
                            );
                        })}

                        {acceptCustomValue && searchValue.trim()
                            && !filteredItems.some(item => sameValue(getText(item), searchValue.trim())) && (
                            <button
                                type="button"
                                className="tmivcom-tagbox-item tmivcom-tagbox-custom-item"
                                onMouseDown={event => event.preventDefault()}
                                onClick={event => createCustomItem(event)}
                            >Add “{searchValue.trim()}”</button>
                        )}
                    </div>

                    {applyValueMode === "useButtons" && (
                        <div className="tmivcom-tagbox-footer">
                            <button type="button" onClick={() => changeOpen(false)}>{cancelButtonText}</button>
                            <button
                                type="button"
                                className="is-primary"
                                onClick={event => {
                                    emitValue(draftValues, event);
                                    changeOpen(false);
                                }}
                            >{doneButtonText}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

TagBox.displayName = "TagBox";
export default TagBox;
