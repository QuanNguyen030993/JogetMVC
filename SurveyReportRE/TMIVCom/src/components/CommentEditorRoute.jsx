import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import SelectBox from './SelectBox';

const CommentEditorRoute = forwardRef(({
    value = '',
    onChange,
    placeholder = 'Nhập nội dung ý kiến...',
    items = [],
    onSubmit,
    onItemsChange,
    emptyText = 'Chưa có ý kiến phản hồi.',
    renderItem,
    showComposer = true,
    submitLabel = 'Gửi ý kiến',
    headerTitle = 'Ý kiến & Định hướng',
    headerSubtitle = '',
    authorName = 'Bạn',
    roleName = 'Thành viên',
    className = '',
    onClick,
    
    // Routing target selection configuration
    departments = [], // List of departments to select from
    valueExpr = 'id',
    displayExpr = 'name',
    selectedDepartment = '',
    routePlaceholder = 'Chọn phòng ban định hướng...',
    routeLabel = 'Định hướng đến:'
}, ref) => {
    const [comments, setComments] = useState(items || []);
    const [draft, setDraft] = useState(value || '');
    const [selectedDeptId, setSelectedDeptId] = useState(selectedDepartment);
    
    const editorRef = useRef(null);

    useEffect(() => {
        if (Array.isArray(items)) {
            setComments(items);
        }
    }, [items]);

    useEffect(() => {
        setSelectedDeptId(selectedDepartment);
    }, [selectedDepartment]);

    useEffect(() => {
        if (!editorRef.current) return;
        const html = value || '';
        if (editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
        setDraft(html);
    }, [value]);

    const handleBlur = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            setDraft(html);
            onChange?.(html);
        }
    };

    const handleEditorChange = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            setDraft(html);
            onChange?.(html);
        }
    };

    const handleDeptChange = (val) => {
        setSelectedDeptId(val);
    };

    const getSelectedDeptName = () => {
        const found = departments.find(item => {
            const itemVal = typeof item === 'object' ? (item[valueExpr] ?? item.id ?? item.key ?? '') : item;
            return String(itemVal) === String(selectedDeptId);
        });
        if (!found) return '';
        return typeof found === 'object' ? (found[displayExpr] ?? found.value ?? found.name ?? '') : found;
    };

    const addComment = () => {
        const htmlText = editorRef.current ? editorRef.current.innerHTML : draft;
        const trimmed = htmlText.replace(/<[^>]*>/g, '').trim(); // text-only check for empty input
        
        if (!trimmed && !htmlText.includes('<img') && !htmlText.includes('<iframe')) {
            alert("Vui lòng nhập nội dung ý kiến!");
            return;
        }

        if (!selectedDeptId) {
            alert("Vui lòng chọn phòng ban định hướng!");
            return;
        }

        const deptName = getSelectedDeptName();

        const nextComment = {
            id: Date.now(),
            author: authorName,
            role: roleName,
            text: htmlText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toDepartmentId: selectedDeptId,
            toDepartment: deptName
        };

        const nextComments = [nextComment, ...comments];
        setComments(nextComments);
        
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
        setDraft('');
        
        onItemsChange?.(nextComments);
        onSubmit?.(nextComment, nextComments);
        onChange?.('');
    };

    const command = (cmd, param = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(cmd, false, param);
            handleEditorChange();
        }
    };

    const initials = useMemo(() => {
        return comments.map((item) => item.author?.charAt(0).toUpperCase() || 'U');
    }, [comments]);

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return editorRef.current ? editorRef.current.innerHTML : draft;
                }
                if (editorRef.current) {
                    editorRef.current.innerHTML = nextValue || '';
                }
                setDraft(nextValue || '');
            } else if (name === 'selectedDepartment') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return selectedDeptId;
                }
                setSelectedDeptId(nextValue || '');
            } else if (name === 'departments') {
                // Read-only or write-only support via options call
                return departments;
            }
        },
        value() {
            return {
                text: editorRef.current ? editorRef.current.innerHTML : draft,
                departmentId: selectedDeptId,
                departmentName: getSelectedDeptName()
            };
        },
        reset() {
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
            setDraft('');
            setSelectedDeptId('');
        }
    }));

    return (
        <div className={`comment-editor-card ${className}`.trim()}>
            <div className="comment-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4>{headerTitle}</h4>
                    {headerSubtitle?.trim() && <p>{headerSubtitle}</p>}
                </div>
                <span className="comment-editor-badge" style={{ background: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {comments.length} ý kiến
                </span>
            </div>

            {/* Existing Comments List */}
            <div className="comment-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                {comments.length === 0 ? (
                    <div className="comment-item" style={{ padding: '12px 0', textAlign: 'center', color: '#64748b' }}>
                        <div className="comment-body">
                            <p>{emptyText}</p>
                        </div>
                    </div>
                ) : (
                    comments.map((item, index) => (
                        <div key={item.id || index} className="comment-item" style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div className="comment-avatar" style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#e2e8f0',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}>
                                {initials[index] || 'U'}
                            </div>
                            <div className="comment-body" style={{ flex: 1 }}>
                                <div className="comment-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px', fontSize: '13px' }}>
                                    <strong style={{ color: '#0f172a' }}>{item.author}</strong>
                                    <span style={{ color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                        {item.role || 'Thành viên'}
                                    </span>
                                    {item.toDepartment && (
                                        <span style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                                            định hướng ➔ {item.toDepartment}
                                        </span>
                                    )}
                                    <em style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '11px', fontStyle: 'normal' }}>{item.time || ''}</em>
                                </div>
                                <div 
                                    style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}
                                    dangerouslySetInnerHTML={{ __html: item.text }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Composer */}
            {showComposer && (
                <div className="comment-compose" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    
                    {/* Routing Department Selection */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                            {routeLabel}
                        </span>
                        <div style={{ flex: 1 }}>
                            <SelectBox 
                                value={selectedDeptId}
                                onChange={handleDeptChange}
                                dataSource={departments}
                                valueExpr={valueExpr}
                                displayExpr={displayExpr}
                                placeholder={routePlaceholder}
                            />
                        </div>
                    </div>

                    {/* Rich text editor toolbar */}
                    <div className="tmiv-mini-toolbar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        <div className="tmiv-tool-item" onClick={() => command("undo")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}>↶</div>
                        <div className="tmiv-tool-item" onClick={() => command("redo")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}>↷</div>
                        <div className="tmiv-toolbar-separator" style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}/>
                        
                        <select
                            className="tmiv-select"
                            onChange={e => command("formatBlock", e.target.value)}
                            style={{ padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                        >
                            <option value="p">Normal</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                        </select>

                        <div className="tmiv-tool-item" onClick={() => command("bold")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>B</div>
                        <div className="tmiv-tool-item" onClick={() => command("italic")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', fontStyle: 'italic' }}>I</div>
                        <div className="tmiv-tool-item" onClick={() => command("underline")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', textDecoration: 'underline' }}>U</div>
                        
                        <div className="tmiv-toolbar-separator" style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}/>
                        
                        <div className="tmiv-tool-item fa fa-align-left" onClick={() => command("justifyLeft")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}></div>
                        <div className="tmiv-tool-item fa fa-align-center" onClick={() => command("justifyCenter")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}></div>
                        <div className="tmiv-tool-item fa fa-align-right" onClick={() => command("justifyRight")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}></div>
                        
                        <div className="tmiv-tool-item" onClick={() => command("insertUnorderedList")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}>•</div>
                        <div className="tmiv-tool-item" onClick={() => command("insertOrderedList")} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}>1.</div>
                        
                        <div className="tmiv-toolbar-separator" style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}/>
                        
                        <div className="tmiv-tool-item" onClick={() => {
                            let url = prompt("URL");
                            if (url) command("createLink", url);
                        }} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}>🔗</div>

                        <button
                            type="button"
                            className="comment-send-btn"
                            onClick={addComment}
                            title={submitLabel}
                            style={{
                                marginLeft: 'auto',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <i className="fa fa-paper-plane"></i> {submitLabel}
                        </button>
                    </div>

                    {/* Rich text editing area */}
                    <div 
                        className="tmiv-mini-editor"
                        ref={editorRef}
                        contentEditable="true"
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        onInput={handleEditorChange}
                        style={{
                            minHeight: "100px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            outline: "none",
                            fontSize: "13px",
                            lineHeight: "1.5"
                        }}
                        placeholder={placeholder}
                    />
                </div>
            )}
        </div>
    );
});

CommentEditorRoute.displayName = "CommentEditorRoute";
export default CommentEditorRoute;
