
import React, { useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

/**
 * HtmlEditorQuill.jsx
 *
 * Install:
 *   npm install react-quill quill
 *
 * Usage:
 *   import HtmlEditorQuill from "./HtmlEditorQuill";
 *
 *   <HtmlEditorQuill
 *      value={html}
 *      onChange={setHtml}
 *   />
 */
function HtmlEditorQuill({
  value = "",
  onChange,
  readOnly = false,
  height = 250,
  placeholder = "",
}) {
  const quillRef = useRef(null);
  const [internalValue, setInternalValue] = useState(value);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          [{ font: [] }],
          [{ size: ["small", false, "large", "huge"] }],

          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],

          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],

          ["blockquote", "code-block"],
          ["link", "image"],

          ["clean"],
        ],
      },

      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "list",
    "bullet",
    "indent",
    "blockquote",
    "code-block",
    "link",
    "image",
  ];

  const handleChange = (html) => {
    setInternalValue(html);

    if (typeof onChange === "function") {
      onChange(html);
    }
  };

  // const getHtml = () => {
  //   const editor = quillRef.current?.getEditor();
  //   if (!editor) return internalValue;

  //   return editor.root.innerHTML;
  // };

  // const clearEditor = () => {
  //   const editor = quillRef.current?.getEditor();
  //   if (editor) {
  //     editor.setContents([]);
  //   }

  //   setInternalValue("");

  //   if (typeof onChange === "function") {
  //     onChange("");
  //   }
  // };

  // const insertSampleHtml = () => {
  //   const sample = `
  //     <h2>Quill HTML Editor</h2>
  //     <p>
  //       Đây là ví dụ <strong>ReactJS + Quill</strong>.
  //     </p>
  //     <p style="color:#00869d;">
  //       Nội dung HTML có thể lưu trực tiếp xuống database.
  //     </p>
  //     <ul>
  //       <li>Bold / Italic / Underline</li>
  //       <li>Danh sách</li>
  //       <li>Link</li>
  //       <li>Image</li>
  //     </ul>
  //   `;

  //   const editor = quillRef.current?.getEditor();

  //   if (editor) {
  //     editor.clipboard.dangerouslyPasteHTML(sample);
  //     const html = editor.root.innerHTML;

  //     setInternalValue(html);

  //     if (typeof onChange === "function") {
  //       onChange(html);
  //     }
  //   }
  // };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 10,
          borderBottom: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        {/* <button type="button" onClick={insertSampleHtml}>
          Insert sample HTML
        </button> */}

        {/* <button type="button" onClick={clearEditor}>
          Clear
        </button> */}

        {/* <button
          type="button"
          onClick={() => {
            console.log("Current HTML:", getHtml());
            alert(getHtml());
          }}
        >
          Get HTML
        </button> */}
      </div>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={internalValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{
          height,
          marginBottom: 42,
        }}
      />
    </div>
  );
}


export default HtmlEditorQuill
/*
========================================================
EXAMPLE APP
========================================================

import React, { useState } from "react";
import HtmlEditorQuill from "./HtmlEditorQuill";

export default function App() {
  const [html, setHtml] = useState(`
    <h2>Hello Quill</h2>
    <p>Đây là nội dung ban đầu.</p>
  `);

  const saveData = async () => {
    console.log("HTML save to DB:", html);

    await fetch("/api/template/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: html,
      }),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HTML Editor - React Quill</h2>

      <HtmlEditorQuill
        value={html}
        onChange={setHtml}
        height={400}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={saveData}>
          Save
        </button>
      </div>

      <hr />

      <h3>HTML output</h3>

      <textarea
        value={html}
        readOnly
        style={{
          width: "100%",
          minHeight: 180,
        }}
      />

      <h3>Preview</h3>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 15,
        }}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </div>
  );
}
*/
