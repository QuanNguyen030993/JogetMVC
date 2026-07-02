import { useEffect, useMemo, useState, useRef } from 'react';
import { register } from './Core';

const initialComments = [
  // {
  //   id: 1,
  //   author: 'Alice',
  //   role: 'Reviewer',
  //   text: 'Please confirm phase 2 before moving forward.',
  //   time: '10:15',
  // },
  // {
  //   id: 2,
  //   author: 'Bob',
  //   role: 'Owner',
  //   text: 'Looks good. I will update the summary soon.',
  //   time: '10:28',
  // },
];

function CommentEditor({
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
}) {
  const sourceItems = Array.isArray(items) ? items : Array.isArray(commentsProp) ? commentsProp : initialComments;
  const [comments, setComments] = useState(sourceItems);
  const [draft, setDraft] = useState(value || '');
const editorRef = useRef();
    const change = () => {

        let html = editorRef.current.innerHTML;

        onChange?.(html);
    };

const handleBlur = () => {
    onChange?.(editorRef.current.innerHTML);
};

  useEffect(() => {
    if (Array.isArray(items) || Array.isArray(commentsProp)) {
      setComments(Array.isArray(items) ? items : commentsProp);
    }
  }, [items, commentsProp]);

  const initials = useMemo(() => {
    return comments.map((item) => item.author?.charAt(0).toUpperCase() || 'U');
  }, [comments]);

  const addComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const nextComment = {
      id: Date.now(),
      author: authorName,
      role: roleName,
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextComments = [nextComment, ...comments];
    setComments(nextComments);
    setDraft('');
    onItemsChange?.(nextComments);
    onSubmit?.(nextComment, nextComments);
    onChange?.(trimmed);
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
        {comments.length} items
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
              <div key={item.id} className="comment-item">
                <div className="comment-avatar">{initials[index] || 'U'}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{item.author}</strong>
                    <span>{item.role || 'Comment'}</span>
                    <em>{item.time || ''}</em>
                  </div>
                  <p>{item.text || item.body || ''}</p>
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
<button
    className="comment-send-btn"
    onClick={addComment}
    title={submitLabel}
>
    <i className="fa fa-paper-plane"></i>
</button>
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
            
            >
              
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
}

register('CommentEditor', CommentEditor);

export default CommentEditor;
