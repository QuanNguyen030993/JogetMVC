import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

const icons = [
  "fa-solid fa-house",
  "fa-solid fa-user",
  "fa-solid fa-users",
  "fa-solid fa-gear",
  "fa-solid fa-chart-line",
  "fa-solid fa-file",
  "fa-solid fa-folder",
  "fa-solid fa-envelope",
  "fa-solid fa-bell",
  "fa-solid fa-database"
];

export default function MenuDesigner() {
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deletedIds, setDeletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/Menu/GetAll`);
      if (!res.ok) throw new Error("Load menus failed");
      const data = await res.json();

      const mapped = (data || []).map((m) => ({
        id: m.id,
        Name: m.name || m.caption || "Unnamed Menu",
        Url: m.actionUri || "/",
        Icon: m.icon || "fa-solid fa-house",
        Order: m.sortOrder || 1,
        Visible: m.active !== false,
        ParentId: m.parentId || null
      }));
      setMenus(mapped);
      setSelected(null);
      setDeletedIds([]);
    } catch (e) {
      console.error("Fetch menus failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const addMenu = () => {
    const id = Date.now();
    const item = {
      id,
      Name: "New Menu",
      Url: "/",
      Icon: "fa-solid fa-house",
      Order: menus.length + 1,
      Visible: true,
      ParentId: null,
      isNew: true
    };
    setMenus((x) => [...x, item]);
    setSelected(item);
  };

  const updateMenu = (key, value) => {
    setMenus((x) =>
      x.map((m) => (m.id === selected.id ? { ...m, [key]: value } : m))
    );
    setSelected((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const removeMenu = () => {
    if (!selected) return;
    if (selected.id < 100000000000) {
      setDeletedIds((prev) => [...prev, selected.id]);
    }
    setMenus((x) => x.filter((m) => m.id !== selected.id));
    setSelected(null);
  };

  const saveMenus = async () => {
    try {
      setSaving(true);

      // 1. Process deletions
      for (const id of deletedIds) {
        const formData = new FormData();
        formData.append("key", id);
        await fetch(`${API_BASE_URL}/api/Menu/DeleteData`, {
          method: "DELETE",
          body: formData
        });
      }

      // 2. Process insertions & updates
      for (const m of menus) {
        const payload = {
          name: m.Name,
          caption: m.Name,
          actionUri: m.Url,
          icon: m.Icon,
          sortOrder: m.Order,
          active: m.Visible,
          parentId: m.ParentId
        };

        const formData = new FormData();

        if (m.isNew || m.id > 100000000000) {
          // Insertion
          formData.append("values", JSON.stringify(payload));
          await fetch(`${API_BASE_URL}/api/Menu/InsertData`, {
            method: "POST",
            body: formData
          });
        } else {
          // Update
          payload.id = m.id;
          formData.append("key", m.id);
          formData.append("values", JSON.stringify(payload));
          await fetch(`${API_BASE_URL}/api/Menu/UpdateData`, {
            method: "PUT",
            body: formData
          });
        }
      }

      alert("Lưu thiết kế Menu thành công! ✅");
      loadMenus();
    } catch (e) {
      console.error(e);
      alert("Lưu thiết kế Menu thất bại! ❌");
    } finally {
      setSaving(false);
    }
  };

  const getParentName = (parentId) => {
    const parent = menus.find((m) => m.id === parentId);
    return parent ? ` (${parent.Name})` : "";
  };

  if (loading && menus.length === 0) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải danh sách menu...</div>;
  }

  return (
    <div className="menu-designer">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Menu Designer (Thiết kế thanh điều hướng)</h2>
        <button 
          onClick={saveMenus} 
          disabled={saving}
          style={{ 
            padding: "10px 20px", 
            background: "#2563eb", 
            color: "white", 
            borderRadius: "8px", 
            fontWeight: "600",
          }}
        >
          {saving ? "Đang lưu..." : "Lưu thiết kế Menu"}
        </button>
      </div>

      <div className="menu-layout">
        <div className="menu-tools">
          <h3>Thành phần</h3>
          <div
            className="menu-item-tool"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("type", "menu")}
          >
            + Menu Item
          </div>
          <button onClick={addMenu} style={{ padding: "10px", background: "#10b981", color: "white", borderRadius: "6px", width: "100%", fontWeight: "600" }}>
            Thêm Menu
          </button>
        </div>

        <div
          className="menu-preview"
          onDragOver={(e) => e.preventDefault()}
          onDrop={addMenu}
        >
          <h3>Danh sách Menu (Xem trước)</h3>
          {menus.map((m) => (
            <div
              key={m.id}
              className={selected?.id === m.id ? "menu-row active" : "menu-row"}
              onClick={() => setSelected(m)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderBottom: "1px solid #e2e8f0",
                cursor: "pointer",
                background: selected?.id === m.id ? "#f1f5f9" : "transparent"
              }}
            >
              <i className={m.Icon}></i>
              <span style={{ fontWeight: m.ParentId ? "400" : "600", marginLeft: m.ParentId ? "18px" : "0", color: "#334155" }}>
                {m.Name} {m.ParentId && <small style={{ color: "#94a3b8", fontWeight: "400" }}>{getParentName(m.ParentId)}</small>}
              </span>
            </div>
          ))}
          {menus.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              Chưa có Menu nào. Kéo thả hoặc click thêm Menu để bắt đầu.
            </div>
          )}
        </div>

        <div className="menu-property" style={{ padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
          <h3>Thuộc tính</h3>
          {selected ? (
            <>
              <label style={{ display: "block", marginBottom: "12px" }}>
                Tên hiển thị (Name/Caption)
                <input
                  value={selected.Name}
                  onChange={(e) => updateMenu("Name", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Đường dẫn (Url)
                <input
                  value={selected.Url}
                  onChange={(e) => updateMenu("Url", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Thứ tự sắp xếp (Order)
                <input
                  type="number"
                  value={selected.Order}
                  onChange={(e) => updateMenu("Order", parseInt(e.target.value) || 0)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Menu cha (Parent Menu)
                <select
                  value={selected.ParentId || ""}
                  onChange={(e) => updateMenu("ParentId", e.target.value ? parseInt(e.target.value) : null)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", background: "white" }}
                >
                  <option value="">-- Không có --</option>
                  {menus
                    .filter((m) => m.id !== selected.id) // Can't be parent of itself
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.Name}</option>
                    ))}
                </select>
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Icon đại diện
                <select
                  value={selected.Icon}
                  onChange={(e) => updateMenu("Icon", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", background: "white" }}
                >
                  {icons.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </label>

              <div className="icon-preview" style={{ padding: "10px", background: "white", borderRadius: "6px", display: "inline-block", border: "1px solid #cbd5e1", marginBottom: "12px" }}>
                <i className={selected.Icon} style={{ fontSize: "1.5rem" }}></i>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="checkbox"
                  checked={selected.Visible}
                  onChange={(e) => updateMenu("Visible", e.target.checked)}
                />
                Hiển thị menu (Active)
              </label>

              <button
                className="delete"
                onClick={removeMenu}
                style={{ width: "100%", padding: "10px", background: "#ef4444", color: "white", borderRadius: "6px", border: "none", fontWeight: "600", marginBottom: "20px" }}
              >
                Xóa Menu này
              </button>

              <h3>JSON Preview</h3>
              <pre style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", overflowX: "auto" }}>
                {JSON.stringify(selected, null, 2)}
              </pre>
            </>
          ) : (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              Chọn một Menu để chỉnh sửa thuộc tính.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}