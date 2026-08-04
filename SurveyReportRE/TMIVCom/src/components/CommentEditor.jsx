import { useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from 'react';

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

const CommentEditor = forwardRef(({
    value = '',
    onChange,
    placeholder = 'Add comment...',
    items = null,
    comments: commentsProp = null,
    onSubmit,
    onItemsChange,
    emptyText = 'No comments.',
    renderItem,
    showComposer = true,
    submitLabel = 'Send',
    headerTitle = 'Comments',
    headerSubtitle = '',
    authorName = 'You',
    roleName = 'Contributor',
    className = '',
    onClick,
    onValueChanged,

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

     
    // const [comments, setComments] = useState(initialComments);
    
    // useEffect(() => {
    //     const apiUrl = import.meta.env.VITE_API_URL || "https://localhost:7254";
    //     fetch(
    //         `${apiUrl}/api/SectionCommentNote/GetAll?refKey=d3ed59f0-b9bd-4a70-8cb0-c7c4daee50c8&refField=RecordGuid`
    //     )
    //         .then(r => r.json())
    //         .then(res => {
    //             const mapped = (res || []).map(x => ({
    //                 id: x.id,
    //                 author: x.author,
    //                 role: x.currentDepartment,
    //                 text: x.content,
    //                 time: x.createdDate
    //             }));
    // 
    //             setComments(mapped);
    //         })
    //         .catch(err => {
    //             console.error(err);
    //         });
    // }, []);

useEffect(() => {
   if (Array.isArray(items)) {
       setComments(items);
   }
}, [items]);
  // Keep editor synced with parent value


    const [draft, setDraft] = useState(value || '');
    const editorRef = useRef();
    const change = () => {
        let html = editorRef.current.innerHTML;
        onChange?.(html);
    };
    useEffect(() => {
        if (!editorRef.current) return;
        const html = value || '';


        if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
        }
    }, [value]);

  

    // useImperativeHandle(ref, () => ({
    //         option(name, value) {
    //             switch (name) {
    //                 case "value":

    //                     if (editorRef.current) {
    //                         editorRef.current.innerHTML =
    //                             value || "";
    //                     }

    //                     break;
    //             }
    //         }
    //     }));


    
const handleBlur = () => {
    onChange?.(editorRef.current.innerHTML);
};



  const initials = useMemo(() => {
    return comments.map((item) => {
        const auth = getCommentAuthor(item);
        return auth.charAt(0).toUpperCase() || 'U';
    });
  }, [comments]);

  const addComment = () => {
    const htmlText = editorRef.current ? editorRef.current.innerHTML : draft;
    const trimmed = htmlText.replace(/<[^>]*>/g, '').trim(); // text-only check for empty input
    if (!trimmed && !htmlText.includes('<img') && !htmlText.includes('<iframe')) return;

    const generatedGuid = generateGuid();
    const formattedDate = formatDate(new Date());

    const nextComment = {
      Id: Date.now(),
      RecordGuid: recordGuid,
      FromDepartment: fromDepartment,
      ToDepartment: null,
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

    const command=(cmd,param=null)=>{


        editorRef.current.focus();


        document.execCommand(
            cmd,
            false,
            param
        );


        update();


    };
  return (
    <div className={`comment-editor-card ${className}`.trim()}>
      <div className="comment-editor-header">
        
    {headerSubtitle?.trim() && (
        <div>
          <h4>{headerTitle}</h4>
          <p>{headerSubtitle}</p>
        </div>
      )}

      <span className="comment-editor-badge">
        {comments.length} comments
      </span>

      </div>

      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="comment-item">
            <div className="comment-body">
              <p>{emptyText}</p>
            </div>
          </div>
        ) : (
                      comments.map((item, index) => {
            if (typeof renderItem === 'function') {
              return renderItem(item, index, initials[index] || 'U');
            }

            return (
              <div key={item.id || index} className="comment-item">
                <div className="comment-avatar">{initials[index] || 'U'}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{getCommentAuthor(item)}</strong>
                    <span>{getCommentRole(item) || 'Comment'}</span>
                    {getCommentToDept(item) && (
                      <span className="route-badge" style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', marginLeft: '6px' }}>
                        Route ➔ {getCommentToDept(item)}
                      </span>
                    )}
                    <em>{getCommentTime(item)}</em>
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{
                        __html: getCommentText(item)
                    }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>


     
      {showComposer ? (
        
        <div className="comment-compose">

                <div class="tmiv-mini-toolbar">

<div
        className="tmiv-tool-item"
        onClick={()=>command("undo")}
    >
        ↶
    </div>


    <div
        className="tmiv-tool-item"
        onClick={()=>command("redo")}
    >
        ↷
    </div>


    <div className="tmiv-toolbar-separator"/>


    <select
        className="tmiv-select"
        onChange={
            e=>command(
                "formatBlock",
                e.target.value
            )
        }
    >
        <option value="p">
            Normal
        </option>

        <option value="h1">
            Heading 1
        </option>

        <option value="h2">
            Heading 2
        </option>

    </select>



    <div
        className="tmiv-tool-item"
        onClick={()=>command("bold")}
    >
        <b>B</b>
    </div>


    <div
        className="tmiv-tool-item"
        onClick={()=>command("italic")}
    >
        <i>I</i>
    </div>


    <div
        className="tmiv-tool-item"
        onClick={()=>command("underline")}
    >
        <u>U</u>
    </div>



    <div className="tmiv-toolbar-separator"/>



    <div
        className="tmiv-tool-item fa fa-align-left"
        onClick={()=>command("justifyLeft")}
    >
        
    </div>


    <div
        className="tmiv-tool-item fa fa-align-center"
        onClick={()=>command("justifyCenter")}
    >
        
    </div>


    <div
        className="tmiv-tool-item fa fa-align-right"
        onClick={()=>command("justifyRight")}
    >
        
    </div>


    <div
        className="tmiv-tool-item"
        onClick={()=>
            command("insertUnorderedList")
        }
    >
        •
    </div>


    <div
        className="tmiv-tool-item"
        onClick={()=>
            command("insertOrderedList")
        }
    >
        1.
    </div>



    <div className="tmiv-toolbar-separator"/>


    <div
        className="tmiv-tool-item"
        onClick={()=>{
            let url=prompt("URL");

            if(url)
                command(
                    "createLink",
                    url
                );
        }}
    >
        🔗
    </div>
      </div>
        <div class="tmiv-mini-editor"
                ref={editorRef}
                contentEditable="true"
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{
                    __html:value
                }}
                // onInput={change}
                style={{
                    minHeight: "100px"
                }}
                onBlur={handleBlur}
                onChange={onChange}
            >
              
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingRight: '4px' }}>
          <button
              type="button"
              className="comment-send-btn"
              onClick={onClick || addComment}
              title={submitLabel || "Send"}
              style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  transition: 'all 0.2s ease'
              }}
          >
              <i className="fa fa-paper-plane" style={{ fontSize: '12px' }}></i>
          </button>
        </div>
          {/* <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
          /> */}
          
        </div>
      ) : null}
    </div>
  );
})

// register('CommentEditor', CommentEditor);

export default CommentEditor;

