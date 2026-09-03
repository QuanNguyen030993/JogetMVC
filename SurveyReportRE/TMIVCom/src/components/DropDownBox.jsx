import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import CustomGrid from "./CustomGrid";

const DropDownBox = forwardRef(({
    value = "",
    onChange,
    modelName,
    dataSource,
    columns,
    valueExpr = "Id",
    displayExpr = "name",
    placeholder = "Select...",
    disabled = false,
    readOnly = false,
    gridOption = {},
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [val, setVal] = useState(value);
    const [displayText, setDisplayText] = useState("");
    const containerRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        setVal(value);
    }, [value]);

    useEffect(() => {
        if (!val) {
            setDisplayText("");
            return;
        }

        const fetchDisplayText = async () => {
            if (modelName) {
                try {
                    const API_BASE_URL = window.CONFIG?.API_URL || 'https://localhost:7254';
                    const res = await fetch(`${API_BASE_URL}/api/${modelName}/GetAll`);
                    if (res.ok) {
                        const data = await res.json();
                        const rows = Array.isArray(data) ? data : data?.data ?? [];
                        const selectedRow = rows.find(r => String(r[valueExpr] ?? r.id ?? r.Id) === String(val));
                        if (selectedRow) {
                            setDisplayText(selectedRow[displayExpr] ?? selectedRow.name ?? val);
                        } else {
                            setDisplayText(val);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch display text for DropDownBox:", e);
                    setDisplayText(val);
                }
            } else if (dataSource) {
                const rows = Array.isArray(dataSource) ? dataSource : [];
                const selectedRow = rows.find(r => String(r[valueExpr] ?? r.id ?? r.Id) === String(val));
                if (selectedRow) {
                    setDisplayText(selectedRow[displayExpr] ?? selectedRow.name ?? val);
                } else {
                    setDisplayText(val);
                }
            }
        };

        fetchDisplayText();
    }, [val, modelName, dataSource, valueExpr, displayExpr]);

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

    const handleRowClick = (row) => {
        const nextVal = row[valueExpr] ?? row.id ?? row.Id;
        setVal(nextVal);
        setDisplayText(row[displayExpr] ?? row.name ?? nextVal);
        onChange?.(nextVal);
        setIsOpen(false);
    };

    const resolvedColumns = useMemo(() => {
        if (columns) return columns;
        if (Array.isArray(dataSource) && dataSource.length > 0) {
            return Object.keys(dataSource[0]).filter(key => key !== 'id' && key !== 'Id');
        }
        return ['Id', 'name'];
    }, [columns, dataSource]);

    return (
        <div className="tmivcom-dropdownbox" ref={containerRef}>
            <div 
                className={`tmivcom-dropdownbox-input ${disabled || readOnly ? 'disabled' : ''}`}
                onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
            >
                <input
                    type="text"
                    readOnly
                    value={displayText}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                <button type="button" className="tmivcom-dropdownbox-button">
                    ▾
                </button>
            </div>
            {isOpen && (
                <div className="tmivcom-dropdownbox-popup">
                    <CustomGrid
                        ref={gridRef}
                        modelName={modelName}
                        dataSource={dataSource}
                        columns={resolvedColumns}
                        gridOption={gridOption}
                        onRowsChange={() => {}}
                        rowTemplate={({ row, columns, defaultRowProps }) => (
                            <tr 
                                {...defaultRowProps} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(row);
                                }}
                                style={{ ...defaultRowProps.style, cursor: 'pointer' }}
                            >
                                {columns.map((column) => (
                                    <td key={column.field || `col-${column.caption}`} className="grid-cell tmivcom-grid-cell">
                                        <div className="grid-cell-content">
                                            {row[column.field] ?? ''}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        )}
                    />
                </div>
            )}
        </div>
    );
});

DropDownBox.displayName = "DropDownBox";
export default DropDownBox;
