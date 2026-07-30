import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { notify } from './Notification';

const HandsomGrid = forwardRef(({
    columns = [], // Array of { dataField, caption, dataType: 'string'|'number'|'boolean'|'date'|'lookup', lookup: { dataSource, valueExpr, displayExpr }, width }
    rows = [], // Array of row objects
    onRowsChange, // Callback on data change
    readOnly = false,
    theme = 'light', // 'light' | 'dark'
    height = '400px',
    allowInsert = true,
    allowDelete = true,
    showHeaders = true, // Show column headers (A, B, C...)
    allowCopyPaste = true
}, ref) => {
    const [gridData, setGridData] = useState([]);
    const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
    const [editCell, setEditCell] = useState({ row: -1, col: -1, tempValue: '' });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, row: -1 });
    
    const gridRef = useRef(null);

    // Initial load
    useEffect(() => {
        setGridData(rows || []);
    }, [rows]);

    // Keyboard navigation handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedCell.row === -1 || selectedCell.col === -1) return;
            const isEditing = editCell.row !== -1;

            if (isEditing) {
                if (e.key === 'Escape') {
                    // Cancel editing
                    setEditCell({ row: -1, col: -1, tempValue: '' });
                    gridRef.current?.focus();
                } else if (e.key === 'Enter') {
                    // Save and move down
                    saveCellEdit();
                    e.preventDefault();
                    if (selectedCell.row < gridData.length - 1) {
                        setSelectedCell(prev => ({ ...prev, row: prev.row + 1 }));
                    }
                } else if (e.key === 'Tab') {
                    // Save and move right
                    saveCellEdit();
                    e.preventDefault();
                    if (selectedCell.col < columns.length - 1) {
                        setSelectedCell(prev => ({ ...prev, col: prev.col + 1 }));
                    }
                }
                return;
            }

            // Navigation mode keys
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedCell(prev => ({ ...prev, row: Math.max(0, prev.row - 1) }));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedCell(prev => ({ ...prev, row: Math.min(gridData.length - 1, prev.row + 1) }));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    setSelectedCell(prev => ({ ...prev, col: Math.max(0, prev.col - 1) }));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setSelectedCell(prev => ({ ...prev, col: Math.min(columns.length - 1, prev.col + 1) }));
                    break;
                case 'Enter':
                case 'F2':
                    e.preventDefault();
                    startCellEdit(selectedCell.row, selectedCell.col);
                    break;
                case 'Delete':
                case 'Backspace':
                    if (!readOnly) {
                        e.preventDefault();
                        updateCellData(selectedCell.row, selectedCell.col, '');
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        setSelectedCell(prev => ({ ...prev, col: Math.max(0, prev.col - 1) }));
                    } else {
                        setSelectedCell(prev => ({ ...prev, col: Math.min(columns.length - 1, prev.col + 1) }));
                    }
                    break;
                default:
                    // Start editing on alphanumeric key input
                    if (!readOnly && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        startCellEdit(selectedCell.row, selectedCell.col, e.key);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, editCell, gridData, columns, readOnly]);

    // Handle global clicks to close context menu and cell edit
    useEffect(() => {
        const handleOutsideClick = () => {
            setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // Copy-paste handlers
    useEffect(() => {
        if (!allowCopyPaste) return;
        
        const handleCopy = (e) => {
            if (selectedCell.row === -1 || editCell.row !== -1) return;
            const focusedEl = document.activeElement;
            if (focusedEl && (focusedEl.tagName === 'INPUT' || focusedEl.tagName === 'TEXTAREA')) return;

            e.preventDefault();
            const rowData = gridData[selectedCell.row];
            const colDef = columns[selectedCell.col];
            const val = rowData[colDef.dataField] ?? '';
            e.clipboardData.setData('text/plain', String(val));
            notify("Đã sao chép ô dữ liệu! 📋", "info", 1500);
        };

        const handlePaste = (e) => {
            if (selectedCell.row === -1 || editCell.row !== -1 || readOnly) return;
            const focusedEl = document.activeElement;
            if (focusedEl && (focusedEl.tagName === 'INPUT' || focusedEl.tagName === 'TEXTAREA')) return;

            e.preventDefault();
            const pasteData = e.clipboardData.getData('text/plain');
            
            // Excel paste parsing (Tab separated values)
            const pasteRows = pasteData.split(/\r?\n/).map(row => row.split('\t'));
            
            setGridData(prev => {
                const next = [...prev];
                for (let rIdx = 0; rIdx < pasteRows.length; rIdx++) {
                    const gridR = selectedCell.row + rIdx;
                    if (gridR >= next.length) break;
                    
                    const pasteCols = pasteRows[rIdx];
                    for (let cIdx = 0; cIdx < pasteCols.length; cIdx++) {
                        const gridC = selectedCell.col + cIdx;
                        if (gridC >= columns.length) break;
                        
                        const colDef = columns[gridC];
                        next[gridR] = {
                            ...next[gridR],
                            [colDef.dataField]: pasteCols[cIdx]
                        };
                    }
                }
                onRowsChange?.(next);
                return next;
            });
            notify("Đã dán dữ liệu thành công! 📝", "success", 1500);
        };

        window.addEventListener('copy', handleCopy);
        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('copy', handleCopy);
            window.removeEventListener('paste', handlePaste);
        };
    }, [selectedCell, editCell, gridData, columns, allowCopyPaste, readOnly]);

    const startCellEdit = (row, col, initChar = '') => {
        if (readOnly) return;
        const colDef = columns[col];
        const val = gridData[row][colDef.dataField] ?? '';
        setEditCell({
            row,
            col,
            tempValue: initChar !== '' ? initChar : String(val)
        });
    };

    const saveCellEdit = () => {
        if (editCell.row === -1) return;
        updateCellData(editCell.row, editCell.col, editCell.tempValue);
        setEditCell({ row: -1, col: -1, tempValue: '' });
        gridRef.current?.focus();
    };

    const updateCellData = (row, col, value) => {
        const colDef = columns[col];
        let finalVal = value;
        if (colDef.dataType === 'number') {
            finalVal = value === '' ? '' : Number(value);
        } else if (colDef.dataType === 'boolean') {
            finalVal = value === 'true' || value === true;
        }

        setGridData(prev => {
            const next = [...prev];
            next[row] = { ...next[row], [colDef.dataField]: finalVal };
            onRowsChange?.(next);
            return next;
        });
    };

    const insertRow = (index = -1) => {
        if (readOnly) return;
        const newRow = {};
        columns.forEach(c => {
            newRow[c.dataField] = c.dataType === 'number' ? 0 : c.dataType === 'boolean' ? false : '';
        });
        
        setGridData(prev => {
            const next = [...prev];
            if (index === -1) {
                next.push(newRow);
            } else {
                next.splice(index, 0, newRow);
            }
            onRowsChange?.(next);
            return next;
        });
    };

    const deleteRow = (index) => {
        if (readOnly || index === -1) return;
        setGridData(prev => {
            const next = prev.filter((_, idx) => idx !== index);
            onRowsChange?.(next);
            return next;
        });
        setSelectedCell({ row: -1, col: -1 });
    };

    // Right-click context menu handler
    const handleContextMenu = (e, rowIndex) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            row: rowIndex
        });
    };

    // Convert col index to letters (A, B, C...)
    const getColLetter = (index) => {
        let temp = index;
        let letter = '';
        while (temp >= 0) {
            letter = String.fromCharCode((temp % 26) + 65) + letter;
            temp = Math.floor(temp / 26) - 1;
        }
        return letter;
    };

    // Imperative API
    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return gridData;
                }
                setGridData(nextValue || []);
            }
        },
        value() {
            return gridData;
        },
        getDataAtCell(row, col) {
            if (row < 0 || row >= gridData.length || col < 0 || col >= columns.length) return null;
            return gridData[row][columns[col].dataField];
        },
        setDataAtCell(row, col, val) {
            if (row >= 0 && row < gridData.length && col >= 0 && col < columns.length) {
                updateCellData(row, col, val);
            }
        },
        getSelectedCell() {
            return selectedCell;
        },
        insertRowAt(index) {
            insertRow(index);
        },
        deleteRowAt(index) {
            deleteRow(index);
        }
    }));

    const isDark = theme === 'dark';

    return (
        <div 
            className={`tmiv-handsomgrid-container ${isDark ? 'dark-theme' : 'light-theme'}`} 
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                outline: 'none'
            }}
            tabIndex={0}
            ref={gridRef}
        >
            {/* Toolbar Action Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                background: isDark ? '#0f172a' : '#f8fafc'
            }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: isDark ? '#cbd5e1' : '#475569', marginRight: 'auto' }}>
                    HandsomGrid Spreadsheet
                </span>
                {allowInsert && !readOnly && (
                    <button
                        type="button"
                        onClick={() => insertRow()}
                        style={{
                            padding: '4px 10px',
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Thêm dòng
                    </button>
                )}
                {allowDelete && !readOnly && selectedCell.row !== -1 && (
                    <button
                        type="button"
                        onClick={() => deleteRow(selectedCell.row)}
                        style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Xóa dòng đang chọn
                    </button>
                )}
            </div>

            {/* Formula / Cell Indicator Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: isDark ? '#1e293b' : '#ffffff',
                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                <div style={{
                    padding: '6px 12px',
                    borderRight: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    width: '60px',
                    textAlign: 'center'
                }}>
                    {selectedCell.row !== -1 && selectedCell.col !== -1 
                        ? `${getColLetter(selectedCell.col)}${selectedCell.row + 1}` 
                        : '--'}
                </div>
                <div style={{
                    padding: '6px 12px',
                    color: isDark ? '#94a3b8' : '#64748b',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {selectedCell.row !== -1 && selectedCell.col !== -1 
                        ? String(gridData[selectedCell.row]?.[columns[selectedCell.col]?.dataField] ?? '') 
                        : ''}
                </div>
            </div>

            {/* Grid Table Workspace */}
            <div style={{
                overflow: 'auto',
                maxHeight: height,
                position: 'relative'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    tableLayout: 'fixed',
                    color: isDark ? '#cbd5e1' : '#334155'
                }}>
                    <thead>
                        <tr style={{ background: isDark ? '#0f172a' : '#f1f5f9' }}>
                            {/* Column Letter / Row Count corner */}
                            <th style={{
                                width: '40px',
                                borderRight: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                padding: '4px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                #
                            </th>
                            {columns.map((col, cIdx) => (
                                <th
                                    key={cIdx}
                                    style={{
                                        width: col.width || '150px',
                                        borderRight: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                        borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                        padding: '6px 8px',
                                        textAlign: 'left',
                                        fontWeight: '600'
                                    }}
                                >
                                    {showHeaders && (
                                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                            {getColLetter(cIdx)}
                                        </div>
                                    )}
                                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {col.caption || col.dataField}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {gridData.map((row, rIdx) => (
                            <tr 
                                key={rIdx} 
                                onContextMenu={(e) => handleContextMenu(e, rIdx)}
                                style={{
                                    background: selectedCell.row === rIdx ? (isDark ? '#1e293b' : '#f8fafc') : 'transparent'
                                }}
                            >
                                {/* Row index number header */}
                                <td style={{
                                    borderRight: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                    borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                    background: isDark ? '#0f172a' : '#f1f5f9',
                                    color: '#94a3b8',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    userSelect: 'none'
                                }}>
                                    {rIdx + 1}
                                </td>
                                {columns.map((col, cIdx) => {
                                    const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                                    const isEditing = editCell.row === rIdx && editCell.col === cIdx;
                                    const rawVal = row[col.dataField];
                                    
                                    // Lookup display expr resolver
                                    let displayVal = rawVal;
                                    if (col.dataType === 'lookup' && col.lookup) {
                                        const lookupItem = col.lookup.dataSource?.find(item => {
                                            const itemVal = typeof item === 'object' ? item[col.lookup.valueExpr] : item;
                                            return String(itemVal) === String(rawVal);
                                        });
                                        if (lookupItem) {
                                            displayVal = typeof lookupItem === 'object' ? lookupItem[col.lookup.displayExpr] : lookupItem;
                                        }
                                    }

                                    return (
                                        <td
                                            key={cIdx}
                                            onClick={() => {
                                                setSelectedCell({ row: rIdx, col: cIdx });
                                                if (isSelected) {
                                                    // Double click mock
                                                    startCellEdit(rIdx, cIdx);
                                                }
                                            }}
                                            onDoubleClick={() => startCellEdit(rIdx, cIdx)}
                                            style={{
                                                borderRight: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                padding: isEditing ? '0' : '6px 8px',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                position: 'relative',
                                                outline: isSelected ? `2px solid ${isDark ? '#2563eb' : '#3b82f6'}` : 'none',
                                                zIndex: isSelected ? 1 : 0,
                                                background: isSelected ? (isDark ? '#1e293b' : '#eff6ff') : 'transparent'
                                            }}
                                        >
                                            {isEditing ? (
                                                col.dataType === 'lookup' && col.lookup ? (
                                                    <select
                                                        value={editCell.tempValue}
                                                        onChange={(e) => setEditCell(prev => ({ ...prev, tempValue: e.target.value }))}
                                                        onBlur={saveCellEdit}
                                                        autoFocus
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            border: 'none',
                                                            outline: 'none',
                                                            background: isDark ? '#0f172a' : '#ffffff',
                                                            color: isDark ? '#cbd5e1' : '#334155',
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        <option value="">Select...</option>
                                                        {col.lookup.dataSource?.map((opt, oIdx) => {
                                                            const oVal = typeof opt === 'object' ? opt[col.lookup.valueExpr] : opt;
                                                            const oDisp = typeof opt === 'object' ? opt[col.lookup.displayExpr] : opt;
                                                            return <option key={oIdx} value={oVal}>{oDisp}</option>;
                                                        })}
                                                    </select>
                                                ) : col.dataType === 'boolean' ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={editCell.tempValue === 'true' || editCell.tempValue === true}
                                                        onChange={(e) => setEditCell(prev => ({ ...prev, tempValue: e.target.checked }))}
                                                        onBlur={saveCellEdit}
                                                        autoFocus
                                                        style={{
                                                            margin: '6px'
                                                        }}
                                                    />
                                                ) : (
                                                    <input
                                                        type={col.dataType === 'number' ? 'number' : 'text'}
                                                        value={editCell.tempValue}
                                                        onChange={(e) => setEditCell(prev => ({ ...prev, tempValue: e.target.value }))}
                                                        onBlur={saveCellEdit}
                                                        autoFocus
                                                        style={{
                                                            width: '100%',
                                                            border: 'none',
                                                            outline: 'none',
                                                            padding: '6px 8px',
                                                            background: isDark ? '#0f172a' : '#ffffff',
                                                            color: isDark ? '#cbd5e1' : '#334155',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                )
                                            ) : (
                                                col.dataType === 'boolean' ? (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!rawVal} 
                                                        readOnly 
                                                        disabled
                                                    />
                                                ) : (
                                                    String(displayVal ?? '')
                                                )
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Context Right-click Menu */}
            {contextMenu.visible && (
                <div style={{
                    position: 'fixed',
                    top: `${contextMenu.y}px`,
                    left: `${contextMenu.x}px`,
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                    padding: '4px 0',
                    zIndex: 99999,
                    fontSize: '12px',
                    minWidth: '150px'
                }}>
                    <div 
                        onClick={() => insertRow(contextMenu.row)}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: isDark ? '#cbd5e1' : '#334155'
                        }}
                        onMouseEnter={(e) => e.target.style.background = isDark ? '#334155' : '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        Chèn dòng lên trên ⬆️
                    </div>
                    <div 
                        onClick={() => insertRow(contextMenu.row + 1)}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: isDark ? '#cbd5e1' : '#334155'
                        }}
                        onMouseEnter={(e) => e.target.style.background = isDark ? '#334155' : '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        Chèn dòng xuống dưới ⬇️
                    </div>
                    <div 
                        onClick={() => deleteRow(contextMenu.row)}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: '#ef4444'
                        }}
                        onMouseEnter={(e) => e.target.style.background = isDark ? '#334155' : '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        Xóa dòng này 🗑️
                    </div>
                </div>
            )}
        </div>
    );
});

HandsomGrid.displayName = "HandsomGrid";
export default HandsomGrid;
