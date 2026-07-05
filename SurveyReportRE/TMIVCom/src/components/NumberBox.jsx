import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";

const NumberBox = forwardRef(({
    value = "",
    onChange,
    placeholder = "",
    disabled = false,
    readOnly = false,
    min,
    max,
    step,
}, ref) => {
    const [val, setVal] = useState(value);

    useEffect(() => {
        setVal(value ?? "");
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value;
        const nextVal = raw === "" ? "" : Number(raw);
        setVal(nextVal);
        onChange?.(nextVal);
    };

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return val;
                }
                const parsedVal = nextValue === "" || nextValue == null ? "" : Number(nextValue);
                setVal(parsedVal);
                onChange?.(parsedVal);
            }
        },
        value() {
            return val;
        }
    }));

    return (
        <div className="tmivcom-numberbox">
            <input
                type="number"
                value={val}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
            />
        </div>
    );
});

NumberBox.displayName = "NumberBox";
export default NumberBox;
