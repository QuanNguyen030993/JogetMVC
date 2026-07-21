import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { notify } from '../../../TMIVCom/src/components/Notification';

const SlaDesign = () => {
    // List & Selection state
    const [slaList, setSlaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Editor view state
    const [isEditing, setIsEditing] = useState(false);
    const [editingSla, setEditingSla] = useState(null);

    // Initial SLA template
    const defaultSlaTemplate = {
        dept: 'UW',
        code: '',
        value: 0,
        unit: 'day',
        attributes: {
            fields: [
                {
                    name: 'premiumAmount',
                    label: 'Premium Amount',
                    control: 'number',
                    required: true,
                    min: 0,
                    max: 1000000000,
                    value: 0
                }
            ],
            calculation: {
                type: 'manual',
                unit: 'day'
            }
        }
    };

    // Load SLA configurations
    const loadSlas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/SLA/GetAll`);
            if (!response.ok) throw new Error(`API returned status ${response.status}`);
            const data = await response.json();
            setSlaList(data || []);
        } catch (err) {
            console.error("Load SLAs failed:", err);
            setError(err.message || "Failed to load SLA list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSlas();
    }, []);

    // Filter list
    const filteredSlaList = useMemo(() => {
        return slaList.filter(item => {
            const code = (item.code || '').toLowerCase();
            const dept = (item.dept || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return code.includes(query) || dept.includes(query);
        });
    }, [slaList, searchQuery]);

    // Handle Edit click
    const handleEdit = (sla) => {
        let parsedAttributes = { fields: [], calculation: { type: 'manual', unit: 'day' } };
        if (sla.attributes) {
            try {
                parsedAttributes = typeof sla.attributes === 'string'
                    ? JSON.parse(sla.attributes)
                    : sla.attributes;
            } catch (e) {
                console.warn("Could not parse SLA attributes JSON", e);
            }
        }

        setEditingSla({
            ...sla,
            attributes: parsedAttributes
        });
        setIsEditing(true);
    };

    // Handle Add click
    const handleAdd = () => {
        setEditingSla({ ...defaultSlaTemplate });
        setIsEditing(true);
    };

    // Handle Delete click
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình SLA này? ❌")) {
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('key', String(id));

            const response = await fetch(`${API_BASE_URL}/api/SLA/DeleteData`, {
                method: 'DELETE',
                body: formData
            });

            if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
            notify("Xóa cấu hình SLA thành công! ✅", "success");
            loadSlas();
        } catch (err) {
            console.error("Delete SLA failed:", err);
            notify(`Xóa thất bại: ${err.message}`, "error");
            setLoading(false);
        }
    };

    // Update single field in editingSla general details
    const updateGeneralField = (field, value) => {
        setEditingSla(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Update calculation field inside attributes
    const updateCalculationField = (field, value) => {
        setEditingSla(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                calculation: {
                    ...prev.attributes.calculation,
                    [field]: value
                }
            }
        }));
    };

    // SLA Fields CRUD inside editor
    const handleAddField = () => {
        const newField = {
            name: `field_${Date.now()}`,
            label: 'New Field',
            control: 'text',
            required: false,
            min: 0,
            max: 0,
            value: ''
        };

        setEditingSla(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                fields: [...(prev.attributes.fields || []), newField]
            }
        }));
    };

    const handleUpdateField = (index, key, value) => {
        setEditingSla(prev => {
            const updatedFields = [...(prev.attributes.fields || [])];
            updatedFields[index] = {
                ...updatedFields[index],
                [key]: value
            };
            return {
                ...prev,
                attributes: {
                    ...prev.attributes,
                    fields: updatedFields
                }
            };
        });
    };

    const handleDeleteField = (index) => {
        setEditingSla(prev => {
            const updatedFields = (prev.attributes.fields || []).filter((_, i) => i !== index);
            return {
                ...prev,
                attributes: {
                    ...prev.attributes,
                    fields: updatedFields
                }
            };
        });
    };

    // Save SLA configuration (Insert / Update)
    const handleSave = async () => {
        if (!editingSla.code) {
            notify("Vui lòng điền mã SLA (Code)! ⚠️", "warning");
            return;
        }
        if (!editingSla.dept) {
            notify("Vui lòng chọn bộ phận (Dept)! ⚠️", "warning");
            return;
        }

        setLoading(true);
        try {
            // Build the attributes string and structure
            const attributesObj = {
                fields: editingSla.attributes?.fields || [],
                calculation: {
                    type: editingSla.attributes?.calculation?.type || 'manual',
                    unit: editingSla.attributes?.calculation?.unit || 'day'
                }
            };

            const dbModel = {
                dept: editingSla.dept,
                code: editingSla.code,
                value: Number(editingSla.value) || 0,
                decimalValue: Number(editingSla.value) || 0,
                unit: attributesObj.calculation.unit || 'day',
                attributes: JSON.stringify(attributesObj)
            };

            const formData = new FormData();
            
            let response;
            if (editingSla.id) {
                // UPDATE (PUT)
                formData.append('key', String(editingSla.id));
                formData.append('values', JSON.stringify({
                    id: editingSla.id,
                    ...dbModel
                }));

                response = await fetch(`${API_BASE_URL}/api/SLA/UpdateData`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                // INSERT (POST)
                formData.append('values', JSON.stringify(dbModel));

                response = await fetch(`${API_BASE_URL}/api/SLA/InsertData`, {
                    method: 'POST',
                    body: formData
                });
            }

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            notify("Lưu cấu hình SLA thành công! ✅", "success");
            setIsEditing(false);
            setEditingSla(null);
            loadSlas();
        } catch (err) {
            console.error("Save SLA failed:", err);
            notify(`Lưu cấu hình thất bại: ${err.message} ❌`, "error");
            setLoading(false);
        }
    };

    // Real-time JSON compiled representation preview helper
    const compiledJsonPreview = useMemo(() => {
        if (!editingSla) return '';
        const attributesObj = {
            fields: editingSla.attributes?.fields || [],
            calculation: {
                type: editingSla.attributes?.calculation?.type || 'manual',
                unit: editingSla.attributes?.calculation?.unit || 'day'
            }
        };

        const previewModel = {
            dept: editingSla.dept,
            code: editingSla.code,
            value: Number(editingSla.value) || 0,
            decimalValue: Number(editingSla.value) || 0,
            unit: attributesObj.calculation.unit || 'day',
            attributes: attributesObj
        };

        return JSON.stringify(previewModel, null, 4);
    }, [editingSla]);

    return (
        <section className="panel sla-designer-panel">
            {/* 1. Header Area */}
            <div className="panel-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h2>Thiết kế & Cấu hình SLA</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {isEditing ? 'Thiết lập các trường động, cách tính toán thời gian và chỉ số SLA' : 'Danh sách cấu hình mức dịch vụ SLA đang chạy trên hệ thống'}
                    </p>
                </div>
                {!isEditing ? (
                    <button type="button" onClick={handleAdd} className="sla-add-btn">
                        <i className="fa fa-plus" style={{ marginRight: '8px' }}></i> Cấu hình SLA mới
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => { setIsEditing(false); setEditingSla(null); }} className="sla-back-btn">
                            Quay lại
                        </button>
                        <button type="button" onClick={handleSave} className="sla-save-btn">
                            <i className="fa fa-save" style={{ marginRight: '8px' }}></i> Lưu SLA
                        </button>
                    </div>
                )}
            </div>

            {loading && !isEditing && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa fa-spinner fa-spin fa-2x" style={{ color: '#2563eb', marginBottom: '10px' }}></i>
                    <div>Đang nạp cấu hình SLA từ hệ thống...</div>
                </div>
            )}

            {/* 2. List View */}
            {!isEditing && !loading && (
                <>
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã SLA hoặc bộ phận..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div className="sla-table-wrapper" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px' }}>ID</th>
                                    <th style={{ padding: '14px' }}>Bộ phận</th>
                                    <th style={{ padding: '14px' }}>Mã SLA</th>
                                    <th style={{ padding: '14px' }}>Chỉ số SLA</th>
                                    <th style={{ padding: '14px' }}>Đơn vị</th>
                                    <th style={{ padding: '14px' }}>Số trường động</th>
                                    <th style={{ padding: '14px' }}>Cách tính</th>
                                    <th style={{ padding: '14px', textAlign: 'right' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSlaList.map((item, index) => {
                                    let fieldsCount = 0;
                                    let calcType = 'manual';
                                    if (item.attributes) {
                                        try {
                                            const attr = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                                            fieldsCount = attr?.fields?.length || 0;
                                            calcType = attr?.calculation?.type || 'manual';
                                        } catch (e) {}
                                    }
                                    return (
                                        <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px', fontWeight: '500', color: '#475569' }}>{item.id}</td>
                                            <td style={{ padding: '14px' }}>
                                                <span style={{
                                                    background: item.dept === 'UW' ? '#eff6ff' : (item.dept === 'TS' ? '#f0fdf4' : '#fff7ed'),
                                                    color: item.dept === 'UW' ? '#2563eb' : (item.dept === 'TS' ? '#16a34a' : '#ea580c'),
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {item.dept}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>{item.code}</td>
                                            <td style={{ padding: '14px' }}>{item.value}</td>
                                            <td style={{ padding: '14px', textTransform: 'capitalize' }}>{item.unit}</td>
                                            <td style={{ padding: '14px', color: '#475569' }}>{fieldsCount} trường</td>
                                            <td style={{ padding: '14px' }}>
                                                <span style={{
                                                    background: calcType === 'dateDiff' ? '#faf5ff' : '#f8fafc',
                                                    color: calcType === 'dateDiff' ? '#9333ea' : '#475569',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.82rem',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    {calcType === 'dateDiff' ? 'Hiệu ngày' : 'Thủ công'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px', textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    style={{
                                                        marginRight: '8px',
                                                        background: '#eff6ff',
                                                        color: '#2563eb',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{
                                                        background: '#fef2f2',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredSlaList.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                            Không tìm thấy cấu hình SLA nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* 3. Editor View */}
            {isEditing && editingSla && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left Column: General Configuration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="sla-card-wrapper" style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: '#1e293b' }}>
                                General Information
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                    <span>Bộ phận (Dept)</span>
                                    <select
                                        value={editingSla.dept}
                                        onChange={(e) => updateGeneralField('dept', e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="UW">UW (Underwriting)</option>
                                        <option value="TS">TS (Technical Support)</option>
                                        <option value="PM">PM (Project Management)</option>
                                        <option value="IT">IT (Information Technology)</option>
                                    </select>
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                    <span>Mã SLA (Code)</span>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: UW_SLA_01"
                                        value={editingSla.code || ''}
                                        onChange={(e) => updateGeneralField('code', e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                    <span>Chỉ số thời gian (Value)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editingSla.value}
                                        onChange={(e) => updateGeneralField('value', e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="sla-card-wrapper" style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: '#1e293b' }}>
                                Calculation
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                    <span>Phương thức tính toán (Type)</span>
                                    <select
                                        value={editingSla.attributes?.calculation?.type || 'manual'}
                                        onChange={(e) => updateCalculationField('type', e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="manual">Manual (Nhập thủ công)</option>
                                        <option value="dateDiff">Date Difference (Hiệu hai mốc ngày)</option>
                                    </select>
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                    <span>Đơn vị đo lường (Unit)</span>
                                    <select
                                        value={editingSla.attributes?.calculation?.unit || 'day'}
                                        onChange={(e) => {
                                            updateCalculationField('unit', e.target.value);
                                            updateGeneralField('unit', e.target.value);
                                        }}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="day">Day (Ngày làm việc)</option>
                                        <option value="hour">Hour (Giờ làm việc)</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="sla-card-wrapper" style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: '#f8fafc' }}>
                                Attributes JSON Preview
                            </h3>
                            <pre style={{
                                margin: 0,
                                fontSize: '0.78rem',
                                color: '#38bdf8',
                                overflowX: 'auto',
                                fontFamily: 'Consolas, Monaco, monospace',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {compiledJsonPreview}
                            </pre>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Fields Configuration */}
                    <div className="sla-card-wrapper" style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: 0 }}>SLA Fields Designer</h3>
                            <button
                                type="button"
                                onClick={handleAddField}
                                style={{
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fa fa-plus" style={{ marginRight: '6px' }}></i> Thêm trường
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {(editingSla.attributes?.fields || []).map((field, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        padding: '16px',
                                        background: '#f8fafc',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Delete field button */}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteField(idx)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                        title="Xóa trường này"
                                    >
                                        <i className="fa fa-trash-alt"></i>
                                    </button>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                            <span>Mã trường (Name)</span>
                                            <input
                                                type="text"
                                                value={field.name || ''}
                                                onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </label>

                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                            <span>Tên hiển thị (Label)</span>
                                            <input
                                                type="text"
                                                value={field.label || ''}
                                                onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </label>

                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                            <span>Kiểu dữ liệu (Control)</span>
                                            <select
                                                value={field.control || 'text'}
                                                onChange={(e) => handleUpdateField(idx, 'control', e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            >
                                                <option value="number">Number (Số)</option>
                                                <option value="text">Text (Văn bản)</option>
                                                <option value="date">Date (Ngày tháng)</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                            <span>Giá trị tối thiểu (Min)</span>
                                            <input
                                                type="number"
                                                value={field.min || 0}
                                                onChange={(e) => handleUpdateField(idx, 'min', Number(e.target.value) || 0)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </label>

                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                            <span>Giá trị tối đa (Max)</span>
                                            <input
                                                type="number"
                                                value={field.max || 0}
                                                onChange={(e) => handleUpdateField(idx, 'max', Number(e.target.value) || 0)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', marginTop: '16px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(field.required)}
                                                onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                            />
                                            <span>Bắt buộc điền</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                            {(editingSla.attributes?.fields || []).length === 0 && (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    Chưa cấu hình trường động nào cho SLA này. Bấm "Thêm trường" để bắt đầu thiết kế.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SlaDesign;
