import { useCallback, useEffect, useState } from 'react';
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

const defaultNodes = [
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

const defaultEdges = [
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

const nodeStyle = ({ nodeType }) => {
  if (nodeType === 'department') {
    return {
      background: '#e0f2fe',
      border: '1px solid #0284c7',
      borderRadius: '10px',
      color: '#0f172a',
    };
  }

  return {
    background: '#f8fafc',
    border: '1px solid #94a3b8',
    borderRadius: '10px',
    color: '#0f172a',
  };
};

const mapWorkflowNodes = (workflowNodes) =>
  workflowNodes.map((node) => ({
    id: node.id,
    position: { x: node.x ?? 0, y: node.y ?? 0 },
    data: {
      label: `${node.nodeName || node.departmentName || node.nodeCode || node.id}`,
      subtitle: node.departmentName ? `${node.departmentName}` : '',
      type: node.nodeType || 'default',
    },
    style: nodeStyle(node),
  }));

const mapWorkflowEdges = (workflowTransitions) =>
  workflowTransitions.map((transition, index) => ({
    id: `e-${transition.fromNodeId}-${transition.toNodeId}-${index}`,
    source: transition.fromNodeId,
    target: transition.toNodeId,
    animated: true,
    type: 'smoothstep',
    label: transition.actionName || transition.statusName || transition.stepNo || '',
  }));

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowId, setWorkflowId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((currentEdges) => addEdge({ ...params, animated: true, type: 'smoothstep' }, currentEdges)),
    [setEdges],
  );

  const loadWorkflow = useCallback(
    async (id) => {
      const workflowDefinitionId = id || workflowId;
      if (!workflowDefinitionId) {
        setError('Please enter a workflow id');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://localhost:7254/api/WorkflowDefinition/GetSingle/${workflowDefinitionId}`);
        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        const nodes = JSON.parse(data.workflowNodes);
        const nextNodes = Array.isArray(nodes.workflowNodes) ? mapWorkflowNodes(nodes.workflowNodes) : [];
        const nextEdges = Array.isArray(nodes.workflowTransitions) ? mapWorkflowEdges(nodes.workflowTransitions) : [];

        setNodes(nextNodes.length ? nextNodes : []);
        setEdges(nextEdges.length ? nextEdges : []);
        setSelectedNode(null);
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load workflow data');
      } finally {
        setLoading(false);
      }
    },
    [workflowId, setEdges, setNodes],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setWorkflowId(id);
      loadWorkflow(id);
    }
  }, [loadWorkflow]);

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
      <Panel position="top-left" className="panel">
        <h2>XY Flow React demo</h2>
        <p>Load workflow data from API, then view it as a graph.</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Workflow id"
            value={workflowId}
            onChange={(event) => setWorkflowId(event.target.value)}
            style={{ minWidth: 240, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <button onClick={() => loadWorkflow()} disabled={loading}>
            {loading ? 'Loading…' : 'Load workflow'}
          </button>
          <button onClick={addNode}>Add node</button>
        </div>
        {error && <p style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p>}
      </Panel>

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
