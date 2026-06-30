import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "../styles/mailTemplateDesigner.css";
import "grapesjs/dist/css/grapes.min.css";


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



function MailTemplateDesigner(){


    const editorRef = useRef(null);
    const editorInstance = useRef(null);


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

                        Database Fields

                    </div>



                    <div className="fields-list">


                    {
                        FIELDS.map(f=>(


                            <div

                            key={f.id}

                            className="field-item"

                            draggable

                            data-field={f.id}

                            >

                                {f.label}


                            </div>


                        ))
                    }


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