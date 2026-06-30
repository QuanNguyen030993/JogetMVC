import {useState} from "react";


const icons=[
    "fa-solid fa-house",
    "fa-solid fa-user",
    "fa-solid fa-users",
    "fa-solid fa-gear",
    "fa-solid fa-chart-line",
    "fa-solid fa-file",
    "fa-solid fa-folder",
    "fa-solid fa-envelope",
    "fa-solid fa-bell",
    "fa-solid fa-database"
];



export default function MenuDesigner(){


const [menus,setMenus]=useState([]);


const [selected,setSelected]=useState(null);




const addMenu=()=>{


const id=Date.now();


const item={

 id,

 Name:"New Menu",

 Url:"/",

 Icon:"fa-solid fa-house",

 Order:menus.length+1,

 Visible:true,

 Children:[]

};


setMenus(x=>[
 ...x,
 item
]);


setSelected(item);

};






const updateMenu=(key,value)=>{


setMenus(x=>

x.map(m=>

m.id===selected.id

?
{
 ...m,
 [key]:value
}

:
m

)

);


setSelected({

 ...selected,

 [key]:value

});


};






const removeMenu=()=>{


setMenus(x=>

x.filter(
m=>m.id!==selected.id
)

);


setSelected(null);

};






return (

<div className="menu-designer">


<h2>
Menu Designer
</h2>




<div className="menu-layout">





<div className="menu-tools">


<h3>
Components
</h3>


<div

className="menu-item-tool"

draggable

onDragStart={
e=>
e.dataTransfer.setData(
"type",
"menu"
)
}

>

+ Menu Item

</div>


<button
onClick={addMenu}
>
Add Menu
</button>



</div>







<div

className="menu-preview"

onDragOver={
e=>e.preventDefault()
}

onDrop={
addMenu
}

>


<h3>
Preview
</h3>



{

menus.map(m=>

<div

key={m.id}

className={
selected?.id===m.id
?
"menu-row active"
:
"menu-row"
}

onClick={
()=>setSelected(m)
}

>


<i className={m.Icon}></i>

<span>
{m.Name}
</span>


</div>

)

}


</div>









<div className="menu-property">


<h3>
Property
</h3>



{
selected &&

<>


<label>
Name
<input

value={selected.Name}

onChange={
e=>
updateMenu(
"Name",
e.target.value
)
}

/>
</label>





<label>
URL
<input

value={selected.Url}

onChange={
e=>
updateMenu(
"Url",
e.target.value
)
}

/>
</label>





<label>
Icon
<select

value={selected.Icon}

onChange={
e=>
updateMenu(
"Icon",
e.target.value
)
}

>

{
icons.map(i=>

<option key={i}>
{i}
</option>

)
}

</select>

</label>




<div className="icon-preview">

<i className={selected.Icon}></i>

</div>




<label>

<input

type="checkbox"

checked={
selected.Visible
}

onChange={
e=>
updateMenu(
"Visible",
e.target.checked
)
}

/>

Visible

</label>




<button
className="delete"
onClick={removeMenu}
>
Delete
</button>



<h3>
JSON
</h3>


<pre>

{
JSON.stringify(
selected,
null,
2
)
}

</pre>


</>

}


</div>





</div>


</div>


)

}