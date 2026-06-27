import React, { useState } from "react";
import { createRoot } from "react-dom/client";


function DateBox({
    value = "",
    onChange,
    placeholder = "Select date"
}) {

    const [val, setVal] = useState(value);


    const change = (e) => {

        const v = e.target.value;

        setVal(v);

        onChange?.(v);
    };


    return (

        <div className="tmivcom-datebox">

            <div className="tmivcom-datebox-input">

                <input
                    type="date"
                    value={val}
                    placeholder={placeholder}
                    onChange={change}
                />

                <span className="tmivcom-datebox-button">
                    📅
                </span>

            </div>

        </div>

    );
}



const roots = new Map();



window.TMIVCom = {

    DateBox(selector, options = {}) {

        const el = document.querySelector(selector);

        if (!el)
            throw new Error(
                `TMIVCom DateBox target not found: ${selector}`
            );


        let root = roots.get(el);


        if (!root) {

            root = createRoot(el);

            roots.set(el, root);

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