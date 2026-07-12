import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";

const safeParseBinaryJson = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      try {
        const decoded = decodeURIComponent(escape(atob(val)));
        return JSON.parse(decoded);
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

export default function EnumDesign() {
  const [enumData, setEnumData] = useState([]);
  const [gridFields, setGridFields] = useState([]);
  const [tables, setTables] = useState([]);
  
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  
  const [groupInput, setGroupInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group EnumData by name
  const dictionaryGroups = React.useMemo(() => {
    const map = {};
    enumData.forEach((row) => {
      const groupName = row.name;
      if (!groupName) return;
      if (!map[groupName]) {
        map[groupName] = [];
      }
      map[groupName].push({
        id: row.id,
        value: row.value,
        enumOrder: row.enumOrder || 0
      });
    });
    
    return Object.keys(map).map((groupName) => ({
      groupName,
      items: map[groupName].sort((a, b) => a.enumOrder - b.enumOrder)
    }));
  }, [enumData]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch EnumData list
      const resEnum = await fetch(`${API_BASE_URL}/api/EnumData/GetAll?take=9999`);
      if (!resEnum.ok) throw new Error("Fetch EnumData failed");
      const dataEnum = await resEnum.json();
      setEnumData(dataEnum || []);

      // 2. Fetch DataGridConfig fields of type dxSelectBox
      const resGrid = await fetch(`${API_BASE_URL}/api/DataGridConfig/GetAll?take=9999`);
      if (!resGrid.ok) throw new Error("Fetch DataGridConfig failed");
      const dataGrid = await resGrid.json();
      // Filter fields that are dxSelectBox
      const selectBoxFields = (dataGrid || []).filter(
        (f) => f.editor === "dxSelectBox" || f.dataType === "boolean" || f.formDataType === "dxSelectBox"
      );
      setGridFields(selectBoxFields);

      // 3. Fetch SysTables for labeling
      const resTables = await fetch(`${API_BASE_URL}/api/SysTable/GetAll`);
      if (resTables.ok) {
        const dataTables = await resTables.json();
        setTables(dataTables || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addGroup = async () => {
    if (!groupInput.trim()) return;
    try {
      setSaving(true);
      const payload = {
        name: groupInput,
        value: "Default",
        sysTableName: "",
        mappingField: "",
        enumOrder: 0
      };

      const formData = new FormData();
      formData.append("values", JSON.stringify(payload));

      const res = await fetch(`${API_BASE_URL}/api/EnumData/InsertData`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Add Group failed");
      setGroupInput("");
      alert(`Đã thêm nhóm "${groupInput}"! ✅`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Thêm nhóm thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ nhóm "${selectedGroup}"?`)) return;
    try {
      setSaving(true);
      const itemsToDelete = enumData.filter((f) => f.name === selectedGroup);
      for (const item of itemsToDelete) {
        const formData = new FormData();
        formData.append("key", item.id);
        await fetch(`${API_BASE_URL}/api/EnumData/DeleteData`, {
          method: "DELETE",
          body: formData
        });
      }
      setSelectedGroup("");
      setSelectedKey("");
      alert(`Đã xóa nhóm! ✅`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Xóa nhóm thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const addKey = async () => {
    if (!selectedGroup || !keyInput.trim()) return;
    try {
      setSaving(true);
      const payload = {
        name: selectedGroup,
        value: keyInput,
        sysTableName: "",
        mappingField: "",
        enumOrder: 0
      };

      const formData = new FormData();
      formData.append("values", JSON.stringify(payload));

      const res = await fetch(`${API_BASE_URL}/api/EnumData/InsertData`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Add Key failed");
      setKeyInput("");
      alert(`Đã thêm key "${keyInput}" vào nhóm "${selectedGroup}"! ✅`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Thêm key thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const deleteKey = async (keyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa key này?")) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("key", keyId);
      const res = await fetch(`${API_BASE_URL}/api/EnumData/DeleteData`, {
        method: "DELETE",
        body: formData
      });
      if (!res.ok) throw new Error("Delete Key failed");
      alert("Đã xóa key thành công! ✅");
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Xóa key thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFieldMapping = async (field, enumValue) => {
    try {
      setSaving(true);
      const parsedFormItem = safeParseBinaryJson(field.formItem);

      const updatedFormItem = {
        ...parsedFormItem,
        enum: enumValue
      };

      const formData = new FormData();
      formData.append("key", field.id);
      formData.append("values", JSON.stringify({
        ...field,
        formItem: safeStringifyBinaryJson(updatedFormItem)
      }));

      const res = await fetch(`${API_BASE_URL}/api/DataGridConfig/UpdateData`, {
        method: "PUT",
        body: formData
      });
      if (!res.ok) throw new Error("Update mapping failed");
      
      alert(`Đã gán enum "${enumValue}" cho trường "${field.dataField}"! ✅`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Lưu liên kết thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const mappingRows = React.useMemo(() => {
    return gridFields.map((f) => {
      const parsedFormItem = safeParseBinaryJson(f.formItem);
      return {
        ...f,
        LinkedEnum: parsedFormItem.enum || ""
      };
    });
  }, [gridFields]);

  const gridColumns = [
    {
      field: "sysTableId",
      caption: "Bảng dữ liệu",
      width: "180px",
      calculateCellValue: (row) => getTableName(row.sysTableId)
    },
    { field: "dataField", caption: "Mã cột (DataField)", width: "160px" },
    { field: "caption", caption: "Tiêu đề (Caption)", width: "180px" },
    {
      field: "LinkedEnum",
      caption: "Nhóm Enum liên kết",
      width: "220px",
      editorType: "selectbox",
      lookup: {
        dataSource: dictionaryGroups.map(g => ({ id: g.groupName, name: g.groupName })),
        valueExpr: "id",
        displayExpr: "name"
      }
    }
  ];

  const handleGridRowsChange = async (nextRows) => {
    for (const nextRow of nextRows) {
      const prevRow = mappingRows.find(r => r.id === nextRow.id);
      if (prevRow && prevRow.LinkedEnum !== nextRow.LinkedEnum) {
        await handleUpdateFieldMapping(nextRow, nextRow.LinkedEnum);
        break;
      }
    }
  };

  if (loading && enumData.length === 0) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải dữ liệu từ API...</div>;
  }

  return (
    <div className="dictionary-builder" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Low Code Dictionary Builder (Cấu hình Enum)</h2>
        <button 
          onClick={loadData} 
          disabled={saving} 
          style={{ padding: "8px 16px", background: "#475569", color: "white", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}
        >
          Tải lại dữ liệu
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", gap: "20px", flex: 1, minHeight: "600px" }}>
        
        {/* LEFT PANEL: ENUM MANAGEMENT */}
        <div className="panel" style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "12px", background: "white", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3>Danh mục Enum</h3>
          
          <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <input 
              placeholder="Tên nhóm (Group Name)..." 
              value={groupInput} 
              onChange={(e) => setGroupInput(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={addGroup} disabled={saving} style={{ flex: 1, padding: "8px", background: "#10b981", color: "white", borderRadius: "6px", fontWeight: "600", border: "none", cursor: "pointer" }}>+ Thêm nhóm</button>
              <button onClick={deleteGroup} disabled={saving || !selectedGroup} style={{ flex: 1, padding: "8px", background: "#ef4444", color: "white", borderRadius: "6px", fontWeight: "600", border: "none", cursor: "pointer" }}>- Xóa nhóm</button>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <input 
              placeholder="Tên Key..." 
              value={keyInput} 
              onChange={(e) => setKeyInput(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
            <button onClick={addKey} disabled={saving || !selectedGroup} style={{ width: "100%", padding: "8px", background: "#2563eb", color: "white", borderRadius: "6px", fontWeight: "600", border: "none", cursor: "pointer" }}>+ Thêm Key</button>
          </div>

          <div style={{ overflowY: "auto", flex: 1, maxHeight: "400px" }}>
            {dictionaryGroups.map((g) => (
              <div 
                key={g.groupName} 
                className="card" 
                style={{ 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "8px", 
                  marginBottom: "12px", 
                  overflow: "hidden",
                  borderColor: selectedGroup === g.groupName ? "#3b82f6" : "#e2e8f0"
                }}
              >
                <div 
                  onClick={() => setSelectedGroup(g.groupName)} 
                  style={{ 
                    padding: "8px 12px", 
                    background: selectedGroup === g.groupName ? "#dbeafe" : "#f1f5f9", 
                    fontWeight: "700", 
                    cursor: "pointer",
                    color: selectedGroup === g.groupName ? "#1e40af" : "#334155"
                  }}
                >
                  {g.groupName}
                </div>
                <div style={{ padding: "6px" }}>
                  {g.items.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "6px 8px", 
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.9rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.value}</span>
                        <span
                          title={`Enum ID: ${item.id}`}
                          style={{
                            flexShrink: 0,
                            padding: "2px 6px",
                            borderRadius: "999px",
                            background: "#e2e8f0",
                            color: "#475569",
                            fontSize: "0.72rem",
                            fontWeight: "700"
                          }}
                        >
                          ID: {item.id}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteKey(item.id)} 
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: FIELD MAPPING */}
        <div className="panel" style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "12px", background: "white", overflowY: "auto" }}>
          <h3>DataGrid Field Mapping</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "15px" }}>Liên kết các trường SelectBox với nhóm Enum đã định nghĩa.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {gridFields.map((f) => {
              const parsedFormItem = safeParseBinaryJson(f.formItem);

              return (
                <div 
                  key={f.id} 
                  style={{ 
                    border: "1px solid #e2e8f0", 
                    padding: "15px", 
                    borderRadius: "10px", 
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: "#1e293b" }}>{f.caption || f.dataField}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                      Bảng: {getTableName(f.sysTableId)} | Field: {f.dataField}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#2563eb", marginTop: "8px", fontWeight: "600" }}>
                      Enum: {parsedFormItem.enum || "Chưa gán"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "200px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Chọn Enum liên kết:</label>
                    <select
                      value={parsedFormItem.enum || ""}
                      onChange={(e) => handleUpdateFieldMapping(f, e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
                    >
                      <option value="">-- Chọn Enum --</option>
                      {dictionaryGroups.map((g) => (
                        <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
            {gridFields.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Không tìm thấy trường nào có kiểu dxSelectBox cần cấu hình Enum.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CONFIG EXPLAINER */}
        <div className="panel" style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "12px", background: "white" }}>
          <h3>Thông tin cấu hình</h3>
          <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "15px", fontSize: "0.95rem" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong>Nhóm đang chọn:</strong>
              <div style={{ color: "#2563eb", fontWeight: "600", marginTop: "4px" }}>{selectedGroup || "Chưa chọn"}</div>
            </div>
            
            <div style={{ color: "#475569", lineHeight: "1.6" }}>
              <p><b>Hướng dẫn:</b></p>
              <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Tạo một <b>nhóm enum</b> (ví dụ: <code>TrangThai</code>) ở cột trái.</li>
                <li>Thêm các <b>Key</b> tương ứng vào nhóm (ví dụ: <code>Hoạt động</code>, <code>Tạm khóa</code>).</li>
                <li>Tìm trường dữ liệu cần liên kết ở phần giữa, chọn nhóm enum vừa tạo.</li>
                <li>Hệ thống tự động đồng bộ sang cấu hình trường Form của DataGrid.</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
