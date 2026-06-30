import { useState } from "react";


export default function DataGridDesigner({ 
    value,
    onChange 
}) {


const [config,setConfig] = useState(
    value || {
        editing:{
            mode:"row",
            allowAdding:false,
            allowUpdating:false,
            allowDeleting:false
        },
        columns:[],
        toolbarItems:[]
    }
);



const updateConfig=(next)=>{

    setConfig(next);

    if(onChange){
        onChange(next);
    }

};



const updateEditing=(key,val)=>{

    updateConfig({
        ...config,
        editing:{
            ...config.editing,
            [key]:val
        }
    });

};



const addColumn=(type)=>{


    const index=config.columns.length+1;


    updateConfig({

        ...config,

        columns:[
            ...config.columns,
            {
                id:Date.now(),
                dataField:`field${index}`,
                caption:`Field ${index}`,
                dataType:type
            }
        ]

    });


};



const removeColumn=(id)=>{


    updateConfig({

        ...config,

        columns:
            config.columns.filter(
                x=>x.id!==id
            )

    });


};



const updateColumn=(id,key,value)=>{


    updateConfig({

        ...config,

        columns:
        config.columns.map(c=>

            c.id===id
            ?
            {
              ...c,
              [key]:value
            }
            :
            c

        )

    });


};





const addToolbar=()=>{


    updateConfig({

        ...config,

        toolbarItems:[
            ...config.toolbarItems,
            {
                name:"editRowButton",
                callElementView:""
            }
        ]

    });

};





const updateToolbar=(index,key,value)=>{


    const arr=[...config.toolbarItems];

    arr[index][key]=value;


    updateConfig({

        ...config,

        toolbarItems:arr

    });


};





const removeToolbar=(index)=>{


    updateConfig({

        ...config,

        toolbarItems:
        config.toolbarItems.filter(
            (_,i)=>i!==index
        )

    });


};






const dragColumn=(e,type)=>{

    e.dataTransfer.setData(
        "columnType",
        type
    );

};




const dropColumn=(e)=>{

    e.preventDefault();


    const type=
        e.dataTransfer.getData(
            "columnType"
        );


    if(type){
        addColumn(type);
    }

};





return (

<div className="dg-designer">


    <h2>
        DataGrid Designer
    </h2>



    <div className="dg-layout">


        {/* LEFT TOOLBOX */}

        <div className="dg-toolbox">


            <h3>
                Components
            </h3>


            <div
              draggable
              onDragStart={
                e=>dragColumn(e,"string")
              }
              className="dg-item"
            >
                Text Column
            </div>



            <div
              draggable
              onDragStart={
                e=>dragColumn(e,"number")
              }
              className="dg-item"
            >
                Number Column
            </div>



            <div
              draggable
              onDragStart={
                e=>dragColumn(e,"date")
              }
              className="dg-item"
            >
                Date Column
            </div>



        </div>





        {/* CENTER */}


        <div 
          className="dg-center"
          onDragOver={
            e=>e.preventDefault()
          }
          onDrop={dropColumn}
        >


            <h3>
                Preview
            </h3>



            <table>

            <thead>
            <tr>

            {
            config.columns.map(c=>

                <th key={c.id}>
                    {c.caption}
                </th>

            )
            }

            </tr>
            </thead>


            <tbody>

            <tr>

            {
            config.columns.map(c=>

                <td key={c.id}>
                    {c.dataField}
                </td>

            )
            }

            </tr>

            </tbody>

            </table>





            <h3>
                Columns
            </h3>



            {
            config.columns.map(c=>

            <div 
              className="dg-column"
              key={c.id}
            >

                <input
                    value={c.dataField}
                    onChange={
                        e=>
                        updateColumn(
                            c.id,
                            "dataField",
                            e.target.value
                        )
                    }
                />


                <input
                    value={c.caption}
                    onChange={
                        e=>
                        updateColumn(
                            c.id,
                            "caption",
                            e.target.value
                        )
                    }
                />


                <select
                value={c.dataType}
                onChange={
                    e=>
                    updateColumn(
                        c.id,
                        "dataType",
                        e.target.value
                    )
                }
                >

                    <option value="string">
                        string
                    </option>

                    <option value="number">
                        number
                    </option>

                    <option value="date">
                        date
                    </option>


                </select>



                <button
                onClick={()=>
                    removeColumn(c.id)
                }
                >
                    X
                </button>


            </div>


            )
            }



        </div>





        {/* RIGHT SETTINGS */}


        <div className="dg-settings">


            <h3>
                Editing
            </h3>



            <label>
            Mode

            <select
            value={
              config.editing.mode
            }
            onChange={
              e=>
              updateEditing(
                "mode",
                e.target.value
              )
            }
            >

                <option>
                    row
                </option>

                <option>
                    cell
                </option>

                <option>
                    popup
                </option>

            </select>

            </label>





            {
            [
                [
                "allowAdding",
                "Allow Adding"
                ],
                [
                "allowUpdating",
                "Allow Updating"
                ],
                [
                "allowDeleting",
                "Allow Deleting"
                ]

            ].map(x=>

            <label key={x[0]}>

                <input
                type="checkbox"
                checked={
                    config.editing[x[0]]
                }
                onChange={
                    e=>
                    updateEditing(
                        x[0],
                        e.target.checked
                    )
                }
                />

                {x[1]}

            </label>

            )
            }






            <h3>
                Toolbar
            </h3>



            <button
            onClick={addToolbar}
            >
                + Toolbar
            </button>



            {
            config.toolbarItems.map((t,i)=>

            <div 
             className="toolbar-row"
             key={i}
            >

                <input
                value={t.name}
                onChange={
                    e=>
                    updateToolbar(
                        i,
                        "name",
                        e.target.value
                    )
                }
                />


                <input
                placeholder="JS action"
                value={
                    t.callElementView
                }
                onChange={
                    e=>
                    updateToolbar(
                        i,
                        "callElementView",
                        e.target.value
                    )
                }
                />


                <button
                onClick={()=>
                    removeToolbar(i)
                }
                >
                    X
                </button>


            </div>

            )
            }






            <h3>
                JSON
            </h3>


            <pre>

{JSON.stringify(
    {
      GridEditorOptions:{
        editing:config.editing,
        columns:config.columns
      },
      ToolbarItemsConfig:
        config.toolbarItems
    },
    null,
    2
)}

            </pre>



        </div>


    </div>



</div>

);


}