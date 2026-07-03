import { useState, useRef, useEffect  } from 'react';
import CustomGrid from './components/CustomGrid';
import HtmlEditor from './components/HtmlEditor';
import DateBox from './components/DateBox';
import CommentEditor from './components/CommentEditor';
import './css/com.all.css';
// import HtmlEditor from './components/HtmlEditor';
const defaultRows = [
  { id: 1, name: 'Alice', role: 'Developer', status: 'Active' },
  { id: 2, name: 'Bob', role: 'Designer', status: 'Pending' },
  { id: 3, name: 'Charlie', role: 'QA', status: 'Active' },
];
const value = "AAA";
function App() {
  const [rows, setRows] = useState(defaultRows);
  const [editorValue, setEditorValue] = useState('');

  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([...rows, { id: nextId, name: '', role: '', status: 'Active' }]);
  };
// const editorRef = useRef();

//     useEffect(() => {

//         const comments = [
//             {
//                 id: 1,
//                 author: "Quan",
//                 text: "Hello"
//             },
//             {
//                 id: 2,
//                 author: "Admin",
//                 text: "Welcome"
//             }
//         ];

//         editorRef.current.option({
//             name: "items",
//             value: comments
//         });

//     }, []);

  return (
    <div className="tmivcom-app">
      <header className="header">
        <div>
          <h1>TMIVCom Reusable Controls</h1>
          <p>Custom React controls for ASP.NET integration: grid and HTML editor.</p>
        </div>
      </header>

      <section className="section">
        <div className="section-title">Custom Grid</div>
        <CustomGrid
          columns={['id', 'name', 'role', 'status']}
          rows={rows}
          onRowsChange={setRows}
          onAddRow={addRow}
        />
      </section>

      <section className="section">
        <div className="section-title">HTML Editor</div>
        <HtmlEditor value={editorValue} onChange={setEditorValue} />
      </section>

        <section className="section">
        <div className="section-title">Date box</div>
        <DateBox value={editorValue} onChange={setEditorValue} />
      </section>

      <section className="section">
        <div className="section-title">Comment Editor</div>
        <CommentEditor value={value} 
 items={[
            {
                id: 1,
                author: "Quan",
                role: "IT",
                text: "<b>Hello</b>",
                time: "10:00"
            }
        ]}
 onChange={setEditorValue} />
      </section>

      {/* <section className="section">
        <div className="section-title">Editor Output</div>
        <div className="output-box" dangerouslySetInnerHTML={{ __html: editorValue }} />
      </section>



      <section className="section">
        <div className="section-title">Editor Output</div>
        <div className="output-box" dangerouslySetInnerHTML={{ __html: editorValue }} />
      </section> */}
    </div>
  );
}

export default App;



