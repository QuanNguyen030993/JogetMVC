import React, {useState} from "react";
import {createRoot} from "react-dom/client";


function DateBox({value="", onChange}) {

    const [val,setVal] = useState(value);


    return (
        <input
            type="date"
            value={val}
            onChange={e=>{
                setVal(e.target.value);
                onChange?.(e.target.value);
            }}
        />
    );
}


const roots = new Map();


window.TMIVCom = {

    DateBox(selector, options={}) {

        const el = document.querySelector(selector);

        if(!el)
            throw new Error("element not found");


        let root = roots.get(el);


        if(!root){
            root = createRoot(el);
            roots.set(el,root);
        }


        root.render(
            <DateBox {...options}/>
        );


        return {

            setValue(value){

                root.render(
                    <DateBox
                       {...options}
                       value={value}
                    />
                );

            }

        };
    }

};