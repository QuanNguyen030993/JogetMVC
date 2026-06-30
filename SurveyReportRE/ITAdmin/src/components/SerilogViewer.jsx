import React, {useEffect, useState} from "react";


export default function SerilogViewer(){

    const [logs,setLogs] = useState([]);
    const [search,setSearch] = useState("");
    const [open,setOpen] = useState(null);


    const loadLogs = async()=>{

        const res = await fetch(
            "https://localhost:7254/api/CommentLog/GetSeriLog"
        );

        const data = await res.json();

        setLogs(data);

    }



    useEffect(()=>{

        loadLogs();

        const timer = setInterval(
            loadLogs,
            10000
        );

        return ()=>clearInterval(timer);

    },[]);



    const filtered = logs.filter(x=>
        JSON.stringify(x)
        .toLowerCase()
        .includes(search.toLowerCase())
    );



    return (

    <div className="log-page">


        <div className="log-toolbar">

            <div>

                <h2>
                    Serilog Viewer
                </h2>

                <span>
                    {logs.length} records
                </span>

            </div>


            <input

                placeholder="Search log..."

                value={search}

                onChange={
                    e=>setSearch(e.target.value)
                }

            />

        </div>



        <div className="log-table">


            <div className="log-head">

                <div>Time</div>
                <div>Level</div>
                <div>Message</div>
                <div>User</div>

            </div>



            {
                filtered.map(log=>(


                <div
                    key={log.id}
                    className={
                      `log-row ${log.level}`
                    }

                    onClick={()=>
                        setOpen(
                           open===log.id
                           ? null
                           : log.id
                        )
                    }

                >


                    <div className="time">

                        {
                          new Date(
                            log.timeStamp
                          ).toLocaleString()
                        }

                    </div>



                    <div>

                        <span
                          className={
                            "badge "+log.level
                          }
                        >

                          {log.level}

                        </span>

                    </div>



                    <div className="message">

                        {log.message}

                    </div>



                    <div>

                        {log.userId}

                    </div>



                    {
                    open===log.id &&

                    <div className="detail">


                        {
                        log.exception &&

                        <>
                        <h4>
                           Exception
                        </h4>

                        <pre>
                           {log.exception}
                        </pre>
                        </>
                        }



                        <h4>
                          Properties
                        </h4>


                        <pre>

                        {
                          JSON.stringify(
                            log.properties,
                            null,
                            2
                          )
                        }

                        </pre>


                    </div>

                    }


                </div>


                ))

            }


        </div>


    </div>

    )
}