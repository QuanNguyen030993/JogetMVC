import { useEffect, useMemo, useState } from 'react';
import { register } from './Core';
import '../css/com.all.css';

const initialComments = [
  {
    id: 1,
    author: 'Alice',
    role: 'Reviewer',
    text: 'Please confirm phase 2 before moving forward.',
    time: '10:15',
  },
  {
    id: 2,
    author: 'Bob',
    role: 'Owner',
    text: 'Looks good. I will update the summary soon.',
    time: '10:28',
  },
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
  headerSubtitle = 'Review thread and add notes',
  authorName = 'You',
  roleName = 'Contributor',
  className = '',
}) {
  const sourceItems = Array.isArray(items) ? items : Array.isArray(commentsProp) ? commentsProp : initialComments;
  const [comments, setComments] = useState(sourceItems);
  const [draft, setDraft] = useState(value || '');

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

  return (
    <div className={`comment-editor-card ${className}`.trim()}>
      <div className="comment-editor-header">
        <div>
          <h4>{headerTitle}</h4>
          <p>{headerSubtitle}</p>
        </div>
        <span className="comment-editor-badge">{comments.length} items</span>
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
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
          />
          <button type="button" onClick={addComment}>{submitLabel}</button>
        </div>
      ) : null}
    </div>
  );
}

register('CommentEditor', CommentEditor);

export default CommentEditor;
