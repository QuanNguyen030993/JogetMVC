import DateBox from "../components/Datebox.jsx"; 
import HtmlEditor from "../components/HtmlEditor.jsx"; 
import CustomGrid from "../components/CustomGrid.jsx"; 
import CommentEditor from "../components/CommentEditor.jsx";
import TextBox from "../components/TextBox.jsx";
import NumberBox from "../components/NumberBox.jsx";
import CheckBox from "../components/CheckBox.jsx";
import SelectBox from "../components/SelectBox.jsx";
import DropDownBox from "../components/DropDownBox.jsx";
import CustomForm from "../components/CustomForm.jsx";
import PreviewOffice from "../components/PreviewOffice.jsx";
// import Map from "../components/Map.jsx";
import FileUploader from "../components/FileUploader.jsx";
import Notification, { notify } from "../components/Notification.jsx";
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

  $.fn.htmleditor = function(arg1,arg2,arg3){
        if (typeof arg1 === "string") {
            if (arg1 === "option") {
                if (arg2 === "value") {
                    if (arguments.length >= 3) {
                        this.each(function(){
                            const instance = roots.get(this);
                            if (!instance) return;
                            if (instance.ref?.current) {
                                instance.ref.current.option("value", arg3);
                            } else {
                                instance.options.value = arg3;
                                const Component = controls[instance.name];
                                instance.root.render(
                                    <Component ref={instance.ref} {...instance.options}/>
                                );
                            }
                        });
                        return this;
                    }

                    // single element -> return scalar, multiple -> return array
                    if (this.length === 1) {
                        const el = this[0];
                        const instance = roots.get(el);
                        if (!instance) return null;
                        const editor = instance.ref?.current;
                        return editor?.value?.() ?? instance.options.value ?? null;
                    }

                    return this.map(function(){
                        const instance = roots.get(this);
                        if (!instance) return null;
                        const editor = instance.ref?.current;
                        return editor?.value?.() ?? instance.options.value ?? null;
                    }).get();
                }

                // unsupported option -> return undefined for chaining compatibility
                return undefined;
            }
        }

        // Initialization: accept options object (or no args). For single element, return the
        // React instance wrapper so callers can do `var control = $(el).htmleditor({...}); control.option("value");`
        if (typeof arg1 === "object" || typeof arg1 === "undefined") {
            if (this.length === 1) {
                mount(this[0], "HtmlEditor", arg1 || {});
                const el = this[0];
                return {
                    option(name, value) {
                        const instance = roots.get(el);
                        if (!instance) return;
                        if (instance.ref?.current) {
                            if (arguments.length === 1) {
                                return instance.ref.current.option(name);
                            }
                            instance.ref.current.option(name, value);
                        } else {
                            if (arguments.length === 1) {
                                return instance.options[name];
                            }
                            instance.options[name] = value;
                            const Component = controls[instance.name];
                            instance.root.render(
                                <Component ref={instance.ref} {...instance.options}/>
                            );
                        }
                    },
                    value() {
                        const instance = roots.get(el);
                        if (!instance) return "";
                        if (instance.ref?.current) {
                            return instance.ref.current.value();
                        }
                        return instance.options.value ?? "";
                    }
                };
            }

            const instances = [];
            this.each(function(){
                mount(this, "HtmlEditor", arg1 || {});
                const el = this;
                instances.push({
                    option(name, value) {
                        const instance = roots.get(el);
                        if (!instance) return;
                        if (instance.ref?.current) {
                            if (arguments.length === 1) {
                                return instance.ref.current.option(name);
                            }
                            instance.ref.current.option(name, value);
                        } else {
                            if (arguments.length === 1) {
                                return instance.options[name];
                            }
                            instance.options[name] = value;
                            const Component = controls[instance.name];
                            instance.root.render(
                                <Component ref={instance.ref} {...instance.options}/>
                            );
                        }
                    },
                    value() {
                        const instance = roots.get(el);
                        if (!instance) return "";
                        if (instance.ref?.current) {
                            return instance.ref.current.value();
                        }
                        return instance.options.value ?? "";
                    }
                });
            });
            return instances;
        }

        return this;
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
function createJQueryPlugin(pluginName, componentName) {
    $.fn[pluginName] = function(arg1, arg2, arg3) {
        if (typeof arg1 === "string") {
            if (arg1 === "option") {
                if (arg2 === "value") {
                    if (arguments.length >= 3) {
                        this.each(function() {
                            const instance = roots.get(this);
                            if (!instance) return;
                            if (instance.ref?.current) {
                                instance.ref.current.option("value", arg3);
                            } else {
                                instance.options.value = arg3;
                                const Component = controls[instance.name];
                                instance.root.render(
                                    <Component ref={instance.ref} {...instance.options}/>
                                );
                            }
                        });
                        return this;
                    }
                    if (this.length === 1) {
                        const el = this[0];
                        const instance = roots.get(el);
                        if (!instance) return null;
                        const controlInstance = instance.ref?.current;
                        return controlInstance?.value?.() ?? instance.options.value ?? null;
                    }
                    return this.map(function() {
                        const instance = roots.get(this);
                        if (!instance) return null;
                        const controlInstance = instance.ref?.current;
                        return controlInstance?.value?.() ?? instance.options.value ?? null;
                    }).get();
                }
                return undefined;
            }
        }

        if (typeof arg1 === "object" || typeof arg1 === "undefined") {
            if (this.length === 1) {
                mount(this[0], componentName, arg1 || {});
                const el = this[0];
                return {
                    option(name, value) {
                        const instance = roots.get(el);
                        if (!instance) return;
                        if (instance.ref?.current) {
                            if (arguments.length === 1) {
                                return instance.ref.current.option(name);
                            }
                            instance.ref.current.option(name, value);
                        } else {
                            if (arguments.length === 1) {
                                return instance.options[name];
                            }
                            instance.options[name] = value;
                            const Component = controls[instance.name];
                            instance.root.render(
                                <Component ref={instance.ref} {...instance.options}/>
                            );
                        }
                    },
                    value() {
                        const instance = roots.get(el);
                        if (!instance) return "";
                        if (instance.ref?.current) {
                            return instance.ref.current.value();
                        }
                        return instance.options.value ?? "";
                    }
                };
            }

            const instances = [];
            this.each(function() {
                mount(this, componentName, arg1 || {});
                const el = this;
                instances.push({
                    option(name, value) {
                        const instance = roots.get(el);
                        if (!instance) return;
                        if (instance.ref?.current) {
                            if (arguments.length === 1) {
                                return instance.ref.current.option(name);
                            }
                            instance.ref.current.option(name, value);
                        } else {
                            if (arguments.length === 1) {
                                return instance.options[name];
                            }
                            instance.options[name] = value;
                            const Component = controls[instance.name];
                            instance.root.render(
                                <Component ref={instance.ref} {...instance.options}/>
                            );
                        }
                    },
                    value() {
                        const instance = roots.get(el);
                        if (!instance) return "";
                        if (instance.ref?.current) {
                            return instance.ref.current.value();
                        }
                        return instance.options.value ?? "";
                    }
                });
            });
            return instances;
        }
        return this;
    };
}

createJQueryPlugin("textbox", "TextBox");
createJQueryPlugin("numberbox", "NumberBox");
createJQueryPlugin("checkbox", "CheckBox");
createJQueryPlugin("selectbox", "SelectBox");
createJQueryPlugin("dropdownbox", "DropDownBox");

$.fn.customform = function(arg1, arg2, arg3) {
    if (typeof arg1 === "string") {
        if (arg1 === "option") {
            if (arg2 === "value") {
                if (arguments.length >= 3) {
                    this.each(function() {
                        const instance = roots.get(this);
                        if (!instance) return;
                        if (instance.ref?.current) {
                            instance.ref.current.option("value", arg3);
                        } else {
                            instance.options.value = arg3;
                            const Component = controls[instance.name];
                            instance.root.render(
                                <Component ref={instance.ref} {...instance.options}/>
                            );
                        }
                    });
                    return this;
                }
                if (this.length === 1) {
                    const el = this[0];
                    const instance = roots.get(el);
                    if (!instance) return null;
                    const controlInstance = instance.ref?.current;
                    return controlInstance?.option("value") ?? instance.options.value ?? null;
                }
            }
            return undefined;
        }
    }

    if (typeof arg1 === "object" || typeof arg1 === "undefined") {
        if (this.length === 1) {
            mount(this[0], "CustomForm", arg1 || {});
            const el = this[0];
            return {
                option(name, value) {
                    const instance = roots.get(el);
                    if (!instance) return;
                    if (instance.ref?.current) {
                        if (arguments.length === 1) {
                            return instance.ref.current.option(name);
                        }
                        instance.ref.current.option(name, value);
                    } else {
                        if (arguments.length === 1) {
                            return instance.options[name];
                        }
                        instance.options[name] = value;
                        const Component = controls[instance.name];
                        instance.root.render(
                            <Component ref={instance.ref} {...instance.options}/>
                        );
                    }
                },
                validate() {
                    const instance = roots.get(el);
                    return instance?.ref?.current?.validate() ?? false;
                },
                save() {
                    const instance = roots.get(el);
                    instance?.ref?.current?.save();
                },
                load() {
                    const instance = roots.get(el);
                    instance?.ref?.current?.load();
                }
            };
        }

        const instances = [];
        this.each(function() {
            mount(this, "CustomForm", arg1 || {});
            const el = this;
            instances.push({
                option(name, value) {
                    const instance = roots.get(el);
                    if (!instance) return;
                    if (instance.ref?.current) {
                        if (arguments.length === 1) {
                            return instance.ref.current.option(name);
                        }
                        instance.ref.current.option(name, value);
                    } else {
                        if (arguments.length === 1) {
                            return instance.options[name];
                        }
                        instance.options[name] = value;
                        const Component = controls[instance.name];
                        instance.root.render(
                            <Component ref={instance.ref} {...instance.options}/>
                        );
                    }
                },
                validate() {
                    const instance = roots.get(el);
                    return instance?.ref?.current?.validate() ?? false;
                },
                save() {
                    const instance = roots.get(el);
                    instance?.ref?.current?.save();
                },
                load() {
                    const instance = roots.get(el);
                    instance?.ref?.current?.load();
                }
            });
        });
        return instances;
    }
    return this;
};

$.fn.previewoffice = function(arg1, arg2, arg3) {
    if (typeof arg1 === "string") {
        if (arg1 === "option") {
            if (arguments.length === 2 && this.length === 1) {
                const instance = roots.get(this[0]);
                return instance?.ref?.current?.option(arg2) ?? instance?.options?.[arg2];
            }

            this.each(function() {
                const instance = roots.get(this);
                if (!instance) return;

                if (instance.ref?.current) {
                    instance.ref.current.option(arg2, arg3);
                } else {
                    instance.options[arg2] = arg3;
                    const Component = controls[instance.name];
                    instance.root.render(
                        <Component ref={instance.ref} {...instance.options}/>
                    );
                }
            });
            return this;
        }

        if (arg1 === "refresh") {
            return this.each(function() {
                const instance = roots.get(this);
                instance?.ref?.current?.refresh?.();
            });
        }
    }

    if (typeof arg1 === "object" || typeof arg1 === "undefined") {
        return this.each(function() {
            mount(this, "PreviewOffice", arg1 || {});
        });
    }

    return this;
};

// $.fn.tmivmap = function(arg1, arg2, arg3) {
//     if (typeof arg1 === "string") {
//         if (arg1 === "option") {
//             if (arguments.length === 2 && this.length === 1) {
//                 const instance = roots.get(this[0]);
//                 return instance?.ref?.current?.option?.(arg2) ?? instance?.options?.[arg2];
//             }

//             this.each(function() {
//                 const instance = roots.get(this);
//                 if (!instance) return;

//                 if (instance.ref?.current) {
//                     instance.ref.current.option?.(arg2, arg3);
//                 } else {
//                     instance.options[arg2] = arg3;
//                     const Component = controls[instance.name];
//                     instance.root.render(
//                         <Component ref={instance.ref} {...instance.options}/>
//                     );
//                 }
//             });
//             return this;
//         }
//     }

//     if (typeof arg1 === "object" || typeof arg1 === "undefined") {
//         return this.each(function() {
//             mount(this, "Map", arg1 || {});
//         });
//     }

//     return this;
// };

$.fn.fileuploader = function(arg1, arg2, arg3) {
    if (typeof arg1 === "string") {
        if (arg1 === "option") {
            if (arguments.length === 2 && this.length === 1) {
                const instance = roots.get(this[0]);
                return instance?.ref?.current?.option?.(arg2) ?? instance?.options?.[arg2];
            }

            this.each(function() {
                const instance = roots.get(this);
                if (!instance) return;

                if (instance.ref?.current) {
                    instance.ref.current.option?.(arg2, arg3);
                } else {
                    instance.options[arg2] = arg3;
                    const Component = controls[instance.name];
                    instance.root.render(
                        <Component ref={instance.ref} {...instance.options}/>
                    );
                }
            });
            return this;
        }
    }

    if (typeof arg1 === "object" || typeof arg1 === "undefined") {
        return this.each(function() {
            mount(this, "FileUploader", arg1 || {});
        });
    }

    return this;
};

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

register(
    "TextBox",
    TextBox
);

register(
    "NumberBox",
    NumberBox
);

register(
    "CheckBox",
    CheckBox
);

register(
    "SelectBox",
    SelectBox
);

register(
    "DropDownBox",
    DropDownBox
);

register(
    "CustomForm",
    CustomForm
);

register(
    "PreviewOffice",
    PreviewOffice
);

// register(
//     "Map",
//     Map
// );

register(
    "FileUploader",
    FileUploader
);

register(
    "Notification",
    Notification
);

window.TMIVCom.notify = notify;
if (typeof $ !== "undefined") {
    $.tmivnotify = notify;
}

export default { DateBox, HtmlEditor, CustomGrid, CommentEditor, TextBox, NumberBox, CheckBox, SelectBox, DropDownBox, CustomForm, PreviewOffice, FileUploader, Notification, notify };
