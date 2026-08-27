import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = value => String(value).padStart(2, "0");

const toDateKey = date => date instanceof Date && !Number.isNaN(date.getTime())
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : "";

const fromDateKey = value => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
};

const sameDay = (left, right) => toDateKey(left) === toDateKey(right);

const parseRangeValue = value => {
    if (Array.isArray(value)) return [fromDateKey(value[0]), fromDateKey(value[1])];
    if (value && typeof value === "object") {
        return [
            fromDateKey(value.startDate ?? value.start ?? value.from),
            fromDateKey(value.endDate ?? value.end ?? value.to)
        ];
    }
    return [null, null];
};

const buildCalendarDays = viewDate => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return date;
    });
};

const DateBox = forwardRef(({
    value = "",
    onChange,
    onValueChanged,
    placeholder = "Select date",
    range = false,
    mode,
    selectionMode,
    type,
    locale = "en-GB",
    min,
    max,
    disabled = false,
    readOnly = false,
    clearable = true,
    name,
    startName,
    endName,
    className = "",
    width
}, ref) => {
    const isRange = range || mode === "range" || selectionMode === "range" || type === "range";
    const containerRef = useRef(null);
    const previousValueRef = useRef(value);
    const initialRange = parseRangeValue(value);
    const initialSingle = isRange ? null : fromDateKey(value);
    const currentValueRef = useRef(isRange
        ? { startDate: toDateKey(initialRange[0]), endDate: toDateKey(initialRange[1]) }
        : toDateKey(initialSingle));
    const [startDate, setStartDate] = useState(isRange ? initialRange[0] : initialSingle);
    const [endDate, setEndDate] = useState(isRange ? initialRange[1] : null);
    const [viewDate, setViewDate] = useState(initialRange[0] || initialSingle || new Date());
    const [opened, setOpened] = useState(false);
    const [calendarView, setCalendarView] = useState("days");

    const minDate = useMemo(() => fromDateKey(min), [min]);
    const maxDate = useMemo(() => fromDateKey(max), [max]);
    const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

    useEffect(() => {
        if (isRange) {
            const [nextStart, nextEnd] = parseRangeValue(value);
            setStartDate(nextStart);
            setEndDate(nextEnd);
            currentValueRef.current = { startDate: toDateKey(nextStart), endDate: toDateKey(nextEnd) };
            if (nextStart) setViewDate(nextStart);
        } else {
            const nextDate = fromDateKey(value);
            setStartDate(nextDate);
            setEndDate(null);
            currentValueRef.current = toDateKey(nextDate);
            if (nextDate) setViewDate(nextDate);
        }
        previousValueRef.current = value;
    }, [value, isRange]);

    useEffect(() => {
        if (!opened) return undefined;

        const closeOnOutsideClick = event => {
            if (!containerRef.current?.contains(event.target)) setOpened(false);
        };
        const closeOnEscape = event => {
            if (event.key === "Escape") setOpened(false);
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [opened]);

    const createValue = (start, end) => isRange
        ? { startDate: toDateKey(start), endDate: toDateKey(end) }
        : toDateKey(start);

    const emitValue = (start, end, event) => {
        const nextValue = createValue(start, end);
        currentValueRef.current = nextValue;
        onChange?.(nextValue);
        onValueChanged?.({ value: nextValue, previousValue: previousValueRef.current, event });
        previousValueRef.current = nextValue;
    };

    const applyInternalValue = nextValue => {
        if (isRange) {
            const [nextStart, nextEnd] = parseRangeValue(nextValue);
            setStartDate(nextStart);
            setEndDate(nextEnd);
            currentValueRef.current = { startDate: toDateKey(nextStart), endDate: toDateKey(nextEnd) };
            if (nextStart) setViewDate(nextStart);
        } else {
            const nextDate = fromDateKey(nextValue);
            setStartDate(nextDate);
            setEndDate(null);
            currentValueRef.current = toDateKey(nextDate);
            if (nextDate) setViewDate(nextDate);
        }
        previousValueRef.current = nextValue;
    };

    useImperativeHandle(ref, () => ({
        option(optionName, nextValue) {
            if (optionName !== "value") return undefined;
            if (arguments.length === 1) return currentValueRef.current;
            applyInternalValue(nextValue);
            return undefined;
        },
        getValue: () => currentValueRef.current,
        focus: () => containerRef.current?.querySelector(".tmivcom-datebox-trigger")?.focus(),
        open: () => !disabled && !readOnly && setOpened(true),
        close: () => setOpened(false)
    }), [startDate, endDate, disabled, readOnly, isRange]);

    const isDisabledDate = date => (
        (minDate && date < minDate) || (maxDate && date > maxDate)
    );

    const selectDate = (date, event) => {
        if (isDisabledDate(date)) return;

        if (!isRange) {
            setStartDate(date);
            emitValue(date, null, event);
            setOpened(false);
            return;
        }

        if (!startDate || endDate) {
            setStartDate(date);
            setEndDate(null);
            emitValue(date, null, event);
            return;
        }

        const nextStart = date < startDate ? date : startDate;
        const nextEnd = date < startDate ? startDate : date;
        setStartDate(nextStart);
        setEndDate(nextEnd);
        emitValue(nextStart, nextEnd, event);
        setOpened(false);
    };

    const clearValue = event => {
        event?.stopPropagation();
        setStartDate(null);
        setEndDate(null);
        emitValue(null, null, event);
    };

    const selectToday = event => {
        const today = new Date();
        if (!isDisabledDate(today)) selectDate(today, event);
    };

    const formatDisplayDate = date => date
        ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date)
        : "";

    const displayValue = isRange
        ? [formatDisplayDate(startDate), formatDisplayDate(endDate)].filter(Boolean).join(" – ")
        : formatDisplayDate(startDate);
    const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(viewDate);
    const monthNames = useMemo(() => Array.from({ length: 12 }, (_, monthIndex) => (
        new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, monthIndex, 1))
    )), [locale]);
    const yearPageStart = Math.floor(viewDate.getFullYear() / 10) * 10;
    const visibleYears = Array.from({ length: 12 }, (_, index) => yearPageStart + index);
    const calendarTitle = calendarView === "days"
        ? monthLabel
        : calendarView === "months"
            ? String(viewDate.getFullYear())
            : `${yearPageStart} – ${yearPageStart + 11}`;

    const moveCalendar = direction => {
        setViewDate(current => {
            if (calendarView === "years") {
                return new Date(current.getFullYear() + (direction * 10), current.getMonth(), 1);
            }
            if (calendarView === "months") {
                return new Date(current.getFullYear() + direction, current.getMonth(), 1);
            }
            return new Date(current.getFullYear(), current.getMonth() + direction, 1);
        });
    };

    const handleCalendarWheel = event => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 1 : -1;
        if (calendarView === "days" && (event.ctrlKey || event.shiftKey)) {
            setViewDate(current => new Date(current.getFullYear() + direction, current.getMonth(), 1));
            return;
        }
        moveCalendar(direction);
    };

    const zoomOutCalendar = () => {
        setCalendarView(current => current === "days" ? "months" : "years");
    };

    return (
        <div
            ref={containerRef}
            className={`tmivcom-datebox ${opened ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
            style={width ? { width } : undefined}
        >
            <div
                className="tmivcom-datebox-trigger"
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-haspopup="dialog"
                aria-expanded={opened}
                onClick={() => !disabled && !readOnly && setOpened(current => {
                    if (!current) setCalendarView("days");
                    return !current;
                })}
                onKeyDown={event => {
                    if ((event.key === "Enter" || event.key === " ") && !disabled && !readOnly) {
                        event.preventDefault();
                        setOpened(current => !current);
                    }
                }}
            >
                <svg className="tmivcom-datebox-calendar-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3v3m10-3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                </svg>
                <span className={`tmivcom-datebox-value ${displayValue ? "" : "is-placeholder"}`}>
                    {displayValue || (isRange ? "Select date range" : placeholder)}
                </span>
                {clearable && (startDate || endDate) && !disabled && !readOnly && (
                    <button type="button" className="tmivcom-datebox-clear" onClick={clearValue} title="Clear date" aria-label="Clear date">×</button>
                )}
                <svg className="tmivcom-datebox-chevron" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m6 8 4 4 4-4" />
                </svg>
            </div>

            {name && !isRange && <input type="hidden" name={name} value={toDateKey(startDate)} />}
            {isRange && (
                <>
                    {(startName || name) && <input type="hidden" name={startName || `${name}Start`} value={toDateKey(startDate)} />}
                    {(endName || name) && <input type="hidden" name={endName || `${name}End`} value={toDateKey(endDate)} />}
                </>
            )}

            {opened && (
                <div
                    className="tmivcom-datebox-popover"
                    role="dialog"
                    aria-label={isRange ? "Choose date range" : "Choose date"}
                    onWheel={handleCalendarWheel}
                >
                    <div className="tmivcom-datebox-header">
                        <button type="button" className="tmivcom-datebox-nav" onClick={() => moveCalendar(-1)} aria-label="Previous period">‹</button>
                        <button
                            type="button"
                            className="tmivcom-datebox-title"
                            onClick={zoomOutCalendar}
                            title="Click to choose month or year"
                        >
                            {calendarTitle}
                        </button>
                        <button type="button" className="tmivcom-datebox-nav" onClick={() => moveCalendar(1)} aria-label="Next period">›</button>
                    </div>

                    {calendarView === "days" && (
                        <>
                            <div className="tmivcom-datebox-weekdays">
                                {DAY_NAMES.map(day => <span key={day}>{day}</span>)}
                            </div>
                            <div className="tmivcom-datebox-days">
                                {calendarDays.map(date => {
                                    const key = toDateKey(date);
                                    const isStart = startDate && sameDay(date, startDate);
                                    const isEnd = endDate && sameDay(date, endDate);
                                    const inRange = isRange && startDate && endDate && date > startDate && date < endDate;
                                    const outsideMonth = date.getMonth() !== viewDate.getMonth();

                                    return (
                                        <button
                                            type="button"
                                            key={key}
                                            className={[
                                                "tmivcom-datebox-day",
                                                outsideMonth ? "is-outside" : "",
                                                sameDay(date, new Date()) ? "is-today" : "",
                                                inRange ? "is-in-range" : "",
                                                isStart ? "is-range-start" : "",
                                                isEnd ? "is-range-end" : ""
                                            ].filter(Boolean).join(" ")}
                                            disabled={isDisabledDate(date)}
                                            onClick={event => selectDate(date, event)}
                                            aria-label={formatDisplayDate(date)}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {calendarView === "months" && (
                        <div className="tmivcom-datebox-period-grid">
                            {monthNames.map((monthName, monthIndex) => (
                                <button
                                    type="button"
                                    key={monthName}
                                    className={monthIndex === viewDate.getMonth() ? "is-selected" : ""}
                                    onClick={() => {
                                        setViewDate(current => new Date(current.getFullYear(), monthIndex, 1));
                                        setCalendarView("days");
                                    }}
                                >
                                    {monthName}
                                </button>
                            ))}
                        </div>
                    )}

                    {calendarView === "years" && (
                        <div className="tmivcom-datebox-period-grid">
                            {visibleYears.map(year => (
                                <button
                                    type="button"
                                    key={year}
                                    className={year === viewDate.getFullYear() ? "is-selected" : ""}
                                    onClick={() => {
                                        setViewDate(current => new Date(year, current.getMonth(), 1));
                                        setCalendarView("months");
                                    }}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="tmivcom-datebox-footer">
                        <span className="tmivcom-datebox-hint">
                            {calendarView === "days"
                                ? (isRange && startDate && !endDate ? "Choose an end date" : (isRange ? "Start date – End date" : "Scroll to change month"))
                                : `Scroll to change ${calendarView === "months" ? "year" : "year range"}`}
                        </span>
                        <div className="tmivcom-datebox-actions">
                            {(startDate || endDate) && clearable && <button type="button" onClick={clearValue}>Clear</button>}
                            <button type="button" className="is-primary" onClick={selectToday}>Today</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

DateBox.displayName = "DateBox";

export default DateBox;
