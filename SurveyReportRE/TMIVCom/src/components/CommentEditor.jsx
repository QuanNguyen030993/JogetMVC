import { useMemo, useState } from 'react';
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

function CommentEditor({ value = '', onChange, placeholder = 'Add comment...' }) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState(value || '');

  const initials = useMemo(() => {
    return comments.map((item) => item.author?.charAt(0).toUpperCase() || 'U');
  }, [comments]);

  const addComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const nextComment = {
      id: Date.now(),
      author: 'You',
      role: 'Contributor',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setComments((prev) => [nextComment, ...prev]);
    setDraft('');
    if (onChange) onChange(trimmed);
  };

  return (
    <div className="comment-editor-card">
      <div className="comment-editor-header">
        <div>
          <h4>Comments</h4>
          <p>Review thread and add notes</p>
        </div>
        <span className="comment-editor-badge">{comments.length} items</span>
      </div>

      <div className="comment-list">
        {comments.map((item, index) => (
          <div key={item.id} className="comment-item">
            <div className="comment-avatar">{initials[index] || 'U'}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <strong>{item.author}</strong>
                <span>{item.role}</span>
                <em>{item.time}</em>
              </div>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="comment-compose">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
        />
        <button type="button" onClick={addComment}>Send</button>
      </div>
    </div>
  );
}

register('CommentEditor', CommentEditor);

export default CommentEditor;
