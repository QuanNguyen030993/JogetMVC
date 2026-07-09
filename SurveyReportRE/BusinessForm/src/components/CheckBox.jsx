import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";

const CheckBox = forwardRef(({
    value = false,
    onChange,
    disabled = false,
    readOnly = false,
    text = "",
}, ref) => {
    const [val, setVal] = useState(!!value);

    useEffect(() => {
        setVal(!!value);
    }, [value]);

    const handleChange = (e) => {
        if (readOnly) return;
        const nextVal = e.target.checked;
        setVal(nextVal);
        onChange?.(nextVal);
    };

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return val;
                }
                const parsedVal = !!nextValue;
                setVal(parsedVal);
                onChange?.(parsedVal);
            }
        },
        value() {
            return val;
        }
    }));

    return (
        <div className="tmivcom-checkbox">
            <label className="tmivcom-checkbox-label">
                <input
                    type="checkbox"
                    checked={val}
                    disabled={disabled}
                    onChange={handleChange}
                />
                {text && <span className="tmivcom-checkbox-text">{text}</span>}
            </label>
        </div>
    );
});

CheckBox.displayName = "CheckBox";
export default CheckBox;
