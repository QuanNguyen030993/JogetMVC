import { createRoot } from "react-dom/client";
// import {CustomGrid} from "./CustomGrid.jsx";
const roots = new WeakMap();
const controls = {};


window.TMIVCom = window.TMIVCom || {};


// register control
export function register(name, component){

    controls[name] = component;

}
console.log("render mount");


// mount react
export function mount(
    element,
    name,
    options
){

    const Component = controls[name];


    if(!Component){
        throw new Error(
            `TMIV component ${name} not found`
        );
    }


    let root = roots.get(element);


    if(!root){

        root = createRoot(element);

        roots.set(
            element,
            root
        );
    }


    root.render(
        <Component {...options}/>
    );

};



// tạo jquery plugin
export function install($){


    // $.fn.datebox = function(options){


    //     return this.each(function(){


    //         TMIVCom.mount(
    //             this,
    //             "DateBox",
    //             options
    //         );


    //     });

    // };

//  $.fn.htmleditor = function(options){


//         return this.each(function(){


//             TMIVCom.mount(
//                 this,
//                 "HtmlEditor",
//                 options
//             );


//         });

//     };
//      $.fn.datagrid = function(options){


//         return this.each(function(){


//             TMIVCom.mount(
//                 this,
//                 "CustomGrid",
//                 options
//             );


//         });

//     };
}