import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import TextBox from "./TextBox";
import NumberBox from "./NumberBox";
import CheckBox from "./CheckBox";
import SelectBox from "./SelectBox";
import DropDownBox from "./DropDownBox";
import DateBox from "./Datebox";
import HtmlEditor from "./HtmlEditor";

const CustomForm = forwardRef(({
    id: initialId = 0,
    formConfig = {},
    formOptions = {},
    dataSource,
    columns,
    onSaveSuccess,
    onClose,
}, ref) => {
    const {
        originModelName = "",
        modelName = originModelName || "",
        pk = "id",
        colCount = 2,
        labelLocation = "top",
        fieldsFilterByTab,
        fieldsFilterByGridByForm,
        allowFormActionButton = true,
        isReadOnly = false,
    } = formConfig;

    const [id, setId] = useState(initialId);
    const [fields, setFields] = useState(columns || []);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Fetch schema / metadata if not provided
    useEffect(() => {
        if (columns && columns.length > 0) {
            setFields(columns);
            return;
        }

        const fetchSchema = async () => {
            try {
                const API_BASE_URL = window.CONFIG?.API_URL || 'https://localhost:7254';
                const targetModel = modelName || originModelName;
                if (!targetModel) return;

                const res = await fetch(`${API_BASE_URL}/api/${targetModel}/GetScheme`);
                if (res.ok) {
                    const schema = await res.json();
                    let filteredSchema = Array.isArray(schema) ? schema : [];

                    if (fieldsFilterByTab) {
                        filteredSchema = filteredSchema.filter(f => f.formGroupName === `Tab@${fieldsFilterByTab}`);
                    }
                    if (fieldsFilterByGridByForm) {
                        filteredSchema = filteredSchema.filter(f => f.formGroupName === `GridByForm@${fieldsFilterByGridByForm}`);
                    }

                    // Sort schema by order / visible index
                    filteredSchema.sort((a, b) => {
                        const orderA = a.formVisibleIndex ?? a.order ?? 0;
                        const orderB = b.formVisibleIndex ?? b.order ?? 0;
                        return orderA - orderB;
                    });

                    setFields(filteredSchema);
                }
            } catch (err) {
                console.error("Failed to fetch schema metadata for form:", err);
            }
        };

        fetchSchema();
    }, [columns, modelName, originModelName, fieldsFilterByTab, fieldsFilterByGridByForm]);

    // Fetch single record if ID > 0, else initialize defaults
    const loadData = async () => {
        const targetModel = modelName || originModelName;
        if (!targetModel) return;

        if (id && id !== "0" && id !== 0) {
            setLoading(true);
            try {
                const API_BASE_URL = window.CONFIG?.API_URL || 'https://localhost:7254';
                if (Array.isArray(dataSource)) {
                    const item = dataSource.find(d => String(d[pk] ?? d.id ?? d.Id) === String(id));
                    if (item) {
                        setFormData(item);
                    }
                } else {
                    const res = await fetch(`${API_BASE_URL}/api/${targetModel}/GetSingle/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFormData(data);
                    }
                }
            } catch (err) {
                console.error("Failed to load form data:", err);
            } finally {
                setLoading(false);
            }
        } else {
            // New record: populate default values
            const initial = {};
            fields.forEach(f => {
                const dfVal = f.defaultValue;
                if (dfVal !== undefined && dfVal !== null && dfVal !== "") {
                    try {
                        if (typeof dfVal === "string" && dfVal.includes("new Date")) {
                            initial[f.dataField] = new Date().toISOString().substring(0, 10);
                        } else {
                            initial[f.dataField] = typeof dfVal === "string" ? eval(dfVal) : dfVal;
                        }
                    } catch {
                        initial[f.dataField] = dfVal;
                    }
                }
            });
            setFormData(initial);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, fields, modelName, originModelName, dataSource]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clean error message on edit
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validate = () => {
        const errors = {};
        fields.forEach(field => {
            const val = formData[field.dataField];
            const rules = field.validationRules || [];
            
            // Handle parsing if validationRules is a string
            let parsedRules = rules;
            if (typeof rules === "string") {
                try {
                    parsedRules = JSON.parse(rules);
                } catch {
                    parsedRules = [];
                }
            }

            for (let rule of parsedRules) {
                if (rule.type === "required") {
                    if (val === undefined || val === null || val === "") {
                        errors[field.dataField] = rule.message || `${field.caption || field.dataField} is required`;
                        break;
                    }
                }
                if (rule.type === "numeric") {
                    if (val !== undefined && val !== null && val !== "" && isNaN(Number(val))) {
                        errors[field.dataField] = rule.message || `${field.caption || field.dataField} must be numeric`;
                        break;
                    }
                }
                if (rule.type === "custom" && typeof rule.validationCallback === "function") {
                    const isValid = rule.validationCallback({ value: val, rule });
                    if (!isValid) {
                        errors[field.dataField] = rule.message || `${field.caption || field.dataField} is invalid`;
                        break;
                    }
                }
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async (isClose = false) => {
        if (!validate()) return;
        setSaving(true);
        const targetModel = modelName || originModelName;
        try {
            const API_BASE_URL = window.CONFIG?.API_URL || 'https://localhost:7254';
            const isNew = !id || id === 0 || id === "0";
            const url = isNew 
                ? `${API_BASE_URL}/api/${targetModel}/InsertData` 
                : `${API_BASE_URL}/api/${targetModel}/UpdateData`;

            const payload = isNew 
                ? { values: JSON.stringify(formData) }
                : { key: id, values: JSON.stringify(formData) };

            const formBody = Object.keys(payload)
                .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
                .join('&');

            const res = await fetch(url, {
                method: "POST", // matches standard JQuery x-www-form-urlencoded posts
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: formBody
            });

            if (res.ok) {
                const responseData = await res.json();
                if (isNew && responseData.id) {
                    setId(responseData.id);
                }
                onSaveSuccess?.(responseData);
                if (isClose && onClose) {
                    onClose();
                } else {
                    loadData();
                }
            } else {
                const errMsg = await res.text();
                console.error("Save failure response:", errMsg);
            }
        } catch (err) {
            console.error("Save form error:", err);
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        option(name, value) {
            if (name === "formData") {
                if (value === undefined) return formData;
                setFormData(value);
            }
            if (name === "value") {
                return formData;
            }
        },
        validate() {
            return validate();
        },
        save() {
            handleSave();
        },
        load() {
            loadData();
        }
    }));

    const renderEditor = (field) => {
        const val = formData[field.dataField] ?? "";
        const readOnly = isReadOnly || field.readOnly;
        const type = (field.formDataType || field.editorType || "string").toLowerCase();

        switch (type) {
            case "boolean":
            case "checkbox":
            case "dxcheckbox":
                return (
                    <CheckBox
                        value={!!val}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                        text={field.caption}
                    />
                );
            case "number":
            case "numberbox":
            case "dxnumberbox":
                return (
                    <NumberBox
                        value={val}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
            case "enum":
            case "selectbox":
            case "dxselectbox":
                return (
                    <SelectBox
                        value={val}
                        dataSource={field.lookup?.dataSource || field.editorOptions?.dataSource || []}
                        valueExpr={field.lookup?.valueExpr || field.editorOptions?.valueExpr || "id"}
                        displayExpr={field.lookup?.displayExpr || field.editorOptions?.displayExpr || "name"}
                        itemTemplate={field.lookup?.itemTemplate || field.editorOptions?.itemTemplate}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
            case "table":
            case "dropdownbox":
            case "dxdropdownbox":
                return (
                    <DropDownBox
                        value={val}
                        modelName={field.editorOptions?.modelName || field.editorOptions?.gridOption?.modelName || field.dataField}
                        dataSource={field.lookup?.dataSource || field.editorOptions?.dataSource}
                        columns={field.editorOptions?.columns || field.lookup?.columns}
                        valueExpr={field.lookup?.valueExpr || field.editorOptions?.valueExpr || "Id"}
                        displayExpr={field.lookup?.displayExpr || field.editorOptions?.displayExpr || "name"}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
            case "date":
            case "datebox":
            case "dxdatebox":
                return (
                    <DateBox
                        value={val ? val.substring(0, 10) : ""}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
            case "html":
            case "htmleditor":
            case "dxhtmleditor":
                return (
                    <HtmlEditor
                        value={val}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
            case "textarea":
            case "dxtextarea":
                return (
                    <textarea
                        className="tmivcom-textarea"
                        value={val}
                        onChange={(e) => handleFieldChange(field.dataField, e.target.value)}
                        disabled={readOnly}
                        placeholder={field.placeholder || ""}
                        style={{
                            width: field.width || "100%",
                            height: field.height || "100px",
                        }}
                    />
                );
            default:
                return (
                    <TextBox
                        value={val}
                        onChange={(v) => handleFieldChange(field.dataField, v)}
                        disabled={readOnly}
                    />
                );
        }
    };

    return (
        <div className="tmivcom-form-container">
            {allowFormActionButton && (
                <div className="tmivcom-form-toolbar">
                    <button 
                        type="button" 
                        className="tmivcom-form-btn save-btn" 
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        <span className="btn-icon">💾</span> Save
                    </button>
                    <button 
                        type="button" 
                        className="tmivcom-form-btn close-btn" 
                        onClick={onClose}
                    >
                        <span className="btn-icon">✖</span> Close
                    </button>
                    <button 
                        type="button" 
                        className="tmivcom-form-btn refresh-btn" 
                        onClick={loadData}
                    >
                        <span className="btn-icon">🔄</span> Refresh
                    </button>
                </div>
            )}

            {loading ? (
                <div className="tmivcom-form-loading">Loading form data...</div>
            ) : (
                <form className="tmivcom-form" onSubmit={(e) => e.preventDefault()}>
                    <div 
                        className="tmivcom-form-grid" 
                        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
                    >
                        {fields.map((field) => {
                            if (field.visible === false) return null;
                            const hasError = !!validationErrors[field.dataField];
                            return (
                                <div 
                                    key={field.dataField} 
                                    className={`tmivcom-form-field-group ${labelLocation}-label ${hasError ? "has-error" : ""}`}
                                    style={{ gridColumn: `span ${field.colSpan || 1}` }}
                                >
                                    {labelLocation !== "hidden" && (
                                        <label className="tmivcom-form-field-label">
                                            {field.caption || field.dataField}
                                            {field.validationRules?.some(r => r.type === "required") && (
                                                <span className="required-star"> *</span>
                                            )}
                                        </label>
                                    )}
                                    <div className="tmivcom-form-field-editor">
                                        {renderEditor(field)}
                                    </div>
                                    {hasError && (
                                        <div className="tmivcom-form-error-msg">
                                            {validationErrors[field.dataField]}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </form>
            )}
        </div>
    );
});

CustomForm.displayName = "CustomForm";
export default CustomForm;
