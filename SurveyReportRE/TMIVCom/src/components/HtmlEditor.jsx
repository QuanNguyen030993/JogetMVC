import React, {
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useState
} from "react";

import Cropper from "cropperjs";

const HtmlEditor = forwardRef(({
    value = "",
    height = 150,
    onChange
}, ref) => {

    const editorRef = useRef();

    const [html,setHtml] =
        useState(value);

    const [showCropper, setShowCropper] =
    useState(false);

const [imageSrc, setImageSrc] =
    useState("");

const selectedImageRef =
    useRef(null);


const [selectedImage, setSelectedImage] =
    useState(null);

const [imageRect, setImageRect] =
    useState(null);

const resizeState =
    useRef(null);


const change = () => {

    const html =
        editorRef.current.innerHTML;

    setHtml(html);

    onChange?.(html);
};

const cropImageRef =
    useRef(null);

const cropperRef =
    useRef(null);

    // const resizeState = useRef({
    //     active: false,
    //     startX: 0,
    //     startWidth: 0,
    //     startHeight: 0
    // });

   
    useEffect(() => {

    if (!editorRef.current)
        return;

    if (
        document.activeElement !==
        editorRef.current
    ) {

        editorRef.current.innerHTML =
            value ?? "";
    }});


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

    const startResizeTop = (e) => {

    e.preventDefault();
    e.stopPropagation();

    const img =
        selectedImageRef.current;

    resizeState.current = {
        type: "top",
        startY: e.clientY,
        startHeight: img.offsetHeight
    };
};
const startResize = e => {

    e.preventDefault();

    resizeState.current = {

        startX:
            e.clientX,
        startY:
            e.clientY,
        startWidth:
            imageRect.width,

        startHeight:
            imageRect.height
    };
};
const startResizeHorizontal = (e) => {

    e.preventDefault();
    e.stopPropagation();

    resizeState.current = {
        type: "horizontal",
        startX: e.clientX,
        startWidth: imageRect.width
    };
};

const startResizeVertical = (e) => {

    e.preventDefault();
    e.stopPropagation();

    const img = selectedImageRef.current;

    resizeState.current = {
        type: "vertical",
        startY: e.clientY,
        startHeight: img.offsetHeight,
        startWidth: img.offsetWidth
    };
};
const startResizeCorner = (e) => {

    e.preventDefault();
    e.stopPropagation();

    resizeState.current = {
        type: "corner",
        startX: e.clientX,
        startY: e.clientY,
        startWidth: imageRect.width,
        startHeight: imageRect.height
    };
};

useEffect(() => {

    const editor =
        editorRef.current;

    const click = e => {

        if (
            e.target.tagName === "IMG"
        ) {

            const rect =
                e.target.getBoundingClientRect();

            setSelectedImage(
                e.target
            );

            setImageRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        }
        else {

            setSelectedImage(null);

        }

    };

    editor.addEventListener(
        "click",
        click
    );

    return () =>
        editor.removeEventListener(
            "click",
            click
        );

}, []);
useEffect(() => {

    if (
        !showCropper ||
        !cropImageRef.current
    )
        return;

    cropperRef.current =
        new Cropper(
            cropImageRef.current,
            {
                viewMode: 1,
                autoCropArea: 1,
                responsive: true,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true
            }
        );

    return () => {

        cropperRef.current?.destroy();

        cropperRef.current = null;
    };

}, [showCropper]);
// useEffect(() => {

//     const move = (e) => {

//         if (!resizeState.current.active)
//             return;

//         const deltaX =
//             e.clientX -
//             resizeState.current.startX;

//         const width =
//             Math.max(
//                 50,
//                 resizeState.current.startWidth +
//                 deltaX
//             );

//         const ratio =
//             resizeState.current.startHeight /
//             resizeState.current.startWidth;

//         const height =
//             Math.round(width * ratio);

//         const img =
//             selectedImage?.element;

//         if (!img)
//             return;

//         img.style.width =
//             width + "px";

//         img.style.height =
//             height + "px";

//         const rect =
//             img.getBoundingClientRect();

//         setSelectedImage({
//             element: img,
//             width,
//             height,
//             x:
//                 rect.left +
//                 window.scrollX,
//             y:
//                 rect.top +
//                 window.scrollY
//         });
//     };

//     const up = () => {

//         if (
//             resizeState.current.active
//         ) {

//             resizeState.current.active =
//                 false;

//             change();
//         }
//     };

//     document.addEventListener(
//         "mousemove",
//         move
//     );

//     document.addEventListener(
//         "mouseup",
//         up
//     );

//     return () => {

//         document.removeEventListener(
//             "mousemove",
//             move
//         );

//         document.removeEventListener(
//             "mouseup",
//             up
//         );

//     };

// }, [selectedImage]);

useEffect(() => {

    const move = e => {

        if (
            !resizeState.current ||
            !selectedImage
        )
            return;

        const deltaX =
            e.clientX -
            resizeState.current.startX;

        const width =
            resizeState.current
                .startWidth +
            deltaX;

        const ratio =
            resizeState.current
                .startHeight /
            resizeState.current
                .startWidth;

        const height =
            width * ratio;

        selectedImage.style.width =
            width + "px";

        selectedImage.style.height =
            height + "px";

        const rect =
            selectedImage
                .getBoundingClientRect();

        setImageRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        });
    };

    const up = () => {

        resizeState.current =
            null;

        change();
    };

    document.addEventListener(
        "mousemove",
        move
    );

    document.addEventListener(
        "mouseup",
        up
    );

    return () => {

        document.removeEventListener(
            "mousemove",
            move
        );

        document.removeEventListener(
            "mouseup",
            up
        );

    };

}, [selectedImage]);

const rotateLeft = () => {

    cropperRef.current?.rotate(
        -90
    );

};

const rotateRight = () => {

    cropperRef.current?.rotate(
        90
    );

};

const zoomIn = () => {

    cropperRef.current?.zoom(
        0.1
    );

};

const zoomOut = () => {

    cropperRef.current?.zoom(
        -0.1
    );

};
const applyCrop = () => {

    if (
        !cropperRef.current
    )
        return;

    const canvas =
        cropperRef.current
            .getCroppedCanvas();

    const base64 =
        canvas.toDataURL(
            "image/png"
        );

    if (
        selectedImageRef.current
    ) {

        selectedImageRef.current.src =
            base64;

    }

    change();

    setShowCropper(false);
};

const cancelCrop = () => {

    setShowCropper(false);

};
useEffect(() => {

    const editor = editorRef.current;

    if (!editor) return;

    const handleClick = (e) => {

        editor
            .querySelectorAll("img")
            .forEach(img =>
                img.classList.remove(
                    "tmiv-selected-image"
                )
            );

        if (e.target.tagName === "IMG") {

            const img = e.target;

            img.classList.add(
                "tmiv-selected-image"
            );

            const rect =
                img.getBoundingClientRect();

if (
    !resizeState.current ||
    !selectedImage
)
    return;

selectedImage.style.width =
    width + "px";

selectedImage.style.height =
    height + "px";

        }
        else {
            setSelectedImage(null);
        }
    };

    editor.addEventListener(
        "click",
        handleClick
    );

    return () =>
        editor.removeEventListener(
            "click",
            handleClick
        );

}, []);
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

                if (!url) return;

                document.execCommand(
                    "insertHTML",
                    false,
                    `<img
                        src="${url}"
                        style="
                            max-width:100%;
                            height:auto;
                        "
                    />`
                );

                change();
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

