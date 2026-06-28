import DateBox from "./components/Datebox.jsx"; 
import HtmlEditor from "./components/HtmlEditor.jsx"; 
import CustomGrid from "./components/CustomGrid.jsx"; 

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

export default DateBox;