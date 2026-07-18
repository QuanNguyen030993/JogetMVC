import React, { useState, useEffect, useRef } from "react";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import CustomForm from "../../../TMIVCom/src/components/CustomForm";
import { API_BASE_URL } from "../config";
import "../styles/notificationtemplate.css";

const getRowVal = (row, field) => {
    if (!row) return "";
    const lower = field.toLowerCase();
    const key = Object.keys(row).find(k => k.toLowerCase() === lower);
    return key ? row[key] : "";
};

export default function NotificationTemplate() {
    const gridRef = useRef(null);
    const formRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [enumList, setEnumList] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("preview"); // "preview" | "edit"

    // Fetch all EnumData once for lookup mappings
    useEffect(() => {
        const fetchEnums = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/EnumData/GetAll?take=9999`);
                if (res.ok) {
                    const data = await res.json();
                    setEnumList(data || []);
                }
            } catch (e) {
                console.error("Failed to fetch EnumData list:", e);
            }
        };
        fetchEnums();
    }, []);

    // Static definition of schema columns for CustomForm lookup
    const enumOptions = React.useMemo(() => {
        return enumList.map(item => ({
            id: item.id || item.Id,
            name: `[${item.name || "Default"}] ${item.value || item.Name || item.Code}`
        }));
    }, [enumList]);

    const formColumns = [
        { 
            dataField: "TemplateName", 
            caption: "Tên Mẫu (Template Name)", 
            dataType: "string", 
            colSpan: 2,
            validationRules: [{ type: "required", message: "Tên mẫu là bắt buộc" }] 
        },
        { 
            dataField: "Title", 
            caption: "Tiêu Đề (Title)", 
            dataType: "string", 
            colSpan: 2,
            validationRules: [{ type: "required", message: "Tiêu đề là bắt buộc" }] 
        },
        { 
            dataField: "TypeId", 
            caption: "Loại Thông Báo (Notification Type)", 
            editorType: "selectbox", 
            colSpan: 1,
            lookup: {
                dataSource: enumOptions,
                valueExpr: "id",
                displayExpr: "name"
            }
        },
        { 
            dataField: "IsActive", 
            caption: "Trạng Thái Kích Hoạt (Active)", 
            editorType: "checkbox",
            colSpan: 1,
            defaultValue: true
        },
        { 
            dataField: "Content", 
            caption: "Nội Dung (Content)", 
            editorType: "htmleditor",
            colSpan: 2
        }
    ];

    const gridColumns = [
        { dataField: "templateName", caption: "Tên mẫu", dataType: "string" },
        { dataField: "title", caption: "Tiêu đề", dataType: "string" },
        { 
            dataField: "typeId", 
            caption: "Loại thông báo", 
            dataType: "string",
            calculateCellValue: (row) => {
                const typeId = getRowVal(row, "typeId");
                const enumItem = enumList.find(e => (e.id || e.Id) === typeId);
                return enumItem ? `${enumItem.name}: ${enumItem.value}` : (typeId || "-");
            }
        },
        { 
            dataField: "isActive", 
            caption: "Kích hoạt", 
            dataType: "boolean"
        }
    ];

    const handleGridRowClick = (row) => {
        setSelectedTemplate(row);
        setActiveTab("preview");
    };

    const handleCreateNew = () => {
        setSelectedTemplate({
            id: 0,
            Id: 0,
            templateName: "Mẫu thông báo mới",
            TemplateName: "Mẫu thông báo mới"
        });
        setActiveTab("edit");
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;
        const id = getRowVal(selectedTemplate, "id");
        const name = getRowVal(selectedTemplate, "templateName");
        if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu thông báo "${name}"?`)) return;

        try {
            const formBody = `key=${encodeURIComponent(id)}`;
            const res = await fetch(`${API_BASE_URL}/api/NotificationTemplate/DeleteData`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: formBody
            });

            if (res.ok) {
                alert("Xóa thành công! ✅");
                setSelectedTemplate(null);
                setRefreshKey(prev => prev + 1);
            } else {
                const text = await res.text();
                alert(`Xóa thất bại: ${text} ❌`);
            }
        } catch (e) {
            alert(`Lỗi: ${e.message} ❌`);
        }
    };

    const handleSaveSuccess = () => {
        alert("Lưu thành công! ✅");
        setRefreshKey(prev => prev + 1);
        setSelectedTemplate(null);
    };

    const getEnumLabel = (typeId) => {
        const item = enumList.find(e => (e.id || e.Id) === typeId);
        return item ? `[${item.name}] ${item.value || item.Code}` : `ID: ${typeId}`;
    };

    return (
        <div className="nt-manager-container">
            <div className="nt-workspace-grid">
                
                {/* Left side: Grid panel */}
                <div className="nt-grid-panel">
                    <div className="nt-panel-header">
                        <h2>
                            <span>📢</span> Thiết lập Notification Template
                        </h2>
                        <button className="nt-btn nt-btn-primary" onClick={handleCreateNew}>
                            ➕ Thêm Mẫu Mới
                        </button>
                    </div>

                    <div className="nt-grid-wrapper">
                        <CustomGrid
                            key={refreshKey}
                            ref={gridRef}
                            columns={gridColumns}
                            apiBaseUrl={API_BASE_URL}
                            showSelectionCheckbox={false}
                            showCommandsColumn={false}
                            onRowClick={handleGridRowClick}
                            gridOption={{
                                overrideGetUrl: "api/NotificationTemplate/GetAll"
                            }}
                        />
                    </div>
                </div>

                {/* Right side: Detail & Edit panel */}
                <div className="nt-detail-panel" style={{ marginTop: 0 }}>
                    {selectedTemplate ? (
                        <>
                            {/* Panel header tabs */}
                            <div className="nt-panel-tabs">
                                <button 
                                    className={`nt-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab("preview")}
                                >
                                    👀 Xem trước
                                </button>
                                <button 
                                    className={`nt-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                                    onClick={() => setActiveTab("edit")}
                                >
                                    ✏️ Chỉnh sửa
                                </button>
                            </div>

                            {/* Tab contents */}
                            {activeTab === "preview" ? (
                                <div className="nt-tab-content nt-preview-content">
                                    <div className="nt-detail-title">
                                        <span>📝 Thông tin chi tiết mẫu</span>
                                        <button className="nt-btn" style={{ padding: "4px 10px", fontSize: "0.8rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" }} onClick={handleDelete}>
                                            🗑️ Xóa mẫu
                                        </button>
                                    </div>

                                    <div className="nt-meta-info">
                                        <div className="nt-meta-item">
                                            <strong>Tên mẫu (Template Name)</strong>
                                            <span>{getRowVal(selectedTemplate, "templateName") || "-"}</span>
                                        </div>
                                        <div className="nt-meta-item">
                                            <strong>Tiêu đề (Title)</strong>
                                            <span>{getRowVal(selectedTemplate, "title") || "-"}</span>
                                        </div>
                                        <div className="nt-meta-item">
                                            <strong>Loại thông báo (Type)</strong>
                                            <span>{getEnumLabel(getRowVal(selectedTemplate, "typeId"))}</span>
                                        </div>
                                        <div className="nt-meta-item">
                                            <strong>Trạng thái</strong>
                                            <span>
                                                {getRowVal(selectedTemplate, "isActive") ? (
                                                    <span className="nt-badge nt-badge-active">Hoạt động</span>
                                                ) : (
                                                    <span className="nt-badge nt-badge-inactive">Không hoạt động</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                        Nội dung mẫu (HTML preview):
                                    </div>
                                    <div 
                                        className="nt-content-preview"
                                        dangerouslySetInnerHTML={{ __html: getRowVal(selectedTemplate, "content") || "<em>Không có nội dung</em>" }}
                                    />
                                </div>
                            ) : (
                                <div className="nt-tab-content">
                                    <div className="nt-detail-title">
                                        <span>✏️ Soạn thảo mẫu thông báo</span>
                                        <button className="nt-btn nt-btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => setActiveTab("preview")}>
                                            Quay lại
                                        </button>
                                    </div>
                                    <div style={{ padding: "10px 0" }}>
                                        <CustomForm
                                            key={`${getRowVal(selectedTemplate, "id")}`}
                                            ref={formRef}
                                            id={getRowVal(selectedTemplate, "id") || 0}
                                            columns={formColumns}
                                            formConfig={{
                                                modelName: "NotificationTemplate",
                                                pk: "Id", // PascalCase Primary Key
                                                colCount: 2,
                                                allowFormActionButton: true
                                            }}
                                            onSaveSuccess={handleSaveSuccess}
                                            onClose={() => setSelectedTemplate(null)}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="nt-empty-state">
                            <span style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📢</span>
                            <p>Chọn một mẫu thông báo từ danh sách để xem chi tiết hoặc chỉnh sửa thông tin.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
