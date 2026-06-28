import DateBox from "./components/Datebox.jsx"; 

import { install } from "./components/Core";
import { register } from "./components/Core";
import { mount } from "./components/Core";
const $ = window.jQuery;

  $.fn.datebox = function(options){
        return this.each(function(){
            console.log("render here");
            mount(
                this,
                "DateBox",
                options
            );

        });
    };


register(
    "DateBox",
    DateBox
);
 install($);

export default DateBox;