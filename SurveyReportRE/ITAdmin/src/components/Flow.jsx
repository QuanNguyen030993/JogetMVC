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
    getSmoothStepPath,
    EdgeLabelRenderer,
    useReactFlow,
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

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    selected,
    data = {},
}) => {
    const { setEdges, getZoom } = useReactFlow();

    const controlX = Number.isFinite(data?.controlX) ? data.controlX : (sourceX + targetX) / 2;
    const controlY = Number.isFinite(data?.controlY) ? data.controlY : (sourceY + targetY) / 2;

    const edgePath = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;

    const labelX = 0.25 * sourceX + 0.5 * controlX + 0.25 * targetX;
    const labelY = 0.25 * sourceY + 0.5 * controlY + 0.25 * targetY;

    const onControlPointMouseDown = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const startMouseX = event.clientX;
        const startMouseY = event.clientY;
        const startControlX = controlX;
        const startControlY = controlY;
        const zoom = getZoom();

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startMouseX;
            const dy = moveEvent.clientY - startMouseY;

            const nextControlX = startControlX + dx / zoom;
            const nextControlY = startControlY + dy / zoom;

            setEdges((currentEdges) =>
                currentEdges.map((edge) => {
                    if (edge.id === id) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                controlX: nextControlX,
                                controlY: nextControlY,
                            },
                        };
                    }
                    return edge;
                })
            );
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            <circle
                cx={controlX}
                cy={controlY}
                r={selected ? 7 : 5}
                fill={selected ? '#2563eb' : '#94a3b8'}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ cursor: 'move', pointerEvents: 'all', opacity: selected ? 1.0 : 0.6 }}
                onMouseDown={onControlPointMouseDown}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

const edgeTypes = {
    custom: CustomEdge,
};

const createNodeStyle = (node = {}) => {
    const type = (node.nodeType || '').toLowerCase();
    const flowType = (node.flowType || '').toLowerCase();
    const name = (node.nodeName || node.label || '').toLowerCase();
    const styleColor = (node.styleColor || '').toLowerCase();

    if (styleColor === 'red' || type === 'end' || flowType === 'end' || name === 'end' || flowType === 'complete' || name === 'client') {
        return {
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '50px',
            color: '#991b1b',
            fontWeight: '600',
            padding: '10px 20px',
        };
    }
    if (styleColor === 'green' || type === 'start' || flowType === 'start' || name === 'start') {
        return {
            background: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '50px',
            color: '#065f46',
            fontWeight: '600',
            padding: '10px 20px',
        };
    }
    if (styleColor === 'orange' || type === 'decision') {
        return {
            background: '#fff7ed',
            border: '1px solid #f97316',
            borderRadius: '14px',
            color: '#c2410c',
            padding: '10px',
        };
    }
    if (styleColor === 'lightorange') {
        return {
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '14px',
            color: '#b45309',
            padding: '10px',
        };
    }
    if (styleColor === 'blue' || type === 'department') {
        return {
            background: '#e0f2fe',
            border: '1px solid #0284c7',
            borderRadius: '14px',
            color: '#0369a1',
            padding: '10px',
        };
    }
    if (type === 'review') {
        return {
            background: '#f3e8ff',
            border: '1px solid #8b5cf6',
            borderRadius: '14px',
            color: '#6b21a8',
            padding: '10px',
        };
    }
    return {
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '14px',
        color: '#1e293b',
        padding: '10px',
    };
};

const layoutNodes = (nodes = [], edges = [], forceLayout = false) => {
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
        if (!forceLayout && node.data?.manualPositioned) {
            return node;
        }
        const level = levels.get(node.id) || 0;
        const bucket = buckets.get(level) || [];
        const index = bucket.findIndex((item) => item.id === node.id);

        return {
            ...node,
            position: {
                x: 140 + level * 260,
                y: 90 + index * 180,
            },
            data: {
                ...node.data,
                manualPositioned: !forceLayout ? node.data?.manualPositioned : false
            }
        };
    });
};

const mapWorkflowNodes = (workflowNodes = [], scaleX = 1.0, scaleY = 1.0) =>
    workflowNodes.map((node, index) => {
        const id = String(node.id ?? `node-${index + 1}`);
        const rawX = Number.isFinite(node.posX) ? node.posX : node.x;
        const rawY = Number.isFinite(node.posY) ? node.posY : node.y;
        const hasPosition = Number.isFinite(rawX) && Number.isFinite(rawY);

        return {
            id,
            position: hasPosition
                ? { x: rawX * scaleX, y: rawY * scaleY }
                : { x: (140 + index * 260) * scaleX, y: (90 + (index % 3) * 180) * scaleY },
            data: {
                label: node.nodeName || node.departmentName || node.nodeCode || node.id || `Step ${index + 1}`,
                subtitle: node.departmentName || '',
                nodeType: node.nodeType || 'task',
                departmentName: node.departmentName || '',
                description: node.description || '',
                manualPositioned: hasPosition,
                laneId: node.laneId || '',
                shape: node.shape || 'rectangle',
                styleColor: node.styleColor || 'blue',
                assignLabel: node.assignLabel || '',
                orderLabel: node.orderLabel || '',
            },
            style: createNodeStyle(node),
        };
    });

const formatTransitionLabel = (actionName, statusText, command) => {
    const actionPart = actionName || '';
    const statusPart = statusText || '';
    const commandPart = command && command !== 'None' ? command : '';

    if (!actionPart && !statusPart && !commandPart) {
        return <span className="label-default">Transition</span>;
    }

    return (
        <span className="flow-edge-label-container">
            {actionPart && <span className="label-item label-action">{actionPart}</span>}
            {statusPart && <span className="label-item label-status">{statusPart}</span>}
            {commandPart && <span className="label-item label-command">{commandPart}</span>}
        </span>
    );
};

const mapWorkflowEdges = (workflowTransitions = [], scaleX = 1.0, scaleY = 1.0) =>
    workflowTransitions.map((transition, index) => {
        const isReturn = transition.isReturn === true || String(transition.isReturn) === 'true' || transition.flowType === 'Return';
        const hasCommand = transition.command && transition.command !== 'None' && transition.command !== '0';
        return {
            id: `edge-${transition.fromNodeId || transition.from || 'from'}-${transition.toNodeId || transition.to || 'to'}-${index}`,
            source: String(transition.fromNodeId || transition.from || ''),
            target: String(transition.toNodeId || transition.to || ''),
            animated: Boolean(hasCommand),
            type: 'custom',
            label: formatTransitionLabel(transition.actionName || transition.actionCode, transition.statusId, transition.command),
            style: isReturn
                ? { stroke: '#dc2626', strokeWidth: 3, strokeDasharray: hasCommand ? '5,5' : undefined }
                : { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: hasCommand ? '5,5' : undefined },
            data: {
                actionName: transition.actionName || '',
                actionCode: transition.actionCode || '',
                stepNo: transition.stepNo || '',
                jumpStepNo: transition.jumpStepNo || '',
                transitionType: transition.transitionType || 'Normal',
                conditionJson: transition.conditionJson || '{}',
                isExitTransition: Boolean(transition.isExitTransition),
                isReturn: isReturn,
                statusId: transition.statusId || '',
                command: transition.command || 'None',
                commandConfig: transition.commandConfig || '',
                controlX: Number.isFinite(transition.controlX) ? transition.controlX * scaleX : null,
                controlY: Number.isFinite(transition.controlY) ? transition.controlY * scaleY : null,
            },
        };
    });

function Flow({ id: propId }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [workflowId, setWorkflowId] = useState(propId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [statusList, setStatusList] = useState([]);
    const [layoutConfig, setLayoutConfig] = useState(null);
    const [workflowDefinition, setWorkflowDefinition] = useState(null);
    const [lanesList, setLanesList] = useState([]);
    const [activeStatsTab, setActiveStatsTab] = useState('nodes');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/EnumData/FetchEnum/OverallStatus`)
            .then(r => r.json())
            .then(data => setStatusList(data || []))
            .catch(err => console.error("Failed to load OverallStatus enums:", err));
    }, []);

    useEffect(() => {
        if (statusList.length > 0 && edges.length > 0) {
            setEdges(currentEdges =>
                currentEdges.map(edge => {
                    const statusObj = statusList.find(s => String(s.id) === String(edge.data?.statusId));
                    const statusText = statusObj ? statusObj.value : edge.data?.statusId;
                    return {
                        ...edge,
                        label: formatTransitionLabel(edge.data?.actionName, statusText, edge.data?.command)
                    };
                })
            );
        }
    }, [statusList]);

    const onConnect = useCallback(
        (params) => {
            const newEdge = {
                id: `edge-${params.source}-${params.target}-${Date.now()}`,
                source: params.source,
                target: params.target,
                animated: false,
                type: 'custom',
                label: 'New transition',
                style: { stroke: '#2563eb', strokeWidth: 2 },
                data: {
                    actionName: '',
                    actionCode: '',
                    stepNo: '',
                    jumpStepNo: '',
                    transitionType: 'Normal',
                    conditionJson: '{}',
                    isExitTransition: false,
                    isReturn: false,
                    statusId: '',
                    command: 'None',
                    commandConfig: '',
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
                const scaleX = parsedPayload._layoutConfig?.SCALE_X || 1.0;
                const scaleY = parsedPayload._layoutConfig?.SCALE_Y || 1.0;
                setLayoutConfig(parsedPayload._layoutConfig || null);
                setWorkflowDefinition(parsedPayload.workflowDefinition || null);
                setLanesList(parsedPayload.lanes || []);

                const nextNodes = Array.isArray(parsedPayload.workflowNodes)
                    ? mapWorkflowNodes(parsedPayload.workflowNodes, scaleX, scaleY)
                    : [];
                const nextEdges = Array.isArray(parsedPayload.workflowTransitions)
                    ? mapWorkflowEdges(parsedPayload.workflowTransitions, scaleX, scaleY)
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
            const scaleX = layoutConfig?.SCALE_X || 1.0;
            const scaleY = layoutConfig?.SCALE_Y || 1.0;

            // Re-map nodes to database structure
            const workflowNodes = nodes.map((node) => {
                const idNum = parseInt(node.id.replace('node-', ''));
                const originalX = Math.round(node.position.x / scaleX);
                const originalY = Math.round(node.position.y / scaleY);
                return {
                    id: isNaN(idNum) ? node.id : idNum,
                    laneId: node.data.laneId || '',
                    nodeName: node.data.label,
                    nodeType: node.data.nodeType || 'task',
                    shape: node.data.shape || 'rectangle',
                    styleColor: node.data.styleColor || 'blue',
                    posX: originalX,
                    posY: originalY,
                    x: originalX,
                    y: originalY,
                    assignLabel: node.data.assignLabel || '',
                    orderLabel: node.data.orderLabel || '',
                    departmentName: node.data.departmentName || '',
                    description: node.data.description || ''
                };
            });

            // Re-map edges to database structure
            const workflowTransitions = edges.map((edge) => {
                const sourceNum = parseInt(edge.source.replace('node-', ''));
                const targetNum = parseInt(edge.target.replace('node-', ''));
                
                let parsedCondition = edge.data?.conditionJson || '{}';
                if (typeof parsedCondition === 'string') {
                    try {
                        parsedCondition = JSON.parse(parsedCondition);
                    } catch (e) {
                        console.warn("Invalid condition JSON, saving as string");
                    }
                }

                return {
                    fromNodeId: isNaN(sourceNum) ? edge.source : sourceNum,
                    toNodeId: isNaN(targetNum) ? edge.target : targetNum,
                    actionName: edge.data?.actionName || edge.label || 'Transition',
                    actionCode: edge.data?.actionCode || '',
                    stepNo: parseInt(edge.data?.stepNo) || null,
                    jumpStepNo: parseInt(edge.data?.jumpStepNo) || null,
                    transitionType: edge.data?.transitionType || 'Normal',
                    conditionJson: parsedCondition,
                    isExitTransition: edge.data?.isExitTransition === true,
                    isReturn: edge.data?.isReturn === true,
                    statusId: edge.data?.statusId || '',
                    command: edge.data?.command || 'None',
                    commandConfig: edge.data?.commandConfig || ''
                };
            });

            const payload = {
                _layoutConfig: layoutConfig,
                workflowDefinition: workflowDefinition,
                lanes: lanesList,
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
    }, [workflowId, nodes, edges, layoutConfig, workflowDefinition, lanesList]);

    useEffect(() => {
        if (propId) {
            setWorkflowId(propId);
            loadWorkflow(propId);
        } else {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id) {
                setWorkflowId(id);
                loadWorkflow(id);
            }
        }
    }, [propId, loadWorkflow]);

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
            style: createNodeStyle({ nodeType: 'task' }),
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
                style: createNodeStyle({ nodeType: template.nodeType }),
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
                style: createNodeStyle({
                    nodeType: field === 'nodeType' ? value : nextNodeData.nodeType,
                    flowType: field === 'flowType' ? value : nextNodeData.flowType,
                    nodeName: field === 'label' ? value : nextNodeData.label,
                    styleColor: field === 'styleColor' ? value : nextNodeData.styleColor
                }),
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

            const nextData = {
                ...selectedEdge.data,
                [field]: value,
            };

            const isReturn = nextData.isReturn === true || String(nextData.isReturn) === 'true';
            const hasCommand = nextData.command && nextData.command !== 'None' && nextData.command !== '0';

            const statusObj = statusList.find(s => String(s.id) === String(nextData.statusId));
            const statusText = statusObj ? statusObj.value : nextData.statusId;

            const nextEdge = {
                ...selectedEdge,
                label: formatTransitionLabel(nextData.actionName, statusText, nextData.command),
                data: nextData,
                animated: Boolean(hasCommand),
                style: isReturn
                    ? { stroke: '#dc2626', strokeWidth: 3, strokeDasharray: hasCommand ? '5,5' : undefined }
                    : { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: hasCommand ? '5,5' : undefined },
            };

            setEdges((currentEdges) =>
                currentEdges.map((edge) => (edge.id === selectedEdge.id ? nextEdge : edge)),
            );
            setSelectedEdge(nextEdge);
        },
        [selectedEdge, setEdges, statusList],
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
                        <option value="decision">Decision (Diamond)</option>
                        <option value="process">Process (Rectangle)</option>
                        <option value="complete">Complete (Circle)</option>
                        <option value="end">End (Circle)</option>
                    </select>
                </label>
                {lanesList.length > 0 && (
                    <label>
                        <span>Lane (Phân làn)</span>
                        <select
                            value={selectedNode.data.laneId || ''}
                            onChange={(event) => updateSelectedNode('laneId', event.target.value)}
                        >
                            <option value="">-- Chọn Phân làn --</option>
                            {lanesList.map(lane => (
                                <option key={lane.id} value={lane.id}>
                                    {lane.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label>
                    <span>Shape (Hình dáng)</span>
                    <select
                        value={selectedNode.data.shape || 'rectangle'}
                        onChange={(event) => updateSelectedNode('shape', event.target.value)}
                    >
                        <option value="rectangle">Rectangle (Hình chữ nhật)</option>
                        <option value="circle">Circle (Hình tròn)</option>
                        <option value="diamond">Diamond (Hình kim cương)</option>
                    </select>
                </label>
                <label>
                    <span>Style Color (Màu sắc hiển thị)</span>
                    <select
                        value={selectedNode.data.styleColor || 'blue'}
                        onChange={(event) => updateSelectedNode('styleColor', event.target.value)}
                    >
                        <option value="blue">Blue (Xanh dương)</option>
                        <option value="green">Green (Xanh lá)</option>
                        <option value="orange">Orange (Cam)</option>
                        <option value="lightOrange">Light Orange (Cam nhạt)</option>
                        <option value="red">Red (Đỏ)</option>
                    </select>
                </label>
                <label>
                    <span>Assign Label (Nhãn phân công)</span>
                    <input
                        value={selectedNode.data.assignLabel || ''}
                        onChange={(event) => updateSelectedNode('assignLabel', event.target.value)}
                        placeholder="e.g. Assign to me"
                    />
                </label>
                <label>
                    <span>Order Label (Nhãn chỉ đạo)</span>
                    <input
                        value={selectedNode.data.orderLabel || ''}
                        onChange={(event) => updateSelectedNode('orderLabel', event.target.value)}
                        placeholder="e.g. Ý chỉ"
                    />
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
    }, [selectedNode, updateSelectedNode, lanesList]);

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
                    <span>Status (Trạng thái)</span>
                    <select
                        value={selectedEdge.data?.statusId || ''}
                        onChange={(event) => updateSelectedEdge('statusId', event.target.value)}
                    >
                        <option value="">-- Chọn Trạng thái --</option>
                        {statusList.map(status => (
                            <option key={status.id} value={status.id}>
                                {status.value} (ID: {status.id})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flow-checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(selectedEdge.data?.isExitTransition)}
                        onChange={(event) => updateSelectedEdge('isExitTransition', event.target.checked)}
                    />
                    <span>Exit transition</span>
                </label>
                <label className="flow-checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(selectedEdge.data?.isReturn)}
                        onChange={(event) => updateSelectedEdge('isReturn', event.target.checked)}
                    />
                    <span>Return transition (Quay lại)</span>
                </label>
                <label>
                    <span>System Command (Lệnh hệ thống)</span>
                    <select
                        value={selectedEdge.data?.command || 'None'}
                        onChange={(event) => updateSelectedEdge('command', event.target.value)}
                    >
                        <option value="None">None</option>
                        <option value="CopyFile">CopyFile</option>
                        <option value="TransferFile">TransferFile</option>
                        <option value="LockFileLocal">LockFileLocal</option>
                    </select>
                </label>
                {selectedEdge.data?.command && selectedEdge.data?.command !== 'None' && (
                    <label>
                        <span>Command Configuration (JSON)</span>
                        <textarea
                            rows={4}
                            value={selectedEdge.data?.commandConfig || ''}
                            onChange={(event) => updateSelectedEdge('commandConfig', event.target.value)}
                            placeholder='{"sourceDepartment": "FO", "targetDepartment": "LMKT"}'
                        />
                    </label>
                )}
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
    }, [selectedEdge, updateSelectedEdge, statusList]);

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
                        <button type="button" className="flow-action-btn" onClick={() => setNodes((currentNodes) => layoutNodes(currentNodes, edges, true))}>
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
                        edgeTypes={edgeTypes}
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

            {/* Stats Summary List */}
            <div className="flow-stats-container">
                <div className="flow-stats-tabs">
                    <button
                        type="button"
                        className={`flow-stats-tab-btn ${activeStatsTab === 'nodes' ? 'active' : ''}`}
                        onClick={() => setActiveStatsTab('nodes')}
                    >
                        Flat Node List ({nodes.length})
                    </button>
                    <button
                        type="button"
                        className={`flow-stats-tab-btn ${activeStatsTab === 'transitions' ? 'active' : ''}`}
                        onClick={() => setActiveStatsTab('transitions')}
                    >
                        Transition List ({edges.length})
                    </button>
                </div>

                <div className="flow-stats-table-wrapper">
                    {activeStatsTab === 'nodes' ? (
                        <table className="flow-stats-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Node Name</th>
                                    <th>Type</th>
                                    <th>Lane</th>
                                    <th>Shape</th>
                                    <th>Style Color</th>
                                    <th>Position (X, Y)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nodes.map((node) => {
                                    const scaleX = layoutConfig?.SCALE_X || 1.0;
                                    const scaleY = layoutConfig?.SCALE_Y || 1.0;
                                    const origX = Math.round(node.position.x / scaleX);
                                    const origY = Math.round(node.position.y / scaleY);
                                    return (
                                        <tr key={node.id} onClick={() => { setSelectedNode(node); setSelectedEdge(null); }} style={{ cursor: 'pointer' }}>
                                            <td><strong>{node.id}</strong></td>
                                            <td>{node.data.label}</td>
                                            <td><span className="label-item label-action" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{node.data.nodeType}</span></td>
                                            <td>{node.data.laneId || '-'}</td>
                                            <td>{node.data.shape || 'rectangle'}</td>
                                            <td><span style={{ color: node.data.styleColor === 'red' ? '#dc2626' : node.data.styleColor === 'green' ? '#10b981' : node.data.styleColor === 'orange' ? '#f97316' : '#2563eb', fontWeight: 600 }}>{node.data.styleColor || 'blue'}</span></td>
                                            <td>{origX}, {origY}</td>
                                        </tr>
                                    );
                                })}
                                {nodes.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No nodes available. Load a workflow to view.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="flow-stats-table">
                            <thead>
                                <tr>
                                    <th>From Node</th>
                                    <th>To Node</th>
                                    <th>Action Name</th>
                                    <th>Action Code</th>
                                    <th>Step No</th>
                                    <th>Status (Trạng thái)</th>
                                    <th>System Command</th>
                                </tr>
                            </thead>
                            <tbody>
                                {edges.map((edge) => {
                                    const statusObj = statusList.find(s => String(s.id) === String(edge.data?.statusId));
                                    const statusText = statusObj ? statusObj.value : edge.data?.statusId;
                                    return (
                                        <tr key={edge.id} onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }} style={{ cursor: 'pointer' }}>
                                            <td>{edge.source}</td>
                                            <td>{edge.target}</td>
                                            <td><span className="label-item label-action">{edge.data?.actionName || '-'}</span></td>
                                            <td><code>{edge.data?.actionCode || '-'}</code></td>
                                            <td>{edge.data?.stepNo || '-'}</td>
                                            <td>{statusText ? <span className="label-item label-status">{statusText}</span> : '-'}</td>
                                            <td>{edge.data?.command && edge.data?.command !== 'None' ? <span className="label-item label-command">{edge.data?.command}</span> : '-'}</td>
                                        </tr>
                                    );
                                })}
                                {edges.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No transitions available. Connect nodes to create transitions.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Flow;
