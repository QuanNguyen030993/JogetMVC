import React, { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "../styles/mailTemplateDesigner.css";
import "grapesjs/dist/css/grapes.min.css";





function MailTemplateDesigner(){


    const editorRef = useRef(null);
    const editorInstance = useRef(null);


const [templates, setTemplates] = useState([]);
const [dynamicFields, setDynamicFields] = useState([]);
const FIELDS = [
    {
        id:"checkerName",
        label:"Checker Name"
    },
    {
        id:"makerName",
        label:"Maker Name"
    },
    {
        id:"shortName",
        label:"Client Name"
    },
    {
        id:"shortLocationName",
        label:"Location"
    },
    {
        id:"typeCheckerApprove",
        label:"Approval Type"
    }
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

    // lấy phần SELECT ... FROM
    const match = query.match(/select([\s\S]*?)from/i);
    if (!match) return [];

    let selectPart = match[1];

    // split theo dấu ,
    const parts = selectPart.split(",");

    parts.forEach(p => {
        // lấy alias nếu có
        const aliasMatch = p.match(/as\s+([a-zA-Z0-9_]+)/i);

        if (aliasMatch) {
            fields.push(aliasMatch[1]);
        } else {
            // nếu không có alias → lấy tên cuối
            const raw = p.trim().split(".").pop().trim();
            fields.push(raw);
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
// const loadTemplate = (template) => {
//     const editor = editorInstance.current;
//     if (!editor) return;

//     const html = convertToEditorFormat(template.templateContent);

//     editor.setComponents(`
//         <div class="mail-content">
//             ${html}
//         </div>
//     `);
// };
const loadTemplate = (template) => {
    const editor = editorInstance.current;
    if (!editor) return;

    const html = convertToEditorFormat(template.templateContent);

    editor.setComponents(`
        <div class="mail-content">
            ${html}
        </div>
    `);

    // ✅ parse SQL
    const fields = extractFieldsFromQuery(template.mailQuery);

    // ✅ clear block cũ (tránh duplicate)
    const bm = editor.BlockManager;
    const existing = bm.getAll().filter(b => b.get("category") === "Fields");
    existing.forEach(b => bm.remove(b));

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

editor.on("load",()=>{


    const canvas =
        editor.Canvas.getBody();



    if(!canvas)
        return;



    canvas.addEventListener(
        "dragover",
        e=>{

            e.preventDefault();

            e.dataTransfer.dropEffect="copy";

        }
    );




    canvas.addEventListener(
        "drop",
        e=>{


            e.preventDefault();



            const field =
                e.dataTransfer.getData(
                    "field"
                );



            if(!field)
                return;



            editor.addComponents({

                type:"tmiv-field",

                content:
                    `{{${field}}}`,

                attributes:{

                    "data-bind":
                        field

                }

            });


        }
    );


});


        return ()=>{

            editor.destroy();

            editorInstance.current=null;

        };


    },[]);






    const saveTemplate = ()=>{


        const editor =
            editorInstance.current;


        if(!editor)
            return;



        const data = {

            html:
                editor.getHtml(),


            css:
                editor.getCss(),


            json:
                editor.getProjectData()

        };


        console.log(
            "TEMPLATE",
            data
        );


        alert(
            "Template saved"
        );

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


        </div>
                    </div>



        </div>

    );

}


export default MailTemplateDesigner;