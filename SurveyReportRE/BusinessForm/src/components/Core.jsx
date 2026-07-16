import Flow from "../components/Flow.jsx"
import WorkloadChart from "../components/WorkloadChart.jsx";
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

const $ = window.jQuery;

$.fn.flow = function(arg1, arg2, arg3) {
    return this.each(function(){
            mount(
                this,
                "Flow",
                options
            );

        });
    // xử lý tương tự customform hoặc htmleditor
};


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

createJQueryPlugin("flow", "Flow");
createJQueryPlugin("workloadchart", "WorkloadChart");

register("Flow", Flow);
register("WorkloadChart", WorkloadChart);
export default { WorkloadChart, Flow };