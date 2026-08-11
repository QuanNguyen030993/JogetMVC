import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import SelectBox from './SelectBox';

const generateGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).toUpperCase();
    });
};

const formatDate = (date) => {
    const pad = (num, size = 2) => {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    };
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${ms}0000`;
};

const getCommentAuthor = (item) => item.Author || item.author || '';
const getCommentRole = (item) => item.CurrentDepartment || item.role || item.FromDepartment || '';
const getCommentText = (item) => item.Content || item.text || '';
const getCommentTime = (item) => {
    const rawDate = item.CreatedDate || item.time || '';
    if (!rawDate) return '';
    if (rawDate.includes(' ') && rawDate.includes(':')) {
        const parts = rawDate.split(' ');
        const timePart = parts[1];
        const timeSubparts = timePart.split(':');
        return `${timeSubparts[0]}:${timeSubparts[1]}`;
    }
    return rawDate;
};
const getCommentToDept = (item) => item.ToDepartment || item.toDepartment || '';

const CommentEditorRoute = forwardRef(({
    value = '',
    onChange,
    placeholder = 'Type a comment...',
    items = [],
    onSubmit,
    onItemsChange,
    emptyText = 'No comments yet.',
    renderItem,
    showComposer = true,
    disableComment = false, // true: chỉ hiển thị log comment, ẩn toàn bộ phần chat/composer
    submitLabel = 'Send',
    headerTitle = 'Comments',
    headerSubtitle = '',
    authorName = 'You',
    roleName = 'Member',
    className = '',
    submitUrl = '',
    onClick,
    // Routing target selection configuration
    departments = [], // List of departments to select from
    valueExpr = 'id',
    displayExpr = 'name',
    selectedDepartment = '',
    routePlaceholder = 'Select routing department...',
    routeLabel = 'Send message to:',

    // Database record parameters
    id = 0,
    recordGuid = '',
    fromDepartment = '',
    currentDepartment = '',
    type = null,
    isPrimaryNote = 0,
    isPinned = 0,
    isUrgent = 0,
    isRead = 0,
    isResolved = 0,
    parentCommentId = null,
    linkedPrimaryNoteId = null,
    createdBy = '',
    author = '',
    rowOrder = null,
    copyFromGuid = null,
    draftGuid = null,
    modifiedBy = null,
    deletedBy = null
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

    const addComment = async () => {
        const htmlText = editorRef.current ? editorRef.current.innerHTML : draft;
        const trimmed = htmlText.replace(/<[^>]*>/g, '').trim(); // text-only check for empty input
        
        if (!trimmed && !htmlText.includes('<img') && !htmlText.includes('<iframe')) {
            alert("Please enter a comment!");
            return;
        }

        if (!selectedDeptId) {
            alert("Please select a routing department!");
            return;
        }

        const deptName = getSelectedDeptName();
        const generatedGuid = generateGuid();
        const formattedDate = formatDate(new Date());

        const nextComment = {
            Id: Date.now(),
            RecordGuid: recordGuid,
            FromDepartment: fromDepartment,
            ToDepartment: deptName || null,
            CurrentDepartment: currentDepartment,
            Type: type || null,
            Content: htmlText,
            IsPrimaryNote: isPrimaryNote || 0,
            IsPinned: isPinned || 0,
            IsUrgent: isUrgent || 0,
            IsRead: isRead || 0,
            IsResolved: isResolved || 0,
            ParentCommentId: parentCommentId || null,
            LinkedPrimaryNoteId: linkedPrimaryNoteId || null,
            Guid: generatedGuid,
            CreatedBy: createdBy,
            CreatedDate: formattedDate,
            ModifiedBy: modifiedBy || null,
            ModifiedDate: formattedDate,
            Deleted: 0,
            DeletedBy: deletedBy || null,
            DeletedDate: formattedDate,
            RowOrder: rowOrder || null,
            CopyFromGuid: copyFromGuid || null,
            DraftGuid: draftGuid || null,
            Author: author || authorName,
            
            // Keep legacy properties for UI matching
            id: Date.now(),
            author: author || authorName,
            role: currentDepartment || roleName,
            text: htmlText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toDepartmentId: selectedDeptId,
            toDepartment: deptName || null
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
        try {
            const apiResult = await callApi(nextComment);
            console.log('API Result:', apiResult);
            // Nếu muốn lấy Id từ DB trả về
            // if (apiResult?.id) {
            // nextComment.Id = apiResult.id;
            // }
            } catch (error) {
            alert('Có lỗi xảy ra khi lưu dữ liệu!');
            console.log(error);
            return;
            }
    };

    const command = (cmd, param = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(cmd, false, param);
            handleEditorChange();
        }
    };

    const initials = useMemo(() => {
        return comments.map((item) => {
            const auth = getCommentAuthor(item);
            return auth.charAt(0).toUpperCase() || 'U';
        });
    }, [comments]);
    const postCommentToApi = async (commentData) => {
        if (!submitUrl) return null;

        try {
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error posting comment:', error);
            throw error;
        }
    };

    const callApi = async (commentData) => {
        if (!submitUrl) return null;

        try {
            const params = new URLSearchParams({
                Guid: commentData.Guid,
                RecordGuid: commentData.RecordGuid,
                Content: commentData.Content,
                FromDepartment: commentData.FromDepartment,
                ToDepartment: commentData.ToDepartment,
                Author: commentData.Author
            });

            const response = await fetch(
                // `${submitUrl}?${params.toString()}`,
                 `${submitUrl}`,
                {
                    method: 'GET'
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

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
                    {/* <h4>{headerTitle}</h4> */}
                    <span className="comment-editor-badge" style={{ background: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {comments.length} comments
                    </span>
                    {headerSubtitle?.trim() && <p>{headerSubtitle}</p>}
                </div>
                
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
                        <div key={item.id || index} className="comment-item">
                            <div className="comment-avatar">{initials[index] || 'U'}</div>
                            <div className="comment-body">
                                <div className="comment-meta">
                                    <strong>{getCommentAuthor(item)}</strong>
                                    <span>{getCommentRole(item) || 'Member'}</span>
                                    {getCommentToDept(item) && (
                                        <span className="route-badge" style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', marginLeft: '6px' }}>
                                             ➔ {getCommentToDept(item)}
                                        </span>
                                    )}
                                    <em>{getCommentTime(item)}</em>
                                </div>
                                <div 
                                    dangerouslySetInnerHTML={{ __html: getCommentText(item) }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Composer */}
            {showComposer && !disableComment && (
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
                            title={submitLabel || "Send"}
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
                            <i className="fa fa-paper-plane"></i>
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
