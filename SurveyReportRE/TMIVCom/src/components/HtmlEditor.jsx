import React, {
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle
} from "react";

const HtmlEditor = forwardRef(({
    value = "",
    height = 150,
    onChange
}, ref) => {

    const editorRef = useRef();

    useEffect(() => {

        if (!editorRef.current) return;

        const html = value ?? "";

        if (editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }

    }, [value]);

    const update = () => {

        if (!editorRef.current) return;

        const result =
            editorRef.current.innerHTML;

        onChange?.(result);
    };

    const command = (cmd, param = null) => {

        editorRef.current?.focus();

        document.execCommand(
            cmd,
            false,
            param
        );

        update();
    };

    useImperativeHandle(ref, () => ({

        option(name, value) {

            switch (name) {

                case "value":

                    if (editorRef.current) {

                        editorRef.current.innerHTML =
                            value ?? "";

                        onChange?.(
                            value ?? ""
                        );
                    }

                    break;

                default:
                    break;
            }
        },

        value() {
            return (
                editorRef.current?.innerHTML ||
                ""
            );
        }

    }));

    return (
        <div className="jira-comment-box">
            <div className="jira-comment-editor-wrap">

                <div className="tmiv-html-editor">

                    <div className="tmiv-html-toolbar">

    <div
        className="tmiv-tool-item"
        onClick={() => command("undo")}
    >
        ↶
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("redo")}
    >
        ↷
    </div>

    <div className="tmiv-toolbar-separator" />

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "fontName",
                e.target.value
            )
        }
    >
         <option value="Asap">
            Asap
        </option>
        <option value="Arial">
            Arial
        </option>

        <option value="Tahoma">
            Tahoma
        </option>

        <option value="Verdana">
            Verdana
        </option>

        <option value="Times New Roman">
            Times
        </option>
    </select>

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "fontSize",
                e.target.value
            )
        }
    >
        <option value="1">8</option>
        <option value="2">10</option>
        <option value="3">12</option>
        <option value="4">16</option>
        <option value="5">24</option>
        <option value="6">32</option>
        <option value="7">48</option>
    </select>

    <div className="tmiv-toolbar-separator" />

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "formatBlock",
                e.target.value
            )
        }
    >
        <option value="p">
            Normal
        </option>

        <option value="h1">
            H1
        </option>

        <option value="h2">
            H2
        </option>

        <option value="h3">
            H3
        </option>

        <option value="blockquote">
            Quote
        </option>
    </select>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => command("bold")}
    >
        <b>B</b>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("italic")}
    >
        <i>I</i>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("underline")}
    >
        <u>U</u>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("strikeThrough")}
    >
        <s>S</s>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("superscript")}
    >
        x²
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("subscript")}
    >
        x₂
    </div>

    <div className="tmiv-toolbar-separator" />

    <input
        type="color"
        title="Text Color"
        onChange={e =>
            command(
                "foreColor",
                e.target.value
            )
        }
    />

    <input
        type="color"
        title="Background Color"
        onChange={e =>
            command(
                "hiliteColor",
                e.target.value
            )
        }
    />

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item fa fa-align-left"
        onClick={() => command("justifyLeft")}
    />

    <div
        className="tmiv-tool-item fa fa-align-center"
        onClick={() => command("justifyCenter")}
    />

    <div
        className="tmiv-tool-item fa fa-align-right"
        onClick={() => command("justifyRight")}
    />

    <div
        className="tmiv-tool-item"
        onClick={() => command("justifyFull")}
    >
        J
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("insertUnorderedList")
        }
    >
        •
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("insertOrderedList")
        }
    >
        1.
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("indent")
        }
    >
        ⇥
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("outdent")
        }
    >
        ⇤
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => {
            const url = prompt("URL");

            if (url) {
                command(
                    "createLink",
                    url
                );
            }
        }}
    >
        🔗
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => {
            const url =
                prompt("Image URL");

            if (url) {
                command(
                    "insertImage",
                    url
                );
            }
        }}
    >
        🖼️
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => {

            document.execCommand(
                "insertHTML",
                false,
                `
                <table border="1" style="border-collapse:collapse;width:100%">
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                </table>
                `
            );

            change();
        }}
    >
        ⊞
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => {

            const text =
                window
                    .getSelection()
                    ?.toString() || "";

            document.execCommand(
                "insertHTML",
                false,
                `<pre><code>${text}</code></pre>`
            );

            change();
        }}
    >
        {"</>"}
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command(
                "insertHorizontalRule"
            )
        }
    >
        ─
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("removeFormat")
        }
    >
        Tx
    </div>

</div>

                    <div
                    
                    ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{
                            __html: value
                        }}
                        onInput={update}
                        className="tmiv-html-content"
                        style={{
                            minHeight: height
                        }}

                    />
                </div>

            </div>
        </div>
    );
});

export default HtmlEditor;


// import React, {
//     useRef,
//     useState,
//     useEffect
// } from "react";
// import { createRoot } from "react-dom/client";

// function HtmlEditor({
//     value = "",
//     height = 300,
//     onChange
// }) {

// const editorRef = useRef();


//     const [html,setHtml] =
//         useState(value);



//     useEffect(()=>{

//         setHtml(value);

//     },[value]);



//     const command=(cmd,param=null)=>{


//         editorRef.current.focus();


//         document.execCommand(
//             cmd,
//             false,
//             param
//         );


//         update();


//     };



//     const update=()=>{


//         let result =
//             editorRef.current.innerHTML;


//         setHtml(result);


//         onChange?.(result);

//     };


//     const change = () => {

//         let html = editorRef.current.innerHTML;

//         onChange?.(html);
//     };


//     return (
// <div className="jira-comment-box">
// <div className="jira-comment-editor-wrap">


//         <div className="tmiv-html-editor">

// <div className="tmiv-html-toolbar">

//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("undo")}
//     >
//         ↶
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("redo")}
//     >
//         ↷
//     </div>


//     <div className="tmiv-toolbar-separator"/>


//     <select
//         className="tmiv-select"
//         onChange={
//             e=>command(
//                 "formatBlock",
//                 e.target.value
//             )
//         }
//     >
//         <option value="p">
//             Normal
//         </option>

//         <option value="h1">
//             Heading 1
//         </option>

//         <option value="h2">
//             Heading 2
//         </option>

//     </select>



//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("bold")}
//     >
//         <b>B</b>
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("italic")}
//     >
//         <i>I</i>
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("underline")}
//     >
//         <u>U</u>
//     </div>



//     <div className="tmiv-toolbar-separator"/>



//     <div
//         className="tmiv-tool-item fa fa-align-left"
//         onClick={()=>command("justifyLeft")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item fa fa-align-center"
//         onClick={()=>command("justifyCenter")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item fa fa-align-right"
//         onClick={()=>command("justifyRight")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>
//             command("insertUnorderedList")
//         }
//     >
//         •
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>
//             command("insertOrderedList")
//         }
//     >
//         1.
//     </div>



//     <div className="tmiv-toolbar-separator"/>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>{
//             let url=prompt("URL");

//             if(url)
//                 command(
//                     "createLink",
//                     url
//                 );
//         }}
//     >
//         🔗
//     </div>

// </div>





//             <div 

//                 ref={editorRef}

//                 contentEditable

//                 suppressContentEditableWarning


//                 dangerouslySetInnerHTML={{
//                     __html:value
//                 }}


//                 onInput={change}


//                 className="tmiv-html-content"


//                 style={{
//                     minHeight: "150px"
//                 }}

//             />

//         </div>
// </div>
// </div>
//     );

// }

// export default HtmlEditor;  

