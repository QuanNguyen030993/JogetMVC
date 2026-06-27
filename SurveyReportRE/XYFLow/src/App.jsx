import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  ConnectionLineType,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 60, y: 80 },
    data: { label: 'Start' },
    style: {
      background: '#e0f2fe',
      border: '1px solid #0284c7',
      borderRadius: '12px',
      color: '#0f172a',
    },
  },
  {
    id: '2',
    position: { x: 300, y: 80 },
    data: { label: 'Process' },
    style: {
      background: '#ede9fe',
      border: '1px solid #7c3aed',
      borderRadius: '12px',
      color: '#0f172a',
    },
  },
  {
    id: '3',
    position: { x: 300, y: 220 },
    data: { label: 'Review' },
    style: {
      background: '#dcfce7',
      border: '1px solid #16a34a',
      borderRadius: '12px',
      color: '#0f172a',
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    type: 'smoothstep',
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    type: 'smoothstep',
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((currentEdges) => addEdge({ ...params, animated: true, type: 'smoothstep' }, currentEdges)),
    [setEdges],
  );

  const addNode = useCallback(() => {
    const id = `node-${Math.random().toString(36).slice(2, 8)}`;
    const newNode = {
      id,
      position: {
        x: 120 + Math.random() * 220,
        y: 80 + Math.random() * 180,
      },
      data: { label: `Step ${nodes.length + 1}` },
      style: {
        background: '#fef3c7',
        border: '1px solid #d97706',
        borderRadius: '12px',
        color: '#0f172a',
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
    setSelectedNode(newNode);
  }, [nodes.length, setNodes]);

  return (
    <div className="app-shell">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Panel position="top-left" className="panel">
          <h2>XY Flow React demo</h2>
          <p>Drag nodes, connect them, and add a new step.</p>
          <button onClick={addNode}>Add node</button>
        </Panel>
        <Panel position="top-right" className="info-panel">
          <strong>{selectedNode ? `Selected: ${selectedNode.data.label}` : 'Select a node'}</strong>
        </Panel>
        <MiniMap />
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

export default App;
