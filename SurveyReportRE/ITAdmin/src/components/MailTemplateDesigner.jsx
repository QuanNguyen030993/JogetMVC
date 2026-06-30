import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "../styles/mailTemplateDesigner.css";



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

            container:editorRef.current,

            height:"100vh",

            width:"100%",


            storageManager:false,


            fromElement:false,


            panels:{
                defaults:[]
            },


            blockManager:{
                appendTo:false
            },


            canvas:{
                styles:[]
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
                    Dear {{checkerName}}
                </p>


                <p>
                    Your report was approved!
                </p>


                <p>
                    Client:
                    {{shortName}}
                </p>


                <p>
                    Location:
                    {{shortLocationName}}
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




        const canvas =
            editor.Canvas.getBody();



        canvas.addEventListener(
            "dragover",
            e=>{

                e.preventDefault();

            });



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




                <main className="editor-wrapper">


                    <div
                    ref={editorRef}
                    className="grapesjs-container"
                    />


                </main>



            </div>



        </div>

    );

}


export default MailTemplateDesigner;