import React, { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "../styles/mailTemplateDesigner.css";
import "grapesjs/dist/css/grapes.min.css";





function MailTemplateDesigner(){


    const editorRef = useRef(null);
    const editorInstance = useRef(null);


const [templates, setTemplates] = useState([]);
const [dynamicFields, setDynamicFields] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [sqlQuery, setSqlQuery] = useState("");
const [title, setTitle] = useState("");
const [prefix, setPrefix] = useState("");
const [cc, setCc] = useState("");

const onSqlChange = (query) => {
    const editor = editorInstance.current;
    if (!editor) return;

    const fields = extractFieldsFromQuery(query);

    const bm = editor.BlockManager;

    // ✅ clear field cũ (dùng prefix cho chắc)
    bm.getAll().forEach(block => {
        if (block.getId().startsWith("field-")) {
            bm.remove(block);
        }
    });

    // ✅ add field mới
    fields.forEach(f => {
        bm.add(`field-${f}`, {
            label: f,
            category: "Fields",
            content: {
                type: "tmiv-field",
                content: `{{${f}}}`,
                attributes: {
                    "data-bind": f
                }
            }
        });
    });

    // ✅ force render lại panel (tránh UI không update)
    bm.render();
};
const FIELDS = [
   
];
useEffect(() => {
    fetch("https://localhost:7254/api/MailTemplate/GetAll")
        .then(res => res.json())
        .then(data => {
            setTemplates(data);
        })
        .catch(err => {
            console.error("Fetch template error", err);
        });
}, []);


const convertToEditorFormat = (html) => {
    return html.replace(/@@([a-zA-Z0-9_]+)/g, (_, key) => `{{${key}}}`);
};

const extractFieldsFromQuery = (query) => {
    if (!query) return [];

    const fields = [];

    const match = query.match(/select([\s\S]*?)from/i);
    if (!match) return [];

    let selectPart = match[1];

    const parts = selectPart.split(",");

    parts.forEach(p => {
        const clean = p.trim();

        // ✅ bỏ phần rỗng (do dấu , cuối)
        if (!clean) return;

        // ✅ bắt alias: AS 'Name' hoặc AS Name
        const aliasMatch = clean.match(/as\s+['"`]?([a-zA-Z0-9_]+)['"`]?/i);

        if (aliasMatch) {
            fields.push(aliasMatch[1]);
        } else {
            // ✅ fallback
            const raw = clean.split(".").pop().trim();
            if (raw) fields.push(raw);
        }
    });

    return fields;
};


const convertFieldsToEditor = (fields) => {
    return fields.map(f => ({
        id: f.charAt(0).toLowerCase() + f.slice(1),
        label: f
    }));
};

const createTemplate = async () => {
    try {
        
        const name = prompt("Enter template name");

        if (!name) return;

        const newTemplate = {
            templateName: name,   // ✅ cho user đổi sau
            title: "",
            prefix: "",
            cc: "",
            active: true,
            templateContent: "",
            mailQuery: ""
        };

        const formData = new FormData();
        formData.append("values", JSON.stringify(newTemplate));

        const res = await fetch(
            "https://localhost:7254/api/MailTemplate/InsertData",
            {
                method: "POST",
                body: formData
            }
        );

        if (!res.ok) throw new Error("Insert failed");

        const created = await res.json();

setTitle("");
setPrefix("");
setCc("");
setSqlQuery("");

        // ✅ add vào list UI
        setTemplates(prev => [created, ...prev]);

        // ✅ select luôn
        loadTemplate(created);

        alert("Template created ✅");

    } catch (err) {
        console.error("CREATE ERROR", err);
        alert("Create failed ❌");
    }
};


const loadTemplate = (template) => {
    





    const editor = editorInstance.current;
    if (!editor) return;

    var html = convertToEditorFormat(template.templateContent);
    
    // html = html.replace(
    //     />([^<>]+)</g,
    //     (match, text) => {
    //         if (text.trim()) {
    //             return ` data-gjs-type="text">${text}<`;
    //         }
    //         return match;
    //     }
    // );

    const components = convertToGrapesComponents(html, editor);

    // editor.setComponents(`
    //     <div class="mail-content">
    //         ${html}
    //     </div>
    // `);
    
    editor.setComponents({
            tagName: "div",
            attributes: { class: "mail-content" },
            components
        });

    setSelectedTemplate(template);
    setSqlQuery(template.mailQuery || "");
    setTitle(template.templateMailTitle || "");
    setPrefix(template.prefixTitleMail || "");
    setCc(template.cc || "");


    // ✅ parse SQL
    const fields = extractFieldsFromQuery(template.mailQuery);

    // ✅ clear block cũ (tránh duplicate)
    const bm = editor.BlockManager;
    
    bm.getAll().forEach(block => {
        if (block.getId().startsWith("field-")) {
            bm.remove(block);
        }
    });


    // ✅ add block mới
    fields.forEach(f => {
        bm.add(`field-${f}`, {
            label: f,
            category: "Fields",
            content: {
                type: "tmiv-field",
                content: `{{${f}}}`,
                attributes: {
                    "data-bind": f
                }
            }
        });
    });
};
    useEffect(()=>{


        if(!editorRef.current)
            return;



        const editor = grapesjs.init({

    container: editorRef.current,

    height:"100vh",

    width:"100%",

    richTextEditor: {},
    storageManager:false,


    fromElement:false,


    // TOOLBAR
    panels: {
        defaults: []
    },


    blockManager: {

        appendTo: "#gjs-blocks"

    },


    canvas: {

        frameStyle: `

        body {

            background:#f3f4f6;

            padding:40px;

            font-family:Arial;

        }


        .mail-content {

            width:700px;

            min-height:400px;

            margin:auto;

            padding:40px;

            background:white;

            border-radius:12px;

            box-shadow:
            0 5px 20px #ddd;

        }



        .tmiv-field {

            background:#e8f3ff;

            border:1px dashed #1677ff;

            padding:3px 8px;

            border-radius:5px;

            color:#1677ff;

        }

        `

    }


});



        editorInstance.current = editor;




        /*
            Custom field component
        */

        editor.DomComponents.addType(
            "tmiv-field",
            {

                model:{

                    defaults:{

                        tagName:"span",

                        content:"{{field}}",

                        draggable:true,

                        droppable:false,


                        attributes:{

                            class:"tmiv-field",

                            "data-bind":""

                        }

                    }
                }
            }
        );
        // editor.DomComponents.addType('default', {
        //     model: {
        //         defaults: {
        //             editable: true,
        //         },

        //         init() {
        //             // nếu có text bên trong thì convert thành text component
        //             const content = this.get('content');

        //             if (content && typeof content === 'string') {
        //                 this.set({
        //                     type: 'text',
        //                     editable: true
        //                 });
        //             }
        //         }
        //     }
        // });


        /*
            Initial template
        */


        editor.setComponents(`


<div class="mail-content">


    <h2>
        Approval Mail
    </h2>



    <p>
        Dear 
        <span 
        class="tmiv-field"
        data-bind="checkerName">

        {{checkerName}}

        </span>
    </p>



    <p>

        Your report was approved!

    </p>




    <p>

        Client:

        <span
        class="tmiv-field"
        data-bind="shortName">

        {{shortName}}

        </span>

    </p>



    <p>

        Location:

        <span
        class="tmiv-field"
        data-bind="shortLocationName">

        {{shortLocationName}}

        </span>


    </p>



</div>


`);




        /*
            Drag field
        */


        const items =
            document.querySelectorAll(
                ".field-item"
            );


document.addEventListener("dragstart", (e) => {
    const target = e.target;

    if (target.classList.contains("field-item")) {
        e.dataTransfer.setData("field", target.dataset.field);
    }
});


        items.forEach(item=>{


            item.addEventListener(
                "dragstart",
                e=>{


                    e.dataTransfer.setData(
                        "field",
                        item.dataset.field
                    );


                }
            );


        });
editor.BlockManager.add(
"text",
{
    label:"Text",

    category:"Basic",

    content:
    `
    <p>
        New text
    </p>
    `
});


editor.BlockManager.add(
"heading",
{

    label:"Heading",

    category:"Basic",

    content:
    `
    <h2>
        Title
    </h2>
    `

});



editor.BlockManager.add(
"button",
{

    label:"Button",

    category:"Basic",

    content:
    `
    <div class="mail-button">
        Click here
    </div>
    `

});



editor.BlockManager.add(
"divider",
{

    label:"Divider",

    category:"Basic",

    content:
    `
    <hr/>
    `

});

// editor.on("load",()=>{
//     const comps = editor.getComponents();

//     comps.forEach(comp => {
//         comp.components().forEach(child => {
//             if (child.is('default')) {
//                 child.set('editable', true);
//             }
//         });
//     });


//     const canvas =
//         editor.Canvas.getBody();




//     if(!canvas)
//         return;



//     canvas.addEventListener(
//         "dragover",
//         e=>{

//             e.preventDefault();

//             e.dataTransfer.dropEffect="copy";

//         }
//     );




//     canvas.addEventListener(
//         "drop",
//         e=>{


//             e.preventDefault();



//             const field =
//                 e.dataTransfer.getData(
//                     "field"
//                 );



//             if(!field)
//                 return;



//             editor.addComponents({

//                 type:"tmiv-field",

//                 content:
//                     `{{${field}}}`,

//                 attributes:{

//                     "data-bind":
//                         field

//                 }

//             });


//         }
//     );


// });


        return ()=>{

            editor.destroy();

            editorInstance.current=null;

        };


    },[]);

const convertToGrapesComponents = (html) => {
    const container = document.createElement("div");
    container.innerHTML = html;

    const walk = (node) => {

        // ✅ TEXT NODE
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;

            if (!text) return null;

            const parts = text.split(/(\{\{.*?\}\})/g);

            return parts.map(p => {
                const match = p.match(/\{\{(.*?)\}\}/);
      
                // ✅ FIELD → component
                if (match) {
                    const key = match[1].trim();
        
                    return {
                        type: "tmiv-field",
                        content: `{{${key}}}`,
                        attributes: {
                            class: "tmiv-field",
                            "data-bind": key
                        }
                    };
                }

                // ✅ TEXT → RETURN STRING (NOT textnode)
                
        return {
                    type: "text",
                    content: p,
                    editable: true
                };

                    });
                }

        // ✅ ELEMENT NODE
        if (node.nodeType === Node.ELEMENT_NODE) {
            return {
                tagName: node.tagName.toLowerCase(),

                attributes: Array.from(node.attributes).reduce((acc, attr) => {
                    acc[attr.name] = attr.value;
                    return acc;
                }, {}),

                components: Array.from(node.childNodes)
                    .map(child => walk(child))
                    .flat()
                    .filter(c => c !== null && c !== undefined)
            };
        }

        return null;
    };

    return Array.from(container.childNodes)
        .map(n => walk(n))
        .flat()
        .filter(Boolean);
};

const saveTemplate = async () => {
    try {
        const editor = editorInstance.current;
        if (!editor || !selectedTemplate) return;

        let html = editor.getHtml();
        // ✅ remove wrapper div.mail-content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const mailContent = doc.querySelector(".mail-content");

        if (mailContent) {
            html = mailContent.innerHTML; // ✅ chỉ lấy nội dung bên trong
        }
        // convert {{}} → @@
        html = html.replace(/\{\{(.*?)\}\}/g, (_, key) => `@@${key}`);

        debugger

        const formItems = {
            ...selectedTemplate,
            templateContent: html,
            mailQuery: sqlQuery ,  // ✅ thêm dòng này
            templateMailTitle: title,     // ✅ thêm
                prefixTitleMail: prefix,   // ✅ thêm
                cc: cc            // ✅ thêm

        };

        // ✅ dùng FormData
        const formData = new FormData();
        formData.append("key", formItems.id);
        formData.append("values", JSON.stringify(formItems));

        const res = await fetch("https://localhost:7254/api/MailTemplate/UpdateData", {
            method: "PUT",
            body: formData // ✅ KHÔNG set header
        });

        if (!res.ok) throw new Error("Save failed");

        console.log("SAVE SUCCESS");
        alert("Saved successfully ✅");

    } catch (err) {
        console.error("SAVE ERROR", err);
        alert("Save failed ❌");
    }
};
    const previewTemplate = ()=>{


        const editor =
            editorInstance.current;


        if(!editor)
            return;



        let html =
            editor.getHtml();




        const data={

            checkerName:
                "Nguyễn Văn A",

            makerName:
                "Trần Thị B",

            shortName:
                "ABC Insurance",

            shortLocationName:
                "Hồ Chí Minh",

            typeCheckerApprove:
                "Manager Approval"

        };




        html =
        html.replace(
            /\{\{(.*?)\}\}/g,
            (_,key)=>{

                return data[key.trim()]
                    ?? _;

            });



        const w =
            window.open("");



        w.document.write(`


            <html>

            <head>

            <style>

            body{
                font-family:Arial;
                padding:30px;
            }


            </style>


            </head>


            <body>


            ${html}


            </body>


            </html>


        `);


        w.document.close();


    };







    const clearTemplate=()=>{


        const editor =
            editorInstance.current;


        if(editor)
            editor.setComponents("");

    };






    return (

        <div className="mail-template-designer">


            <div className="designer-container">


                <aside className="field-panel">


                    <div className="panel-header">
                        Templates
                    </div>


                    <div className="fields-list">
                        <div
                                key="new"
                                className="field-item"
                                onClick={createTemplate}
                                style={{justifyContent: "center"}}
                            >
                            +
                            </div>
                        {templates.map(t => (
                            <div
                                key={t.id}
                                className="field-item"
                                onClick={() => loadTemplate(t)}
                            >
                                {t.templateName}
                            </div>
                        ))}
                    </div>




                    <div className="panel-actions">


                        <button
                        className="btn primary"
                        onClick={saveTemplate}
                        >
                            Save
                        </button>


                        <button
                        className="btn secondary"
                        onClick={previewTemplate}
                        >
                            Preview
                        </button>



                        <button
                        className="btn danger"
                        onClick={clearTemplate}
                        >
                            Clear
                        </button>


                    </div>



                </aside>




           <div className="editor-wrapper">


            <div
                ref={editorRef}
                className="grapesjs-container"
            />


            <aside className="tool-panel">

                <div className="tool-title">
                    Components
                </div>


                <div id="gjs-blocks"></div>


            </aside>





            <div className="sql-box">
                {/* TITLE */}
                <input
                    
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                />

                {/* PREFIX */}
                <input
                
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="Prefix"
                />

                {/* CC */}
                <input
                
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="CC (email1; email2...)"
                />

                <div className="panel-header">SQL Query</div>

                <textarea
                    
                className="sql-input"
                    value={sqlQuery}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSqlQuery(value);

                        onSqlChange(value); // ✅ gọi xử lý
                    }}
                    placeholder="SELECT name AS customerName FROM table..."

                />
            </div>

        </div>
                    </div>



        </div>

    );

}


export default MailTemplateDesigner;