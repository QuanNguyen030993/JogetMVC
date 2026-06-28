// tmiv-core.jsx

import { createRoot } from "react-dom/client";


const components = {};

const instances = {};


TMIVCom = window.TMIVCom || {};



TMIVCom.register = function(
    name,
    component,
    options={}
){

    components[name] = component;


    // mỗi control có WeakMap riêng
    instances[name] = new WeakMap();

};



TMIVCom.mount = function(
    element,
    name,
    props
){

    const Component = components[name];


    if(!Component){
        throw new Error(
          `${name} not registered`
        );
    }


    let instance =
        instances[name].get(element);



    if(!instance){

        const root =
            createRoot(element);


        instance = {
            root,
            props
        };


        instances[name].set(
            element,
            instance
        );

    }



    instance.root.render(
        <Component
            {...props}
        />
    );



    return {

        destroy(){

            instance.root.unmount();

            instances[name].delete(
                element
            );
        }

    };
};