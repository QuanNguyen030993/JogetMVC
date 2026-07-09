import { useCallback, useEffect, useState,useMemo  } from 'react';
import { API_BASE_URL } from './config';

// import ChartPanel from './components/ChartPanel';
// import MailTemplateDesigner from './components/MailTemplateDesigner';
// import MailQueue from './components/MailQueue';
import Flow from './components/Flow';
// import SerilogViewer from './components/SerilogViewer';
// import SysTable from './components/SysTable';
// import DataGridFieldDesigner from './components/DataGridFieldDesigner';
// import MenuDesigner from './components/MenuDesigner';
// import UserManagement from './components/UserManagement';
// import OverviewPanel from './components/OverviewPanel';
// import EnumDesign from './components/EnumDesign';
// import SlaDesign from './components/SlaDesign';
// import CustomGrid from '../../TMIVCom/src/components/CustomGrid'
import './styles/flow.css';
import './styles/com.all.css';
import './styles/serilogs.css';
import './styles/systable.css';
import './styles/datagridfielddesigner.css';
import './styles/mailtemplatedesigner.css'
import './styles/mailqueue.css';
import './styles/menudesigner.css';
import './styles/sladesigner.css';
import "./fonts/css/all.min.css";


function App() {
  const [loginStats,setLoginStats]=useState([]);
   const [disk,setDisk]=useState(0);
   const [selectedWorkflowId, setSelectedWorkflowId] = useState(11);
      const [selectedWorkflowGuid, setSelectedWorkflowGuid] = useState("00cf6f4b-1228-40f6-bd4b-45b1daf996b3");
        return <Flow id={selectedWorkflowId} guid={selectedWorkflowGuid} />;
 
}

export default App;
