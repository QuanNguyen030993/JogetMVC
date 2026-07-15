import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";

const icons = [
  "",
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
  const [tagInput, setTagInput] = useState("");

  const loadMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/Menu/GetAll`);
      if (!res.ok) throw new Error("Load menus failed");
      const data = await res.json();

      const mapped = (data || []).map((m) => ({
        id: m.id,
        Name: m.name || "",
        Caption: m.caption || "",
        Url: m.actionUri || "/",
        Icon: m.icon || "",
        Order: m.sortOrder || 1,
        Visible: m.active !== false,
        ParentId: m.parentId || null,
        PageSystem: m.pageSystem ?? m.PageSystem ?? "[]"
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

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("dragged-menu-id", item.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnRow = (e, targetItem) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData("dragged-menu-id"));
    if (!draggedId || draggedId === targetItem.id) return;

    const draggedItem = menus.find((m) => m.id === draggedId);
    if (!draggedItem) return;

    const isDescendant = (parent, potentialChild) => {
      if (!potentialChild.ParentId) return false;
      if (potentialChild.ParentId === parent.id) return true;
      const immediateParent = menus.find(m => m.id === potentialChild.ParentId);
      return immediateParent ? isDescendant(parent, immediateParent) : false;
    };

    if (isDescendant(draggedItem, targetItem)) {
      alert("Không thể kéo menu cha vào menu con của chính nó! ❌");
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const dropPosition = relativeY < rect.height / 2 ? "before" : "after";

    const targetParentId = targetItem.ParentId;

    const siblings = menus
      .filter((m) => m.ParentId === targetParentId && m.id !== draggedId)
      .sort((a, b) => (a.Order || 0) - (b.Order || 0));

    const targetIndex = siblings.findIndex((m) => m.id === targetItem.id);
    let newIndex = targetIndex;
    if (dropPosition === "after") {
      newIndex = targetIndex + 1;
    }

    siblings.splice(newIndex, 0, { ...draggedItem, ParentId: targetParentId });

    const updatedMenus = menus.map((m) => {
      if (m.id === draggedId) {
        const orderIdx = siblings.findIndex(s => s.id === draggedId);
        return { ...m, ParentId: targetParentId, Order: orderIdx + 1 };
      }
      
      const sibIdx = siblings.findIndex(s => s.id === m.id);
      if (sibIdx !== -1) {
        return { ...m, Order: sibIdx + 1 };
      }

      return m;
    });

    setMenus(updatedMenus);
  };

  const addMenu = () => {
    const id = Date.now();
    const item = {
      id,
      Name: "New Menu",
      Caption: "New Menu",
      Url: "/",
      Icon: "",
      Order: menus.length + 1,
      Visible: true,
      ParentId: null,
      PageSystem: "[]",
      isNew: true
    };
    setMenus((x) => [...x, item]);
    setSelected(item);
  };

  const handleDropOnPreviewContainer = (e) => {
    e.preventDefault();
    const isNewItem = e.dataTransfer.getData("menu-item");
    if (isNewItem === "true") {
      addMenu();
    }
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

  const parentLookupSource = menus.map(m => ({ id: m.id, name: m.Name }));

  const gridColumns = [
    { field: "Name", caption: "Tên Menu (Name)", width: "180px" },
    { field: "Caption", caption: "Nhãn hiển thị (Caption)", width: "180px" },
    { field: "Url", caption: "Đường dẫn (Url)", width: "200px" },
    {
      field: "Icon",
      caption: "Icon đại diện",
      width: "150px",
      editorType: "selectbox",
      lookup: {
        dataSource: icons.map(i => ({ id: i, name: i || "Blank / Không có icon" })),
        valueExpr: "id",
        displayExpr: "name"
      }
    },
    { field: "Order", caption: "Thứ tự sắp xếp (Order)", width: "100px", editorType: "numberbox" },
    { field: "Visible", caption: "Hiển thị (Active)", width: "100px", editorType: "checkbox" },
    {
      field: "ParentId",
      caption: "Menu cha (Parent Menu)",
      width: "180px",
      editorType: "selectbox",
      lookup: {
        dataSource: parentLookupSource,
        valueExpr: "id",
        displayExpr: "name"
      }
    },
    { field: "PageSystem", caption: "Quyền truy cập (JSON)", width: "220px" }
  ];

  const handleGridRowsChange = (nextRows) => {
    const currentIds = menus.map(m => m.id);
    const nextIds = nextRows.map(m => m.id);
    const removedIds = currentIds.filter(id => !nextIds.includes(id));
    
    removedIds.forEach(id => {
      if (id < 100000000000) {
        setDeletedIds(prev => [...prev, id]);
      }
    });
    setMenus(nextRows);
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

      for (const id of deletedIds) {
        const formData = new FormData();
        formData.append("key", id);
        await fetch(`${API_BASE_URL}/api/Menu/DeleteData`, {
          method: "DELETE",
          body: formData
        });
      }

      for (const m of menus) {
        const payload = {
          name: m.Name,
          caption: m.Caption || m.Name,
          actionUri: m.Url,
          icon: m.Icon,
          sortOrder: m.Order,
          active: m.Visible,
          parentId: m.ParentId,
          PageSystem: m.PageSystem || "[]"
        };

        const formData = new FormData();

        if (m.isNew || m.id > 100000000000) {
          formData.append("values", JSON.stringify(payload));
          const response = await fetch(`${API_BASE_URL}/api/Menu/InsertData`, {
            method: "POST",
            body: formData
          });
          if (!response.ok) throw new Error(`Insert menu failed (${response.status})`);
        } else {
          payload.id = m.id;
          formData.append("key", m.id);
          formData.append("values", JSON.stringify(payload));
          const response = await fetch(`${API_BASE_URL}/api/Menu/UpdateData`, {
            method: "PUT",
            body: formData
          });
          if (!response.ok) throw new Error(`Update menu ${m.id} failed (${response.status})`);
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

  const hierarchicalMenus = React.useMemo(() => {
    const roots = menus.filter((m) => !m.ParentId);
    const children = menus.filter((m) => m.ParentId);

    roots.sort((a, b) => (a.Order || 0) - (b.Order || 0));

    const result = [];

    const traverse = (parent, level = 0) => {
      result.push({ ...parent, level });

      const myChildren = children.filter((c) => c.ParentId == parent.id);
      myChildren.sort((a, b) => (a.Order || 0) - (b.Order || 0));

      myChildren.forEach((child) => {
        traverse(child, level + 1);
      });
    };

    roots.forEach((root) => {
      traverse(root, 0);
    });

    const processedIds = new Set(result.map((x) => x.id));
    const orphans = menus.filter((m) => !processedIds.has(m.id));
    orphans.forEach((orphan) => {
      result.push({ ...orphan, level: 0 });
    });

    return result;
  }, [menus]);

  if (loading && menus.length === 0) {
    return <div style={{ padding: "20px", color: "#6b7280" }}>Đang tải danh sách menu...</div>;
  }

  return (
    <div className="menu-builder">
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
            border: "none",
            cursor: "pointer"
          }}
        >
          {saving ? "Đang lưu..." : "Lưu thiết kế Menu"}
        </button>
      </div>

      <div className="menu-layout" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div className="menu-tools" style={{ width: "240px", flexShrink: 0, padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "white" }}>
          <h3>Thành phần</h3>
          <div
            className="menu-item-tool"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("menu-item", "true")}
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              marginBottom: "15px",
              cursor: "grab",
              fontWeight: "600",
              color: "#475569"
            }}
          >
            + Menu Item
          </div>
          <button onClick={addMenu} style={{ padding: "10px", background: "#10b981", color: "white", borderRadius: "6px", width: "100%", fontWeight: "600", border: "none", cursor: "pointer" }}>
            Thêm Menu
          </button>
        </div>

        <div
          className="menu-preview"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPreviewContainer}
          style={{ flex: 1, minWidth: "300px", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "white" }}
        >
          <h3>Danh sách Menu (Xem trước)</h3>
          {hierarchicalMenus.map((m) => (
            <div
              key={m.id}
              className={selected?.id === m.id ? "menu-row active" : "menu-row"}
              onClick={() => setSelected(m)}
              draggable
              onDragStart={(e) => handleDragStart(e, m)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnRow(e, m)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                paddingLeft: `${14 + m.level * 20}px`,
                borderBottom: "1px solid #e2e8f0",
                cursor: "move",
                background: selected?.id === m.id ? "#f1f5f9" : "transparent"
              }}
            >
              {m.level > 0 && <span style={{ color: "#cbd5e1", marginRight: "4px" }}>└─</span>}
              <i className={m.Icon}></i>
              <span style={{ fontWeight: m.level > 0 ? "400" : "600", color: "#334155" }}>
                {m.Name} {m.Caption ? `(${m.Caption})` : ""}
              </span>
            </div>
          ))}
          {menus.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              Chưa có Menu nào. Kéo thả hoặc click thêm Menu để bắt đầu.
            </div>
          )}
        </div>

        <div className="menu-property" style={{ width: "340px", flexShrink: 0, padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
          <h3>Thuộc tính</h3>
          {selected ? (
            <>
              <label style={{ display: "block", marginBottom: "12px" }}>
                Tên Menu (Name)
                <input
                  value={selected.Name}
                  onChange={(e) => updateMenu("Name", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Nhãn hiển thị (Caption)
                <input
                  value={selected.Caption || ""}
                  onChange={(e) => updateMenu("Caption", e.target.value)}
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
                    .filter((m) => m.id !== selected.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.Name}</option>
                    ))}
                </select>
              </label>

              <label style={{ display: "block", marginBottom: "12px" }}>
                Icon đại diện
                <select
                  value={selected.Icon || ""}
                  onChange={(e) => updateMenu("Icon", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", background: "white" }}
                >
                  {icons.map((i) => (
                    <option key={i} value={i}>{i || "Blank / Không có icon"}</option>
                  ))}
                </select>
              </label>

              <div className="icon-preview" style={{ padding: "10px", background: "white", borderRadius: "6px", display: "inline-block", border: "1px solid #cbd5e1", marginBottom: "12px" }}>
                <i className={selected.Icon} style={{ fontSize: "1.5rem" }}></i>
              </div>

              {(() => {
                const tags = [];
                try {
                  const parsed = JSON.parse(selected.PageSystem || "[]");
                  if (Array.isArray(parsed)) {
                    tags.push(...parsed);
                  } else if (parsed && parsed.permission) {
                    const permVal = parsed.permission;
                    if (Array.isArray(permVal)) {
                      tags.push(...permVal);
                    } else if (typeof permVal === 'string') {
                      tags.push(...permVal.split(",").filter(Boolean));
                    }
                  } else if (selected.PageSystem) {
                    tags.push(...selected.PageSystem.split(",").filter(Boolean));
                  }
                } catch (e) {
                  if (selected.PageSystem) {
                    tags.push(...selected.PageSystem.split(",").filter(Boolean));
                  }
                }

                const addTag = (val) => {
                  const cleaned = val.trim();
                  if (cleaned && !tags.includes(cleaned)) {
                    const updated = [...tags, cleaned];
                    updateMenu("PageSystem", JSON.stringify({ permission: updated.join(",") }));
                  }
                };

                const removeTag = (indexToRemove) => {
                  const updated = tags.filter((_, idx) => idx !== indexToRemove);
                  updateMenu("PageSystem", JSON.stringify({ permission: updated.join(",") }));
                };

                return (
                  <label style={{ display: "block", marginBottom: "16px" }}>
                    Quyền truy cập (Allowed Roles / Departments - JSON Array)
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      padding: "6px 10px",
                      background: "white",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      marginTop: "6px",
                      minHeight: "38px",
                      alignItems: "center"
                    }}>
                      {tags.map((tag, idx) => (
                        <span key={idx} style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#e2e8f0",
                          color: "#334155",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: "500"
                        }}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "0.8rem",
                              padding: "0 2px"
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={tags.length === 0 ? "Nhập tag rồi ấn Enter..." : ""}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTag(tagInput);
                            setTagInput("");
                          }
                        }}
                        style={{
                          border: "none",
                          outline: "none",
                          flex: "1",
                          minWidth: "120px",
                          fontSize: "0.9rem",
                          padding: "4px 0"
                        }}
                      />
                    </div>
                  </label>
                );
              })()}

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
                style={{ width: "100%", padding: "10px", background: "#ef4444", color: "white", borderRadius: "6px", border: "none", fontWeight: "600", marginBottom: "20px", cursor: "pointer" }}
              >
                Xóa Menu này
              </button>
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
