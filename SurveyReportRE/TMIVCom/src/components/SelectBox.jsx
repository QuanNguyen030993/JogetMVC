import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";

const SelectBox = forwardRef(({
    value = "",
    onChange,
    dataSource = [],
    valueExpr = "id",
    displayExpr = "name",
    placeholder = "Select...",
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
        <div className="tmivcom-selectbox">
            <select
                value={val}
                disabled={disabled || readOnly}
                onChange={handleChange}
            >
                <option value="">{placeholder}</option>
                {dataSource.map((item, idx) => {
                    const itemVal = typeof item === 'object' ? (item[valueExpr] ?? item.id ?? item.key ?? '') : item;
                    const itemText = typeof item === 'object' ? (item[displayExpr] ?? item.value ?? item.text ?? item.name ?? '') : item;
                    return (
                        <option key={idx} value={itemVal}>
                            {itemText}
                        </option>
                    );
                })}
            </select>
        </div>
    );
});

SelectBox.displayName = "SelectBox";
export default SelectBox;
