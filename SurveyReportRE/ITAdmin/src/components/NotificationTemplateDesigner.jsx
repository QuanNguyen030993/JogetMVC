import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";
import grapesjs from "grapesjs";
import { notify } from "../../../TMIVCom/src/components/Notification";
import "../styles/notificationTemplateDesigner.css";
import "grapesjs/dist/css/grapes.min.css";

function NotificationTemplateDesigner() {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);

    const [templates, setTemplates] = useState([]);
    const [enumList, setEnumList] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Form fields for current selected template
    const [templateName, setTemplateName] = useState("");
    const [title, setTitle] = useState("");
    const [typeId, setTypeId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [sqlQuery, setSqlQuery] = useState("");

    // Load templates & EnumData on mount
    useEffect(() => {
        // Load Notification Templates
        fetch(`${API_BASE_URL}/api/NotificationTemplate/GetAll`)
            .then(res => res.json())
            .then(data => setTemplates(data || []))
            .catch(err => console.error("Fetch NotificationTemplates error", err));

        // Load EnumData list for NotificationType select
        fetch(`${API_BASE_URL}/api/EnumData/GetAll?take=9999`)
            .then(res => res.json())
            .then(data => setEnumList(data || []))
            .catch(err => console.error("Fetch EnumData error", err));
    }, []);

    // Filter NotificationType enum list
    const notificationTypeEnums = React.useMemo(() => {
        const filtered = enumList.filter(item => {
            const name = (item.name || item.Name || "").toLowerCase();
            const code = (item.code || item.Code || "").toLowerCase();
            return name.includes("notification") || code.includes("notification");
        });
        return filtered.length > 0 ? filtered : enumList;
    }, [enumList]);

    const convertToEditorFormat = (html = "") => {
        if (!html) return "";
        return html.replace(/@@([a-zA-Z0-9_]+)/g, (_, key) => `{{${key}}}`);
    };

    const extractFieldsFromQuery = (query) => {
        if (!query) return [];
        const fields = [];
        const match = query.match(/select([\s\S]*?)from/i);
        if (!match) return [];

        const selectPart = match[1];
        const parts = selectPart.split(",");

        parts.forEach(p => {
            const clean = p.trim();
            if (!clean) return;

            const aliasMatch = clean.match(/as\s+['"`]?([a-zA-Z0-9_]+)['"`]?/i);
            if (aliasMatch) {
                fields.push(aliasMatch[1]);
            } else {
                const raw = clean.split(".").pop().trim();
                if (raw) fields.push(raw);
            }
        });

        return fields;
    };

    const convertToGrapesComponents = (html) => {
        const container = document.createElement("div");
        container.innerHTML = html;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                if (!text) return null;

                const parts = text.split(/(\{\{.*?\}\})/g);
                return parts.map(p => {
                    const match = p.match(/\{\{(.*?)\}\}/);
                    if (match) {
                        const key = match[1].trim();
                        return {
                            type: "tmiv-field",
                            content: `{{${key}}}`,
                            attributes: {
                                class: "tmiv-field",
                                "data-bind": key
                            }
                        };
                    }
                    return {
                        type: "text",
                        content: p,
                        editable: true
                    };
                });
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                return {
                    tagName: node.tagName.toLowerCase(),
                    attributes: Array.from(node.attributes).reduce((acc, attr) => {
                        acc[attr.name] = attr.value;
                        return acc;
                    }, {}),
                    components: Array.from(node.childNodes)
                        .map(child => walk(child))
                        .flat()
                        .filter(Boolean)
                };
            }

            return null;
        };

        return Array.from(container.childNodes)
            .map(n => walk(n))
            .flat()
            .filter(Boolean);
    };

    const onSqlChange = (query) => {
        const editor = editorInstance.current;
        if (!editor) return;

        const fields = extractFieldsFromQuery(query);
        const bm = editor.BlockManager;

        // Clear existing field blocks
        bm.getAll().forEach(block => {
            if (block.getId().startsWith("field-")) {
                bm.remove(block);
            }
        });

        // Add extracted field blocks
        fields.forEach(f => {
            bm.add(`field-${f}`, {
                label: f,
                category: "Fields",
                content: {
                    type: "tmiv-field",
                    content: `{{${f}}}`,
                    attributes: {
                        "data-bind": f
                    }
                }
            });
        });

        bm.render();
    };

    const loadTemplate = (template) => {
        const editor = editorInstance.current;
        if (!editor) return;

        const rawContent = template.content || template.Content || template.templateContent || "";
        const html = convertToEditorFormat(rawContent);
        const components = convertToGrapesComponents(html);

        editor.setComponents({
            tagName: "div",
            attributes: { class: "notification-content" },
            components
        });

        setSelectedTemplate(template);
        setTemplateName(template.templateName || template.TemplateName || "");
        setTitle(template.title || template.Title || "");
        setTypeId(template.typeId || template.TypeId || "");
        setIsActive(template.isActive !== undefined ? Boolean(template.isActive) : true);
        const q = template.notificationQuery || template.NotificationQuery || template.mailQuery || template.MailQuery || "";
        setSqlQuery(q);

        // Update block manager fields
        const fields = extractFieldsFromQuery(q);
        const bm = editor.BlockManager;
        bm.getAll().forEach(block => {
            if (block.getId().startsWith("field-")) {
                bm.remove(block);
            }
        });
        fields.forEach(f => {
            bm.add(`field-${f}`, {
                label: f,
                category: "Fields",
                content: {
                    type: "tmiv-field",
                    content: `{{${f}}}`,
                    attributes: {
                        "data-bind": f
                    }
                }
            });
        });
    };

    const createTemplate = async () => {
        try {
            const name = prompt("Nhập tên Mẫu Thông Báo mới:");
            if (!name) return;

            const newTemplate = {
                templateName: name,
                title: name,
                content: `<div class="notification-content"><h3>${name}</h3><p>Nội dung thông báo mới</p></div>`,
                typeId: notificationTypeEnums[0]?.id || notificationTypeEnums[0]?.Id || null,
                isActive: true,
                notificationQuery: ""
            };

            const formData = new FormData();
            formData.append("values", JSON.stringify(newTemplate));

            const res = await fetch(`${API_BASE_URL}/api/NotificationTemplate/InsertData`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Insert failed");

            const created = await res.json();
            setTemplates(prev => [created, ...prev]);
            loadTemplate(created);
            notify("Đã tạo mẫu thông báo thành công ✅", "success");
        } catch (err) {
            console.error("CREATE ERROR", err);
            notify("Tạo mẫu thất bại ❌", "error");
        }
    };

    const saveTemplate = async () => {
        try {
            const editor = editorInstance.current;
            if (!editor || !selectedTemplate) {
                notify("Vui lòng chọn một mẫu để lưu!", "warning");
                return;
            }

            let html = editor.getHtml();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const notiContent = doc.querySelector(".notification-content");
            if (notiContent) {
                html = notiContent.innerHTML;
            }

            const updatedTemplate = {
                id: selectedTemplate.id || selectedTemplate.Id,
                templateName: templateName,
                title: title,
                content: html,
                typeId: typeId ? parseInt(typeId) : null,
                notificationQuery: sqlQuery,
                isActive: isActive
            };

            const formData = new FormData();
            formData.append("key", updatedTemplate.id);
            formData.append("values", JSON.stringify(updatedTemplate));

            const res = await fetch(`${API_BASE_URL}/api/NotificationTemplate/UpdateData`, {
                method: "PUT",
                body: formData
            });

            if (!res.ok) throw new Error("Update failed");

            notify("Đã lưu mẫu thông báo thành công ✅", "success");
            setTemplates(prev => prev.map(t => (t.id || t.Id) === updatedTemplate.id ? { ...t, ...updatedTemplate } : t));
        } catch (err) {
            console.error("SAVE ERROR", err);
            notify("Lưu thất bại ❌", "error");
        }
    };

    const deleteTemplate = async () => {
        if (!selectedTemplate) return;
        const id = selectedTemplate.id || selectedTemplate.Id;
        const name = templateName || selectedTemplate.templateName || "Template";
        if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu thông báo "${name}"?`)) return;

        try {
            const formBody = `key=${encodeURIComponent(id)}`;
            const res = await fetch(`${API_BASE_URL}/api/NotificationTemplate/DeleteData`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: formBody
            });

            if (!res.ok) throw new Error("Delete failed");

            notify("Đã xóa mẫu thông báo thành công ✅", "success");
            setTemplates(prev => prev.filter(t => (t.id || t.Id) !== id));
            setSelectedTemplate(null);
            if (editorInstance.current) editorInstance.current.setComponents("");
        } catch (err) {
            console.error("DELETE ERROR", err);
            notify("Xóa thất bại ❌", "error");
        }
    };

    const previewTemplate = () => {
        const editor = editorInstance.current;
        if (!editor) return;
        const html = editor.getHtml();
        const w = window.open("", "_blank");
        if (w) {
            w.document.write(`
                <html>
                <head>
                    <title>Xem trước Mẫu Thông Báo</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 30px; background: #f8fafc; }
                        .notification-preview-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 600px; margin: auto; }
                    </style>
                </head>
                <body>
                    <div class="notification-preview-box">
                        <h3 style="margin-top:0; color:#1e293b;">${title || 'Thông báo'}</h3>
                        ${html}
                    </div>
                </body>
                </html>
            `);
            w.document.close();
        }
    };

    const clearTemplate = () => {
        const editor = editorInstance.current;
        if (editor) editor.setComponents("");
    };

    // Initialize GrapesJS on mount
    useEffect(() => {
        if (!editorRef.current) return;

        const editor = grapesjs.init({
            container: editorRef.current,
            height: "100vh",
            width: "100%",
            richTextEditor: {},
            storageManager: false,
            fromElement: false,
            panels: { defaults: [] },
            blockManager: { appendTo: "#gjs-notification-blocks" },
            canvas: {
                frameStyle: `
                    body {
                        background: #f3f4f6;
                        padding: 40px;
                        font-family: Arial, sans-serif;
                    }
                    .notification-content {
                        width: 650px;
                        min-height: 350px;
                        margin: auto;
                        padding: 30px;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 5px 20px #ddd;
                    }
                    .tmiv-field {
                        background: #e8f3ff;
                        border: 1px dashed #1677ff;
                        padding: 3px 8px;
                        border-radius: 5px;
                        color: #1677ff;
                    }
                `
            }
        });

        editorInstance.current = editor;

        // Custom field component
        editor.DomComponents.addType("tmiv-field", {
            model: {
                defaults: {
                    tagName: "span",
                    content: "{{field}}",
                    draggable: true,
                    droppable: false,
                    attributes: {
                        class: "tmiv-field",
                        "data-bind": ""
                    }
                }
            }
        });

        // Add standard blocks
        editor.BlockManager.add("text", {
            label: "Text",
            category: "Basic",
            content: "<p>Nội dung văn bản thông báo...</p>"
        });

        editor.BlockManager.add("heading", {
            label: "Heading",
            category: "Basic",
            content: "<h2>Tiêu đề thông báo</h2>"
        });

        editor.BlockManager.add("button", {
            label: "Button",
            category: "Basic",
            content: '<div class="mail-button" style="display:inline-block; padding:10px 20px; background:#2563eb; color:white; border-radius:6px; text-align:center; cursor:pointer;">Xem chi tiết</div>'
        });

        editor.BlockManager.add("divider", {
            label: "Divider",
            category: "Basic",
            content: "<hr/>"
        });

        return () => {
            editor.destroy();
            editorInstance.current = null;
        };
    }, []);

    return (
        <div className="notification-template-designer">
            <div className="designer-container">
                {/* Left side: Templates List panel */}
                <aside className="field-panel">
                    <div className="panel-header">
                        Notification Templates
                    </div>

                    <div className="fields-list">
                        <div
                            key="new"
                            className="field-item create-btn-item"
                            onClick={createTemplate}
                            style={{ justifyContent: "center", fontWeight: "bold", background: "#eff6ff", color: "#2563eb" }}
                        >
                            ➕ Tạo Mẫu Mới
                        </div>
                        {templates.map(t => {
                            const id = t.id || t.Id;
                            const isSelected = selectedTemplate && (selectedTemplate.id || selectedTemplate.Id) === id;
                            return (
                                <div
                                    key={id}
                                    className={`field-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => loadTemplate(t)}
                                >
                                    📢 {t.templateName || t.TemplateName || `Template ${id}`}
                                </div>
                            );
                        })}
                    </div>

                    <div className="panel-actions">
                        <button className="btn primary" onClick={saveTemplate} disabled={!selectedTemplate}>
                            💾 Save Template
                        </button>
                        <button className="btn secondary" onClick={previewTemplate} disabled={!selectedTemplate}>
                            👀 Preview
                        </button>
                        <button className="btn danger" onClick={deleteTemplate} disabled={!selectedTemplate}>
                            🗑️ Delete
                        </button>
                    </div>
                </aside>

                {/* Center & Right: Editor Wrapper */}
                <div className="editor-wrapper">
                    {/* GrapesJS Canvas */}
                    <div ref={editorRef} className="grapesjs-container" />

                    {/* Right side: Block Manager */}
                    <aside className="tool-panel">
                        <div className="tool-title">
                            Components
                        </div>
                        <div id="gjs-notification-blocks" />
                    </aside>

                    {/* Control Element Panel: Template Settings, TypeId (EnumData), SQL Query */}
                    <div className="sql-box">
                        <div className="panel-header" style={{ padding: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                            ⚙️ Control Element Settings
                        </div>

                        {/* Template Name */}
                        <div className="control-field">
                            <label className="control-label">Template Name</label>
                            <input
                                className="control-input"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Nhập tên mẫu thông báo..."
                            />
                        </div>

                        {/* Title */}
                        <div className="control-field">
                            <label className="control-label">Notification Title</label>
                            <input
                                className="control-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề hiển thị..."
                            />
                        </div>

                        {/* NotificationType (TypeId - EnumData) */}
                        <div className="control-field">
                            <label className="control-label">Loại Thông Báo (EnumData NotificationType)</label>
                            <select
                                className="control-select"
                                value={typeId || ""}
                                onChange={(e) => setTypeId(e.target.value)}
                            >
                                <option value="">-- Chọn Loại EnumData NotificationType --</option>
                                {notificationTypeEnums.map((item) => {
                                    const itemId = item.id || item.Id;
                                    const code = item.code || item.Code || item.name || "Enum";
                                    const val = item.value || item.Value || item.name;
                                    return (
                                        <option key={itemId} value={itemId}>
                                            [{code}] {val}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Active Checkbox */}
                        <div className="control-field" style={{ margin: "10px 0" }}>
                            <label className="control-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                Kích hoạt Mẫu (Active)
                            </label>
                        </div>

                        {/* SQL Query */}
                        <div className="control-field">
                            <label className="control-label">SQL Query (Dynamic Placeholders)</label>
                            <textarea
                                className="sql-input"
                                value={sqlQuery}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSqlQuery(value);
                                    onSqlChange(value);
                                }}
                                placeholder="SELECT RecordNo AS RefNo, CustomerName AS Client, Department AS Dept FROM..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationTemplateDesigner;
