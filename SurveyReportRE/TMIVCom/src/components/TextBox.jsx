import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";

const TextBox = forwardRef(({
    value = "",
    onChange,
    placeholder = "",
    disabled = false,
    readOnly = false,
}, ref) => {
    const [val, setVal] = useState(value);

    useEffect(() => {
        setVal(value ?? "");
    }, [value]);

    const handleChange = (e) => {
        const nextVal = e.target.value;
        setVal(nextVal);
        onChange?.(nextVal);
    };

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return val;
                }
                setVal(nextValue ?? "");
                onChange?.(nextValue ?? "");
            }
        },
        value() {
            return val;
        }
    }));

    return (
        <div className="tmivcom-textbox">
            <input
                type="text"
                value={val}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                onChange={handleChange}
            />
        </div>
    );
});

TextBox.displayName = "TextBox";
export default TextBox;
