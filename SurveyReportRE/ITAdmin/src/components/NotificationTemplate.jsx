import { useEffect, useMemo, useState } from "react";
import appsettings from "../../../host.json";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import { DataGrid, GridCustomStore } from "../../../TMIVCom/src/DataGrid";
import "../styles/notificationtemplate.css";

const API_BASE_URL = appsettings.UrlConfig.Host;

const mutateNotificationTemplate = async (path, method, key, values) => {
    const formData = new FormData();
    if (key !== undefined) formData.append("key", key);
    if (values !== undefined) formData.append("values", JSON.stringify(values));
    const response = await fetch(`${API_BASE_URL}/api/NotificationTemplate/${path}`, { method, body: formData });
    if (!response.ok) throw new Error(`Không thể lưu Notification Template (${response.status})`);
    const text = await response.text();
    if (!text) return values;
    try { return JSON.parse(text); } catch { return values; }
};

export default function NotificationTemplate({ onOpenDesigner }) {
    const [engine, setEngine] = useState("modular");
    const [editMode, setEditMode] = useState("batch");
    const [enumList, setEnumList] = useState([]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_BASE_URL}/api/EnumData/GetAll?take=9999`, { signal: controller.signal })
            .then((response) => response.ok ? response.json() : [])
            .then((result) => setEnumList(Array.isArray(result) ? result : result?.data || []))
            .catch((error) => { if (error.name !== "AbortError") console.error("Failed to load NotificationType:", error); });
        return () => controller.abort();
    }, []);

    const notificationTypes = useMemo(() => {
        const filtered = enumList.filter((item) => {
            const name = String(item.name || item.Name || "").toLowerCase();
            const code = String(item.code || item.Code || "").toLowerCase();
            return name.includes("notification") || code.includes("notification");
        });
        return filtered.length ? filtered : enumList;
    }, [enumList]);

    const typeLookup = useMemo(() => notificationTypes.map((item) => ({
        id: item.id || item.Id,
        name: `[${item.code || item.Code || item.name || item.Name || "Type"}] ${item.value || item.Value || item.name || item.Name || ""}`
    })), [notificationTypes]);

    const columns = useMemo(() => [
        {
            field: "templateName",
            caption: "Tên mẫu",
            dataType: "string",
            minWidth: 170,
            fixed: true,
            validationRules: [{ type: "required", message: "Tên mẫu là bắt buộc" }]
        },
        {
            field: "title",
            caption: "Tiêu đề",
            dataType: "string",
            minWidth: 230,
            validationRules: [{ type: "required", message: "Tiêu đề là bắt buộc" }]
        },
        {
            field: "typeId",
            caption: "Loại thông báo",
            dataType: "number",
            minWidth: 180,
            editorType: "selectbox",
            lookup: { dataSource: typeLookup, valueExpr: "id", displayExpr: "name" }
        },
        {
            field: "notificationQuery",
            caption: "SQL Query",
            dataType: "string",
            minWidth: 220,
            hidingPriority: 2
        },
        {
            field: "clearContent",
            caption: "Clear Content",
            dataType: "string",
            minWidth: 260,
            visible: true,
            allowEditing: false,
            allowHiding: false,
            hidingPriority: 1000
        },
        {
            field: "isActive",
            caption: "Kích hoạt",
            dataType: "boolean",
            width: 105,
            fixed: true,
            fixedPosition: "right"
        }
    ], [typeLookup]);

    const store = useMemo(() => new GridCustomStore({
        key: "id",
        async load() {
            const response = await fetch(`${API_BASE_URL}/api/NotificationTemplate/GetAll`);
            if (!response.ok) throw new Error(`Không thể tải Notification Template (${response.status})`);
            const result = await response.json();
            const data = Array.isArray(result) ? result : result?.data || [];
            return { data, totalCount: result?.totalCount ?? data.length };
        },
        async insert(values) {
            return await mutateNotificationTemplate("InsertData", "POST", undefined, { isActive: true, ...values }) || values;
        },
        async update(key, values) {
            return mutateNotificationTemplate("UpdateData", "PUT", key, values);
        },
        async remove(key) {
            await mutateNotificationTemplate("DeleteData", "DELETE", key);
        }
    }), []);

    return (
        <section className="itadmin-grid-list notification-template-list">
            <header className="itadmin-grid-list__header">
                <div>
                    <h2>Notification Template</h2>
                    <p>{engine === "modular" ? `TMIV modular DataGrid — ${editMode} editing` : "Legacy CustomGrid — batch editing"}</p>
                </div>
                <div className="notification-template-list__actions">
                    <button type="button" className="notification-template-list__designer" onClick={onOpenDesigner}>Notification Design</button>
                    <div className="itadmin-grid-list__engine" role="group" aria-label="Grid engine">
                        <button type="button" className={engine === "modular" ? "is-active" : ""} onClick={() => setEngine("modular")}>Modular</button>
                        <button type="button" className={engine === "legacy" ? "is-active" : ""} onClick={() => setEngine("legacy")}>Legacy edit</button>
                    </div>
                    {engine === "modular" && <div className="itadmin-grid-list__engine" role="group" aria-label="Editing mode">
                        {["batch", "row", "cell"].map((mode) => <button type="button" key={mode} className={editMode === mode ? "is-active" : ""} onClick={() => setEditMode(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}
                    </div>}
                </div>
            </header>

            {engine === "legacy" ? (
                <CustomGrid modelName="NotificationTemplate" gridType="System" apiBaseUrl={API_BASE_URL} editMode="batch" />
            ) : (
                <DataGrid
                    key={`notification-template-${editMode}`}
                    dataSource={store}
                    keyExpr="id"
                    columns={columns}
                    height="calc(100vh - 210px)"
                    showBorders
                    showRowLines
                    showColumnLines
                    rowAlternationEnabled
                    hoverStateEnabled
                    columnAutoWidth
                    allowColumnReordering
                    allowColumnResizing
                    columnResizingMode="widget"
                    columnChooser={{ enabled: true, mode: "dragAndDrop", searchable: true, allowSelectAll: true, title: "Tùy chọn cột" }}
                    responsive={{ enabled: true, padding: 254 }}
                    sorting={{ mode: "multiple" }}
                    searchPanel={{ visible: true, placeholder: "Tìm trong Notification Template...", width: 320, debounce: 250, highlightSearchText: true }}
                    filterRow={{ visible: true, applyMode: "auto" }}
                    headerFilter={{ visible: true, searchable: true }}
                    groupPanel={{ visible: true, allowColumnDragging: true, emptyText: "Kéo cột vào đây để nhóm dữ liệu" }}
                    grouping={{ autoExpandAll: true, allowCollapsing: true }}
                    editing={{
                        mode: editMode,
                        allowAdding: true,
                        allowUpdating: true,
                        allowDeleting: true,
                        confirmDelete: true,
                        newRowPosition: "first",
                        texts: { add: "Thêm", edit: "Sửa", delete: "Xóa", save: "Lưu", cancel: "Hủy", saveAll: "Lưu thay đổi", cancelAll: "Hoàn tác" }
                    }}
                    selection={{ mode: "multiple", showCheckBoxes: true, selectAllMode: "allPages" }}
                    paging={{ enabled: true, pageSize: 50 }}
                    pager={{ visible: true, allowedPageSizes: [25, 50, 100], showPageSizeSelector: true, showNavigationButtons: true, showInfo: true }}
                    rowNumber={{ visible: true, mode: "absolute" }}
                    messages={{ noData: "Không có Notification Template", loading: "Đang tải Notification Template...", retry: "Tải lại", columns: "Cột", resetColumns: "Đặt lại cột" }}
                />
            )}
        </section>
    );
}
