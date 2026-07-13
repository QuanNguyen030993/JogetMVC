import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";

const safeParseBinaryJson = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      try {
        //const decoded = decodeURIComponent(escape(atob(val)));
        return JSON.parse(val);
      } catch (e2) {
        console.error("Failed to parse binary JSON:", e2);
        return null;
      }
    }
  }
  return null;
};

const safeStringifyBinaryJson = (obj) => {
  if (!obj) return "";
  try {
    const jsonStr = JSON.stringify(obj);
    // return btoa(unescape(encodeURIComponent(jsonStr)));
    return jsonStr;
  } catch (e) {
    console.error("Failed to stringify binary JSON:", e);
    return "";
  }
};

export default function DataGridDesigner() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTableName, setNewTableName] = useState("");
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    editing: {
      mode: "row",
      allowAdding: false,
      allowUpdating: false,
      allowDeleting: false
    },
    columns: []
  });

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/SysTable/GetAll`);
      if (!res.ok) throw new Error("Load tables failed");
      const data = await res.json();
      setTables(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const selectTable = (table) => {
    setSelectedTable(table);
    if (table) {
      const gridOpts = safeParseBinaryJson(table.gridEditorOptions) || { editing: { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false }, columns: [] };
      setConfig({
        editing: gridOpts.editing || { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false },
        columns: gridOpts.columns || []
      });
    }
  };

  const saveConfig = async () => {
    if (!selectedTable) return;
    try {
      setSaving(true);
      const updatedTable = {
        ...selectedTable,
        gridEditorOptions: safeStringifyBinaryJson({
          editing: config.editing,
          columns: config.columns
        }),
        toolbarItemsConfig: selectedTable.toolbarItemsConfig || safeStringifyBinaryJson([]),
        displayExpr: selectedTable.displayExpr || selectedTable.DisplayExpr || "",
        DisplayExpr: selectedTable.displayExpr || selectedTable.DisplayExpr || ""
      };

      const formData = new FormData();
      formData.append("key", selectedTable.id);
      formData.append("values", JSON.stringify(updatedTable));

      const res = await fetch(`${API_BASE_URL}/api/SysTable/UpdateData`, {
        method: "PUT",
        body: formData
      });
      if (!res.ok) throw new Error("Save config failed");
      alert("Lưu cấu hình thành công! ✅");
      loadTables();
    } catch (e) {
      console.error(e);
      alert("Lưu cấu hình thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const createTable = async () => {
    if (!newTableName.trim()) return;
    try {
      setSaving(true);
      const newTable = {
        name: newTableName,
        gridEditorOptions: safeStringifyBinaryJson({
          editing: { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false },
          columns: []
        }),
        toolbarItemsConfig: safeStringifyBinaryJson([]),
        displayExpr: "",
        DisplayExpr: ""
      };

      const formData = new FormData();
      formData.append("values", JSON.stringify(newTable));

      const res = await fetch(`${API_BASE_URL}/api/SysTable/InsertData`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Create table failed");
      const created = await res.json();
      setNewTableName("");
      alert("Tạo bảng thành công! ✅");
      await loadTables();
      selectTable(created);
    } catch (e) {
      console.error(e);
      alert("Tạo bảng thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (next) => {
    setConfig(next);
  };

  const updateEditing = (key, val) => {
    updateConfig({
      ...config,
      editing: {
        ...config.editing,
        [key]: val
      }
    });
  };

  const addColumn = (type) => {
    const index = config.columns.length + 1;
    updateConfig({
      ...config,
      columns: [
        ...config.columns,
        {
          id: Date.now(),
          dataField: `field${index}`,
          caption: `Field ${index}`,
          dataType: type
        }
      ]
    });
  };

  const removeColumn = (id) => {
    updateConfig({
      ...config,
      columns: config.columns.filter((x) => x.id !== id)
    });
  };

  const updateColumn = (id, key, value) => {
    updateConfig({
      ...config,
      columns: config.columns.map((c) =>
        c.id === id ? { ...c, [key]: value } : c
      )
    });
  };

  if (loading) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải danh sách bảng...</div>;
  }

  return (
    <div className="dg-designer" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
        <h2>DataGrid Designer (Bảng hệ thống)</h2>
        <div>
          <button 
            onClick={saveConfig} 
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
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      <div className="dg-layout" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* LEFT SIDEBAR: List of Tables & Create Table */}
        <div className="dg-toolbox" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3>Bảng hệ thống ({tables.length})</h3>
          
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              placeholder="Tên bảng mới..." 
              value={newTableName} 
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createTable(); }}
              style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", height: "32px" }}
            />
            <button 
              onClick={createTable} 
              disabled={saving} 
              style={{ padding: "0 10px", background: "#10b981", color: "white", borderRadius: "6px", fontWeight: "600", height: "32px" }}
            >
              +
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {tables.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTable(t)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: selectedTable?.id === t.id ? "#eff6ff" : "transparent",
                  border: selectedTable?.id === t.id ? "1px solid #3b82f6" : "1px solid transparent",
                  color: selectedTable?.id === t.id ? "#1d4ed8" : "#475569",
                  fontWeight: selectedTable?.id === t.id ? "600" : "400",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.15s"
                }}
              >
                {t.name}
              </div>
            ))}
            {tables.length === 0 && (
              <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px", fontSize: "0.85rem" }}>
                Chưa có bảng nào.
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Combined Columns and Settings Configuration */}
        <div className="dg-center" style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {!selectedTable ? (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8", textAlign: "center", padding: "40px" }}>
              Chọn một bảng hệ thống ở danh sách bên trái để bắt đầu cấu hình.
            </div>
          ) : (
            <>
              {/* Table Title */}
              <h3 style={{ margin: "0 0 15px 0", fontSize: "1.2rem", flexShrink: 0 }}>
                Cấu hình bảng: <span style={{ color: "#2563eb" }}>{selectedTable.name}</span>
              </h3>

              {/* Table Settings Row */}
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px", alignItems: "flex-end", flexShrink: 0 }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>Chế độ sửa (Mode)</label>
                  <select
                    value={config.editing.mode}
                    onChange={(e) => updateEditing("mode", e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", width: "120px" }}
                  >
                    <option value="row">row</option>
                    <option value="cell">cell</option>
                    <option value="popup">popup</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "15px", marginBottom: "8px" }}>
                  {[
                    ["allowAdding", "Cho phép thêm"],
                    ["allowUpdating", "Cho phép sửa"],
                    ["allowDeleting", "Cho phép xóa"]
                  ].map((x) => (
                    <label key={x[0]} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "500", color: "#475569", margin: 0, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={config.editing[x[0]]}
                        onChange={(e) => updateEditing(x[0], e.target.checked)}
                      />
                      {x[1]}
                    </label>
                  ))}
                </div>

                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>Trường hiển thị (DisplayExpr)</label>
                  <input
                    value={selectedTable.displayExpr || selectedTable.DisplayExpr || ""}
                    onChange={(e) => {
                      setSelectedTable({
                        ...selectedTable,
                        displayExpr: e.target.value,
                        DisplayExpr: e.target.value
                      });
                    }}
                    placeholder="Ví dụ: name"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Columns Config Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Danh sách cột</h3>
                <button
                  onClick={() => addColumn("string")}
                  style={{ padding: "6px 12px", background: "#0f172a", color: "white", borderRadius: "6px", fontSize: "0.85rem" }}
                >
                  + Thêm cột mới
                </button>
              </div>

              {/* Columns Input List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {config.columns.map((c) => (
                  <div className="dg-column" key={c.id} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <input
                      value={c.dataField || ""}
                      placeholder="Data Field"
                      onChange={(e) => updateColumn(c.id, "dataField", e.target.value)}
                      style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                    <input
                      value={c.caption || ""}
                      placeholder="Caption"
                      onChange={(e) => updateColumn(c.id, "caption", e.target.value)}
                      style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                    <select
                      value={c.dataType || "string"}
                      onChange={(e) => updateColumn(c.id, "dataType", e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="boolean">boolean</option>
                    </select>
                    <button
                      onClick={() => removeColumn(c.id)}
                      style={{ padding: "6px 12px", background: "#ef4444", color: "white", borderRadius: "6px" }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                {config.columns.length === 0 && (
                  <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", border: "2px dashed #cbd5e1", borderRadius: "8px" }}>
                    Chưa có cột nào được thiết lập. Nhấp vào nút "+ Thêm cột mới" để bắt đầu.
                  </div>
                )}
              </div>

              {/* JSON Review */}
              <h3 style={{ margin: "10px 0 10px 0", fontSize: "1rem", flexShrink: 0 }}>JSON Review</h3>
              <pre style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", overflowX: "auto", margin: 0, flexShrink: 0 }}>
                {JSON.stringify(
                  {
                    DisplayExpr: selectedTable.displayExpr || selectedTable.DisplayExpr || "",
                    GridEditorOptions: {
                      editing: config.editing,
                      columns: config.columns
                    }
                  },
                  null,
                  2
                )}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}