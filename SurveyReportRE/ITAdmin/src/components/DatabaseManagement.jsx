import React, { useState, useEffect, useRef } from "react";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import { API_BASE_URL } from "../config";
import "../styles/databasemanagement.css";

export default function DatabaseManagement() {
    const gridRef = useRef(null);

    const [activeTab, setActiveTab] = useState("stats"); // "stats" | "actions"
    const [tablesList, setTablesList] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [searchTableKeyword, setSearchTableKeyword] = useState("");

    // Backup states
    const [backupFolder, setBackupFolder] = useState("C:\\Backup\\");
    const [backupFileName, setBackupFileName] = useState("JogetMVC_Backup.bak");
    const [backingUp, setBackingUp] = useState(false);
    const [backupAlert, setBackupAlert] = useState(null);

    // Script generator states
    const [selectedTables, setSelectedTables] = useState([]);
    const [scriptSchema, setScriptSchema] = useState(true);
    const [scriptData, setScriptData] = useState(false);
    const [generatingScript, setGeneratingScript] = useState(false);
    const [generatedScript, setGeneratedScript] = useState("");
    const [scriptAlert, setScriptAlert] = useState(null);

    // Fetch the list of tables for selection
    const loadTables = async () => {
        setLoadingTables(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/DatabaseManagement/GetTablesSpaceUsage`);
            if (res.ok) {
                const data = await res.json();
                setTablesList(data || []);
            }
        } catch (e) {
            console.error("Failed to load tables list for scripting:", e);
        } finally {
            setLoadingTables(false);
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    // Grid columns configuration for Space/Records Usage
    const gridColumns = [
        { dataField: "tableName", caption: "Tên Bảng (Table)", dataType: "string" },
        { dataField: "schemaName", caption: "Schema", dataType: "string", width: "90px" },
        { 
            dataField: "rowCounts", 
            caption: "Số Dòng (Record Count)", 
            dataType: "number",
            format: "#,##0",
            width: "150px"
        },
        { 
            dataField: "totalSpaceMB", 
            caption: "Tổng Dung Lượng", 
            dataType: "string",
            calculateCellValue: (row) => `${row.totalSpaceMB} MB`,
            width: "140px"
        },
        { 
            dataField: "usedSpaceMB", 
            caption: "Dung Lượng Đã Dùng", 
            dataType: "string",
            calculateCellValue: (row) => `${row.usedSpaceMB} MB`,
            width: "140px"
        },
        { 
            dataField: "unusedSpaceMB", 
            caption: "Dung Lượng Trống", 
            dataType: "string",
            calculateCellValue: (row) => `${row.unusedSpaceMB} MB`,
            width: "140px"
        }
    ];

    // Handle database backup
    const handleBackup = async () => {
        setBackingUp(true);
        setBackupAlert(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/DatabaseManagement/BackupDatabase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backupFolder, backupFileName })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setBackupAlert({
                    type: "success",
                    message: `${data.message}\nĐường dẫn file: ${data.backupPath}`
                });
            } else {
                setBackupAlert({
                    type: "error",
                    message: data.message || "Lỗi không xác định khi thực hiện sao lưu."
                });
            }
        } catch (e) {
            setBackupAlert({ type: "error", message: e.message || "Lỗi kết nối mạng." });
        } finally {
            setBackingUp(false);
        }
    };

    // Handle script generation
    const handleGenerateScript = async () => {
        if (selectedTables.length === 0) {
            alert("Vui lòng chọn ít nhất một bảng!");
            return;
        }

        setGeneratingScript(true);
        setScriptAlert(null);
        setGeneratedScript("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/DatabaseManagement/GenerateScript`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tables: selectedTables,
                    scriptSchema,
                    scriptData
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setGeneratedScript(data.script || "");
                setScriptAlert({
                    type: "success",
                    message: `Tạo script thành công cho ${selectedTables.length} bảng! ✅`
                });
            } else {
                setScriptAlert({
                    type: "error",
                    message: data.message || "Lỗi không xác định khi tạo script."
                });
            }
        } catch (e) {
            setScriptAlert({ type: "error", message: e.message || "Lỗi kết nối mạng." });
        } finally {
            setGeneratingScript(false);
        }
    };

    const handleSelectAllTables = () => {
        setSelectedTables(tablesList.map(t => t.tableName));
    };

    const handleDeselectAllTables = () => {
        setSelectedTables([]);
    };

    const handleCheckboxChange = (tableName, checked) => {
        if (checked) {
            setSelectedTables(prev => [...prev, tableName]);
        } else {
            setSelectedTables(prev => prev.filter(t => t !== tableName));
        }
    };

    const handleCopyScript = () => {
        if (!generatedScript) return;
        navigator.clipboard.writeText(generatedScript);
        alert("Đã sao chép Script vào Clipboard! 📋✅");
    };

    const filteredTablesForSelection = tablesList.filter(t => 
        t.tableName.toLowerCase().includes(searchTableKeyword.toLowerCase())
    );

    return (
        <div className="db-manager-container">
            {/* Tab navigation */}
            <div className="db-panel-tabs">
                <button 
                    className={`db-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab("stats")}
                >
                    📊 Thống kê Record & Dung lượng
                </button>
                <button 
                    className={`db-tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab("actions");
                        loadTables(); // Refresh tables listing when switching to scripting
                    }}
                >
                    💾 Sao lưu & Tạo Script (SSMS)
                </button>
            </div>

            {/* Tab 1: Space & Row count Statistics */}
            {activeTab === "stats" && (
                <div className="db-card-panel">
                    <div className="db-panel-header">
                        <h2>
                            <span>📈</span> Thống kê Dung lượng & Số lượng dòng (Record Count)
                        </h2>
                        <button className="db-btn db-btn-secondary" style={{ padding: "6px 12px" }} onClick={() => gridRef.current?.load()}>
                            🔄 Làm mới
                        </button>
                    </div>

                    <div style={{ height: "550px", overflow: "hidden" }}>
                        <CustomGrid
                            ref={gridRef}
                            columns={gridColumns}
                            apiBaseUrl={API_BASE_URL}
                            showSelectionCheckbox={false}
                            showCommandsColumn={false}
                            gridOption={{
                                overrideGetUrl: "api/DatabaseManagement/GetTablesSpaceUsage"
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Tab 2: Backup & Script Action Center */}
            {activeTab === "actions" && (
                <div className="db-workspace-split">
                    
                    {/* Left: Backup Panel */}
                    <div className="db-card-panel">
                        <div className="db-panel-header">
                            <h2>
                                <span>💾</span> Cấu hình Sao lưu (Database Backup)
                            </h2>
                        </div>

                        {backupAlert && (
                            <div className={`db-alert db-alert-${backupAlert.type}`}>
                                {backupAlert.type === "success" ? "✅" : "⚠️"} {backupAlert.message}
                            </div>
                        )}

                        <div className="db-form-group">
                            <label>Thư mục sao lưu trên máy chủ (Backup Folder)</label>
                            <input 
                                type="text"
                                className="db-input"
                                value={backupFolder}
                                onChange={(e) => setBackupFolder(e.target.value)}
                                placeholder="E.g. C:\Backup\"
                            />
                        </div>

                        <div className="db-form-group">
                            <label>Tên File Backup (.bak)</label>
                            <input 
                                type="text"
                                className="db-input"
                                value={backupFileName}
                                onChange={(e) => setBackupFileName(e.target.value)}
                                placeholder="E.g. JogetMVC_Backup.bak"
                            />
                        </div>

                        <button 
                            className="db-btn db-btn-primary" 
                            style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
                            onClick={handleBackup}
                            disabled={backingUp}
                        >
                            {backingUp ? "⏳ Đang tiến hành sao lưu..." : "💾 Tiến hành Sao Lưu (Backup)"}
                        </button>

                        <div style={{ marginTop: "20px", fontSize: "0.82rem", color: "#64748b", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            💡 <strong>Lưu ý:</strong> Tiến trình Backup được chạy trực tiếp bằng lệnh <code>BACKUP DATABASE</code> của SQL Server. Thư mục sao lưu chỉ định phải có quyền ghi dành cho tài khoản dịch vụ chạy SQL Server.
                        </div>
                    </div>

                    {/* Right: SSMS Script Generator */}
                    <div className="db-card-panel">
                        <div className="db-panel-header">
                            <h2>
                                <span>📜</span> SSMS Script Generator
                            </h2>
                        </div>

                        {scriptAlert && (
                            <div className={`db-alert db-alert-${scriptAlert.type}`}>
                                {scriptAlert.type === "success" ? "✅" : "⚠️"} {scriptAlert.message}
                            </div>
                        )}

                        <div className="db-form-group">
                            <label>Tìm kiếm bảng để tạo Script</label>
                            <input 
                                type="text"
                                className="db-input"
                                placeholder="Nhập tên bảng cần lọc..."
                                value={searchTableKeyword}
                                onChange={(e) => setSearchTableKeyword(e.target.value)}
                            />
                        </div>

                        <div className="db-form-group">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <label>Chọn bảng ({selectedTables.length} đã chọn)</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="db-btn" style={{ padding: "2px 8px", fontSize: "0.75rem", background: "#f1f5f9" }} onClick={handleSelectAllTables}>Tất cả</button>
                                    <button className="db-btn" style={{ padding: "2px 8px", fontSize: "0.75rem", background: "#f1f5f9" }} onClick={handleDeselectAllTables}>Bỏ chọn</button>
                                </div>
                            </div>

                            <div className="db-checkbox-list">
                                {loadingTables ? (
                                    <div style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>Đang tải danh sách bảng...</div>
                                ) : filteredTablesForSelection.length > 0 ? (
                                    filteredTablesForSelection.map((table) => {
                                        const isChecked = selectedTables.includes(table.tableName);
                                        return (
                                            <label key={table.tableName} className="db-checkbox-item">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleCheckboxChange(table.tableName, e.target.checked)}
                                                />
                                                <span style={{ fontWeight: "500" }}>{table.tableName}</span>
                                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({table.rowCounts.toLocaleString()} records)</span>
                                            </label>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy bảng phù hợp.</div>
                                )}
                            </div>
                        </div>

                        <div className="db-options-grid">
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
                                <input 
                                    type="checkbox"
                                    checked={scriptSchema}
                                    onChange={(e) => setScriptSchema(e.target.checked)}
                                />
                                Schema (Cấu trúc bảng)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
                                <input 
                                    type="checkbox"
                                    checked={scriptData}
                                    onChange={(e) => setScriptData(e.target.checked)}
                                />
                                Data (Dữ liệu INSERT)
                            </label>
                        </div>

                        <button 
                            className="db-btn db-btn-primary" 
                            style={{ width: "100%", justifyContent: "center" }}
                            onClick={handleGenerateScript}
                            disabled={generatingScript || selectedTables.length === 0}
                        >
                            {generatingScript ? "⏳ Đang tạo script..." : "📜 Tạo Script (Generate)"}
                        </button>
                    </div>

                    {/* Bottom: Script Output Viewport */}
                    {generatedScript && (
                        <div className="db-code-preview-panel" style={{ gridColumn: "span 2" }}>
                            <div className="db-panel-header" style={{ marginBottom: "10px", paddingBottom: "10px" }}>
                                <h3>Văn bản SQL Script (Tạo theo chuẩn SSMS)</h3>
                                <button className="db-btn db-btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={handleCopyScript}>
                                    📋 Sao chép Script
                                </button>
                            </div>
                            <textarea 
                                className="db-code-area"
                                value={generatedScript}
                                readOnly
                                onClick={(e) => e.target.select()}
                            />
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
