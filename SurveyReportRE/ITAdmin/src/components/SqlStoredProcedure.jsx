import React, { useState, useEffect, useRef } from "react";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import CustomForm from "../../../TMIVCom/src/components/CustomForm";
import { API_BASE_URL } from "../config";
import "../styles/sqlstoredprocedure.css";

export default function SqlStoredProcedure() {
    const gridRef = useRef(null);
    const formRef = useRef(null);

    const [selectedProc, setSelectedProc] = useState(null);
    const [procDetails, setProcDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // Search states
    const [searchInputValue, setSearchInputValue] = useState("");
    const [searchText, setSearchText] = useState("");

    // Stored procedure execution states
    const [paramValues, setParamValues] = useState({});
    const [executing, setExecuting] = useState(false);
    const [execResult, setExecResult] = useState(null);
    const [execError, setExecError] = useState(null);

    // Modal state for Insert/Update CustomForm
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProcId, setEditingProcId] = useState(0); // 0 = insert, >0 = update
    const [modalTitle, setModalTitle] = useState("Thêm Stored Procedure");

    // Static definition of schema columns for CustomForm
    const formColumns = [
        { 
            dataField: "name", 
            caption: "Tên Stored Procedure", 
            dataType: "string", 
            readOnly: false, 
            validationRules: [{ type: "required", message: "Tên procedure là bắt buộc" }] 
        },
        { 
            dataField: "definition", 
            caption: "Định nghĩa SQL (CREATE OR ALTER ...)", 
            dataType: "string", 
            editorType: "textarea", 
            colSpan: 2, 
            height: "350px", 
            placeholder: "CREATE PROCEDURE [dbo].[usp_StoredName]\n@Param1 NVARCHAR(50),\n@Param2 INT\nAS\nBEGIN\n    SELECT * FROM MyTable WHERE Name = @Param1;\nEND" 
        }
    ];

    // Load detailed stored proc info (definition and params)
    const loadDetails = async (procId) => {
        setLoadingDetails(true);
        setExecResult(null);
        setExecError(null);
        setParamValues({});
        try {
            const res = await fetch(`${API_BASE_URL}/api/SqlStoredProcedure/GetSingle/${procId}`);
            if (res.ok) {
                const data = await res.json();
                setProcDetails(data);
                
                // Initialize default empty values for parameters
                const initialParams = {};
                if (data.parameters) {
                    data.parameters.forEach(p => {
                        initialParams[p.name] = "";
                    });
                }
                setParamValues(initialParams);
            } else {
                console.error("Failed to load stored procedure details.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (selectedProc) {
            loadDetails(selectedProc.id || selectedProc.Id);
        } else {
            setProcDetails(null);
        }
    }, [selectedProc]);

    const handleGridRowClick = (row) => {
        setSelectedProc(row);
    };

    const executeProc = async () => {
        if (!procDetails) return;
        setExecuting(true);
        setExecResult(null);
        setExecError(null);

        const cleanedParams = {};
        Object.keys(paramValues).forEach(k => {
            const val = paramValues[k];
            if (val === "" || val === null || val === undefined) {
                cleanedParams[k] = null;
            } else {
                const paramMeta = procDetails.parameters.find(p => p.name === k);
                const dt = (paramMeta?.dataType || "").toLowerCase();
                if (["int", "bigint", "smallint", "tinyint", "decimal", "numeric", "float", "real"].includes(dt)) {
                    const num = Number(val);
                    cleanedParams[k] = isNaN(num) ? val : num;
                } else if (dt === "bit") {
                    cleanedParams[k] = val === "true" || val === "1" || val === true;
                } else {
                    cleanedParams[k] = val;
                }
            }
        });

        try {
            const res = await fetch(`${API_BASE_URL}/api/SqlStoredProcedure/Execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: procDetails.name,
                    parameters: cleanedParams
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setExecResult(data.data || []);
            } else {
                setExecError(data.message || "Lỗi không xác định khi thực thi Stored Procedure.");
            }
        } catch (e) {
            setExecError(e.message || "Lỗi kết nối mạng.");
        } finally {
            setExecuting(false);
        }
    };

    const openCreateModal = () => {
        setEditingProcId(0);
        setModalTitle("Thêm Mới Stored Procedure");
        setShowFormModal(true);
    };

    const openEditModal = () => {
        if (!procDetails) return;
        setEditingProcId(procDetails.id || procDetails.Id);
        setModalTitle(`Sửa Stored Procedure: ${procDetails.name}`);
        setShowFormModal(true);
    };

    const handleDelete = async () => {
        if (!procDetails) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa Stored Procedure "${procDetails.name}"?`)) return;

        try {
            const formBody = `key=${encodeURIComponent(procDetails.id)}`;
            const res = await fetch(`${API_BASE_URL}/api/SqlStoredProcedure/DeleteData`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: formBody
            });

            if (res.ok) {
                alert("Xóa Stored Procedure thành công! ✅");
                setSelectedProc(null);
                setProcDetails(null);
                gridRef.current?.load();
            } else {
                const text = await res.text();
                alert(`Xóa thất bại: ${text} ❌`);
            }
        } catch (e) {
            alert(`Lỗi: ${e.message} ❌`);
        }
    };

    const handleSaveSuccess = () => {
        setShowFormModal(false);
        alert("Lưu Stored Procedure thành công! ✅");
        gridRef.current?.load();
        
        if (editingProcId > 0) {
            loadDetails(editingProcId);
        }
    };

    const handleSearch = () => {
        setSearchText(searchInputValue);
        setSelectedProc(null);
        setProcDetails(null);
    };

    // Columns structure for custom grid
    const gridColumns = [
        { dataField: "name", caption: "Tên Stored Procedure", dataType: "string" },
        { dataField: "paramCount", caption: "Số tham số", dataType: "number" },
        { dataField: "createDate", caption: "Ngày tạo", dataType: "date" }
    ];

    // Build help SQL scripts like EXEC or ALTER for selected procedure
    const getExecScript = () => {
        if (!procDetails) return "";
        const paramsStr = (procDetails.parameters || [])
            .map(p => `${p.name} = NULL`)
            .join(",\n    ");
        return `EXEC [dbo].[${procDetails.name}]\n    ${paramsStr || ""};`;
    };

    const getAlterScript = () => {
        if (!procDetails) return "";
        return `ALTER PROCEDURE [dbo].[${procDetails.name}]\n-- Thêm tham số tại đây\nAS\nBEGIN\n    -- Thêm logic SQL tại đây\nEND;`;
    };

    return (
        <div className="sp-manager-container">
            {/* List and search panel */}
            <div className="sp-grid-panel">
                <div className="sp-panel-header">
                    <h2>
                        <span>⚙️</span> Quản lý Stored Procedure (Database Catalog)
                    </h2>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "6px", background: "white", padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                            <input 
                                type="text"
                                placeholder="Tìm nội dung code (ví dụ: ListASM)..."
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                style={{ border: "none", outline: "none", fontSize: "0.85rem", width: "250px" }}
                            />
                            <button className="sp-btn" style={{ padding: "4px 10px", background: "#f1f5f9" }} onClick={handleSearch}>
                                🔍 Tìm
                            </button>
                        </div>
                        <button className="sp-btn sp-btn-primary" onClick={openCreateModal}>
                            ➕ Thêm mới SP
                        </button>
                    </div>
                </div>

                <div style={{ height: "400px", overflow: "hidden" }}>
                    <CustomGrid
                        ref={gridRef}
                        columns={gridColumns}
                        apiBaseUrl={API_BASE_URL}
                        showSelectionCheckbox={false}
                        showCommandsColumn={false}
                        onRowClick={handleGridRowClick}
                        gridOption={{
                            overrideGetUrl: `api/SqlStoredProcedure/GetAll?searchText=${encodeURIComponent(searchText)}`
                        }}
                    />
                </div>
            </div>

            {/* Details, parameters and test panel */}
            {selectedProc && (
                <div className="sp-detail-grid">
                    {/* Left: Code viewer and scripts */}
                    <div className="sp-detail-panel">
                        <div className="sp-detail-title">
                            <span>📝 Code định nghĩa Stored</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="sp-btn sp-btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={openEditModal}>
                                    ✏️ Sửa code
                                </button>
                                <button className="sp-btn" style={{ padding: "4px 10px", fontSize: "0.8rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" }} onClick={handleDelete}>
                                    🗑️ Xóa SP
                                </button>
                            </div>
                        </div>

                        {loadingDetails ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải code...</div>
                        ) : procDetails ? (
                            <>
                                <div className="sp-meta-info">
                                    <div className="sp-meta-item">
                                        <strong>Tên SP</strong>
                                        <span>{procDetails.name}</span>
                                    </div>
                                    <div className="sp-meta-item">
                                        <strong>Ngày tạo</strong>
                                        <span>{procDetails.createDate ? new Date(procDetails.createDate).toLocaleString() : "-"}</span>
                                    </div>
                                </div>
                                <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                    Đoạn code định nghĩa SQL (syscomments):
                                </div>
                                <textarea 
                                    className="sp-code-area"
                                    value={procDetails.definition || "/* Không tìm thấy định nghĩa SQL */"}
                                    readOnly
                                    onClick={(e) => e.target.select()}
                                />
                            </>
                        ) : (
                            <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>Lỗi tải thông tin chi tiết.</div>
                        )}
                    </div>

                    {/* Right: Parameter settings and Execution testing */}
                    <div className="sp-detail-panel">
                        <div className="sp-detail-title">
                            <span>⚡ Thực thi Stored Procedure</span>
                        </div>

                        {procDetails && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <div className="sp-params-title">Tham Số Đầu Vào:</div>
                                <div className="sp-params-list">
                                    {(procDetails.parameters || []).length > 0 ? (
                                        (procDetails.parameters || []).map(param => (
                                            <div key={param.parameterId} className="sp-param-item">
                                                <label>
                                                    <code>{param.name}</code>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "4px" }}>({param.dataType})</span>
                                                </label>
                                                <input 
                                                    type="text"
                                                    className="sp-param-input"
                                                    value={paramValues[param.name] || ""}
                                                    placeholder={param.isOutput ? "Output Parameter" : "Nhập giá trị..."}
                                                    disabled={param.isOutput}
                                                    onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: "10px 0", color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>
                                            Stored Procedure này không nhận tham số đầu vào.
                                        </div>
                                    )}
                                </div>

                                <div className="sp-script-title">Gợi Ý Câu Lệnh Gọi (EXEC Script):</div>
                                <textarea 
                                    className="sp-script-area"
                                    value={getExecScript()}
                                    readOnly
                                    onClick={(e) => e.target.select()}
                                />

                                <button 
                                    className="sp-btn sp-btn-primary" 
                                    style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}
                                    onClick={executeProc}
                                    disabled={executing}
                                >
                                    {executing ? "⏳ Đang thực thi..." : "⚡ Chạy Stored Procedure"}
                                </button>

                                <div className="sp-params-title" style={{ marginTop: "16px" }}>Kết Quả Chạy (Results):</div>
                                <div className="sp-results-panel">
                                    {execError && (
                                        <div style={{ color: "#ef4444", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                                            Lỗi: {execError}
                                        </div>
                                    )}

                                    {execResult && (
                                        execResult.length > 0 ? (
                                            <table className="sp-results-table">
                                                <thead>
                                                    <tr>
                                                        {Object.keys(execResult[0]).map(k => <th key={k}>{k}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {execResult.map((row, rIdx) => (
                                                        <tr key={rIdx}>
                                                            {Object.keys(row).map((col, cIdx) => (
                                                                <td key={cIdx}>
                                                                    {row[col] !== null ? String(row[col]) : <em style={{ color: "#cbd5e1" }}>NULL</em>}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="sp-empty-results">
                                                Thực thi thành công. Không có dòng dữ liệu nào được trả về (hoặc Query không phải là SELECT).
                                            </div>
                                        )
                                    )}

                                    {!execResult && !execError && (
                                        <div className="sp-empty-results">
                                            Nhấp vào nút "Thực thi Stored Procedure" ở trên để xem kết quả tại đây.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for CustomForm */}
            {showFormModal && (
                <div className="sp-modal-overlay">
                    <div className="sp-modal">
                        <div className="sp-modal-header">
                            <h3>{modalTitle}</h3>
                            <button className="sp-modal-close" onClick={() => setShowFormModal(false)}>
                                ✖
                            </button>
                        </div>
                        <div className="sp-modal-body">
                            <div className="sp-form-tip">
                                💡 <strong>Mẹo:</strong> Để SQL Server chấp nhận biên dịch, định nghĩa SQL phải bắt đầu bằng lệnh <code>CREATE PROCEDURE [Tên]</code> hoặc <code>CREATE OR ALTER PROCEDURE [Tên]</code>. 
                                <br />Nếu bạn đổi tên Procedure trong đoạn code định nghĩa, vui lòng điền đúng tên mới vào ô <strong>Tên Stored Procedure</strong> ở trên để hệ thống lưu trữ chính xác.
                            </div>
                            <CustomForm
                                ref={formRef}
                                id={editingProcId}
                                columns={formColumns}
                                formConfig={{
                                    modelName: "SqlStoredProcedure",
                                    pk: "id",
                                    colCount: 1,
                                    allowFormActionButton: true
                                }}
                                onSaveSuccess={handleSaveSuccess}
                                onClose={() => setShowFormModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
