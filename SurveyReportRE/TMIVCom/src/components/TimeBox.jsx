import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";

const padTime = value => String(value).padStart(2, "0");
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

const parseTime = value => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return { hour: value.getHours(), minute: value.getMinutes(), second: value.getSeconds() };
    }
    if (value && typeof value === "object") {
        return {
            hour: clamp(value.hour ?? value.hours, 0, 23),
            minute: clamp(value.minute ?? value.minutes, 0, 59),
            second: clamp(value.second ?? value.seconds, 0, 59)
        };
    }

    const match = String(value || "").match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?/);
    return match
        ? {
            hour: clamp(match[1], 0, 23),
            minute: clamp(match[2], 0, 59),
            second: clamp(match[3], 0, 59)
        }
        : { hour: 0, minute: 0, second: 0 };
};

const formatTimeValue = (time, showSeconds) => (
    `${padTime(time.hour)}:${padTime(time.minute)}${showSeconds ? `:${padTime(time.second)}` : ""}`
);

const positionOnDial = (value, radius, multiplier = 30) => {
    const angle = value * multiplier * (Math.PI / 180);
    return {
        left: `${120 + Math.sin(angle) * radius}px`,
        top: `${120 - Math.cos(angle) * radius}px`
    };
};

const TimeBox = forwardRef(({
    value = "",
    onChange,
    onValueChanged,
    placeholder = "Select time",
    use24Hour = true,
    showSeconds = false,
    minuteStep = 5,
    disabled = false,
    readOnly = false,
    clearable = true,
    name,
    className = "",
    width
}, ref) => {
    const containerRef = useRef(null);
    const hasInitialValue = value !== undefined && value !== null && value !== "";
    const initialTime = parseTime(value);
    const [time, setTime] = useState(initialTime);
    const [hasValue, setHasValue] = useState(hasInitialValue);
    const [opened, setOpened] = useState(false);
    const [clockView, setClockView] = useState("hours");
    const previousValueRef = useRef(hasInitialValue ? formatTimeValue(initialTime, showSeconds) : "");
    const currentValueRef = useRef(previousValueRef.current);

    const requestedMinuteStep = Number(minuteStep);
    const safeMinuteStep = requestedMinuteStep > 0 && 60 % requestedMinuteStep === 0
        ? requestedMinuteStep
        : 5;
    const minuteOptions = useMemo(
        () => Array.from({ length: 60 / safeMinuteStep }, (_, index) => index * safeMinuteStep),
        [safeMinuteStep]
    );

    useEffect(() => {
        const nextHasValue = value !== undefined && value !== null && value !== "";
        const nextTime = parseTime(value);
        const nextValue = nextHasValue ? formatTimeValue(nextTime, showSeconds) : "";
        setTime(nextTime);
        setHasValue(nextHasValue);
        currentValueRef.current = nextValue;
        previousValueRef.current = nextValue;
    }, [value, showSeconds]);

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

    const emitTime = (nextTime, event) => {
        const nextValue = formatTimeValue(nextTime, showSeconds);
        currentValueRef.current = nextValue;
        setTime(nextTime);
        setHasValue(true);
        onChange?.(nextValue);
        onValueChanged?.({ value: nextValue, previousValue: previousValueRef.current, event });
        previousValueRef.current = nextValue;
    };

    const applyInternalValue = nextValue => {
        const nextHasValue = nextValue !== undefined && nextValue !== null && nextValue !== "";
        const nextTime = parseTime(nextValue);
        const normalizedValue = nextHasValue ? formatTimeValue(nextTime, showSeconds) : "";
        setTime(nextTime);
        setHasValue(nextHasValue);
        currentValueRef.current = normalizedValue;
        previousValueRef.current = normalizedValue;
    };

    useImperativeHandle(ref, () => ({
        option(optionName, nextValue) {
            if (optionName !== "value") return undefined;
            if (arguments.length === 1) return currentValueRef.current;
            applyInternalValue(nextValue);
            return undefined;
        },
        getValue: () => currentValueRef.current,
        focus: () => containerRef.current?.querySelector(".tmivcom-timebox-trigger")?.focus(),
        open: () => !disabled && !readOnly && setOpened(true),
        close: () => setOpened(false)
    }), [disabled, readOnly, showSeconds]);

    const clearValue = event => {
        event?.stopPropagation();
        const previousValue = currentValueRef.current;
        setHasValue(false);
        currentValueRef.current = "";
        onChange?.("");
        onValueChanged?.({ value: "", previousValue, event });
        previousValueRef.current = "";
    };

    const selectHour = (hour, event) => {
        let nextHour = hour;
        if (!use24Hour) {
            const isPm = time.hour >= 12;
            nextHour = isPm ? (hour % 12) + 12 : hour % 12;
        }
        emitTime({ ...time, hour: nextHour }, event);
        setClockView("minutes");
    };

    const selectMinuteOrSecond = (valueToSet, event) => {
        const key = clockView === "seconds" ? "second" : "minute";
        emitTime({ ...time, [key]: valueToSet }, event);
        if (clockView === "minutes" && showSeconds) setClockView("seconds");
    };

    const togglePeriod = (period, event) => {
        const nextHour = period === "PM" ? (time.hour % 12) + 12 : time.hour % 12;
        emitTime({ ...time, hour: nextHour }, event);
    };

    const hourItems = use24Hour
        ? [
            ...Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: index + 1, radius: 94 })),
            ...Array.from({ length: 12 }, (_, index) => ({ value: index === 11 ? 0 : index + 13, label: index === 11 ? "00" : index + 13, radius: 63 }))
        ]
        : Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: index + 1, radius: 94 }));
    const dialValue = clockView === "hours" ? time.hour : clockView === "seconds" ? time.second : time.minute;
    const handAngle = clockView === "hours" ? (time.hour % 12) * 30 : dialValue * 6;
    const handLength = clockView === "hours" && use24Hour && (time.hour === 0 || time.hour > 12) ? 63 : 94;

    return (
        <div
            ref={containerRef}
            className={`tmivcom-timebox ${opened ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
            style={width ? { width } : undefined}
        >
            <div
                className="tmivcom-timebox-trigger"
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-haspopup="dialog"
                aria-expanded={opened}
                onClick={() => !disabled && !readOnly && setOpened(current => {
                    if (!current) setClockView("hours");
                    return !current;
                })}
                onKeyDown={event => {
                    if ((event.key === "Enter" || event.key === " ") && !disabled && !readOnly) {
                        event.preventDefault();
                        setOpened(current => !current);
                    }
                }}
            >
                <svg className="tmivcom-timebox-clock-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" />
                </svg>
                <span className={`tmivcom-timebox-value ${hasValue ? "" : "is-placeholder"}`}>
                    {hasValue ? formatTimeValue(time, showSeconds) : placeholder}
                </span>
                {clearable && hasValue && !disabled && !readOnly && (
                    <button type="button" className="tmivcom-timebox-clear" onClick={clearValue} title="Clear time" aria-label="Clear time">×</button>
                )}
                <svg className="tmivcom-timebox-chevron" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m6 8 4 4 4-4" />
                </svg>
            </div>

            {name && <input type="hidden" name={name} value={hasValue ? formatTimeValue(time, showSeconds) : ""} />}

            {opened && (
                <div className="tmivcom-timebox-popover" role="dialog" aria-label="Choose time">
                    <div className="tmivcom-timebox-display">
                        <div className="tmivcom-timebox-digits">
                            <button type="button" className={clockView === "hours" ? "is-active" : ""} onClick={() => setClockView("hours")}>
                                {padTime(use24Hour ? time.hour : (time.hour % 12 || 12))}
                            </button>
                            <span>:</span>
                            <button type="button" className={clockView === "minutes" ? "is-active" : ""} onClick={() => setClockView("minutes")}>
                                {padTime(time.minute)}
                            </button>
                            {showSeconds && (
                                <>
                                    <span>:</span>
                                    <button type="button" className={clockView === "seconds" ? "is-active" : ""} onClick={() => setClockView("seconds")}>
                                        {padTime(time.second)}
                                    </button>
                                </>
                            )}
                        </div>
                        {!use24Hour && (
                            <div className="tmivcom-timebox-period">
                                <button type="button" className={time.hour < 12 ? "is-active" : ""} onClick={event => togglePeriod("AM", event)}>AM</button>
                                <button type="button" className={time.hour >= 12 ? "is-active" : ""} onClick={event => togglePeriod("PM", event)}>PM</button>
                            </div>
                        )}
                    </div>

                    <div className="tmivcom-timebox-dial">
                        <span
                            className="tmivcom-timebox-hand"
                            style={{ height: `${handLength}px`, transform: `rotate(${handAngle}deg)` }}
                        />
                        <span className="tmivcom-timebox-center" />
                        {clockView === "hours"
                            ? hourItems.map(item => (
                                <button
                                    type="button"
                                    key={item.value}
                                    className={time.hour === item.value || (!use24Hour && (time.hour % 12 || 12) === item.value) ? "is-selected" : ""}
                                    style={positionOnDial(item.value % 12, item.radius)}
                                    onClick={event => selectHour(item.value, event)}
                                >
                                    {item.label}
                                </button>
                            ))
                            : minuteOptions.map(item => (
                                <button
                                    type="button"
                                    key={item}
                                    className={dialValue === item ? "is-selected" : ""}
                                    style={positionOnDial(item, 94, 6)}
                                    onClick={event => selectMinuteOrSecond(item, event)}
                                >
                                    {padTime(item)}
                                </button>
                            ))}
                    </div>

                    <div className="tmivcom-timebox-footer">
                        <button type="button" onClick={() => {
                            const now = new Date();
                            emitTime({ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }, null);
                        }}>Now</button>
                        <button type="button" className="is-primary" onClick={() => setOpened(false)}>Done</button>
                    </div>
                </div>
            )}
        </div>
    );
});

TimeBox.displayName = "TimeBox";

export default TimeBox;
