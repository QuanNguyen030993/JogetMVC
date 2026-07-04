import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";

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
    columns: [],
    toolbarItems: []
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
      let gridOpts = { editing: { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false }, columns: [] };
      let toolbarOpts = [];
      try {
        if (table.gridEditorOptions) {
          gridOpts = typeof table.gridEditorOptions === 'string' ? JSON.parse(table.gridEditorOptions) : table.gridEditorOptions;
        }
      } catch (e) {
        console.error("Parse grid options failed", e);
      }
      try {
        if (table.toolbarItemsConfig) {
          toolbarOpts = typeof table.toolbarItemsConfig === 'string' ? JSON.parse(table.toolbarItemsConfig) : table.toolbarItemsConfig;
        }
      } catch (e) {
        console.error("Parse toolbar config failed", e);
      }
      setConfig({
        editing: gridOpts.editing || { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false },
        columns: gridOpts.columns || [],
        toolbarItems: toolbarOpts || []
      });
    }
  };

  const saveConfig = async () => {
    if (!selectedTable) return;
    try {
      setSaving(true);
      const updatedTable = {
        ...selectedTable,
        gridEditorOptions: JSON.stringify({
          editing: config.editing,
          columns: config.columns
        }),
        toolbarItemsConfig: JSON.stringify(config.toolbarItems)
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
        gridEditorOptions: JSON.stringify({
          editing: { mode: "row", allowAdding: false, allowUpdating: false, allowDeleting: false },
          columns: []
        }),
        toolbarItemsConfig: JSON.stringify([])
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

  const addToolbar = () => {
    updateConfig({
      ...config,
      toolbarItems: [
        ...config.toolbarItems,
        {
          name: "editRowButton",
          callElementView: ""
        }
      ]
    });
  };

  const updateToolbar = (index, key, value) => {
    const arr = [...config.toolbarItems];
    arr[index][key] = value;
    updateConfig({
      ...config,
      toolbarItems: arr
    });
  };

  const removeToolbar = (index) => {
    updateConfig({
      ...config,
      toolbarItems: config.toolbarItems.filter((_, i) => i !== index)
    });
  };

  const dragColumn = (e, type) => {
    e.dataTransfer.setData("columnType", type);
  };

  const dropColumn = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("columnType");
    if (type) {
      addColumn(type);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải danh sách bảng...</div>;
  }

  return (
    <div className="dg-designer">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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

      <div className="panel" style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div>
          <label style={{ fontWeight: "600", marginRight: "10px", color: "#475569" }}>Chọn bảng hệ thống:</label>
          <select 
            value={selectedTable ? selectedTable.id : ""} 
            onChange={(e) => {
              const tbl = tables.find((t) => t.id === parseInt(e.target.value));
              selectTable(tbl || null);
            }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", background: "white" }}
          >
            <option value="">-- Chọn bảng --</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input 
            placeholder="Tên bảng mới..." 
            value={newTableName} 
            onChange={(e) => setNewTableName(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }}
          />
          <button 
            onClick={createTable} 
            disabled={saving} 
            style={{ padding: "8px 16px", background: "#10b981", color: "white", borderRadius: "6px", fontWeight: "600" }}
          >
            Tạo bảng mới
          </button>
        </div>
      </div>

      {!selectedTable ? (
        <div className="panel" style={{ padding: "60px", textAlign: "center", color: "#6b7280", borderRadius: "18px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          Vui lòng chọn hoặc tạo một bảng hệ thống để bắt đầu thiết kế cấu hình Grid.
        </div>
      ) : (
        <div className="dg-layout">
          {/* LEFT TOOLBOX */}
          <div className="dg-toolbox">
            <h3>Cột mẫu</h3>
            <div
              draggable
              onDragStart={(e) => dragColumn(e, "string")}
              className="dg-item"
            >
              Text Column (Chuỗi)
            </div>
            <div
              draggable
              onDragStart={(e) => dragColumn(e, "number")}
              className="dg-item"
            >
              Number Column (Số)
            </div>
            <div
              draggable
              onDragStart={(e) => dragColumn(e, "date")}
              className="dg-item"
            >
              Date Column (Ngày tháng)
            </div>
          </div>

          {/* CENTER PREVIEW */}
          <div 
            className="dg-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={dropColumn}
          >
            <h3>Xem trước bảng grid</h3>
            <table>
              <thead>
                <tr>
                  {config.columns.map((c) => (
                    <th key={c.id}>{c.caption}</th>
                  ))}
                  {config.columns.length === 0 && <th>Kéo thả các cột vào đây</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {config.columns.map((c) => (
                    <td key={c.id}>{c.dataField}</td>
                  ))}
                  {config.columns.length === 0 && <td>Kéo thả cột để xem trước trường dữ liệu</td>}
                </tr>
              </tbody>
            </table>

            <h3>Danh sách các cột cấu hình</h3>
            {config.columns.map((c) => (
              <div className="dg-column" key={c.id} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <input
                  value={c.dataField}
                  placeholder="Data Field"
                  onChange={(e) => updateColumn(c.id, "dataField", e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <input
                  value={c.caption}
                  placeholder="Caption"
                  onChange={(e) => updateColumn(c.id, "caption", e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <select
                  value={c.dataType}
                  onChange={(e) => updateColumn(c.id, "dataType", e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                </select>
                <button
                  onClick={() => removeColumn(c.id)}
                  style={{ padding: "6px 12px", background: "#ef4444", color: "white", borderRadius: "6px" }}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT SETTINGS */}
          <div className="dg-settings">
            <h3>Quyền & Chế độ sửa</h3>
            <label style={{ display: "block", marginBottom: "12px" }}>
              Chế độ (Mode)
              <select
                value={config.editing.mode}
                onChange={(e) => updateEditing("mode", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              >
                <option value="row">row</option>
                <option value="cell">cell</option>
                <option value="popup">popup</option>
              </select>
            </label>

            {[
              ["allowAdding", "Cho phép thêm"],
              ["allowUpdating", "Cho phép sửa"],
              ["allowDeleting", "Cho phép xóa"]
            ].map((x) => (
              <label key={x[0]} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  checked={config.editing[x[0]]}
                  onChange={(e) => updateEditing(x[0], e.target.checked)}
                />
                {x[1]}
              </label>
            ))}

            <h3 style={{ marginTop: "24px" }}>Nút chức năng (Toolbar)</h3>
            <button 
              onClick={addToolbar} 
              style={{ padding: "8px 12px", background: "#0f172a", color: "white", borderRadius: "6px", width: "100%", marginBottom: "12px" }}
            >
              + Thêm nút chức năng
            </button>

            {config.toolbarItems.map((t, i) => (
              <div className="toolbar-row" key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                <input
                  value={t.name}
                  onChange={(e) => updateToolbar(i, "name", e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  placeholder="Tên nút"
                />
                <input
                  placeholder="JS Action"
                  value={t.callElementView}
                  onChange={(e) => updateToolbar(i, "callElementView", e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <button
                  onClick={() => removeToolbar(i)}
                  style={{ padding: "6px 10px", background: "#ef4444", color: "white", borderRadius: "6px" }}
                >
                  X
                </button>
              </div>
            ))}

            <h3 style={{ marginTop: "24px" }}>JSON Review</h3>
            <pre style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", overflowX: "auto" }}>
              {JSON.stringify(
                {
                  GridEditorOptions: {
                    editing: config.editing,
                    columns: config.columns
                  },
                  ToolbarItemsConfig: config.toolbarItems
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}