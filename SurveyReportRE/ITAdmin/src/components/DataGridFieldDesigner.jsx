import {useState} from "react";


const controlTypes=[
    "dxTextBox",
    "dxSelectBox",
    "dxDateBox",
    "dxNumberBox",
    "dxCheckBox"
];



export default function DataGridFieldDesigner(){


const [fields,setFields]=useState([]);



const addField=(editor)=>{


const id=Date.now();


setFields(x=>[

...x,

{

id,

AllowGrouping:true,
AllowHeaderFiltering:true,

Caption:"New Field",

DataField:`field_${x.length+1}`,

DataType:"string",

Editor:editor,

Visible:true,

Fixed:false,

ValidationRules:[],

EditorOptions:{},

FormItem:{}

}

]);


};





const updateField=(id,key,value)=>{


setFields(x=>

x.map(f=>

f.id===id

?
{
 ...f,
 [key]:value
}

:
f

)

);


};





const removeField=(id)=>{


setFields(x=>

x.filter(
f=>f.id!==id
)

);


};





return (

<div className="field-builder">



<h2>
DataGrid Config Designer
</h2>



<div className="builder-layout">



{/* TOOLBOX */}


<div className="toolbox">


<h3>
Controls
</h3>


{
controlTypes.map(t=>

<div

key={t}

className="control-item"

draggable

onDragStart={
e=>
e.dataTransfer.setData(
"control",
t
)
}

>

{t}

</div>

)

}



</div>





{/* CANVAS */}



<div

className="canvas"

onDragOver={
e=>e.preventDefault()
}


onDrop={e=>{


const type=
e.dataTransfer.getData(
"control"
);


if(type)
addField(type);


}}

>


<h3>
Fields
</h3>



{

fields.map(f=>

<div

className="field-card"

key={f.id}

>


<div className="field-header">


<strong>
{f.Caption}
</strong>


<button
onClick={()=>
removeField(f.id)
}
>
x
</button>


</div>



<div>

DataField:
<input

value={f.DataField}

onChange={
e=>
updateField(
f.id,
"DataField",
e.target.value
)
}

/>

</div>



<div>

Caption:

<input

value={f.Caption}

onChange={
e=>
updateField(
f.id,
"Caption",
e.target.value
)
}

/>

</div>



<div>

Editor:

<select

value={f.Editor}

onChange={
e=>
updateField(
f.id,
"Editor",
e.target.value
)
}

>

{
controlTypes.map(x=>

<option key={x}>
{x}
</option>

)

}

</select>

</div>




<label>

<input

type="checkbox"

checked={f.Visible}

onChange={
e=>
updateField(
f.id,
"Visible",
e.target.checked
)
}

/>

Visible


</label>




<label>

<input

type="checkbox"

checked={
f.AllowGrouping
}

onChange={
e=>
updateField(
f.id,
"AllowGrouping",
e.target.checked
)
}

/>

Grouping


</label>





</div>


)

}


</div>








{/* PROPERTY */}



<div className="property">


<h3>
JSON Preview
</h3>


<pre>

{
JSON.stringify(
fields,
null,
2
)
}

</pre>


</div>



</div>



</div>

);

}