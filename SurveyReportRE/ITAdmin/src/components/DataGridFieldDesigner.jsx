import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";

const safeParseBinaryJson = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val || "{}");
    } catch (e) {
      try {
         const decodedBytes = Uint8Array.from(atob(val || "{}" ), c => c.charCodeAt(0));
        const decodedString = new TextDecoder("utf-8").decode(decodedBytes);
        // const decoded = decodeURIComponent(escape(atob(val)));
        return JSON.parse(decodedString);
      } catch (e2) {
        console.error("Failed to parse binary JSON:", e2);
        return {};
      }
    }
  }
  return {};
};

const safeStringifyBinaryJson = (obj) => {
  if (!obj) return "";
  try {
    const jsonStr = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error("Failed to stringify binary JSON:", e);
    return "";
  }
};

const controlTypes = [
  "dxTextBox",
  "dxSelectBox",
  "dxDateBox",
  "dxNumberBox",
  "dxCheckBox"
];

export default function DataGridFieldDesigner() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [fields, setFields] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/SysTable/GetAll`);
      console.log(res);
      if (!res.ok) throw new Error("Load tables failed");
      const data = await res.json();
      setTables(data || []);
    } catch (e) {
      console.error("Fetch tables failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const loadFields = async (table) => {
    if (!table) {
      setFields([]);
      setDeletedIds([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/DataGridConfig/GetAll?take=9999`);
      if (!res.ok) throw new Error("Load grid configs failed");
      const data = await res.json();
      console.log(res);
      // Filter columns belonging to the selected SysTable
      const filtered = (data || [])
        .filter((c) => c.sysTableId == table.id || c.SysTableId == table.id)
        .map((c) => ({
          id: c.id,
          AllowGrouping: c.allowGrouping !== false,
          AllowHeaderFiltering: c.allowHeaderFiltering !== false,
          Caption: c.caption || "New Field",
          DataField: c.dataField,
          DataType: c.dataType || "string",
          Editor: c.editor || "dxTextBox",
          Visible: c.visible !== false,
          Fixed: c.fixed === true,
          ValidationRules: typeof c.validationRules === 'string' ? JSON.parse(c.validationRules || "{}") : c.validationRules || [],
          EditorOptions: safeParseBinaryJson(c.editorOptions || "{}"),
          FormItem: safeParseBinaryJson(c.formItem || "{}")
        }));
      setFields(filtered);
      setDeletedIds([]);
    } catch (e) {
      console.error("Fetch fields failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    loadFields(table);
  };

  const addField = (editor) => {
    const id = Date.now();
    setFields((x) => [
      ...x,
      {
        id,
        AllowGrouping: true,
        AllowHeaderFiltering: true,
        Caption: "New Field",
        DataField: `field_${x.length + 1}`,
        DataType: "string",
        Editor: editor,
        Visible: true,
        Fixed: false,
        ValidationRules: [],
        EditorOptions: {},
        FormItem: {}
      }
    ]);
  };

  const updateField = (id, key, value) => {
    setFields((x) =>
      x.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const removeField = (id) => {
    if (id < 100000000000) {
      setDeletedIds((prev) => [...prev, id]);
    }
    setFields((x) => x.filter((f) => f.id !== id));
  };

  const saveFields = async () => {
    if (!selectedTable) return;
    try {
      setSaving(true);

      // 1. Process deletions
      for (const id of deletedIds) {
        const formData = new FormData();
        formData.append("key", id);
        await fetch(`${API_BASE_URL}/api/DataGridConfig/DeleteData`, {
          method: "DELETE",
          body: formData
        });
      }

      // 2. Process insertions & updates
      for (const f of fields) {
        const payload = {
          sysTableId: selectedTable.id,
          dataField: f.DataField,
          caption: f.Caption,
          dataType: f.DataType,
          editor: f.Editor,
          visible: f.Visible,
          allowGrouping: f.AllowGrouping,
          allowHeaderFiltering: f.AllowHeaderFiltering,
          fixed: f.Fixed,
          validationRules: JSON.stringify(f.ValidationRules),
          editorOptions: safeStringifyBinaryJson(f.EditorOptions),
          formItem: safeStringifyBinaryJson(f.FormItem)
        };

        const formData = new FormData();
        
        if (f.id > 100000000000) {
          // Insertion
          formData.append("values", JSON.stringify(payload));
          await fetch(`${API_BASE_URL}/api/DataGridConfig/InsertData`, {
            method: "POST",
            body: formData
          });
        } else {
          // Update
          payload.id = f.id;
          formData.append("key", f.id);
          formData.append("values", JSON.stringify(payload));
          await fetch(`${API_BASE_URL}/api/DataGridConfig/UpdateData`, {
            method: "PUT",
            body: formData
          });
        }
      }

      alert("Lưu danh sách trường thành công! ✅");
      loadFields(selectedTable);
    } catch (e) {
      console.error(e);
      alert("Lưu cấu hình trường thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const gridColumns = [
    { field: "DataField", caption: "Mã trường (DataField)", width: "180px" },
    { field: "Caption", caption: "Tiêu đề hiển thị (Caption)", width: "180px" },
    {
      field: "DataType",
      caption: "Kiểu dữ liệu (DataType)",
      width: "120px",
      editorType: "selectbox",
      lookup: {
        dataSource: [
          { id: "string", name: "string" },
          { id: "number", name: "number" },
          { id: "date", name: "date" },
          { id: "boolean", name: "boolean" }
        ],
        valueExpr: "id",
        displayExpr: "name"
      }
    },
    {
      field: "Editor",
      caption: "Control hiển thị (Editor)",
      width: "150px",
      editorType: "selectbox",
      lookup: {
        dataSource: controlTypes.map(x => ({ id: x, name: x })),
        valueExpr: "id",
        displayExpr: "name"
      }
    },
    { field: "Visible", caption: "Hiển thị", width: "100px", editorType: "checkbox" },
    { field: "AllowGrouping", caption: "Cho phép nhóm", width: "130px", editorType: "checkbox" },
    { field: "Fixed", caption: "Cố định cột", width: "100px", editorType: "checkbox" }
  ];

  const handleGridRowsChange = (nextRows) => {
    // Detect deleted IDs
    const currentIds = fields.map(f => f.id);
    const nextIds = nextRows.map(f => f.id);
    const removedIds = currentIds.filter(id => !nextIds.includes(id));
    
    removedIds.forEach(id => {
      if (id < 100000000000) {
        setDeletedIds(prev => [...prev, id]);
      }
    });
    setFields(nextRows);
  };

  if (loading && tables.length === 0) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải danh sách bảng...</div>;
  }

  return (
    <div className="field-builder">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>DataGrid Config Designer (Cấu hình cột chi tiết)</h2>
        <button 
          onClick={saveFields} 
          disabled={!selectedTable || saving}
          style={{ 
            padding: "10px 20px", 
            background: selectedTable ? "#2563eb" : "#94a3b8", 
            color: "white", 
            borderRadius: "8px", 
            fontWeight: "600",
            cursor: selectedTable ? "pointer" : "not-allowed" 
          }}
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình cột"}
        </button>
      </div>

      <div className="panel" style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <div>
          <label style={{ fontWeight: "600", marginRight: "10px", color: "#475569" }}>Chọn bảng để cấu hình cột:</label>
          <select 
            value={selectedTable ? selectedTable.id : ""} 
            onChange={(e) => {
              const tbl = tables.find((t) => t.id === parseInt(e.target.value));
              handleSelectTable(tbl || null);
            }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", background: "white" }}
          >
            <option value="">-- Chọn bảng --</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTable ? (
        <div className="panel" style={{ padding: "60px", textAlign: "center", color: "#6b7280", borderRadius: "18px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          Vui lòng chọn một bảng để bắt đầu thiết kế các trường dữ liệu cho Grid.
        </div>
      ) : (
        <>
          <div className="builder-layout" style={{ display: "flex", gap: "20px" }}>
            {/* TOOLBOX */}
            <div className="toolbox" style={{ width: "220px", flexShrink: 0 }}>
              <h3>Loại Control</h3>
              {controlTypes.map((t) => (
                <div
                  key={t}
                  className="control-item"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("control", t)}
                  style={{
                    padding: "10px",
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    cursor: "grab",
                    fontWeight: "500",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            {/* CANVAS */}
            <div
              className="canvas"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const type = e.dataTransfer.getData("control");
                if (type) addField(type);
              }}
              style={{ flex: 1, minHeight: "400px", padding: "15px", border: "2px dashed #cbd5e1", borderRadius: "12px", background: "white" }}
            >
              <h3>Danh sách các trường của bảng</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {fields.map((f) => (
                  <div className="field-card" key={f.id} style={{ border: "1px solid #cbd5e1", padding: "15px", borderRadius: "10px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div className="field-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{f.Caption}</strong>
                      <button 
                        onClick={() => removeField(f.id)} 
                        style={{ background: "#ef4444", color: "white", padding: "4px 8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Xóa
                      </button>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#64748b" }}>Tên trường (DataField):</label>
                      <input
                        value={f.DataField}
                        onChange={(e) => updateField(f.id, "DataField", e.target.value)}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#64748b" }}>Tiêu đề (Caption):</label>
                      <input
                        value={f.Caption}
                        onChange={(e) => updateField(f.id, "Caption", e.target.value)}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", color: "#64748b" }}>DataType:</label>
                        <select
                          value={f.DataType}
                          onChange={(e) => updateField(f.id, "DataType", e.target.value)}
                          style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", background: "white" }}
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="date">date</option>
                          <option value="boolean">boolean</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.85rem", color: "#64748b" }}>Editor:</label>
                        <select
                          value={f.Editor}
                          onChange={(e) => updateField(f.id, "Editor", e.target.value)}
                          style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", background: "white" }}
                        >
                          {controlTypes.map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={f.Visible}
                          onChange={(e) => updateField(f.id, "Visible", e.target.checked)}
                        />
                        Hiển thị
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={f.AllowGrouping}
                          onChange={(e) => updateField(f.id, "AllowGrouping", e.target.checked)}
                        />
                        Nhóm
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={f.Fixed}
                          onChange={(e) => updateField(f.id, "Fixed", e.target.checked)}
                        />
                        Cố định
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {fields.length === 0 && (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#6b7280", border: "2px dashed #cbd5e1", borderRadius: "10px", marginTop: "20px" }}>
                  Kéo thả các Control từ hộp công cụ bên trái vào đây để tạo trường dữ liệu mới.
                </div>
              )}
            </div>
          </div>

          {/* PROPERTY PREVIEW */}
          <div className="property" style={{ marginTop: "20px" }}>
            <h3>JSON Preview</h3>
            <pre style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", overflowX: "auto" }}>
              {JSON.stringify(fields, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}