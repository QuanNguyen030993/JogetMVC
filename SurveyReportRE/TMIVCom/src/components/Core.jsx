import DateBox from "../components/Datebox.jsx"; 
import TimeBox from "../components/TimeBox.jsx";
import HtmlEditor from "../components/HtmlEditor.jsx"; 
import HtmlEditorCommentBox from "../components/HtmlEditorCommentBox.jsx"; 
import CustomGrid from "../components/CustomGrid.jsx"; 
import CommentEditor from "../components/CommentEditor.jsx";
import CommentEditorRoute from "../components/CommentEditorRoute.jsx";
import HandsomGrid from "../components/HandsomGrid.jsx";
import TourGuide, { startTour, exportTour } from "../components/TourGuide.jsx";
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

  $.fn.datebox = function(arg1, arg2, arg3){
        if (arg1 === "option" && arg2 === "value") {
            if (arguments.length >= 3) {
                this.each(function(){
                    const instance = roots.get(this);
                    if (!instance) return;
                    instance.options.value = arg3;
                    if (instance.ref?.current) {
                        instance.ref.current.option("value", arg3);
                    } else {
                        const Component = controls[instance.name];
                        instance.root.render(<Component ref={instance.ref} {...instance.options}/>);
                    }
                });
                return this;
            }

            const instance = this.length === 1 ? roots.get(this[0]) : null;
            return instance?.ref?.current?.option("value") ?? instance?.options?.value;
        }

        if (typeof arg1 === "object" || typeof arg1 === "undefined") {
            return this.each(function(){
                mount(this, "DateBox", arg1 || {});
            });
        }

        return this;
    };

  $.fn.timebox = function(arg1, arg2, arg3){
        if (arg1 === "option" && arg2 === "value") {
            if (arguments.length >= 3) {
                this.each(function(){
                    const instance = roots.get(this);
                    if (!instance) return;
                    instance.options.value = arg3;
                    if (instance.ref?.current) {
                        instance.ref.current.option("value", arg3);
                    } else {
                        const Component = controls[instance.name];
                        instance.root.render(<Component ref={instance.ref} {...instance.options}/>);
                    }
                });
                return this;
            }

            const instance = this.length === 1 ? roots.get(this[0]) : null;
            return instance?.ref?.current?.option("value") ?? instance?.options?.value;
        }

        if (typeof arg1 === "object" || typeof arg1 === "undefined") {
            return this.each(function(){
                mount(this, "TimeBox", arg1 || {});
            });
        }

        return this;
    };

  $.fn.tmivtimebox = $.fn.timebox;

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


$.fn.tmivhtmleditorcommentbox = function(arg1, arg2, arg3, ...rest) {
    const getInstance = (el) => roots.get(el);

    const getControl = (el) => {
        const instance = getInstance(el);
        return instance?.ref?.current || null;
    };

    const callButtonsMethod = (el, method, args) => {
        const control = getControl(el);
        return control?.buttons?.[method]?.(...args);
    };

    // Command mode:
    // $("#x").tmivhtmleditorcommentbox("option", "value")
    // $("#x").tmivhtmleditorcommentbox("option", "value", "<b>Hello</b>")
    // $("#x").tmivhtmleditorcommentbox("value")
    // $("#x").tmivhtmleditorcommentbox("focus")
    // $("#x").tmivhtmleditorcommentbox("buttons", "push", button)
    // $("#x").tmivhtmleditorcommentbox("buttons", "unshift", button)
    // $("#x").tmivhtmleditorcommentbox("buttons", "shift")
    // $("#x").tmivhtmleditorcommentbox("buttons", "pop")
    // $("#x").tmivhtmleditorcommentbox("buttons", "splice", start, deleteCount, ...items)
    // $("#x").tmivhtmleditorcommentbox("buttons", "remove", "buttonName")
    // $("#x").tmivhtmleditorcommentbox("buttons", "clear")
    if (typeof arg1 === "string") {
        if (arg1 === "option") {
            if (arguments.length === 2 && this.length === 1) {
                const instance = getInstance(this[0]);
                if (!instance) return undefined;

                const control = instance.ref?.current;
                return control?.option?.(arg2) ?? instance.options?.[arg2];
            }

            this.each(function() {
                const instance = getInstance(this);
                if (!instance) return;

                // Luôn sync option trong core để lần render/mount kế tiếp
                // không ghi đè state React bằng giá trị cũ.
                instance.options[arg2] = arg3;

                const control = instance.ref?.current;

                if (control?.option) {
                    control.option(arg2, arg3);
                } else {
                    const Component = controls[instance.name];
                    instance.root.render(
                        <Component
                            ref={instance.ref}
                            {...instance.options}
                        />
                    );
                }
            });

            return this;
        }

        if (arg1 === "value") {
            if (arguments.length === 1) {
                if (this.length === 1) {
                    const instance = getInstance(this[0]);
                    if (!instance) return "";

                    return instance.ref?.current?.value?.()
                        ?? instance.options?.value
                        ?? "";
                }

                return this.map(function() {
                    const instance = getInstance(this);
                    if (!instance) return null;

                    return instance.ref?.current?.value?.()
                        ?? instance.options?.value
                        ?? null;
                }).get();
            }

            this.each(function() {
                const instance = getInstance(this);
                if (!instance) return;

                instance.options.value = arg2;

                if (instance.ref?.current?.option) {
                    instance.ref.current.option("value", arg2);
                } else {
                    const Component = controls[instance.name];
                    instance.root.render(
                        <Component
                            ref={instance.ref}
                            {...instance.options}
                        />
                    );
                }
            });

            return this;
        }

        if (arg1 === "focus") {
            return this.each(function() {
                getControl(this)?.focus?.();
            });
        }

        if (arg1 === "buttons") {
            const method = arg2;

            if (!method) {
                if (this.length === 1) {
                    return getControl(this[0])?.buttons?.get?.() ?? [];
                }
                return [];
            }

            const methodArgs = [arg3, ...rest];

            // commands with no arg
            if (
                method === "shift" ||
                method === "pop" ||
                method === "clear" ||
                method === "get"
            ) {
                methodArgs.length = 0;
            }

            // Getter-like button methods on a single element
            if (
                this.length === 1 &&
                (method === "get" || method === "shift" || method === "pop")
            ) {
                return callButtonsMethod(
                    this[0],
                    method,
                    methodArgs
                );
            }

            this.each(function() {
                callButtonsMethod(
                    this,
                    method,
                    methodArgs
                );
            });

            return this;
        }

        if (arg1 === "setDepartments") {
            return this.each(function() {
                const instance = getInstance(this);
                if (!instance) return;

                instance.options.departments = arg2;
                getControl(this)?.setDepartments?.(arg2);
            });
        }

        if (arg1 === "getDepartments") {
            if (this.length === 1) {
                return getControl(this[0])?.getDepartments?.() ?? [];
            }

            return this.map(function() {
                return getControl(this)?.getDepartments?.() ?? [];
            }).get();
        }

        if (arg1 === "addComment") {
            if (this.length === 1) {
                return getControl(this[0])?.addComment?.(arg2 ?? null);
            }

            this.each(function() {
                getControl(this)?.addComment?.(arg2 ?? null);
            });

            return this;
        }

        if (arg1 === "addButton") {
            return this.each(function() {
                getControl(this)?.addButton?.(
                    arg2,
                    arg3 || "push"
                );
            });
        }

        if (arg1 === "removeButton") {
            return this.each(function() {
                getControl(this)?.removeButton?.(arg2);
            });
        }

        return this;
    }

    // Initialization
    const options = arg1 || {};

    if (this.length === 1) {
        mount(
            this[0],
            "HtmlEditorCommentBox",
            options
        );

        const el = this[0];

        return {
            option(name, value) {
                const instance = getInstance(el);
                if (!instance) return undefined;

                const control = instance.ref?.current;

                if (arguments.length === 1) {
                    return control?.option?.(name)
                        ?? instance.options?.[name];
                }

                // Giữ core options và React state đồng bộ.
                instance.options[name] = value;

                if (control?.option) {
                    control.option(name, value);
                } else {
                    const Component = controls[instance.name];
                    instance.root.render(
                        <Component
                            ref={instance.ref}
                            {...instance.options}
                        />
                    );
                }

                return this;
            },

            value(nextValue) {
                const instance = getInstance(el);
                if (!instance) return "";

                const control = instance.ref?.current;

                if (arguments.length === 0) {
                    return control?.value?.()
                        ?? instance.options?.value
                        ?? "";
                }

                instance.options.value = nextValue;

                control?.option?.(
                    "value",
                    nextValue
                );

                return this;
            },

            focus() {
                getControl(el)?.focus?.();
                return this;
            },

            buttons: {
                get() {
                    return getControl(el)?.buttons?.get?.() ?? [];
                },

                set(items) {
                    getControl(el)?.buttons?.set?.(items);
                    return this;
                },

                push(...items) {
                    getControl(el)?.buttons?.push?.(...items);
                    return this;
                },

                unshift(...items) {
                    getControl(el)?.buttons?.unshift?.(...items);
                    return this;
                },

                pop() {
                    return getControl(el)?.buttons?.pop?.();
                },

                shift() {
                    return getControl(el)?.buttons?.shift?.();
                },

                splice(start, deleteCount, ...items) {
                    getControl(el)?.buttons?.splice?.(
                        start,
                        deleteCount,
                        ...items
                    );
                    return this;
                },

                remove(nameOrPredicate) {
                    getControl(el)?.buttons?.remove?.(
                        nameOrPredicate
                    );
                    return this;
                },

                clear() {
                    getControl(el)?.buttons?.clear?.();
                    return this;
                }
            },

            setDepartments(items) {
                const instance = getInstance(el);

                if (instance) {
                    instance.options.departments = items;
                }

                getControl(el)?.setDepartments?.(items);
                return this;
            },

            getDepartments() {
                return getControl(el)?.getDepartments?.() ?? [];
            },

            addComment(event = null) {
                return getControl(el)?.addComment?.(event);
            },

            addButton(button, position = "push") {
                getControl(el)?.addButton?.(
                    button,
                    position
                );
                return this;
            },

            removeButton(nameOrPredicate) {
                getControl(el)?.removeButton?.(
                    nameOrPredicate
                );
                return this;
            }
        };
    }

    // Multiple elements: jQuery chaining
    return this.each(function() {
        mount(
            this,
            "HtmlEditorCommentBox",
            options
        );
    });
};


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

// $.fn.fileuploader = function(arg1, arg2, arg3) {
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
//             mount(this, "FileUploader", arg1 || {});
//         });
//     }

//     return this;
// };
$.fn.fileuploader = function(arg1, arg2, arg3) {
   const getInstance = (el) => {
       return roots.get(el);
   };
   const getControl = (el) => {
       const instance = getInstance(el);
       return instance?.ref?.current || null;
   };
   /*
    * COMMAND MODE
    */
   if (typeof arg1 === "string") {
       /*
        * $("#id").fileuploader("option", "value")
        * $("#id").fileuploader("option", "value", value)
        */
       if (arg1 === "option") {
           // GET
           if (arguments.length === 2) {
               if (this.length === 0) {
                   return null;
               }
               if (this.length === 1) {
                   const el = this[0];
                   const instance =
                       getInstance(el);
                   if (!instance) {
                       return null;
                   }
                   const control =
                       getControl(el);
                   if (
                       control &&
                       typeof control.option === "function"
                   ) {
                       return control.option(arg2);
                   }
                   return instance.options?.[arg2] ?? null;
               }
               return this.map(function() {
                   const instance =
                       getInstance(this);
                   if (!instance) {
                       return null;
                   }
                   const control =
                       getControl(this);
                   if (
                       control &&
                       typeof control.option === "function"
                   ) {
                       return control.option(arg2);
                   }
                   return instance.options?.[arg2] ?? null;
               }).get();
           }
           // SET
           if (arguments.length >= 3) {
               this.each(function() {
                   const instance =
                       getInstance(this);
                   if (!instance) {
                       return;
                   }
                   /*
                    * Sync vào wrapper option luôn.
                    */
                   instance.options[arg2] = arg3;
                   const control =
                       getControl(this);
                   if (
                       control &&
                       typeof control.option === "function"
                   ) {
                       control.option(
                           arg2,
                           arg3
                       );
                       return;
                   }
                   /*
                    * Nếu React ref chưa sẵn sàng,
                    * render lại với options mới.
                    */
                   const Component =
                       controls[instance.name];
                   instance.root.render(
<Component
                           ref={instance.ref}
                           {...instance.options}
                       />
                   );
               });
               return this;
           }
       }
       /*
        * $("#id").fileuploader("value")
        */
       if (arg1 === "value") {
           // GET
           if (arguments.length === 1) {
               if (this.length === 1) {
                   const instance =
                       getInstance(this[0]);
                   if (!instance) {
                       return [];
                   }
                   const control =
                       getControl(this[0]);
                   if (
                       control &&
                       typeof control.value === "function"
                   ) {
                       return control.value();
                   }
                   return instance.options?.value ?? [];
               }
               return this.map(function() {
                   const instance =
                       getInstance(this);
                   if (!instance) {
                       return [];
                   }
                   const control =
                       getControl(this);
                   if (
                       control &&
                       typeof control.value === "function"
                   ) {
                       return control.value();
                   }
                   return instance.options?.value ?? [];
               }).get();
           }
           // SET
           return this.each(function() {
               const instance =
                   getInstance(this);
               if (!instance) {
                   return;
               }
               instance.options.value = arg2;
               const control =
                   getControl(this);
               if (
                   control &&
                   typeof control.value === "function"
               ) {
                   control.value(arg2);
                   return;
               }
               if (
                   control &&
                   typeof control.option === "function"
               ) {
                   control.option(
                       "value",
                       arg2
                   );
                   return;
               }
               const Component =
                   controls[instance.name];
               instance.root.render(
<Component
                       ref={instance.ref}
                       {...instance.options}
                   />
               );
           });
       }
       /*
        * $("#id").fileuploader("instance")
        */
       if (arg1 === "instance") {
           if (this.length !== 1) {
               return null;
           }
           const instance =
               getInstance(this[0]);
           return instance?.ref?.current || null;
       }
       /*
        * $("#id").fileuploader("clear")
        */
       if (arg1 === "clear") {
           return this.each(function() {
               const instance =
                   getInstance(this);
               if (!instance) {
                   return;
               }
               const control =
                   getControl(this);
               control?.clear?.();
               instance.options.value = [];
           });
       }
       return this;
   }
   /*
    * INITIALIZATION
    *
    * $("#id").fileuploader({...})
    */
   if (
       typeof arg1 === "object" ||
       typeof arg1 === "undefined"
   ) {
       return this.each(function() {
           mount(
               this,
               "FileUploader",
               arg1 || {}
           );
       });
   }
   return this;
};

$.fn.tmivcommenteditorroute = function(arg1, arg2, arg3) {
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
            mount(this, "CommentEditorRoute", arg1 || {});
        });
    }

    return this;
};

$.fn.tmivhandsomgrid = function(arg1, arg2, arg3) {
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
            mount(this, "HandsomGrid", arg1 || {});
        });
    }

    return this;
};

$.fn.tmivtourguide = function(arg1, arg2, arg3) {
    if (Array.isArray(arg1)) {
        startTour(arg1, arg2 || {});
        return this;
    }

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
            mount(this, "TourGuide", arg1 || {});
        });
    }

    return this;
};

register(
    "DateBox",
    DateBox
);

register(
    "TimeBox",
    TimeBox
);

register(
    "HtmlEditor",
    HtmlEditor
);

register(
    "HtmlEditorCommentBox",
    HtmlEditorCommentBox
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

register(
    "CommentEditorRoute",
    CommentEditorRoute
);

register(
    "HandsomGrid",
    HandsomGrid
);

register(
    "TourGuide",
    TourGuide
);

window.TMIVCom.notify = notify;
window.TMIVCom.startTour = startTour;
window.TMIVCom.exportTour = exportTour;

const jqueryInstances = [window.jQuery, window.$].filter(
    (instance, index, instances) => instance && instances.indexOf(instance) === index
);

jqueryInstances.forEach((jqueryInstance) => {
    jqueryInstance.tmivnotify = (...args) => notify(...args);
    jqueryInstance.tmivtourguide = (...args) => startTour(...args);
    jqueryInstance.tmivexporttour = (...args) => exportTour(...args);
});

// Test notification demo for TMIVCom library (triggers 5 seconds after load)
if (typeof window !== "undefined") {
    //setTimeout(() => {
    //    notify({
    //        title: "TMIVCom Status Notification! 🚀",
    //        content: "Thông báo thử nghiệm từ thư viện <b>TMIVCom</b> xuất hiện sau <b>5 giây</b> delay.<br/>Định vị: Right Bottom | Loại: Success",
    //        type: "success",
    //        position: "bottom-right",
    //        duration: 6000,
    //        onClick: (toast) => {
    //            notify("Bạn vừa click vào thông báo thử nghiệm TMIVCom! 🌟", "info");
    //        }
    //    });
    //}, 5000);
}

export default { DateBox, TimeBox, HtmlEditor, HtmlEditorCommentBox, CustomGrid, HandsomGrid, CommentEditor, CommentEditorRoute, TextBox, NumberBox, CheckBox, SelectBox, DropDownBox, CustomForm, PreviewOffice, FileUploader, Notification, notify, TourGuide, startTour, exportTour };
