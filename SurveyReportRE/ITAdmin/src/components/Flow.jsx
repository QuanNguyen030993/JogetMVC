import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
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

const nodeTemplates = [
    {
        type: 'start',
        label: 'Start',
        subtitle: 'Entry point',
        nodeType: 'start',
        description: 'Initial workflow step',
    },
    {
        type: 'task',
        label: 'Task',
        subtitle: 'Approval / action',
        nodeType: 'task',
        description: 'Standard workflow action',
    },
    {
        type: 'department',
        label: 'Department',
        subtitle: 'Assigned team',
        nodeType: 'department',
        description: 'Department or owner assignment',
    },
    {
        type: 'review',
        label: 'Review',
        subtitle: 'Checker step',
        nodeType: 'review',
        description: 'Review / verification step',
    },
];

const createNodeStyle = (nodeType = 'default') => {
    switch (nodeType) {
        case 'start':
            return {
                background: '#dbeafe',
                border: '1px solid #2563eb',
                borderRadius: '14px',
                color: '#0f172a',
            };
        case 'department':
            return {
                background: '#e0f2fe',
                border: '1px solid #0284c7',
                borderRadius: '14px',
                color: '#0f172a',
            };
        case 'review':
            return {
                background: '#dcfce7',
                border: '1px solid #16a34a',
                borderRadius: '14px',
                color: '#0f172a',
            };
        default:
            return {
                background: '#fef3c7',
                border: '1px solid #d97706',
                borderRadius: '14px',
                color: '#0f172a',
            };
    }
};

const layoutNodes = (nodes = [], edges = []) => {
    if (!nodes.length) {
        return nodes;
    }

    const incoming = new Map(nodes.map((node) => [node.id, 0]));
    edges.forEach((edge) => {
        if (edge.target) {
            incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
        }
    });

    const roots = nodes.filter((node) => (incoming.get(node.id) || 0) === 0).map((node) => node.id);
    const levels = new Map();
    const queue = [...roots];

    while (queue.length) {
        const currentId = queue.shift();
        const currentLevel = levels.get(currentId) || 0;
        const children = edges.filter((edge) => edge.source === currentId).map((edge) => edge.target);

        children.forEach((childId) => {
            const nextLevel = currentLevel + 1;
            if ((levels.get(childId) || -1) < nextLevel) {
                levels.set(childId, nextLevel);
            }
            queue.push(childId);
        });
    }

    const buckets = new Map();
    nodes.forEach((node) => {
        const level = levels.get(node.id) || 0;
        if (!buckets.has(level)) {
            buckets.set(level, []);
        }
        buckets.get(level).push(node);
    });

    return nodes.map((node) => {
        const level = levels.get(node.id) || 0;
        const bucket = buckets.get(level) || [];
        const index = bucket.findIndex((item) => item.id === node.id);

        return {
            ...node,
            position: {
                x: 140 + level * 260,
                y: 90 + index * 180,
            },
        };
    });
};

const mapWorkflowNodes = (workflowNodes = []) =>
    workflowNodes.map((node, index) => {
        const id = String(node.id ?? `node-${index + 1}`);
        const hasPosition = Number.isFinite(node.x) && Number.isFinite(node.y);

        return {
            id,
            position: hasPosition
                ? { x: node.x, y: node.y }
                : { x: 140 + index * 260, y: 90 + (index % 3) * 180 },
            data: {
                label: node.nodeName || node.departmentName || node.nodeCode || node.id || `Step ${index + 1}`,
                subtitle: node.departmentName || '',
                nodeType: node.nodeType || 'task',
                departmentName: node.departmentName || '',
                description: node.description || '',
                manualPositioned: hasPosition,
            },
            style: createNodeStyle(node.nodeType || 'task'),
        };
    });

const mapWorkflowEdges = (workflowTransitions = []) =>
    workflowTransitions.map((transition, index) => ({
        id: `edge-${transition.fromNodeId || transition.from || 'from'}-${transition.toNodeId || transition.to || 'to'}-${index}`,
        source: String(transition.fromNodeId || transition.from || ''),
        target: String(transition.toNodeId || transition.to || ''),
        animated: true,
        type: ConnectionLineType.SmoothStep,
        label: transition.actionName || transition.actionCode || transition.statusName || 'Transition',
        data: {
            actionName: transition.actionName || '',
            actionCode: transition.actionCode || '',
            stepNo: transition.stepNo || '',
            jumpStepNo: transition.jumpStepNo || '',
            transitionType: transition.transitionType || 'Normal',
            conditionJson: transition.conditionJson || '{}',
            isExitTransition: Boolean(transition.isExitTransition),
            statusId: transition.statusId || '',
        },
    }));

function Flow() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [workflowId, setWorkflowId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const onConnect = useCallback(
        (params) => {
            const newEdge = {
                id: `edge-${params.source}-${params.target}-${Date.now()}`,
                source: params.source,
                target: params.target,
                animated: true,
                type: ConnectionLineType.SmoothStep,
                label: 'New transition',
                data: {
                    actionName: '',
                    actionCode: '',
                    stepNo: '',
                    jumpStepNo: '',
                    transitionType: 'Normal',
                    conditionJson: '{}',
                    isExitTransition: false,
                    statusId: '',
                },
            };

            setEdges((currentEdges) => {
                const nextEdges = addEdge(newEdge, currentEdges);
                setNodes((currentNodes) => layoutNodes(currentNodes, nextEdges));
                return nextEdges;
            });
            setSelectedEdge(newEdge);
        },
        [setEdges, setNodes],
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
                const response = await fetch(`${API_BASE_URL}/api/WorkflowDefinition/GetSingle/${workflowDefinitionId}`);
                if (!response.ok) {
                    throw new Error(`API error ${response.status}`);
                }

                const data = await response.json();
                const parsedPayload = typeof data.workflowNodes === 'string' ? JSON.parse(data.workflowNodes) : data.workflowNodes || {};
                const nextNodes = Array.isArray(parsedPayload.workflowNodes)
                    ? mapWorkflowNodes(parsedPayload.workflowNodes)
                    : [];
                const nextEdges = Array.isArray(parsedPayload.workflowTransitions)
                    ? mapWorkflowEdges(parsedPayload.workflowTransitions)
                    : [];

                setNodes(nextNodes.length ? layoutNodes(nextNodes, nextEdges) : []);
                setEdges(nextEdges);
                setSelectedNode(null);
                setSelectedEdge(null);
            } catch (fetchError) {
                setError(fetchError.message || 'Failed to load workflow data');
            } finally {
                setLoading(false);
            }
        },
        [workflowId, setEdges, setNodes],
    );

    const saveWorkflow = useCallback(async () => {
        const workflowDefinitionId = workflowId;
        if (!workflowDefinitionId) {
            setError('Please load or enter a workflow id first');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Re-map nodes to database structure
            const workflowNodes = nodes.map((node, index) => {
                const idNum = parseInt(node.id.replace('node-', ''));
                return {
                    id: isNaN(idNum) ? node.id : idNum,
                    nodeName: node.data.label,
                    nodeCode: node.data.label,
                    nodeType: node.data.nodeType || 'task',
                    departmentName: node.data.departmentName || '',
                    description: node.data.description || '',
                    x: Math.round(node.position.x),
                    y: Math.round(node.position.y)
                };
            });

            // Re-map edges to database structure
            const workflowTransitions = edges.map((edge, index) => {
                const sourceNum = parseInt(edge.source.replace('node-', ''));
                const targetNum = parseInt(edge.target.replace('node-', ''));
                return {
                    fromNodeId: isNaN(sourceNum) ? edge.source : sourceNum,
                    toNodeId: isNaN(targetNum) ? edge.target : targetNum,
                    actionName: edge.data?.actionName || edge.label || 'Transition',
                    actionCode: edge.data?.actionCode || '',
                    stepNo: parseInt(edge.data?.stepNo) || null,
                    jumpStepNo: parseInt(edge.data?.jumpStepNo) || null,
                    transitionType: edge.data?.transitionType || 'Normal',
                    conditionJson: edge.data?.conditionJson || '{}',
                    isExitTransition: edge.data?.isExitTransition === true,
                    statusId: edge.data?.statusId || ''
                };
            });

            const payload = {
                workflowNodes,
                workflowTransitions
            };

            const formData = new FormData();
            formData.append("key", workflowDefinitionId);
            formData.append("values", JSON.stringify({
                workflowNodes: JSON.stringify(payload)
            }));

            const response = await fetch(`${API_BASE_URL}/api/WorkflowDefinition/UpdateData`, {
                method: "PUT",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error ${response.status}`);
            }

            alert("Lưu quy trình thành công! ✅");
        } catch (saveError) {
            setError(saveError.message || 'Failed to save workflow data');
            alert("Lưu quy trình thất bại! ❌");
        } finally {
            setLoading(false);
        }
    }, [workflowId, nodes, edges]);

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
        const nextNode = {
            id,
            position: {
                x: 140 + nodes.length * 120,
                y: 90 + (nodes.length % 3) * 180,
            },
            data: {
                label: `Step ${nodes.length + 1}`,
                subtitle: 'New step',
                nodeType: 'task',
                departmentName: '',
                description: '',
                manualPositioned: false,
            },
            style: createNodeStyle('task'),
        };

        const nextNodes = [...nodes, nextNode];
        setNodes(layoutNodes(nextNodes, edges));
        setSelectedNode(nextNode);
        setSelectedEdge(null);
    }, [edges, nodes, setNodes]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type || !reactFlowInstance) {
                return;
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            const template = nodeTemplates.find((item) => item.type === type) || nodeTemplates[0];
            const newNode = {
                id: `node-${Math.random().toString(36).slice(2, 8)}`,
                position,
                data: {
                    label: template.label,
                    subtitle: template.subtitle,
                    nodeType: template.nodeType,
                    departmentName: '',
                    description: template.description,
                    manualPositioned: true,
                },
                style: createNodeStyle(template.nodeType),
            };

            const nextNodes = [...nodes, newNode];
            setNodes(layoutNodes(nextNodes, edges));
            setSelectedNode(newNode);
            setSelectedEdge(null);
        },
        [edges, nodes, reactFlowInstance, setNodes],
    );

    const updateSelectedNode = useCallback(
        (field, value) => {
            if (!selectedNode) {
                return;
            }

            const nextNodeData = {
                ...selectedNode.data,
                [field]: value,
            };

            const nextNode = {
                ...selectedNode,
                data: nextNodeData,
                style: createNodeStyle(field === 'nodeType' ? value : nextNodeData.nodeType || 'task'),
            };

            setNodes((currentNodes) =>
                currentNodes.map((node) => (node.id === selectedNode.id ? nextNode : node)),
            );
            setSelectedNode(nextNode);
        },
        [selectedNode, setNodes],
    );

    const updateSelectedEdge = useCallback(
        (field, value) => {
            if (!selectedEdge) {
                return;
            }

            const nextEdge = {
                ...selectedEdge,
                data: {
                    ...selectedEdge.data,
                    [field]: value,
                },
            };

            setEdges((currentEdges) =>
                currentEdges.map((edge) => (edge.id === selectedEdge.id ? nextEdge : edge)),
            );
            setSelectedEdge(nextEdge);
        },
        [selectedEdge, setEdges],
    );

    const nodeDetails = useMemo(() => {
        if (!selectedNode) {
            return null;
        }

        return (
            <div className="flow-form-card">
                <h3>Node properties</h3>
                <label>
                    <span>Node name</span>
                    <input
                        value={selectedNode.data.label || ''}
                        onChange={(event) => updateSelectedNode('label', event.target.value)}
                    />
                </label>
                <label>
                    <span>Node type</span>
                    <select
                        value={selectedNode.data.nodeType || 'task'}
                        onChange={(event) => updateSelectedNode('nodeType', event.target.value)}
                    >
                        <option value="start">Start</option>
                        <option value="task">Task</option>
                        <option value="department">Department</option>
                        <option value="review">Review</option>
                    </select>
                </label>
                <label>
                    <span>Department</span>
                    <input
                        value={selectedNode.data.departmentName || ''}
                        onChange={(event) => updateSelectedNode('departmentName', event.target.value)}
                    />
                </label>
                <label>
                    <span>Description</span>
                    <textarea
                        rows={3}
                        value={selectedNode.data.description || ''}
                        onChange={(event) => updateSelectedNode('description', event.target.value)}
                    />
                </label>
            </div>
        );
    }, [selectedNode, updateSelectedNode]);

    const edgeDetails = useMemo(() => {
        if (!selectedEdge) {
            return null;
        }

        return (
            <div className="flow-form-card">
                <h3>Transition properties</h3>
                <label>
                    <span>Action name</span>
                    <input
                        value={selectedEdge.data?.actionName || ''}
                        onChange={(event) => updateSelectedEdge('actionName', event.target.value)}
                    />
                </label>
                <label>
                    <span>Action code</span>
                    <input
                        value={selectedEdge.data?.actionCode || ''}
                        onChange={(event) => updateSelectedEdge('actionCode', event.target.value)}
                    />
                </label>
                <label>
                    <span>Step no</span>
                    <input
                        value={selectedEdge.data?.stepNo || ''}
                        onChange={(event) => updateSelectedEdge('stepNo', event.target.value)}
                    />
                </label>
                <label>
                    <span>Jump step no</span>
                    <input
                        value={selectedEdge.data?.jumpStepNo || ''}
                        onChange={(event) => updateSelectedEdge('jumpStepNo', event.target.value)}
                    />
                </label>
                <label>
                    <span>Transition type</span>
                    <select
                        value={selectedEdge.data?.transitionType || 'Normal'}
                        onChange={(event) => updateSelectedEdge('transitionType', event.target.value)}
                    >
                        <option value="Normal">Normal</option>
                        <option value="Loop">Loop</option>
                        <option value="Condition">Condition</option>
                    </select>
                </label>
                <label>
                    <span>Status id</span>
                    <input
                        value={selectedEdge.data?.statusId || ''}
                        onChange={(event) => updateSelectedEdge('statusId', event.target.value)}
                    />
                </label>
                <label className="flow-checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(selectedEdge.data?.isExitTransition)}
                        onChange={(event) => updateSelectedEdge('isExitTransition', event.target.checked)}
                    />
                    <span>Exit transition</span>
                </label>
                <label>
                    <span>Condition JSON</span>
                    <textarea
                        rows={4}
                        value={selectedEdge.data?.conditionJson || '{}'}
                        onChange={(event) => updateSelectedEdge('conditionJson', event.target.value)}
                    />
                </label>
            </div>
        );
    }, [selectedEdge, updateSelectedEdge]);

    return (
        <div className="flow-shell">
            <div className="flow-layout">
                <aside className="flow-sidebar">
                    <div className="flow-sidebar-card">
                        <h3>Node palette</h3>
                        <p>Drag a node to the canvas to build workflow steps.</p>
                        <div className="flow-palette-list">
                            {nodeTemplates.map((template) => (
                                <div
                                    key={template.type}
                                    className="flow-palette-item"
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData('application/reactflow', template.type);
                                        event.dataTransfer.effectAllowed = 'move';
                                    }}
                                >
                                    <strong>{template.label}</strong>
                                    <span>{template.subtitle}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flow-sidebar-card">
                        <h3>Quick actions</h3>
                        <button type="button" className="flow-action-btn" onClick={() => setNodes((currentNodes) => layoutNodes(currentNodes, edges))}>
                            Auto layout
                        </button>
                        <button type="button" className="flow-action-btn secondary" onClick={addNode}>
                            Add node
                        </button>
                    </div>
                </aside>

                <div className="flow-canvas-panel">
                    <ReactFlow
                        className="workflow-canvas"
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(_, node) => {
                            setSelectedNode(node);
                            setSelectedEdge(null);
                        }}
                        onEdgeClick={(_, edge) => {
                            setSelectedEdge(edge);
                            setSelectedNode(null);
                        }}
                        onPaneClick={() => {
                            setSelectedNode(null);
                            setSelectedEdge(null);
                        }}
                        onNodeDragStop={(_, node) => {
                            setNodes((currentNodes) =>
                                currentNodes.map((item) =>
                                    item.id === node.id
                                        ? {
                                            ...item,
                                            position: node.position,
                                            data: {
                                                ...item.data,
                                                manualPositioned: true,
                                            },
                                        }
                                        : item,
                                ),
                            );
                            setSelectedNode(node);
                        }}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        fitView
                    >
                        <Panel position="top-left" className="flow-toolbar">
                            <div>
                                <h2>Workflow designer</h2>
                                <p>Load workflow data from API and edit nodes and transitions visually.</p>
                            </div>
                            <div className="flow-actions">
                                <input
                                    type="text"
                                    placeholder="Workflow id"
                                    value={workflowId}
                                    onChange={(event) => setWorkflowId(event.target.value)}
                                />
                                <button type="button" onClick={() => loadWorkflow()} disabled={loading}>
                                    {loading ? 'Loading…' : 'Load workflow'}
                                </button>
                                <button type="button" onClick={saveWorkflow} disabled={loading || !workflowId} style={{ background: '#10b981', color: 'white', marginLeft: '10px', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                                    Lưu (Save)
                                </button>
                            </div>
                        </Panel>

                        <Panel position="top-right" className="info-panel">
                            <strong>
                                {selectedNode
                                    ? `Selected node: ${selectedNode.data.label || selectedNode.id}`
                                    : selectedEdge
                                        ? 'Selected transition'
                                        : 'Select a node or transition'}
                            </strong>
                        </Panel>

                        <MiniMap />
                        <Controls />
                        <Background gap={16} size={1} />
                    </ReactFlow>
                </div>

                <aside className="flow-properties-panel">
                    {error && <div className="flow-error">{error}</div>}
                    {nodeDetails}
                    {edgeDetails}
                    {!selectedNode && !selectedEdge && (
                        <div className="flow-empty-state">
                            <h3>Configure workflow</h3>
                            <p>Select a node or connect two nodes to edit transition attributes such as action name, step no and condition JSON.</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default Flow;
