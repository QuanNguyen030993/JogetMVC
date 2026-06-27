import { useCallback } from 'react';

const toolbarItems = [
  { label: 'Bold', style: 'font-weight: bold;' },
  { label: 'Italic', style: 'font-style: italic;' },
  { label: 'Underline', style: 'text-decoration: underline;' },
  { label: 'Heading', style: 'font-size: 1.25rem; font-weight: bold;' },
];

function HtmlEditor({ value, onChange }) {
  const applyFormat = useCallback(
    (style) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.cssText = style;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      selection.addRange(range);
      onChange(document.getElementById('editor').innerHTML);
    },
    [onChange],
  );

  return (
    <div className="html-editor">
      <div className="editor-toolbar">
        {toolbarItems.map((item) => (
          <button key={item.label} type="button" onClick={() => applyFormat(item.style)}>
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="editor"
        className="editor-area"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}

export default HtmlEditor;
