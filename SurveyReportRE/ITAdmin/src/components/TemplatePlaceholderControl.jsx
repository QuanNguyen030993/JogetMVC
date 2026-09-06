import React, { useEffect, useState } from "react";
import TemplatePlaceholderHelp from "./TemplatePlaceholderHelp";
import { buildPlaceholderToken } from "./templatePlaceholderUtils";
import "../styles/templatePlaceholderControl.css";

const PLACEHOLDER_OPTIONS = [
    { value: "data", label: "@@ Dữ liệu" },
    { value: "editor", label: "{{ }} Editor" },
    { value: "position", label: "{ } Vị trí" },
    { value: "special", label: "< > Đặc biệt" }
];

export default function TemplatePlaceholderControl({ editorInstance }) {
    const [selected, setSelected] = useState(null);
    const [fieldName, setFieldName] = useState("");
    const [placeholderType, setPlaceholderType] = useState("data");

    useEffect(() => {
        let editor;
        let timer;
        const syncSelected = (component) => {
            if (component?.get?.("type") !== "tmiv-placeholder") {
                setSelected(null);
                return;
            }
            setSelected(component);
            setFieldName(component.get("fieldName") || "FieldName");
            setPlaceholderType(component.get("placeholderType") || "data");
        };
        const bind = () => {
            editor = editorInstance?.current;
            if (!editor) {
                timer = window.setTimeout(bind, 100);
                return;
            }
            editor.on("component:selected", syncSelected);
            editor.on("component:deselected", () => syncSelected(null));
            syncSelected(editor.getSelected());
        };
        bind();
        return () => {
            window.clearTimeout(timer);
            editor?.off("component:selected", syncSelected);
        };
    }, [editorInstance]);

    const updateFieldName = (value) => {
        setFieldName(value);
        selected?.set("fieldName", value || "FieldName");
    };
    const updateType = (value) => {
        setPlaceholderType(value);
        selected?.set("placeholderType", value);
    };

    return (
        <section className={`template-placeholder-control ${selected ? "is-editing" : ""}`}>
            <div className="template-placeholder-control__title">
                <span>Placeholder</span>
                <TemplatePlaceholderHelp />
            </div>
            {selected ? (
                <>
                    <label><span>Loại</span><select value={placeholderType} onChange={(event) => updateType(event.target.value)}>
                        {PLACEHOLDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select></label>
                    <label><span>Tên field</span><input value={fieldName} onChange={(event) => updateFieldName(event.target.value)} placeholder="FieldName" /></label>
                    <code className="template-placeholder-control__preview">{buildPlaceholderToken(placeholderType, fieldName)}</code>
                </>
            ) : (
                <small>Kéo block Placeholder bên dưới vào giữa nội dung, sau đó chọn block để nhập field.</small>
            )}
        </section>
    );
}
