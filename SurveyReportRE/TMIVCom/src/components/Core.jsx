import DateBox from "../components/Datebox.jsx"; 
import HtmlEditor from "../components/HtmlEditor.jsx"; 
import CustomGrid from "../components/CustomGrid.jsx"; 
import CommentEditor from "../components/CommentEditor.jsx";
import React from "react";

import { createRoot } from "react-dom/client";
// import {CustomGrid} from "./CustomGrid.jsx";
const roots = new WeakMap();
const controls = {};

window.TMIVCom = window.TMIVCom || {};


// register control
function register(name, component){

    controls[name] = component;

}
// // mount react
// export function mount(
//     element,
//     name,
//     options
// ){

//     const Component = controls[name];


//     if(!Component){
//         throw new Error(
//             `TMIV component ${name} not found`
//         );
//     }


//     let root = roots.get(element);


//     if(!root){

//         root = createRoot(element);

//         roots.set(
//             element,
//             root
//         );
//     }


//     root.render(
//         <Component {...options}/>
//     );

// };
function mount(element, name, options){
   let instance = roots.get(element);
   if(!instance){
       const root = createRoot(element);
       instance = {
           root,
           name,
           options:{},
           ref: React.createRef()
       };
       roots.set(element, instance);
   }
   instance.options = {
       ...instance.options,
       ...options
   };
   const Component = controls[name];
   instance.root.render(
       <Component ref={instance.ref} {...instance.options}/>
   );
}


// // tạo jquery plugin
// export function install($){


//     // $.fn.datebox = function(options){


//     //     return this.each(function(){


//     //         TMIVCom.mount(
//     //             this,
//     //             "DateBox",
//     //             options
//     //         );


//     //     });

//     // };

// //  $.fn.htmleditor = function(options){


// //         return this.each(function(){


// //             TMIVCom.mount(
// //                 this,
// //                 "HtmlEditor",
// //                 options
// //             );


// //         });

// //     };
// //      $.fn.datagrid = function(options){


// //         return this.each(function(){


// //             TMIVCom.mount(
// //                 this,
// //                 "CustomGrid",
// //                 options
// //             );


// //         });

// //     };
// }
const $ = window.jQuery;

  $.fn.datebox = function(options){
        return this.each(function(){
            mount(
                this,
                "DateBox",
                options
            );

        });
    };

 $.fn.htmleditor = function(arg1,arg2){
        if (typeof arg1 === "string") {
            if (arg1 === "option") {
                if (arg2 === "value") {
                    // single element -> return scalar, multiple -> return array
                    if (this.length === 1) {
                        const el = this[0];
                        const instance = roots.get(el);
                        if (!instance) return null;
                        const editor = instance.ref?.current;
                        return editor?.value?.() ?? null;
                    }

                    return this.map(function(){
                        const instance = roots.get(this);
                        if (!instance) return null;
                        const editor = instance.ref?.current;
                        return editor?.value?.() ?? null;
                    }).get();
                }

                // unsupported option -> return undefined for chaining compatibility
                return undefined;
            }
        }

        return this.each(function(){
            mount(
                this,
                "HtmlEditor",
                arg1
            );

        });
    };

     $.fn.datagrid = function(options){
        return this.each(function(){
            mount(
                this,
                "CustomGrid",
                options
            );

        });
    };

   $.fn.commenteditor = function(arg1,arg2){
        if(typeof arg1==="string"){
            if (arg1 === "option" || arg1 === "value"){
                return this.each(function(){
                    const instance = roots.get(this);
                    if(!instance) return;
                    instance.options[arg2.name]=arg2.value;
                    instance.root.render(
                        React.createElement(
                            controls[instance.name],
                            instance.options
                        )
                    );
                    
                    // const instance = roots.get(this);

                    //         if (!instance?.ref?.current)
                    //             return;

                    //         instance.ref.current.option(
                    //             arg2.name,
                    //             arg2.value
                    //         );

                });
            }
   }


   return this.each(function(){
       mount(
           this,
           "CommentEditor",
           arg1||{}
       );
   });
}
register(
    "DateBox",
    DateBox
);

register(
    "HtmlEditor",
    HtmlEditor
);
register(
    "CustomGrid",
    CustomGrid
);

register(
    "CommentEditor",
    CommentEditor
);

export default { DateBox, HtmlEditor, CustomGrid, CommentEditor };