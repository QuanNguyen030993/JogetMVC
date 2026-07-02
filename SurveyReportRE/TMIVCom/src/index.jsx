import DateBox from "./components/Datebox.jsx"; 
import HtmlEditor from "./components/HtmlEditor.jsx"; 
import CustomGrid from "./components/CustomGrid.jsx"; 
import CommentEditor from "./components/CommentEditor.jsx";

import { install } from "./components/Core";
import { register } from "./components/Core";
import { mount } from "./components/Core";
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

    // $.fn.commenteditor = function(options){
    //     return this.each(function(){
    //         mount(
    //             this,
    //             "CommentEditor",
    //             options
    //         );

    //     });
    // };

    $.fn.commenteditor = function(method, value){

    if (method === "option") {

        const instance = this.data("commenteditor");

        if (instance) {

            instance.props = {
                ...instance.props,
                [value.name]: value.value
            };

            mount(
                instance.element,
                "CommentEditor",
                instance.props
            );
        }

        return this;
    }

    return this.each(function(){

        const instance = {
            element: this,
            props: method
        };

        $(this).data("commenteditor", instance);

        mount(
            this,
            "CommentEditor",
            method
        );
    });
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

export default { DateBox, HtmlEditor, CustomGrid, CommentEditor };