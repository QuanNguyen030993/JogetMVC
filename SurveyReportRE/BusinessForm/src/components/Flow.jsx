import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import {
    useEdgesState,
    useNodesState,
    MarkerType,
} from '@xyflow/react';
import Diagram, { createNodeStyle } from '../../../ITAdmin/src/components/Diagram';
import '@xyflow/react/dist/style.css';

const nodeTemplates = [
    {
        type: 'start',
        label: 'Start Node',
        subtitle: 'Entry point',
        nodeType: 'start',
        description: 'Initial workflow step',
    },
    {
        type: 'end',
        label: 'End Node',
        subtitle: 'Exit point',
        nodeType: 'end',
        description: 'Terminating workflow step',
    },
    {
        type: 'custom',
        label: 'Custom Node',
        subtitle: 'Custom process',
        nodeType: 'custom',
        description: 'Special process step',
    },
    {
        type: 'task',
        label: 'Task Node',
        subtitle: 'Approval / Action',
        nodeType: 'task',
        description: 'Standard workflow action',
    },
    {
        type: 'department',
        label: 'Department Node',
        subtitle: 'Assigned team',
        nodeType: 'department',
        description: 'Department assignment step',
    }
];

const transitionIconOptions = [
    { icon: 'x', value: 'close', label: 'close' },
    { icon: 'check', value: 'check', label: 'check' },
    { icon: 'plus', value: 'plus', label: 'plus' },
    { icon: 'minus', value: 'minus', label: 'minus' },
    { icon: 'edit', value: 'edit', label: 'edit' },
    { icon: 'trash', value: 'trash', label: 'trash' },
    { icon: 'save', value: 'save', label: 'save' },
    { icon: 'search', value: 'search', label: 'search' },
    { icon: 'refresh', value: 'refresh', label: 'refresh' },
    { icon: 'copy', value: 'copy', label: 'copy' },
    { icon: 'paste', value: 'paste', label: 'paste' },
    { icon: 'download', value: 'download', label: 'download' },
    { icon: 'upload', value: 'upload', label: 'upload' },
    { icon: 'folder', value: 'folder', label: 'folder' },
    { icon: 'home', value: 'home', label: 'home' },
    { icon: 'preferences', value: 'preferences', label: 'preferences' },
    { icon: 'user', value: 'user', label: 'user' },
    { icon: 'lock', value: 'lock', label: 'lock' },
    { icon: 'menu', value: 'menu', label: 'menu' },
    { icon: 'chevronleft', value: 'chevronleft', label: 'chevronleft' },
    { icon: 'chevronright', value: 'chevronright', label: 'chevronright' },
    { icon: 'chevronup', value: 'chevronup', label: 'chevronup' },
    { icon: 'chevrondown', value: 'chevrondown', label: 'chevrondown' },
];

const transitionButtonClassOptions = [
    { value: '', label: 'Default' },
    { value: 'dx-button-default', label: 'Default' },
    { value: 'dx-button-success', label: 'Success' },
    { value: 'dx-button-danger', label: 'Danger' },
    { value: 'dx-button-warning', label: 'Warning' },
    { value: 'dx-button-info', label: 'Info' },
    { value: 'dx-button-normal', label: 'Normal' },
];


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
            // Prevent infinite loop on cycles by limiting maximum path level traversal to the nodes count
            if (nextLevel < nodes.length) {
                if ((levels.get(childId) || -1) < nextLevel) {
                    levels.set(childId, nextLevel);
                    queue.push(childId);
                }
            }
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
        const id = String(node.id ?? node.nodeId ?? `NODE_${index + 1}`);
        const code = node.nodeCode || node.code || id;
        const rawX = Number.isFinite(node.posX) ? node.posX : node.x;
        const rawY = Number.isFinite(node.posY) ? node.posY : node.y;
        const hasPosition = Number.isFinite(rawX) && Number.isFinite(rawY);

        let parsedScreenConditions = [];
        if (Array.isArray(node.screenConditions)) {
            parsedScreenConditions = node.screenConditions;
        } else if (node.data) {
            try {
                const parsed = typeof node.data === 'string' ? JSON.parse(node.data) : node.data;
                if (Array.isArray(parsed.screenConditions)) {
                    parsedScreenConditions = parsed.screenConditions;
                } else if (parsed.rawNode && Array.isArray(parsed.rawNode.screenConditions)) {
                    parsedScreenConditions = parsed.rawNode.screenConditions;
                }
            } catch (e) {}
        }

        return {
            id,
            type: 'workflowNode',
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
                code,
                flowType: node.flowType || node.nodeStatus || 'Both',
                stepRole: node.stepRole || '',
                levelNo: node.levelNo || '',
                allowLoop: !!node.allowLoop,
                loopGroup: node.loopGroup || '',
                screenConditions: parsedScreenConditions,
                custom: node.custom || '',
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

const parseJsonToRulesState = (jsonStr) => {
    const fallback = { rootOperator: 'AND', rules: [] };
    if (!jsonStr || jsonStr === '{}') return fallback;
    try {
        const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (!obj || typeof obj !== 'object') return fallback;

        if (obj.type === 'group') {
            const rules = (obj.children || []).map((child, i) => ({
                id: `rule-${Date.now()}-${i}`,
                source: child.source || 'payload',
                field: child.field || '',
                dataType: child.dataType || 'string',
                operator: child.operator || '=',
                value: child.value != null ? String(child.value) : '',
                customHandler: child.handler || '',
                customArgs: child.args ? JSON.stringify(child.args, null, 2) : ''
            }));
            return {
                rootOperator: obj.operator || 'AND',
                rules
            };
        } else if (obj.type === 'rule' || obj.field || obj.handler) {
            return {
                rootOperator: 'AND',
                rules: [{
                    id: `rule-${Date.now()}-0`,
                    source: obj.source || 'payload',
                    field: obj.field || '',
                    dataType: obj.dataType || 'string',
                    operator: obj.operator || '=',
                    value: obj.value != null ? String(obj.value) : '',
                    customHandler: obj.handler || '',
                    customArgs: obj.args ? JSON.stringify(obj.args, null, 2) : ''
                }]
            };
        }
    } catch (e) {
        console.warn("Failed to parse condition JSON to rules state", e);
    }
    return fallback;
};

const mapWorkflowEdges = (workflowTransitions = [], scaleX = 1.0, scaleY = 1.0) =>
    workflowTransitions.map((transition, index) => {
        const isReturn = transition.isReturn === true || String(transition.isReturn) === 'true' || transition.flowType === 'Return';
        const hasCommand = transition.command && transition.command !== 'None' && transition.command !== '0';
        
        let conditionJsonStr = '{}';
        if (transition.conditionJson) {
            conditionJsonStr = typeof transition.conditionJson === 'string' 
                ? transition.conditionJson 
                : JSON.stringify(transition.conditionJson, null, 2);
        }

        return {
            id: `edge-${transition.fromNodeId || transition.from || 'from'}-${transition.toNodeId || transition.to || 'to'}-${index}`,
            source: String(transition.fromNodeId || transition.from || ''),
            target: String(transition.toNodeId || transition.to || ''),
            animated: !hasCommand,
            type: 'custom',
            label: formatTransitionLabel(transition.actionName || transition.actionCode, transition.statusName || transition.statusId, transition.command),
            style: isReturn
                ? { stroke: '#dc2626', strokeWidth: 3 }
                : { stroke: '#2563eb', strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: isReturn ? '#dc2626' : '#2563eb',
            },
            data: {
                actionName: transition.actionName || '',
                actionCode: transition.actionCode || '',
                stepNo: transition.stepNo || '',
                jumpStepNo: transition.jumpStepNo || '',
                transitionType: transition.transitionType || 'Normal',
                conditionJson: conditionJsonStr,
                conditionRulesState: transition.conditionRulesState || parseJsonToRulesState(transition.conditionJson),
                isExitTransition: Boolean(transition.isExitTransition),
                isReturn: isReturn,
                statusId: transition.statusId || '',
                statusName: transition.statusName || '',
                transitionScript: normalizeTransitionScript(transition.transitionScript || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.transitionScript || '';
                    } catch (e) { return ''; }
                })()),
                icon: transition.icon || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.icon || '';
                    } catch (e) { return ''; }
                })(),
                buttonClass: transition.buttonClass || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.buttonClass || '';
                    } catch (e) { return ''; }
                })(),
                command: transition.command || 'None',
                commandConfig: transition.commandConfig || '',
                mailTemplateId: transition.mailTemplateId || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.mailTemplateId || '';
                    } catch (e) { return ''; }
                })(),
                notificationTemplateId: transition.notificationTemplateId || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.notificationTemplateId || '';
                    } catch (e) { return ''; }
                })(),
                custom: (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.custom || '';
                    } catch (e) { return ''; }
                })(),
                controlX: Number.isFinite(transition.controlX) ? transition.controlX * scaleX : null,
                controlY: Number.isFinite(transition.controlY) ? transition.controlY * scaleY : null,
            },
        };
    });

const normalizeTransitionScript = (value) => {
    let script = value || '';
    for (let index = 0; index < 3 && typeof script === 'string'; index += 1) {
        const text = script.trim();
        if (!text.startsWith('{')) break;
        try {
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed.transitionScript !== 'string') break;
            script = parsed.transitionScript;
        } catch (error) {
            break;
        }
    }
    return typeof script === 'string' ? script : '';
};


function Flow({ id: propId, guid: propGuid }) {
   
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [workflowId, setWorkflowId] = useState(propId || '');
    const [workflowGuid, setWorkflowGuid] = useState(propGuid || '');
    const [searchRecordGuid, setSearchRecordGuid] = useState(propGuid || '');
    const [tracedStep, setTracedStep] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notificationsList, setNotificationsList] = useState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [layoutConfig, setLayoutConfig] = useState(null);
    const [workflowDefinition, setWorkflowDefinition] = useState(null);
    const [lanesList, setLanesList] = useState([]);
    const focusNode = useCallback(
        (nodeId) => {
            window.requestAnimationFrame(() => {
                reactFlowInstance?.fitView?.({
                    nodes: [{ id: nodeId }],
                    padding: 0.5,
                    duration: 250,
                    maxZoom: 1.2,
                });
            });
        },
        [reactFlowInstance],
    );


    

    const onConnect = useCallback(
        (params) => {
            const newEdge = {
                id: `edge-${params.source}-${params.target}-${Date.now()}`,
                source: params.source,
                target: params.target,
                animated: true,
                type: 'custom',
                label: 'New transition',
                style: { stroke: '#2563eb', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: '#2563eb',
                },
                data: {
                    actionName: '',
                    actionCode: '',
                    stepNo: '',
                    jumpStepNo: '',
                    transitionType: 'Normal',
                    conditionJson: '{}',
                    conditionRulesState: { rootOperator: 'AND', rules: [] },
                    isExitTransition: false,
                    isReturn: false,
                    statusId: '',
                    statusName: '',
                    icon: '',
                    buttonClass: '',
                    command: 'None',
                    commandConfig: '',
                },
            };

            setEdges((currentEdges) => {
                const finalEdge = {
                    ...newEdge,
                    sourceHandle: params.sourceHandle,
                    targetHandle: params.targetHandle,
                };
                const nextEdges = [...currentEdges, finalEdge];
                setNodes((currentNodes) => layoutNodes(currentNodes, nextEdges));
                return nextEdges;
            });
            setSelectedEdge({
                ...newEdge,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
            });
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
                    setWorkflowGuid(data.guid || data.Guid || '');
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
                    traceInstanceWorkflow();
                } catch (fetchError) {
                    setError(fetchError.message || 'Failed to load workflow data');
                } finally {
                    setLoading(false);
                }
            },
            [workflowId, setEdges, setNodes],
        );


        const traceInstanceWorkflow = useCallback(async () => {
        if (!searchRecordGuid) {
            alert("Vui lòng nhập Record GUID!");
            return;
        }

        setLoading(true);
        setError(null);
        setTracedStep(null);

        try {
            // Query InstanceWorkflow matching the RecordGuid
            const response = await fetch(`${API_BASE_URL}/api/InstanceWorkflow/GetAll?refField=RecordGuid&refKey=${propGuid}`);
            if (!response.ok) {
                throw new Error(`Instance API returned status ${response.status}`);
            }

            const dataList = await response.json();
            if (!Array.isArray(dataList) || dataList.length === 0) {
                alert("Không tìm thấy dòng dữ liệu nào cho Record GUID này! ❌");
                return;
            }

            // Get the first matching record
            const record = dataList[0];
            const currentStep = record.currentStep || record.CurrentStep;

            if (!currentStep) {
                alert("Dòng dữ liệu tìm thấy nhưng không có thông tin CurrentStep! ⚠️");
                return;
            }

            // Highlight the node matching currentStep using data.isTraced flag
            setTracedStep(currentStep);
            setSelectedNode(null);
            setSelectedEdge(null);

            setNodes((currentNodes) =>
                currentNodes.map((n) => ({
                    ...n,
                    data: {
                        ...n.data,
                        isTraced: n.id === currentStep
                    }
                }))
            );

            // Let's find if the node exists on our canvas
            const nodeExists = nodes.find(n => n.id === currentStep);
            if (nodeExists) {
                setSelectedNode(nodeExists);
                // alert(`Tìm thấy tiến trình đang chạy tại bước: ${nodeExists.data?.label || currentStep} (Đã highlight) 🎯`);
            } else {
                // alert(`Tìm thấy CurrentStep: ${currentStep}, nhưng bước này chưa được vẽ trên sơ đồ hiện tại! ⚠️`);
            }

        } catch (err) {
            console.error("Trace error:", err);
            alert(`Lỗi tra cứu Instance: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [searchRecordGuid, nodes, setNodes]);


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

    

    const endPaletteDrag = useCallback(() => {
        setIsPaletteDragging(false);
    }, []);

    

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const getDropPosition = useCallback(
        (event) => {
            const screenPosition = {
                x: event.clientX,
                y: event.clientY,
            };

            if (reactFlowInstance?.screenToFlowPosition) {
                return reactFlowInstance.screenToFlowPosition(screenPosition);
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            const panePosition = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            };

            if (reactFlowInstance?.project) {
                return reactFlowInstance.project(panePosition);
            }

            return panePosition;
        },
        [reactFlowInstance],
    );

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();
            endPaletteDrag();
            if (!reactFlowInstance) return;

            const position = getDropPosition(event);
            const plainData = event.dataTransfer.getData('text/plain');

            const laneDataStr =
                event.dataTransfer.getData('application/reactflow-lane') ||
                (plainData.startsWith('lane:') ? plainData.slice(5) : '');
            const type =
                event.dataTransfer.getData('application/reactflow') ||
                (!laneDataStr ? plainData : '');

            let newNode = null;

            if (type) {
                const template = nodeTemplates.find((item) => item.type === type) || nodeTemplates[0];
                const id = generateUniqueNodeId(nodes, 'NODE');
                
                let shape = 'rectangle';
                let styleColor = 'blue';
                if (template.type === 'start') {
                    shape = 'circle';
                    styleColor = 'green';
                } else if (template.type === 'end') {
                    shape = 'circle';
                    styleColor = 'red';
                } else if (template.type === 'custom') {
                    shape = 'diamond';
                    styleColor = 'orange';
                }

                newNode = {
                    id,
                    type: 'workflowNode',
                    position,
                    data: {
                        label: template.label,
                        subtitle: template.subtitle,
                        nodeType: template.nodeType,
                        departmentName: '',
                        description: template.description,
                        manualPositioned: true,
                        laneId: '',
                        shape: shape,
                        styleColor: styleColor,
                        code: id,
                        flowType: 'Both',
                        stepRole: '',
                        levelNo: 1,
                        allowLoop: false,
                        loopGroup: '',
                    },
                    style: createNodeStyle({ nodeType: template.nodeType, styleColor: styleColor }),
                };
            } else if (laneDataStr) {
                try {
                    const lane = JSON.parse(laneDataStr);
                    const id = generateUniqueNodeId(nodes, 'NODE');
                    newNode = {
                        id,
                        type: 'workflowNode',
                        position,
                        data: {
                            label: lane.label || lane.id,
                            subtitle: 'Department Step',
                            nodeType: 'department',
                            departmentName: lane.label || lane.id,
                            description: `Step for department ${lane.label}`,
                            manualPositioned: true,
                            laneId: lane.id,
                            shape: 'rectangle',
                            styleColor: 'green',
                            code: id,
                            flowType: 'Both',
                            stepRole: '',
                            levelNo: 1,
                            allowLoop: false,
                            loopGroup: '',
                        },
                        style: createNodeStyle({ nodeType: 'department', styleColor: 'green' }),
                    };
                } catch (e) {
                    console.error("Failed to parse dragged lane data", e);
                }
            }

            if (!newNode) return;

            setNodes((currentNodes) => layoutNodes([...currentNodes, newNode], edges));
            setSelectedNode(newNode);
            setSelectedEdge(null);
            focusNode(newNode.id);
        },
        [edges, endPaletteDrag, focusNode, getDropPosition, nodes, reactFlowInstance, setNodes],
    );

    return (
            <div className="">
                <Diagram
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    selectedEdge={selectedEdge}
                    setSelectedEdge={setSelectedEdge}
                    setReactFlowInstance={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
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
                    loading={loading}
                />
            </div>
    );
}

export default Flow;
