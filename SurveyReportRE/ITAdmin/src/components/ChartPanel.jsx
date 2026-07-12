import { useCallback, useEffect, useState } from 'react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';



const ChartPanel = ({
  serilogData,
  ticketData,
  loginStats = [],
  disk = 0
}) => {


const months=[
 ...new Set(
  loginStats.map(x=>x.month)
 )
];


const hours=[
 ...new Set(
  loginStats.map(x=>x.hour)
 )
];
const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
  "#be123c"
];

const monthColors=[
 "#2563eb",
 "#16a34a",
 "#f59e0b",
 "#dc2626"
];

const pivotData = hours.map(h=>{
 
  
 let row={
   hour:`${h}:00`
 };


 months.forEach(m=>{

   const item =
   loginStats.find(
     x =>
       x.month === m &&
       x.hour === h
   );


   row[m] =
      item?.loginCount || 0;


 });


 return row;

});




const diskData=[

{
 name:"Used",
 value:292-disk
},

{
 name:"Available",
 value:disk
}

];





return (

<section className="panel chart-panel">


<div className="chart-row">



{/* Serilog hourly count */}

<div className="chart-card">

<div className="chart-card-header">

<h3>
Serilog count by hour
</h3>

<span>
Today
</span>

</div>



<ResponsiveContainer
 width="100%"
 height={240}
>

<AreaChart
data={serilogData}
>

<defs>

<linearGradient
id="colorSerilog"
x1="0"
y1="0"
x2="0"
y2="1"
>

<stop
offset="5%"
stopColor="#2563eb"
stopOpacity={0.8}
/>

<stop
offset="95%"
stopColor="#2563eb"
stopOpacity={0.1}
/>

</linearGradient>

</defs>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="label"/>

<YAxis/>


<Tooltip/>


<Area

type="monotone"

dataKey="count"

stroke="#2563eb"

fill="url(#colorSerilog)"

/>


</AreaChart>


</ResponsiveContainer>


</div>








{/* Ticket */}


<div className="chart-card">


<div className="chart-card-header">

<h3>
Ticket IT — Browser errors
</h3>

<span>
Error count by time
</span>

</div>



<ResponsiveContainer
width="100%"
height={240}
>


<BarChart
data={ticketData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="day"/>

<YAxis/>


<Tooltip/>

<Legend/>


<Bar dataKey="clientBrowserError" fill="#475569" name="Client Browser Error" radius={[4, 4, 0, 0]} />


<Bar dataKey="errorBrowserDetails" fill="#0f766e" name="Error Browser Details" radius={[4, 4, 0, 0]} />


</BarChart>


</ResponsiveContainer>



</div>









{/* LOGIN PIVOT */}



<div className="chart-card wide">


<div className="chart-card-header">

<h3>
User Login Monitoring
</h3>

<span>
Hour
</span>

</div>




<ResponsiveContainer
width="100%"
height={260}
>


<BarChart
data={pivotData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis
dataKey="month"
/>


<YAxis/>


<Tooltip/>


<Legend/>


{
months.map((m,index)=>

<Bar

key={m}

dataKey={m}

name={m}

fill={
 monthColors[index % monthColors.length]
}

/>

)
}


</BarChart>


</ResponsiveContainer>



</div>








{/* DISK GAUGE */}

<div className="chart-card">


<div className="chart-card-header">

<h3>
Disk Capacity
</h3>

<span>
GB
</span>

</div>




<ResponsiveContainer
width="100%"
height={240}
>


<PieChart>


<Pie

data={diskData}

dataKey="value"

cx="50%"

cy="50%"

innerRadius={60}

outerRadius={90}

>


{
diskData.map(
(_,index)=>

<Cell
key={index}
/>

)
}


</Pie>


<Tooltip/>

</PieChart>



</ResponsiveContainer>



<div className="disk-value">

{disk} GB Available

</div>



</div>




</div>


</section>

);


};


export default ChartPanel;
