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
           options:{}
       };
       roots.set(element, instance);
   }
   instance.options = {
       ...instance.options,
       ...options
   };
   const Component = controls[name];
   instance.root.render(
<Component {...instance.options}/>
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

 $.fn.htmleditor = function(options){
        return this.each(function(){
            mount(
                this,
                "HtmlEditor",
                options
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