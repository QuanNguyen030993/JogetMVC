import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const SelectBox = forwardRef(({
    value = "",
    onChange,
    dataSource = [],
    valueExpr = "id",
    displayExpr = "name",
    placeholder = "Select...",
    disabled = false,
    readOnly = false,
    itemTemplate,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [val, setVal] = useState(value);
    const [selectedItem, setSelectedItem] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setVal(value);
    }, [value]);

    useEffect(() => {
        const selected = dataSource.find(item => {
            const itemVal = typeof item === 'object' ? (item[valueExpr] ?? item.id ?? item.key ?? '') : item;
            return String(itemVal) === String(val);
        });
        setSelectedItem(selected || null);
    }, [val, dataSource, valueExpr]);

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return val;
                }
                setVal(nextValue);
                onChange?.(nextValue);
            }
        },
        value() {
            return val;
        }
    }));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = (item) => {
        const nextVal = typeof item === 'object' ? (item[valueExpr] ?? item.id ?? item.key ?? '') : item;
        setVal(nextVal);
        onChange?.(nextVal);
        setIsOpen(false);
    };

    const displayVal = selectedItem 
        ? (typeof selectedItem === 'object' ? (selectedItem[displayExpr] ?? selectedItem.value ?? selectedItem.text ?? selectedItem.name ?? '') : selectedItem)
        : "";

    return (
        <div className="tmivcom-selectbox" ref={containerRef}>
            <div 
                className={`tmivcom-selectbox-input ${disabled || readOnly ? 'disabled' : ''}`}
                onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
            >
                {selectedItem && itemTemplate ? (
                    <div className="tmivcom-selectbox-selected-template">
                        {itemTemplate(selectedItem)}
                    </div>
                ) : (
                    <input
                        type="text"
                        readOnly
                        value={displayVal}
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                )}
                <button type="button" className="tmivcom-selectbox-button">
                    ▾
                </button>
            </div>
            {isOpen && (
                <div className="tmivcom-selectbox-popup">
                    <ul className="tmivcom-selectbox-list">
                        <li 
                            className="tmivcom-selectbox-item placeholder"
                            onClick={() => handleItemClick("")}
                        >
                            {placeholder}
                        </li>
                        {dataSource.map((item, idx) => {
                            const itemVal = typeof item === 'object' ? (item[valueExpr] ?? item.id ?? item.key ?? '') : item;
                            const isSelected = String(itemVal) === String(val);
                            return (
                                <li 
                                    key={idx} 
                                    className={`tmivcom-selectbox-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleItemClick(item)}
                                >
                                    {itemTemplate ? (
                                        <div className="tmivcom-selectbox-item-template">
                                            {itemTemplate(item)}
                                        </div>
                                    ) : (
                                        <span>
                                            {typeof item === 'object' ? (item[displayExpr] ?? item.value ?? item.text ?? item.name ?? '') : item}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
});

SelectBox.displayName = "SelectBox";
export default SelectBox;
