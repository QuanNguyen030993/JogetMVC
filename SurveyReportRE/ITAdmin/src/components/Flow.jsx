import { useCallback, useEffect, useMemo, useState } from 'react';
import appsettings from '../../../host.json';
import {
    useEdgesState,
    useNodesState,
    MarkerType,
} from '@xyflow/react';
import Diagram, { createNodeStyle } from './Diagram';
import '@xyflow/react/dist/style.css';
import CustomGrid from '../../../TMIVCom/src/components/CustomGrid';
import { notify } from '../../../TMIVCom/src/components/Notification';



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
    { icon: 'person-running', value: 'person-running', label: 'person-running' },
    { icon: 'user', value: 'user', label: 'user' },
    { icon: 'lock', value: 'lock', label: 'lock' },
    { icon: 'menu', value: 'menu', label: 'menu' },
    { icon: 'chevronleft', value: 'chevronleft', label: 'chevronleft' },
    { icon: 'chevronright', value: 'chevronright', label: 'chevronright' },
    { icon: 'chevronup', value: 'chevronup', label: 'chevronup' },
    { icon: 'chevrondown', value: 'chevrondown', label: 'chevrondown' },
];

const getUiConditionGroupNames = (rule = {}) => {
    if (Array.isArray(rule.groupNames)) {
        return rule.groupNames.map((name) => String(name).trim()).filter(Boolean);
    }

    if (Array.isArray(rule.targets)) {
        return rule.targets
            .filter((target) => !target?.itemType || target.itemType === 'group')
            .map((target) => String(target?.name || '').trim())
            .filter(Boolean);
    }

    const legacyName = String(rule.groupName || rule.sectionId || '').trim();
    return legacyName ? [legacyName] : [];
};

const normalizeScreenConditionRule = (rule = {}, index = 0) => {
    const groupNames = getUiConditionGroupNames(rule);
    return {
        ...rule,
        id: rule.id || `ui-lock-${Date.now()}-${index}`,
        type: rule.type || 'uiLock',
        trigger: rule.trigger || 'sameDepartmentReturn',
        department: rule.department || '',
        targetItemType: 'group',
        groupNames,
        targets: groupNames.map((name) => ({ itemType: 'group', name })),
        mode: rule.mode || 'ReadOnly',
    };
};

const parseUiLockRules = (conditionJson, storedRules = []) => {
    if (Array.isArray(storedRules) && storedRules.length) {
        return storedRules.map(normalizeScreenConditionRule);
    }

    try {
        const parsed = typeof conditionJson === 'string' ? JSON.parse(conditionJson) : conditionJson;
        if (parsed?.type === 'uiLock') return [normalizeScreenConditionRule(parsed)];
        if (parsed?.type === 'uiLockGroup') {
            return (parsed.children || []).map(normalizeScreenConditionRule);
        }
    } catch (e) {
        // Keep malformed/manual JSON available in the raw editor.
    }
    return [];
};

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
        let parsedNodeData = {};
        if (Array.isArray(node.screenConditions)) {
            parsedScreenConditions = node.screenConditions;
        }
        if (node.data) {
            try {
                const parsed = typeof node.data === 'string' ? JSON.parse(node.data) : node.data;
                parsedNodeData = parsed || {};
                if (!parsedScreenConditions.length && Array.isArray(parsed.screenConditions)) {
                    parsedScreenConditions = parsed.screenConditions;
                } else if (!parsedScreenConditions.length && parsed.rawNode && Array.isArray(parsed.rawNode.screenConditions)) {
                    parsedScreenConditions = parsed.rawNode.screenConditions;
                }
            } catch (e) {}
        }
        const rawNodeData = parsedNodeData.rawNode || {};
        const jumpStepNo = node.jumpStepNo ?? parsedNodeData.jumpStepNo ?? rawNodeData.jumpStepNo ?? '';
        const jumpCondition = node.jumpCondition ?? parsedNodeData.jumpCondition ?? rawNodeData.jumpCondition ?? '';
        const jumpTargetNodeId = node.jumpTargetNodeId ?? parsedNodeData.jumpTargetNodeId ?? rawNodeData.jumpTargetNodeId ?? '';
        const jumpDefinitionsSource = node.jumpDefinitions ?? parsedNodeData.jumpDefinitions ?? rawNodeData.jumpDefinitions ?? [];
        const jumpDefinitions = Array.isArray(jumpDefinitionsSource)
            ? jumpDefinitionsSource.map((definition, definitionIndex) => ({
                id: definition.id || `jump-definition-${index}-${definitionIndex}`,
                conditionName: definition.conditionName || definition.name || '',
                transitionId: definition.transitionId || definition.jumpTransitionId || ''
            }))
            : [];

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
                jumpEnabled: node.jumpEnabled === true || parsedNodeData.jumpEnabled === true || rawNodeData.jumpEnabled === true || Boolean(jumpStepNo || jumpCondition),
                jumpStepNo,
                jumpCondition,
                jumpTargetNodeId,
                jumpDefinitions,
                screenConditions: parsedScreenConditions.map(normalizeScreenConditionRule),
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
        const legacyExitTransition = transition.isExitTransition === true || String(transition.isExitTransition).toLowerCase() === 'true';
        const transitionType = legacyExitTransition
            ? 'Exit'
            : (transition.transitionType || transition.flowType || 'Normal');
        const isJump = String(transitionType).toLowerCase() === 'jump';
        const isExit = String(transitionType).toLowerCase() === 'exit';
        const hasCommand = transition.command && transition.command !== 'None' && transition.command !== '0';
        
        let conditionJsonStr = '{}';
        if (transition.conditionJson) {
            conditionJsonStr = typeof transition.conditionJson === 'string' 
                ? transition.conditionJson 
                : JSON.stringify(transition.conditionJson, null, 2);
        }
        const uiLockRules = parseUiLockRules(
            transition.conditionJson,
            transition.uiLockRules || transition.conditionRulesState?.uiLockRules
        );
        const conditionBuilderType = transition.conditionBuilderType
            || transition.conditionRulesState?.builderType
            || (uiLockRules.length ? 'uiLock' : 'operator');
        return {
            id: String(transition.id || `edge-${transition.fromNodeId || transition.from || 'from'}-${transition.toNodeId || transition.to || 'to'}-${index}`),
            source: String(transition.fromNodeId || transition.from || ''),
            target: String(transition.toNodeId || transition.to || ''),
            sourceHandle: transition.sourceHandle || null,
            targetHandle: transition.targetHandle || null,
            animated: !hasCommand,
            type: 'custom',
            label: formatTransitionLabel(transition.actionName || transition.actionCode, transition.statusName || transition.statusId, transition.command),
            style: isJump
                ? { stroke: '#7c3aed', strokeWidth: 3, strokeDasharray: '8 5' }
                : (isExit || isReturn)
                ? { stroke: '#dc2626', strokeWidth: 3 }
                : { stroke: '#2563eb', strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: isJump ? '#7c3aed' : ((isExit || isReturn) ? '#dc2626' : '#2563eb'),
            },
            data: {
                actionName: transition.actionName || '',
                actionCode: transition.actionCode || '',
                stepNo: transition.stepNo || '',
                legacyJumpStepNo: transition.jumpStepNo || '',
                transitionType,
                conditionJson: conditionJsonStr,
                conditionRulesState: transition.conditionRulesState || parseJsonToRulesState(transition.conditionJson),
                conditionBuilderType,
                uiLockRules,
                isExitTransition: isExit,
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
                        return parsed.mailTemplateId || "";
                    } catch (e) { return ''; }
                })(),
                notificationTemplateId: transition.notificationTemplateId || (() => {
                    try {
                        const parsed = typeof transition.data === 'string' ? JSON.parse(transition.data) : (transition.data || {});
                        return parsed.notificationTemplateId || "";
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
                labelOffsetX: Number.isFinite(transition.labelOffsetX) ? transition.labelOffsetX * scaleX : 0,
                labelOffsetY: Number.isFinite(transition.labelOffsetY) ? transition.labelOffsetY * scaleY : 0,
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

const normalizeNodeCode = (value, fallback = 'NODE') => {
    const rawValue = String(value || fallback).trim();
    const normalized = rawValue.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return normalized || fallback;
};

const generateUniqueNodeId = (nodes = [], baseName = 'NODE') => {
    const base = normalizeNodeCode(baseName, 'NODE');
    const existing = new Set(nodes.map((node) => String(node.id)));
    let candidate = `${base}_${Date.now()}`;

    while (existing.has(candidate)) {
        candidate = `${base}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    return candidate;
};

const getMiniMapNodeColor = (node) => {
    const styleColor = (node.data?.styleColor || '').toLowerCase();
    const nodeType = (node.data?.nodeType || '').toLowerCase();

    if (styleColor === 'red' || nodeType === 'end') return '#ef4444';
    if (styleColor === 'green' || nodeType === 'start' || nodeType === 'department') return '#10b981';
    if (styleColor === 'orange' || nodeType === 'custom' || nodeType === 'decision') return '#f97316';
    if (styleColor === 'lightorange') return '#f59e0b';
    if (styleColor === 'blue') return '#0284c7';
    if (nodeType === 'review') return '#8b5cf6';
    return '#64748b';
};

function Flow({ id: propId }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [workflowId, setWorkflowId] = useState(propId || '');
    const [workflowGuid, setWorkflowGuid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchRecordGuid, setSearchRecordGuid] = useState('');
    const [tracedStep, setTracedStep] = useState(null);
    const [mailTemplates, setMailTemplates] = useState([]);
    const [notificationsList, setNotificationsList] = useState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [statusList, setStatusList] = useState([]);
    const [layoutConfig, setLayoutConfig] = useState(null);
    const [workflowDefinition, setWorkflowDefinition] = useState(null);
    const [lanesList, setLanesList] = useState([]);
    const [activeStatsTab, setActiveStatsTab] = useState('nodes');
    const [isPaletteDragging, setIsPaletteDragging] = useState(false);
    const [draggedLaneIndex, setDraggedLaneIndex] = useState(null);

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

    const nodeColumns = useMemo(() => [
        { dataField: 'id', caption: 'ID', width: 80 },
        { dataField: 'label', caption: 'Node Name', width: 150 },
        { dataField: 'nodeType', caption: 'Type', width: 100 },
        { dataField: 'flowType', caption: 'Flow Type', width: 110 },
        { dataField: 'laneId', caption: 'Lane (Phân làn)', width: 120 },
        { dataField: 'shape', caption: 'Shape', width: 100 },
        { dataField: 'styleColor', caption: 'Style Color', width: 100 },
        { dataField: 'allowLoop', caption: 'Allow Loop', width: 100 },
        { dataField: 'loopGroup', caption: 'Loop Group', width: 110 },
        { dataField: 'code', caption: 'Code', width: 100 },
        { dataField: 'stepRole', caption: 'Step Role', width: 100 },
        { dataField: 'departmentName', caption: 'Department', width: 130 },
        { dataField: 'levelNo', caption: 'Level No', width: 90 },
        { dataField: 'jumpTransitions', caption: 'Condition → Jump ID', width: 220 },
        { dataField: 'position', caption: 'Position (X, Y)', width: 120 }
    ], []);

    const transitionColumns = useMemo(() => [
        { dataField: 'source', caption: 'From Node', width: 110 },
        { dataField: 'target', caption: 'To Node', width: 110 },
        { dataField: 'actionName', caption: 'Action Name', width: 140 },
        { dataField: 'actionCode', caption: 'Action Code', width: 120 },
        { dataField: 'stepNo', caption: 'Step No', width: 90 },
        { dataField: 'transitionType', caption: 'Flow Type', width: 110 },
        { dataField: 'isReturn', caption: 'Is Return', width: 90 },
        { dataField: 'isLoop', caption: 'Is Loop', width: 90 },
        { dataField: 'loopGroup', caption: 'Loop Group', width: 110 },
        { dataField: 'loopExitMode', caption: 'Loop Exit Mode', width: 130 },
        { dataField: 'maxLoopCount', caption: 'Max Loop Count', width: 120 },
        { dataField: 'userDecisionLabel', caption: 'User Decision Label', width: 150 },
        { dataField: 'statusName', caption: 'Status', width: 130 },
        { dataField: 'icon', caption: 'Icon', width: 100 },
        { dataField: 'buttonClass', caption: 'Button Class', width: 130 },
        { dataField: 'command', caption: 'System Command', width: 130 },
        { dataField: 'conditionJson', caption: 'Condition JSON', width: 180 }
    ], []);

    const flatNodes = useMemo(() => {
        return nodes.map(node => {
            const scaleX = layoutConfig?.SCALE_X || 1.0;
            const scaleY = layoutConfig?.SCALE_Y || 1.0;
            const origX = Math.round(node.position.x / scaleX);
            const origY = Math.round(node.position.y / scaleY);
            return {
                id: node.id,
                label: node.data?.label || '',
                nodeType: node.data?.nodeType || 'task',
                flowType: node.data?.flowType || '',
                laneId: node.data?.laneId || '',
                shape: node.data?.shape || 'rectangle',
                styleColor: node.data?.styleColor || 'blue',
                allowLoop: node.data?.allowLoop ? 'Yes' : 'No',
                loopGroup: node.data?.loopGroup || '',
                code: node.data?.code || '',
                stepRole: node.data?.stepRole || '',
                departmentName: node.data?.departmentName || '',
                levelNo: node.data?.levelNo || '',
                jumpTransitions: (node.data?.jumpDefinitions || [])
                    .map((definition) => `${definition.conditionName || '?'} → ${definition.transitionId || '?'}`)
                    .join(' | '),
                posX: origX,
                posY: origY,
                position: `${origX}, ${origY}`
            };
        });
    }, [nodes, layoutConfig]);

    const flatTransitions = useMemo(() => {
        return edges.map(edge => {
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                actionName: edge.data?.actionName || '',
                actionCode: edge.data?.actionCode || '',
                stepNo: edge.data?.stepNo || '',
                transitionType: edge.data?.transitionType || 'Normal',
                isReturn: edge.data?.isReturn ? 'Yes' : 'No',
                isLoop: edge.data?.isLoop ? 'Yes' : 'No',
                loopGroup: edge.data?.loopGroup || '',
                loopExitMode: edge.data?.loopExitMode || 'None',
                maxLoopCount: edge.data?.maxLoopCount || '',
                userDecisionLabel: edge.data?.userDecisionLabel || '',
                statusId: edge.data?.statusId || '',
                statusName: edge.data?.statusName || '',
                icon: edge.data?.icon || '',
                buttonClass: edge.data?.buttonClass || '',
                command: edge.data?.command || 'None',
                conditionJson: edge.data?.conditionJson || '{}'
            };
        });
    }, [edges]);

    useEffect(() => {
        fetch(`${appsettings.UrlConfig.Host}/api/EnumData/FetchEnum/OverallStatus`)
            .then(r => r.json())
            .then(data => setStatusList(data || []))
            .catch(err => console.error("Failed to load OverallStatus enums:", err));
    }, []);

    useEffect(() => {
        if (statusList.length > 0 && edges.length > 0) {
            setEdges(currentEdges =>
                currentEdges.map(edge => {
                    const statusObj = statusList.find(s => String(s.id) === String(edge.data?.statusId));
                    const statusText = statusObj ? statusObj.value : edge.data?.statusName || edge.data?.statusId;
                    return {
                        ...edge,
                        label: formatTransitionLabel(edge.data?.actionName, statusText, edge.data?.command),
                        data: {
                            ...edge.data,
                            statusName: edge.data?.statusName || (statusObj ? statusObj.value : '')
                        }
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
                    transitionType: 'Normal',
                    conditionJson: '{}',
                    conditionRulesState: { rootOperator: 'AND', rules: [] },
                    conditionBuilderType: 'operator',
                    uiLockRules: [],
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
                const response = await fetch(`${appsettings.UrlConfig.Host}/api/WorkflowDefinition/GetSingle/${workflowDefinitionId}`);
                if (!response.ok) {
                    throw new Error(`API error ${response.status}`);
                }

                const data = await response.json();
                setWorkflowGuid(data.guid || data.Guid || '');
                const parsedPayload = typeof data.workflowNodes === 'string' ? JSON.parse(data.workflowNodes) : data.workflowNodes || {};
                console.log(parsedPayload);
                const scaleX = parsedPayload._layoutConfig?.SCALE_X || 1.0;
                const scaleY = parsedPayload._layoutConfig?.SCALE_Y || 1.0;
                setLayoutConfig(parsedPayload._layoutConfig || null);
                setWorkflowDefinition(parsedPayload.workflowDefinition || null);
                setLanesList(parsedPayload.lanes || []);

                const mappedNodes = Array.isArray(parsedPayload.workflowNodes)
                    ? mapWorkflowNodes(parsedPayload.workflowNodes, scaleX, scaleY)
                    : [];
                const mappedEdges = Array.isArray(parsedPayload.workflowTransitions)
                    ? mapWorkflowEdges(parsedPayload.workflowTransitions, scaleX, scaleY)
                    : [];
                // One-time compatibility migration: old JumpStepNo edges become stable Jump transition IDs.
                const nextEdges = mappedEdges.map((edge) => {
                    if (!edge.data?.legacyJumpStepNo || edge.data?.transitionType === 'Jump') return edge;
                    return {
                        ...edge,
                        style: { stroke: '#7c3aed', strokeWidth: 3, strokeDasharray: '8 5' },
                        markerEnd: { ...edge.markerEnd, color: '#7c3aed' },
                        data: { ...edge.data, transitionType: 'Jump' }
                    };
                });
                const nextNodes = mappedNodes.map((node) => {
                    const legacyJumpEdge = nextEdges.find((edge) => edge.source === node.id && edge.data?.legacyJumpStepNo);
                    const firstJumpEdge = nextEdges.find((edge) => edge.source === node.id && edge.data?.transitionType === 'Jump');
                    if (!legacyJumpEdge && !firstJumpEdge) return node;
                    const jumpDefinitions = node.data?.jumpDefinitions?.length
                        ? node.data.jumpDefinitions
                        : (node.data?.jumpCondition && firstJumpEdge
                            ? [{ id: `jump-definition-${node.id}`, conditionName: node.data.jumpCondition, transitionId: firstJumpEdge.id }]
                            : []);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            jumpEnabled: true,
                            jumpStepNo: node.data?.jumpStepNo || legacyJumpEdge?.data?.legacyJumpStepNo || '',
                            jumpDefinitions
                        }
                    };
                });

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

            // Sort nodes physically (Left-to-Right, then Top-to-Bottom)
            const sortedNodesList = [...nodes].sort((a, b) => {
                if (Math.round(a.position.x) !== Math.round(b.position.x)) {
                    return a.position.x - b.position.x;
                }
                return a.position.y - b.position.y;
            });

            // Re-map nodes to database structure in sorted order
            const workflowNodes = sortedNodesList.map((node, index) => {
                const originalX = Math.round(node.position.x / scaleX);
                const originalY = Math.round(node.position.y / scaleY);
                const nodeCode = node.data.code || node.id;
                return {
                    id: node.id,
                    laneId: node.data.laneId || '',
                    nodeName: node.data.label,
                    nodeType: node.data.nodeType || 'task',
                    nodeCode,
                    code: nodeCode,
                    flowType: node.data.flowType || 'Both',
                    stepRole: node.data.stepRole || '',
                    levelNo: node.data.levelNo || '',
                    allowLoop: !!node.data.allowLoop,
                    loopGroup: node.data.loopGroup || '',
                    jumpEnabled: !!node.data.jumpEnabled,
                    jumpDefinitions: node.data.jumpDefinitions || [],
                    shape: node.data.shape || 'rectangle',
                    styleColor: node.data.styleColor || 'blue',
                    posX: originalX,
                    posY: originalY,
                    x: originalX,
                    y: originalY,
                    assignLabel: node.data.assignLabel || '',
                    orderLabel: node.data.orderLabel || '',
                    departmentName: node.data.departmentName || '',
                    description: node.data.description || '',
                    sortOrder: index + 1,
                    orderNo: index + 1,
                    screenConditions: node.data.screenConditions || [],
                    custom: node.data.custom || ''
                };
            });

            // Sort edges based on the sorted order of their source nodes
            const sortedEdgesList = [...edges].sort((a, b) => {
                const indexA = sortedNodesList.findIndex((n) => n.id === a.source);
                const indexB = sortedNodesList.findIndex((n) => n.id === b.source);
                return indexA - indexB;
            });
   
            // Re-map edges to database structure in sorted order
            const workflowTransitions = sortedEdgesList.map((edge, index) => {
                let parsedCondition = edge.data?.conditionJson || '{}';
                console.log(edge);
                if (typeof parsedCondition === 'string') {
                    try {
                        parsedCondition = JSON.parse(parsedCondition);
                    } catch (e) {
                        console.warn("Invalid condition JSON, saving as string");
                    }
                }

                return {
                    id: edge.id,
                    fromNodeId: edge.source,
                    toNodeId: edge.target,
                    sourceHandle: edge.sourceHandle || null,
                    targetHandle: edge.targetHandle || null,
                    actionName: edge.data?.actionName || edge.label || 'Transition',
                    actionCode: edge.data?.actionCode || '',
                    stepNo: parseInt(edge.data?.stepNo) || null,
                    transitionType: edge.data?.transitionType || 'Normal',
                    conditionJson: parsedCondition,
                    conditionBuilderType: edge.data?.conditionBuilderType || 'operator',
                    uiLockRules: edge.data?.uiLockRules || [],
                    conditionRulesState: {
                        ...(edge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] }),
                        builderType: edge.data?.conditionBuilderType || 'operator',
                        uiLockRules: edge.data?.uiLockRules || []
                    },
                    isExitTransition: edge.data?.transitionType === 'Exit',
                    isReturn: edge.data?.isReturn === true,
                    statusId: edge.data?.statusId || '',
                    statusName: edge.data?.statusName || '',
                    icon: edge.data?.icon || '',
                    buttonClass: edge.data?.buttonClass || '',
                    command: edge.data?.command || 'None',
                    commandConfig: edge.data?.commandConfig || '',
                    mailTemplateId: edge.data?.mailTemplateId || null,
                    notificationTemplateId: edge.data?.notificationTemplateId || null,
                    data: {
                        transitionScript: normalizeTransitionScript(edge.data?.transitionScript),
                        icon: edge.data?.icon || '',
                        buttonClass: edge.data?.buttonClass || '',
                        mailTemplateId: edge.data?.mailTemplateId || null,
                        notificationTemplateId: edge.data?.notificationTemplateId || null,
                        custom: edge.data?.custom || ''
                    },
                    controlX: Number.isFinite(edge.data?.controlX) ? Math.round(edge.data.controlX / scaleX) : null,
                    controlY: Number.isFinite(edge.data?.controlY) ? Math.round(edge.data.controlY / scaleY) : null,
                    labelOffsetX: Number.isFinite(edge.data?.labelOffsetX) ? Math.round(edge.data.labelOffsetX / scaleX) : null,
                    labelOffsetY: Number.isFinite(edge.data?.labelOffsetY) ? Math.round(edge.data.labelOffsetY / scaleY) : null,
                    sortOrder: index + 1
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

            const response = await fetch(`${appsettings.UrlConfig.Host}/api/WorkflowDefinition/UpdateData`, {
                method: "PUT",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error ${response.status}`);
            }

            notify("Lưu quy trình thành công! ✅", "success");
        } catch (saveError) {
            setError(saveError.message || 'Failed to save workflow data');
            notify("Lưu quy trình thất bại! ❌", "error");
        } finally {
            setLoading(false);
        }
    }, [workflowId, nodes, edges, layoutConfig, workflowDefinition, lanesList]);

    const buildWorkflow = useCallback(async () => {
        const workflowDefinitionId = workflowGuid || workflowId;
        if (!workflowDefinitionId) {
            setError('Please load or enter a workflow id first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const scaleX = layoutConfig?.SCALE_X || 1.0;
            const scaleY = layoutConfig?.SCALE_Y || 1.0;

            // Sort nodes physically (Left-to-Right, then Top-to-Bottom)
            const sortedNodesList = [...nodes].sort((a, b) => {
                if (Math.round(a.position.x) !== Math.round(b.position.x)) {
                    return a.position.x - b.position.x;
                }
                return a.position.y - b.position.y;
            });

            // 1. Build Nodes list in sorted order
            const nodesPayload = sortedNodesList.map((node, index) => {
                const origX = Math.round(node.position.x / scaleX);
                const origY = Math.round(node.position.y / scaleY);
                const incomingEdge = edges.find((e) => e.target === node.id);
                const parentNodeId = incomingEdge ? incomingEdge.source : null;

                return {
                    workflowDefinitionId: workflowDefinitionId,
                    nodeId: node.id,
                    parentNodeId: parentNodeId,
                    nodeName: node.data?.label || "",
                    nodeType: node.data?.nodeType || "",
                    nodeStatus: node.data?.flowType || "Both",
                    allowLoop: node.data?.allowLoop === true || node.data?.allowLoop === 'Yes',
                    loopGroup: node.data?.loopGroup || null,
                    nodeCode: node.data?.code || node.id,
                    stepRole: node.data?.stepRole || null,
                    departmentCode: node.data?.departmentName || null,
                    levelNo: node.data?.levelNo ? parseInt(node.data.levelNo) : null,
                    posX: origX,
                    posY: origY,
                    sortOrder: index + 1,
                    isActive: true,
                    data: JSON.stringify({
                        rawNode: {
                            id: node.id,
                            text: node.data?.label || "",
                            type: node.data?.nodeType || "",
                            flowType: node.data?.flowType || "Both",
                            allowLoop: node.data?.allowLoop,
                            loopGroup: node.data?.loopGroup,
                            code: node.data?.code,
                            stepRole: node.data?.stepRole,
                            departmentName: node.data?.departmentName,
                            levelNo: node.data?.levelNo,
                            jumpEnabled: !!node.data?.jumpEnabled,
                            jumpDefinitions: node.data?.jumpDefinitions || [],
                            x: origX,
                            y: origY,
                            screenConditions: node.data?.screenConditions || []
                        },
                        screenConditions: node.data?.screenConditions || [],
                        jumpEnabled: !!node.data?.jumpEnabled,
                        jumpDefinitions: node.data?.jumpDefinitions || [],
                        jumpTransitionMap: Object.fromEntries(
                            (node.data?.jumpDefinitions || [])
                                .filter((definition) => definition.conditionName && definition.transitionId)
                                .map((definition) => [definition.conditionName, definition.transitionId])
                        ),
                        jump: node.data?.jumpEnabled ? {
                            definitions: node.data?.jumpDefinitions || [],
                            transitionMap: Object.fromEntries(
                                (node.data?.jumpDefinitions || [])
                                    .filter((definition) => definition.conditionName && definition.transitionId)
                                    .map((definition) => [definition.conditionName, definition.transitionId])
                            )
                        } : null,
                        condition: (() => {
                            const conditionObj = {};
                            (node.data?.screenConditions || []).forEach(rule => {
                                getUiConditionGroupNames(rule).forEach((groupName) => {
                                    conditionObj[groupName] = rule.mode || 'ReadOnly';
                                });
                            });
                            return conditionObj;
                        })(),
                        nodetype: node.data?.nodeType || "task"
                    })
                };
            });

            // 2. Build Steps list
            const nodeMap = {};
            nodes.forEach(n => {
                nodeMap[n.id] = n;
            });

            // Sort edges based on the sorted order of their source nodes
            const sortedEdgesList = [...edges].sort((a, b) => {
                const indexA = sortedNodesList.findIndex((n) => n.id === a.source);
                const indexB = sortedNodesList.findIndex((n) => n.id === b.source);
                return indexA - indexB;
            });

            const stepsPayload = sortedEdgesList.map((edge, index) => {
                const fromNode = nodeMap[edge.source] || {};
                const toNode = edge.target ? (nodeMap[edge.target] || {}) : null;
                const incomingEdgesCount = edges.filter((e) => e.target === fromNode.id).length;
                const isStart = fromNode.data?.nodeType === 'start' || incomingEdgesCount === 0;
                const isEnd = edge.data?.transitionType === 'Exit' || !edge.target;
                const isReturn = edge.data?.isReturn === true || false; 

                let uiMode = "Start";
                const actionCode = edge.data?.actionCode || "";
                if (actionCode.startsWith("SUBMIT")) uiMode = "Forward";
                else if (actionCode.startsWith("RETURN")) uiMode = "Withdraw";
                else if (actionCode.startsWith("COMPLETE")) uiMode = "Finish";

                let stepType = 2; // Normal
                if (isEnd) stepType = 9; // End
                else if (edge.data?.isLoop === true || edge.data?.isLoop === 'Yes') stepType = 3; // Loop
                else if (edge.data?.transitionType === 'Jump') stepType = 4; // Conditional jump / bypass

                let conditionData = {};
                if (edge.data?.conditionJson) {
                    try {
                        conditionData = typeof edge.data.conditionJson === 'string'
                            ? JSON.parse(edge.data.conditionJson)
                            : edge.data.conditionJson;
                    } catch (e) {
                        console.warn("Could not parse condition JSON for step data", e);
                    }
                }
                const stepData = {
                    ...conditionData,
                    transitionScript: normalizeTransitionScript(edge.data?.transitionScript) || null,
                    icon: edge.data?.icon || null,
                    buttonClass: edge.data?.buttonClass || null,
                    mailTemplateId: edge.data?.mailTemplateId || null,
                    notificationTemplateId: edge.data?.notificationTemplateId || null,
                    custom: edge.data?.custom || null
                };
                if (edge.data?.transitionType === 'Jump' || fromNode.data?.jumpEnabled) {
                    const jumpDefinitions = fromNode.data?.jumpDefinitions || [];
                    stepData.nodeJump = {
                        enabled: !!fromNode.data?.jumpEnabled,
                        transitionId: edge.id,
                        targetNodeId: edge.target || null,
                        conditionNames: jumpDefinitions
                            .filter((definition) => definition.transitionId === edge.id)
                            .map((definition) => definition.conditionName)
                            .filter(Boolean),
                        transitionMap: Object.fromEntries(
                            jumpDefinitions
                                .filter((definition) => definition.conditionName && definition.transitionId)
                                .map((definition) => [definition.conditionName, definition.transitionId])
                        )
                    };
                }
                return {
                    sortOrder: index + 1,
                    stepNo: edge.data?.stepNo?.toString() || null,
                    jumpStepNo: null,
                    workflowDefinitionId: workflowDefinitionId,

                    stepType: stepType,
                    allowLoop: edge.data?.isLoop === true || edge.data?.isLoop === 'Yes',
                    canComment: true,
                    canEdit: !isEnd,
                    canUpload: !isEnd,
                    command: edge.data?.command || null,
                    commandConfig: edge.data?.commandConfig || null,
                    mailTemplateId: edge.data?.mailTemplateId ? parseInt(edge.data.mailTemplateId) : null,
                    notificationTemplateId: edge.data?.notificationTemplateId ? parseInt(edge.data.notificationTemplateId) : null,

                    departmentCode: fromNode.data?.departmentName || null,
                    displayStatus: edge.data?.actionName || null,
                    flowType: edge.data?.transitionType || "Both",
                    isActive: true,
                    isEnd: isEnd,
                    isStart: isStart,
                    isReturn : isReturn,
                    levelNo: fromNode.data?.levelNo ? parseInt(fromNode.data.levelNo) : null,
                    loopGroup: edge.data?.loopGroup || null,
                    parentStepId: null,
                    posX: fromNode.position ? Math.round(fromNode.position.x / scaleX) : null,
                    posY: fromNode.position ? Math.round(fromNode.position.y / scaleY) : null,
                    roleCode: fromNode.data?.code || fromNode.data?.label || fromNode.id,
                    stepCode: `${edge.source}_${actionCode}`,
                    stepName: `${fromNode.data?.label || edge.source} ${edge.data?.actionName || actionCode}`,
                    uiMode: uiMode,

                    actionCode: actionCode || null,
                    data: JSON.stringify(stepData),

                    fromNodeId: edge.source || null,
                    fnodeId: edge.source || null,
                    tnodeId: edge.target || null,
                    toNodeId: edge.target || null,
                    statusId: edge.data?.statusId || null
                };
            });

            // 3. Assemble & Post to BuildSteps API
            const buildPayload = {
                WorkflowDefinitionId: workflowDefinitionId,
                Nodes: nodesPayload,
                Steps: stepsPayload
            };

            const response = await fetch(`${appsettings.UrlConfig.Host}/api/StepsWorkflow/BuildSteps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(buildPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `API error ${response.status}`);
            }

            notify("Build Workflow thành công! 🚀 Quy trình đã được biên dịch để thực thi.", "success");
        } catch (err) {
            setError(err.message || 'Failed to build workflow steps');
            notify(`Build quy trình thất bại! ❌ Chi tiết: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    }, [workflowId, workflowGuid, nodes, edges, layoutConfig]);

    const traceInstanceWorkflow = useCallback(async () => {
        if (!searchRecordGuid) {
            notify("Vui lòng nhập Record GUID!", "warning");
            return;
        }

        setLoading(true);
        setError(null);
        setTracedStep(null);

        try {
            // Query InstanceWorkflow matching the RecordGuid
            const response = await fetch(`${appsettings.UrlConfig.Host}/api/InstanceWorkflow/GetAll?refField=RecordGuid&refKey=${searchRecordGuid}`);
            if (!response.ok) {
                throw new Error(`Instance API returned status ${response.status}`);
            }

            const dataList = await response.json();
            if (!Array.isArray(dataList) || dataList.length === 0) {
                notify("Không tìm thấy dòng dữ liệu nào cho Record GUID này! ❌", "error");
                return;
            }

            // Get the first matching record
            const record = dataList[0];
            const currentStep = record.currentStep || record.CurrentStep;

            if (!currentStep) {
                notify("Dòng dữ liệu tìm thấy nhưng không có thông tin CurrentStep! ⚠️", "warning");
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
                notify(`Tìm thấy tiến trình đang chạy tại bước: ${nodeExists.data?.label || currentStep} 🎯`, "success");
            } else {
                notify(`Tìm thấy CurrentStep: ${currentStep}, nhưng bước này chưa được vẽ trên sơ đồ hiện tại! ⚠️`, "warning");
            }

        } catch (err) {
            console.error("Trace error:", err);
            notify(`Lỗi tra cứu Instance: ${err.message}`, "error");
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

    useEffect(() => {
        // Load Mail Templates
        fetch(`${appsettings.UrlConfig.Host}/api/MailTemplate/GetAll`)
            .then((res) => {
                if (!res.ok) throw new Error('API status ' + res.status);
                return res.json();
            })
            .then((data) => 
            {
                
                console.log(data);
                setMailTemplates(data || []);})
            .catch((err) => console.error("Failed to load Mail Templates:", err));

        // Load Notification Templates
        fetch(`${appsettings.UrlConfig.Host}/api/NotificationTemplate/GetAll`)
            .then((res) => {
                if (!res.ok) throw new Error('API status ' + res.status);
                return res.json();
            })
            .then((data) => setNotificationsList(data || []))
            .catch((err) => console.error("Failed to load Notification Templates:", err));
    }, []);

    useEffect(() => {
        if (!isPaletteDragging) return undefined;

        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
        };
    }, [isPaletteDragging]);

    const endPaletteDrag = useCallback(() => {
        setIsPaletteDragging(false);
    }, []);

    const addNode = useCallback(() => {
        setNodes((currentNodes) => {
            const id = generateUniqueNodeId(currentNodes, 'NODE');
            const nextNode = {
                id,
                type: 'workflowNode',
                position: {
                    x: 140 + currentNodes.length * 120,
                    y: 90 + (currentNodes.length % 3) * 180,
                },
                data: {
                    label: `Step ${currentNodes.length + 1}`,
                    subtitle: 'New step',
                    nodeType: 'task',
                    departmentName: '',
                    description: '',
                    manualPositioned: false,
                    code: id,
                    flowType: 'Both',
                    stepRole: '',
                    levelNo: 1,
                    allowLoop: false,
                    loopGroup: '',
                    jumpEnabled: false,
                    jumpStepNo: '',
                    jumpCondition: '',
                    jumpTargetNodeId: '',
                    jumpDefinitions: [],
                },
                style: createNodeStyle({ nodeType: 'task' }),
            };

            window.requestAnimationFrame(() => {
                setSelectedNode(nextNode);
                setSelectedEdge(null);
                focusNode(nextNode.id);
            });

            return layoutNodes([...currentNodes, nextNode], edges);
        });
    }, [edges, focusNode, setNodes]);

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
                        jumpEnabled: false,
                        jumpStepNo: '',
                        jumpCondition: '',
                        jumpTargetNodeId: '',
                        jumpDefinitions: [],
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
                            jumpEnabled: false,
                            jumpStepNo: '',
                            jumpCondition: '',
                            jumpTargetNodeId: '',
                            jumpDefinitions: [],
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

    // const updateSelectedEdge = useCallback(
    //     (field, value) => {
    //         if (!selectedEdge) {
    //             return;
    //         }

    //         const matched = edges.find((e) => e.id === selectedEdge.id);
    //         const dataToUse = matched ? matched.data : selectedEdge.data;
    //         const nextData = {
    //             ...dataToUse,
    //             [field]: value,
    //         };
    //         const isReturn = nextData.isReturn === true || String(nextData.isReturn) === 'true';
    //         const hasCommand = nextData.command && nextData.command !== 'None' && nextData.command !== '0';

    //         const nextEdge = {
    //             ...(matched || selectedEdge),
    //             label: formatTransitionLabel(nextData.actionName, nextData.statusName || nextData.statusId, nextData.command),
    //             data: nextData,
    //             animated: !hasCommand,
    //             style: isReturn
    //                 ? { stroke: '#dc2626', strokeWidth: 3 }
    //                 : { stroke: '#2563eb', strokeWidth: 2 },
    //             markerEnd: {
    //                 type: MarkerType.ArrowClosed,
    //                 width: 16,
    //                 height: 16,
    //                 color: isReturn ? '#dc2626' : '#2563eb',
    //             },
    //         };

    //         setEdges((currentEdges) =>
    //             currentEdges.map((edge) => (edge.id === selectedEdge.id ? nextEdge : edge))
    //         );
    //         setSelectedEdge(nextEdge);
    //     },
    //     [selectedEdge, edges, setEdges],
    // );
const updateSelectedEdge = useCallback(
   (fieldOrValues, value) => {
       if (!selectedEdge) return;
       const values =
           typeof fieldOrValues === 'object'
               ? fieldOrValues
               : { [fieldOrValues]: value };
       let updatedEdge = null;
       setEdges((currentEdges) =>
           currentEdges.map((edge) => {
               if (edge.id !== selectedEdge.id) {
                   return edge;
               }
               const nextData = {
                   ...edge.data,
                   ...values,
               };
               const isReturn =
                   nextData.isReturn === true ||
                   String(nextData.isReturn) === 'true';
               const isJump = String(nextData.transitionType || '').toLowerCase() === 'jump';
               const isExit = String(nextData.transitionType || '').toLowerCase() === 'exit';
               const hasCommand =
                   nextData.command &&
                   nextData.command !== 'None' &&
                   nextData.command !== '0';
               updatedEdge = {
                   ...edge,
                   label: formatTransitionLabel(
                       nextData.actionName,
                       nextData.statusName || nextData.statusId,
                       nextData.command
                   ),
                   data: nextData,
                   animated: !hasCommand,
                   style: isJump
                       ? {
                             stroke: '#7c3aed',
                             strokeWidth: 3,
                             strokeDasharray: '8 5',
                         }
                       : (isExit || isReturn)
                       ? {
                             stroke: '#dc2626',
                             strokeWidth: 3,
                         }
                       : {
                             stroke: '#2563eb',
                             strokeWidth: 2,
                         },
                   markerEnd: {
                       type: MarkerType.ArrowClosed,
                       width: 16,
                       height: 16,
                       color: isJump ? '#7c3aed' : ((isExit || isReturn) ? '#dc2626' : '#2563eb'),
                   },
               };
               return updatedEdge;
           })
       );
       if (updatedEdge) {
           setSelectedEdge(updatedEdge);
       } else {
           setSelectedEdge((currentSelectedEdge) => {
               if (!currentSelectedEdge) return currentSelectedEdge;
               const nextData = {
                   ...currentSelectedEdge.data,
                   ...values,
               };
               return {
                   ...currentSelectedEdge,
                   data: nextData,
                   label: formatTransitionLabel(
                       nextData.actionName,
                       nextData.statusName || nextData.statusId,
                       nextData.command
                   ),
               };
           });
       }
   },
   [selectedEdge, setEdges]
);

    const [condSource, setCondSource] = useState('payload');
    const [condField, setCondField] = useState('totalPremiumTotal');
    const [condDataType, setCondDataType] = useState('number');
    const [condOperator, setCondOperator] = useState('>');
    const [condValue, setCondValue] = useState('0');
    const [condCustomHandler, setCondCustomHandler] = useState('');
    const [condCustomArgs, setCondCustomArgs] = useState('{\n  "folder": "FO"\n}');
    const [condRootOperator, setCondRootOperator] = useState('AND');
    const [uiLockTrigger, setUiLockTrigger] = useState('sameDepartmentReturn');
    const [uiLockDepartment, setUiLockDepartment] = useState('');
    const [uiLockGroupNames, setUiLockGroupNames] = useState('');
    const [uiLockMode, setUiLockMode] = useState('ReadOnly');

    useEffect(() => {
        if (selectedEdge) {
            setCondRootOperator(selectedEdge.data?.conditionRulesState?.rootOperator || 'AND');
            const sourceDepartment = nodes.find((node) => node.id === selectedEdge.source)?.data?.departmentName || '';
            const targetDepartment = nodes.find((node) => node.id === selectedEdge.target)?.data?.departmentName || '';
            setUiLockDepartment(targetDepartment || sourceDepartment);
        }
    }, [selectedEdge, nodes]);

    const parseConditionValueByType = useCallback((dataType, value) => {
        if (dataType === "number") {
            const n = Number(value);
            return isNaN(n) ? 0 : n;
        }
        if (dataType === "boolean") {
            return value === true || value === "true" || value === "1" || value === 1;
        }
        if (dataType === "array") {
            if (!value) return [];
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (err) {
                return String(value).split(",").map(x => x.trim()).filter(Boolean);
            }
        }
        return value ?? "";
    }, []);

    const mapBuilderRuleToJson = useCallback((rule) => {
        if (rule.source === "custom") {
            return {
                type: "rule",
                source: rule.source,
                handler: rule.customHandler || "",
                args: (() => {
                    try { return JSON.parse(rule.customArgs || '{}'); } catch (e) { return {}; }
                })(),
                operator: rule.operator || "=",
                value: parseConditionValueByType(rule.dataType, rule.value)
            };
        }
        return {
            type: rule.type || 'rule',
            source: rule.source || "payload",
            field: rule.field || "",
            dataType: rule.dataType || "string",
            operator: rule.operator || "=",
            value: parseConditionValueByType(rule.dataType, rule.value)
        };
    }, [parseConditionValueByType]);

    const buildConditionJson = useCallback((rulesState) => {
        const rules = rulesState?.rules || [];
        if (!rules.length) return "{}";
        if (rules.length === 1) {
            return JSON.stringify(mapBuilderRuleToJson(rules[0]), null, 2);
        }
        return JSON.stringify({
            type: "group",
            operator: rulesState.rootOperator || "AND",
            children: rules.map(mapBuilderRuleToJson)
        }, null, 2);
    }, [mapBuilderRuleToJson]);

    const buildUiLockConditionJson = useCallback((rules = []) => {
        if (!rules.length) return '{}';
        const toJsonRule = (rule) => ({
            type: 'uiLock',
            trigger: rule.trigger || 'sameDepartmentReturn',
            department: rule.department || '',
            targets: getUiConditionGroupNames(rule).map((name) => ({ itemType: 'group', name })),
            mode: rule.mode || 'ReadOnly',
            condition: rule.condition || ''
        });
        if (rules.length === 1) return JSON.stringify(toJsonRule(rules[0]), null, 2);
        return JSON.stringify({ type: 'uiLockGroup', children: rules.map(toJsonRule) }, null, 2);
    }, []);

    const changeConditionBuilderType = useCallback((builderType) => {
        if (!selectedEdge) return;
        const conditionRulesState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        const uiLockRules = selectedEdge.data?.uiLockRules || [];
        updateSelectedEdge({
            conditionBuilderType: builderType,
            conditionRulesState: { ...conditionRulesState, builderType, uiLockRules },
            conditionJson: builderType === 'uiLock'
                ? buildUiLockConditionJson(uiLockRules)
                : buildConditionJson(conditionRulesState)
        });
    }, [selectedEdge, buildConditionJson, buildUiLockConditionJson, updateSelectedEdge]);

    const addUiLockRule = useCallback(() => {
        if (!selectedEdge) return;
        const groupNames = uiLockGroupNames
            .split(/[\n,]/)
            .map((name) => name.trim())
            .filter(Boolean);
        if (!groupNames.length) {
            notify('Nhập ít nhất một dxForm group name.', 'warning');
            return;
        }
        const newRule = normalizeScreenConditionRule({
            id: `ui-lock-${Date.now()}`,
            type: 'uiLock',
            trigger: uiLockTrigger,
            department: uiLockDepartment,
            groupNames,
            targets: groupNames.map((name) => ({ itemType: 'group', name })),
            mode: uiLockMode
        });
        const nextRules = [...(selectedEdge.data?.uiLockRules || []), newRule];
        const conditionRulesState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        updateSelectedEdge({
            conditionBuilderType: 'uiLock',
            uiLockRules: nextRules,
            conditionRulesState: { ...conditionRulesState, builderType: 'uiLock', uiLockRules: nextRules },
            conditionJson: buildUiLockConditionJson(nextRules)
        });
        setUiLockGroupNames('');
    }, [selectedEdge, uiLockGroupNames, uiLockTrigger, uiLockDepartment, uiLockMode, buildUiLockConditionJson, updateSelectedEdge]);

    const removeUiLockRule = useCallback((ruleId) => {
        if (!selectedEdge) return;
        const nextRules = (selectedEdge.data?.uiLockRules || []).filter((rule) => rule.id !== ruleId);
        const conditionRulesState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        updateSelectedEdge({
            uiLockRules: nextRules,
            conditionRulesState: { ...conditionRulesState, builderType: 'uiLock', uiLockRules: nextRules },
            conditionJson: buildUiLockConditionJson(nextRules)
        });
    }, [selectedEdge, buildUiLockConditionJson, updateSelectedEdge]);

    const clearUiLockRules = useCallback(() => {
        if (!selectedEdge) return;
        const conditionRulesState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        updateSelectedEdge({
            uiLockRules: [],
            conditionRulesState: { ...conditionRulesState, builderType: 'uiLock', uiLockRules: [] },
            conditionJson: '{}'
        });
    }, [selectedEdge, updateSelectedEdge]);

    const addConditionRule = useCallback(() => {
        if (!selectedEdge) return;
        const newRule = {
            id: `rule-${Date.now()}`,
            source: condSource,
            field: condSource === 'custom' ? '' : condField,
            dataType: condDataType,
            operator: condOperator,
            value: condValue,
            customHandler: condSource === 'custom' ? condCustomHandler : '',
            customArgs: condSource === 'custom' ? condCustomArgs : ''
        };

        const currentState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        const nextRules = [...(currentState.rules || []), newRule];
        const nextState = {
            ...currentState,
            builderType: 'operator',
            rootOperator: condRootOperator,
            rules: nextRules
        };

        const nextJson = buildConditionJson(nextState);
        updateSelectedEdge({ conditionBuilderType: 'operator', conditionRulesState: nextState, conditionJson: nextJson });
    }, [selectedEdge, condSource, condField, condDataType, condOperator, condValue, condCustomHandler, condCustomArgs, condRootOperator, buildConditionJson, updateSelectedEdge]);

    const clearConditionRules = useCallback(() => {
        if (!selectedEdge) return;
        const nextState = {
            ...(selectedEdge.data?.conditionRulesState || {}),
            builderType: 'operator',
            rootOperator: 'AND',
            rules: []
        };
        updateSelectedEdge({ conditionBuilderType: 'operator', conditionRulesState: nextState, conditionJson: '{}' });
    }, [selectedEdge, updateSelectedEdge]);

    const changeRootOperator = useCallback((op) => {
        if (!selectedEdge) return;
        setCondRootOperator(op);
        const currentState = selectedEdge.data?.conditionRulesState || { rootOperator: op, rules: [] };
        const nextState = {
            ...currentState,
            builderType: 'operator',
            rootOperator: op
        };
        const nextJson = buildConditionJson(nextState);
        updateSelectedEdge({ conditionBuilderType: 'operator', conditionRulesState: nextState, conditionJson: nextJson });
    }, [selectedEdge, buildConditionJson, updateSelectedEdge]);

    const removeConditionRule = useCallback((ruleId) => {
        if (!selectedEdge) return;
        const currentState = selectedEdge.data?.conditionRulesState || { rootOperator: 'AND', rules: [] };
        const nextRules = (currentState.rules || []).filter(r => r.id !== ruleId);
        const nextState = {
            ...currentState,
            builderType: 'operator',
            rules: nextRules
        };
        const nextJson = buildConditionJson(nextState);
        updateSelectedEdge({ conditionBuilderType: 'operator', conditionRulesState: nextState, conditionJson: nextJson });
    }, [selectedEdge, buildConditionJson, updateSelectedEdge]);

    const nodeDetails = useMemo(() => {
        if (!selectedNode) {
            return null;
        }
        const outgoingJumpEdges = edges.filter((edge) => (
            edge.source === selectedNode.id && edge.data?.transitionType === 'Jump'
        ));

        return (
            <div className="flow-form-card">
                <h3>Node properties</h3>
                <label>
                    <span>Node ID</span>
                    <input
                        value={selectedNode.id}
                        onChange={(event) => {
                            const newId = event.target.value;
                            const oldId = selectedNode.id;
                            
                            setNodes((currentNodes) =>
                                currentNodes.map((item) =>
                                    item.id === oldId
                                        ? {
                                            ...item,
                                            id: newId,
                                            data: {
                                                ...item.data,
                                                code: item.data?.code === oldId || !item.data?.code ? newId : item.data.code,
                                            },
                                        }
                                        : item
                                )
                            );
                            
                            setEdges((currentEdges) =>
                                currentEdges.map((edge) => {
                                    let nextEdge = { ...edge };
                                    if (edge.source === oldId) nextEdge.source = newId;
                                    if (edge.target === oldId) nextEdge.target = newId;
                                    return nextEdge;
                                })
                            );

                            setSelectedNode((prev) => ({
                                ...prev,
                                id: newId,
                                data: {
                                    ...prev.data,
                                    code: prev.data?.code === oldId || !prev.data?.code ? newId : prev.data.code,
                                },
                            }));
                        }}
                    />
                </label>
                <label>
                    <span>Node name</span>
                    <input
                        value={selectedNode.data.label || ''}
                        onChange={(event) => updateSelectedNode('label', event.target.value)}
                    />
                </label>
                <label>
                    <span>Code</span>
                    <input
                        value={selectedNode.data.code || ''}
                        onChange={(event) => updateSelectedNode('code', event.target.value)}
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
                        <option value="custom">Custom</option>
                    </select>
                </label>
                <div style={{ marginTop: '14px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px dashed #f59e0b' }}>
                    <label className="flow-checkbox" style={{ marginBottom: selectedNode.data.jumpEnabled ? '10px' : 0 }}>
                        <input
                            type="checkbox"
                            checked={selectedNode.data.jumpEnabled === true}
                            onChange={(event) => updateSelectedNode('jumpEnabled', event.target.checked)}
                        />
                        <span style={{ fontWeight: 600, color: '#b45309' }}>Node data có điều kiện Jump / Bypass</span>
                    </label>
                    {selectedNode.data.jumpEnabled && (
                        <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '0.78rem', color: '#92400e' }}>Condition Name → Jump Transition ID</strong>
                            <button
                                type="button"
                                disabled={!outgoingJumpEdges.length}
                                onClick={() => {
                                    const definitions = selectedNode.data?.jumpDefinitions || [];
                                    updateSelectedNode('jumpDefinitions', [...definitions, {
                                        id: `jump-definition-${Date.now()}`,
                                        conditionName: '',
                                        transitionId: outgoingJumpEdges[0]?.id || ''
                                    }]);
                                }}
                                style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', background: outgoingJumpEdges.length ? '#d97706' : '#cbd5e1', color: '#fff', cursor: outgoingJumpEdges.length ? 'pointer' : 'not-allowed' }}
                            >
                                Thêm mapping
                            </button>
                        </div>

                        {!outgoingJumpEdges.length && (
                            <div style={{ padding: '8px', borderRadius: '6px', background: '#fff7ed', color: '#9a3412', fontSize: '0.74rem' }}>
                                Tạo transition từ node này và chọn type Jump trước.
                            </div>
                        )}

                        {(selectedNode.data?.jumpDefinitions || []).map((definition, definitionIndex) => (
                            <div key={definition.id || definitionIndex} style={{ position: 'relative', padding: '9px', marginBottom: '8px', background: '#fff', border: '1px solid #fde68a', borderRadius: '7px' }}>
                                <button
                                    type="button"
                                    title="Xóa mapping"
                                    onClick={() => updateSelectedNode(
                                        'jumpDefinitions',
                                        (selectedNode.data?.jumpDefinitions || []).filter((_, index) => index !== definitionIndex)
                                    )}
                                    style={{ position: 'absolute', top: '4px', right: '5px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                                <label style={{ marginRight: '18px' }}>
                                    <span>Condition Name</span>
                                    <input
                                        value={definition.conditionName || ''}
                                        placeholder="Ví dụ: bypassTS"
                                        onChange={(event) => {
                                            const definitions = [...(selectedNode.data?.jumpDefinitions || [])];
                                            definitions[definitionIndex] = { ...definitions[definitionIndex], conditionName: event.target.value };
                                            updateSelectedNode('jumpDefinitions', definitions);
                                        }}
                                    />
                                </label>
                                <label style={{ marginTop: '7px' }}>
                                    <span>Jump Transition ID</span>
                                    <select
                                        value={definition.transitionId || ''}
                                        onChange={(event) => {
                                            const definitions = [...(selectedNode.data?.jumpDefinitions || [])];
                                            definitions[definitionIndex] = { ...definitions[definitionIndex], transitionId: event.target.value };
                                            updateSelectedNode('jumpDefinitions', definitions);
                                        }}
                                    >
                                        <option value="">-- Chọn Jump transition --</option>
                                        {outgoingJumpEdges.map((edge) => (
                                            <option key={edge.id} value={edge.id}>
                                                {edge.id} · {edge.data?.actionName || edge.target || 'Jump'}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        ))}
                        <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#92400e' }}>
                            Runtime đọc condition name trong data và lấy đúng transition ID từ jumpTransitionMap.
                        </p>
                        </div>
                    )}
                </div>
                {selectedNode.data.nodeType === 'custom' && (
                    <label>
                        <span>Vị trí Binding (Custom Key)</span>
                        <input
                            value={selectedNode.data.custom || ''}
                            placeholder="Ví dụ: name của group trong dxForm"
                            onChange={(event) => updateSelectedNode('custom', event.target.value)}
                        />
                    </label>
                )}
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
                    <span>Node Detail</span>
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

                {/* UI lock conditions for named dxForm groups */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                Loại 2 · UI Condition Lock
                            </span>
                            <span style={{ display: 'block', marginTop: '3px', fontSize: '0.72rem', color: '#64748b' }}>
                                Khóa các itemType: &quot;group&quot; theo ngữ cảnh workflow.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const currentRules = selectedNode.data?.screenConditions || [];
                                const newRule = {
                                    id: `ui-lock-${Date.now()}`,
                                    type: 'uiLock',
                                    trigger: 'sameDepartmentReturn',
                                    department: selectedNode.data?.departmentName || '',
                                    targetItemType: 'group',
                                    groupNames: [],
                                    targets: [],
                                    mode: 'ReadOnly',
                                    condition: ''
                                };
                                updateSelectedNode('screenConditions', [...currentRules, newRule]);
                            }}
                            style={{
                                padding: '4px 8px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Thêm UI lock
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(selectedNode.data?.screenConditions || []).map((rule, idx) => (
                            <div
                                key={rule.id || idx}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    background: '#f8fafc',
                                    position: 'relative'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentRules = selectedNode.data?.screenConditions || [];
                                        const nextRules = currentRules.filter((_, i) => i !== idx);
                                        updateSelectedNode('screenConditions', nextRules);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                    title="Xóa điều kiện"
                                >
                                    ✕
                                </button>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', marginRight: '16px' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                        <span>Kích hoạt khi</span>
                                        <select
                                            value={rule.trigger || 'sameDepartmentReturn'}
                                            onChange={(e) => {
                                                const currentRules = [...(selectedNode.data?.screenConditions || [])];
                                                currentRules[idx] = { ...currentRules[idx], type: 'uiLock', trigger: e.target.value };
                                                updateSelectedNode('screenConditions', currentRules);
                                            }}
                                            style={{ padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
                                        >
                                            <option value="sameDepartmentReturn">Quay lại cùng department</option>
                                            <option value="enterDepartment">Đi vào department</option>
                                            <option value="always">Luôn áp dụng tại node</option>
                                        </select>
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                        <span>Department</span>
                                        <input
                                            type="text"
                                            value={rule.department ?? selectedNode.data?.departmentName ?? ''}
                                            onChange={(e) => {
                                                const currentRules = [...(selectedNode.data?.screenConditions || [])];
                                                currentRules[idx] = { ...currentRules[idx], department: e.target.value };
                                                updateSelectedNode('screenConditions', currentRules);
                                            }}
                                            placeholder="e.g. FO"
                                            style={{ padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
                                        />
                                    </label>
                                </div>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', marginBottom: '8px' }}>
                                    <span>Tên dxForm group (mỗi dòng hoặc phân cách bằng dấu phẩy)</span>
                                    <textarea
                                        rows={3}
                                        value={getUiConditionGroupNames(rule).join('\n')}
                                        onChange={(e) => {
                                            const groupNames = e.target.value
                                                .split(/[\n,]/)
                                                .map((name) => name.trim())
                                                .filter(Boolean);
                                            const currentRules = [...(selectedNode.data?.screenConditions || [])];
                                            currentRules[idx] = {
                                                ...currentRules[idx],
                                                type: 'uiLock',
                                                targetItemType: 'group',
                                                groupNames,
                                                targets: groupNames.map((name) => ({ itemType: 'group', name })),
                                                // Keep the first target readable by the legacy section consumer.
                                                sectionId: groupNames[0] || ''
                                            };
                                            updateSelectedNode('screenConditions', currentRules);
                                        }}
                                        placeholder={'e.g.\nrequestInfoGroup\nattachmentGroup'}
                                        style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', resize: 'vertical' }}
                                    />
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                        <span>Lock mode</span>
                                        <select
                                            value={rule.mode || 'ReadOnly'}
                                            onChange={(e) => {
                                                const currentRules = [...(selectedNode.data?.screenConditions || [])];
                                                currentRules[idx] = { ...currentRules[idx], mode: e.target.value };
                                                updateSelectedNode('screenConditions', currentRules);
                                            }}
                                            style={{ padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
                                        >
                                            <option value="ReadOnly">ReadOnly (Chỉ đọc)</option>
                                            <option value="Disabled">Disabled (Vô hiệu hóa)</option>
                                            <option value="Hide">Hide (Ẩn)</option>
                                            <option value="Show">Show (Hiển thị)</option>
                                        </select>
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                        <span>Điều kiện bổ sung (không bắt buộc)</span>
                                        <input
                                            type="text"
                                            value={rule.condition || ''}
                                            onChange={(e) => {
                                                const currentRules = [...(selectedNode.data?.screenConditions || [])];
                                                currentRules[idx] = { ...currentRules[idx], condition: e.target.value };
                                                updateSelectedNode('screenConditions', currentRules);
                                            }}
                                            placeholder="e.g. isReturned = true"
                                            style={{ padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}

                        {(selectedNode.data?.screenConditions || []).length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>
                                Chưa có UI lock. Các group cần khai báo thuộc tính name trong cấu hình dxForm.
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid #fee2e2', paddingTop: '15px' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setNodes((currentNodes) => currentNodes.filter(n => n.id !== selectedNode.id));
                            setEdges((currentEdges) => currentEdges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                            setSelectedNode(null);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Xóa Node này (Delete)
                    </button>
                </div>
            </div>
        );
    }, [selectedNode, updateSelectedNode, lanesList, setNodes, setEdges, edges]);

    const edgeDetails = useMemo(() => {
        if (!selectedEdge) {
            return null;
        }

        return (
            <div className="flow-form-card">
                <h3>Transition properties</h3>
                <label>
                    <span>From Node (Nút nguồn)</span>
                    <select
                        value={selectedEdge.source}
                        onChange={(event) => {
                            const newSource = event.target.value;
                            setEdges((currentEdges) =>
                                currentEdges.map((e) => (e.id === selectedEdge.id ? { ...e, source: newSource } : e))
                            );
                            setSelectedEdge((prev) => ({ ...prev, source: newSource }));
                        }}
                    >
                        {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                                {n.data?.label || n.id} (ID: {n.id})
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>To Node (Nút đích)</span>
                    <select
                        value={selectedEdge.target || ''}
                        onChange={(event) => {
                            const newTarget = event.target.value || null;
                            setEdges((currentEdges) =>
                                currentEdges.map((e) => (e.id === selectedEdge.id ? { ...e, target: newTarget } : e))
                            );
                            setSelectedEdge((prev) => ({ ...prev, target: newTarget }));
                        }}
                    >
                        <option value="">-- Chưa chọn / Exit --</option>
                        {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                                {n.data?.label || n.id} (ID: {n.id})
                            </option>
                        ))}
                    </select>
                </label>
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
                    <span>Icon</span>
                    <input
                        list="transition-icon-options"
                        value={selectedEdge.data?.icon || ''}
                        onChange={(event) => updateSelectedEdge('icon', event.target.value)}
                        placeholder="e.g. check"
                    />
                    <datalist id="transition-icon-options">
                        {transitionIconOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.icon} {item.label}
                            </option>
                        ))}
                    </datalist>
                </label>
                <label>
                    <span>Button class</span>
                    <select
                        value={selectedEdge.data?.buttonClass || ''}
                        onChange={(event) => updateSelectedEdge('buttonClass', event.target.value)}
                    >
                        {transitionButtonClassOptions.map((item) => (
                            <option key={item.value || 'default'} value={item.value}>
                                {item.label}{item.value ? ` (${item.value})` : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Step no</span>
                    <input
                        value={selectedEdge.data?.stepNo || ''}
                        onChange={(event) => updateSelectedEdge('stepNo', event.target.value)}
                    />
                </label>
                <label>
                    <span>Transition type</span>
                    <select
                        value={selectedEdge.data?.transitionType || 'Normal'}
                        onChange={(event) => {
                            const transitionType = event.target.value;
                            updateSelectedEdge('transitionType', transitionType);
                            if (transitionType === 'Jump') {
                                setNodes((currentNodes) => currentNodes.map((node) => (
                                    node.id === selectedEdge.source
                                        ? { ...node, data: { ...node.data, jumpEnabled: true } }
                                        : node
                                )));
                            } else {
                                setNodes((currentNodes) => currentNodes.map((node) => (
                                    node.id === selectedEdge.source
                                        ? {
                                            ...node,
                                            data: {
                                                ...node.data,
                                                jumpDefinitions: (node.data?.jumpDefinitions || [])
                                                    .filter((definition) => definition.transitionId !== selectedEdge.id)
                                            }
                                        }
                                        : node
                                )));
                            }
                        }}
                    >
                        <option value="Normal">Normal</option>
                        <option value="Loop">Loop</option>
                        <option value="Jump">Jump / Bypass</option>
                        <option value="Exit">Exit</option>
                        <option value="Condition">Condition</option>
                        <option value="Custom">Custom</option>
                    </select>
                </label>
                {selectedEdge.data?.transitionType === 'Jump' && (
                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#f5f3ff', border: '1px dashed #8b5cf6', color: '#6d28d9', fontSize: '0.76rem' }}>
                        Khai báo Condition Name → Jump Transition ID tại node nguồn. ID của transition này: <strong>{selectedEdge.id}</strong>
                    </div>
                )}
                <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.74rem', color: '#475569' }}>
                    Chọn transition để kéo 2 đầu tiếp xúc dọc viền node, chỉnh 3 điểm bẻ góc hoặc kéo panel Action/Status sang vị trí khác.
                    <div style={{ display: 'flex', gap: '6px', marginTop: '7px' }}>
                        <button
                            type="button"
                            onClick={() => updateSelectedEdge({ controlX: null, controlY: null })}
                            style={{ flex: 1, padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                        >
                            Auto route
                        </button>
                        <button
                            type="button"
                            onClick={() => updateSelectedEdge({ labelOffsetX: 0, labelOffsetY: 0 })}
                            style={{ flex: 1, padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                        >
                            Reset label
                        </button>
                    </div>
                </div>
                {selectedEdge.data?.transitionType === 'Custom' && (
                    <label>
                        <span>Vị trí Binding (Custom Key)</span>
                        <input
                            value={selectedEdge.data?.custom || ''}
                            placeholder="Ví dụ: name của group trong dxForm"
                            onChange={(event) => updateSelectedEdge('custom', event.target.value)}
                        />
                    </label>
                )}
                {/* <label>
                    <span>Status (Trạng thái)</span>
                    <select
                        value={selectedEdge.data?.statusName || ''}
                        onChange={(event) => {
                            const selectedValue = event.target.value;
                            const matchingStatus = statusList.find(s => s.value === selectedValue);
                            const matchingId = matchingStatus ? matchingStatus.id : '';
                            // Update statusName and statusId
                            updateSelectedEdge('statusName', selectedValue);
                            updateSelectedEdge('statusId', matchingId);
                        }}
                    >
                        <option value="">-- Chọn Trạng thái --</option>
                        {statusList.map(status => (
                            <option key={status.id} value={status.value}>
                                {status.value} (ID: {status.id})
                            </option>
                        ))}
                    </select>
                </label> */}
                <label>
                <span>Status (Trạng thái)</span>
                <select
                    value={selectedEdge.data?.statusId || ''}
                    onChange={(event) => {
                        const selectedId = event.target.value;
                        const matchingStatus = statusList.find(
                            (status) => String(status.id) === String(selectedId)
                        );
                        updateSelectedEdge({
                            statusId: selectedId,
                            statusName: matchingStatus?.value || '',
                        });
                    }}
                >
                <option value="">-- Chọn Trạng thái --</option>
                    {statusList.map((status) => (
                <option key={status.id} value={status.id}>
                            {status.value} (ID: {status.id})
                </option>
                    ))}
                </select>
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
                        <option value="ClearTurnaroundTimesAttributes">ClearTurnaroundTimesAttributes</option>
                        <option value="CallAPI">CallAPI</option>
                    </select>
                </label>
                <label>
                    <span>Transition JavaScript</span>
                    <textarea
                        rows={7}
                        value={selectedEdge.data?.transitionScript || ''}
                        onChange={(event) => updateSelectedEdge('transitionScript', event.target.value)}
                        placeholder={'const status = JSON.parse(formItems.actionStatus || "{}");\nstatus[findRoute.fromNodeId] = "Approved";\nformItems.actionStatus = JSON.stringify(status);\nreturn formItems;'}
                    />
                    <small>Available: formItems, sendData, findRoute, nextStep, moduleName.</small>
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
                    <span>Mẫu Email (Mail Template)</span>
                    <select
                        value={selectedEdge.data?.mailTemplateId || ''}
                        onChange={(event) => updateSelectedEdge('mailTemplateId', event.target.value)}
                    >
                        <option value="">-- Không gửi Email --</option>
                        {mailTemplates.map((item) => (
                            <option key={item.id || item.Id} value={item.id || item.Id}>
                                {item.templateName || item.TemplateName || item.templateMailTitle || item.TemplateMailTitle || `Template ${item.id || item.Id}`}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Mẫu Thông báo (Notification Template)</span>
                    <select
                        value={selectedEdge.data?.notificationTemplateId || ''}
                        onChange={(event) => updateSelectedEdge('notificationTemplateId', event.target.value)}
                    >
                        <option value="">-- Không gửi Thông báo --</option>
                        {notificationsList.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.templateName || item.title || `Notification ${item.id}`}
                            </option>
                        ))}
                    </select>
                </label>

                <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', margin: '0 0 10px', color: '#0f172a', fontWeight: 700 }}>
                            Mini Condition Builder
                        </h4>
                        <label>
                            <span>Loại điều kiện</span>
                            <select
                                value={selectedEdge.data?.conditionBuilderType || 'operator'}
                                onChange={(e) => changeConditionBuilderType(e.target.value)}
                            >
                                <option value="operator">Loại 1 · Điều kiện toán tử</option>
                                <option value="uiLock">Loại 2 · UI Condition Lock</option>
                            </select>
                        </label>

                        {(selectedEdge.data?.conditionBuilderType || 'operator') === 'operator' ? (
                        <>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: '#1e293b', fontWeight: 600 }}>
                            Loại 1 · Operator Condition Builder
                        </h4>
                        <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#64748b' }}>
                            Tạo điều kiện dữ liệu cho transition bằng AND/OR và toán tử so sánh.
                        </p>
                        
                        <label>
                            <span>Root Operator</span>
                            <select
                                value={condRootOperator}
                                onChange={(e) => changeRootOperator(e.target.value)}
                            >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </label>

                        <label>
                            <span>Rule Source</span>
                            <select value={condSource} onChange={(e) => setCondSource(e.target.value)}>
                                <option value="payload">payload</option>
                                <option value="form">form</option>
                                <option value="custom">custom</option>
                                <option value="user">user</option>
                                <option value="department">department</option>
                                <option value="actor">actor</option>
                                <option value="system">system</option>
                            </select>
                        </label>

                        {condSource !== 'custom' ? (
                            <label>
                                <span>Field</span>
                                <input value={condField} onChange={(e) => setCondField(e.target.value)} />
                            </label>
                        ) : (
                            <>
                                <label>
                                    <span>Custom Handler</span>
                                    <input value={condCustomHandler} onChange={(e) => setCondCustomHandler(e.target.value)} placeholder="e.g. checkDepartmentLimit" />
                                </label>
                                <label>
                                    <span>Custom Args (JSON)</span>
                                    <textarea
                                        rows={3}
                                        value={condCustomArgs}
                                        onChange={(e) => setCondCustomArgs(e.target.value)}
                                        placeholder='{"folder": "FO"}'
                                    />
                                </label>
                            </>
                        )}

                        <label>
                            <span>Data Type</span>
                            <select value={condDataType} onChange={(e) => setCondDataType(e.target.value)}>
                                <option value="string">string</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                                <option value="array">array</option>
                            </select>
                        </label>

                        <label>
                            <span>Operator</span>
                            <select value={condOperator} onChange={(e) => setCondOperator(e.target.value)}>
                                <option value="=">=</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                                <option value="contains">contains</option>
                                <option value="in">in</option>
                            </select>
                        </label>

                        <label>
                            <span>Value</span>
                            <input value={condValue} onChange={(e) => setCondValue(e.target.value)} />
                        </label>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={addConditionRule}
                                style={{ flex: 1, padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                Add Rule
                            </button>
                            <button
                                type="button"
                                onClick={clearConditionRules}
                                style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                Clear All
                            </button>
                        </div>

                        {selectedEdge.data?.conditionRulesState?.rules?.length > 0 && (
                            <div style={{ marginTop: '14px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Added Rules ({condRootOperator}):</span>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: '#334155' }}>
                                    {selectedEdge.data.conditionRulesState.rules.map((rule) => (
                                        <li key={rule.id} style={{ marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>
                                                    {rule.source === 'custom' 
                                                        ? `custom: ${rule.customHandler}`
                                                        : `${rule.source}.${rule.field} ${rule.operator} ${rule.value}`
                                                    }
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeConditionRule(rule.id)}
                                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        </>
                        ) : (
                        <>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: '#1e293b', fontWeight: 600 }}>
                                Loại 2 · UI Condition Lock
                            </h4>
                            <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#64748b' }}>
                                Khóa các group của dxForm khi transition quay lại hoặc đi vào department.
                            </p>

                            <label>
                                <span>Kích hoạt khi</span>
                                <select value={uiLockTrigger} onChange={(e) => setUiLockTrigger(e.target.value)}>
                                    <option value="sameDepartmentReturn">Quay lại cùng department</option>
                                    <option value="enterDepartment">Đi vào department</option>
                                    <option value="always">Luôn áp dụng</option>
                                </select>
                            </label>
                            <label>
                                <span>Department</span>
                                <input
                                    value={uiLockDepartment}
                                    onChange={(e) => setUiLockDepartment(e.target.value)}
                                    placeholder="e.g. FO"
                                />
                            </label>
                            <label>
                                <span>dxForm group names</span>
                                <textarea
                                    rows={3}
                                    value={uiLockGroupNames}
                                    onChange={(e) => setUiLockGroupNames(e.target.value)}
                                    placeholder={'Mỗi dòng hoặc phân cách bằng dấu phẩy\nrequestInfoGroup\nattachmentGroup'}
                                />
                            </label>
                            <label>
                                <span>Lock mode</span>
                                <select value={uiLockMode} onChange={(e) => setUiLockMode(e.target.value)}>
                                    <option value="ReadOnly">ReadOnly (Chỉ đọc)</option>
                                    <option value="Disabled">Disabled (Vô hiệu hóa)</option>
                                    <option value="Hide">Hide (Ẩn)</option>
                                    <option value="Show">Show (Hiển thị)</option>
                                </select>
                            </label>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={addUiLockRule}
                                    style={{ flex: 1, padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Add UI Lock
                                </button>
                                <button
                                    type="button"
                                    onClick={clearUiLockRules}
                                    style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Clear All
                                </button>
                            </div>

                            {(selectedEdge.data?.uiLockRules || []).length > 0 && (
                                <div style={{ marginTop: '14px', background: '#faf5ff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                                        UI Locks đã thêm:
                                    </span>
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: '#334155' }}>
                                        {selectedEdge.data.uiLockRules.map((rule) => (
                                            <li key={rule.id} style={{ marginBottom: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                    <span>
                                                        {rule.department || '(department)'} · {rule.trigger} · {getUiConditionGroupNames(rule).join(', ')} → {rule.mode}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeUiLockRule(rule.id)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                        )}
                </div>
                <label style={{ marginTop: '16px' }}>
                    <span>Condition JSON</span>
                    <textarea
                        rows={4}
                        value={selectedEdge.data?.conditionJson || '{}'}
                        onChange={(event) => updateSelectedEdge('conditionJson', event.target.value)}
                    />
                </label>
                <div style={{ marginTop: '20px', borderTop: '1px solid #fee2e2', paddingTop: '15px' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setEdges((currentEdges) => currentEdges.filter(e => e.id !== selectedEdge.id));
                            setNodes((currentNodes) => currentNodes.map((node) => ({
                                ...node,
                                data: {
                                    ...node.data,
                                    jumpDefinitions: (node.data?.jumpDefinitions || [])
                                        .filter((definition) => definition.transitionId !== selectedEdge.id)
                                }
                            })));
                            setSelectedEdge(null);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Xóa Transition này (Delete)
                    </button>
                </div>
            </div>
        );
    }, [
        selectedEdge,
        updateSelectedEdge,
        statusList,
        condSource,
        condField,
        condDataType,
        condOperator,
        condValue,
        condCustomHandler,
        condCustomArgs,
        condRootOperator,
        addConditionRule,
        clearConditionRules,
        changeRootOperator,
        removeConditionRule,
        changeConditionBuilderType,
        uiLockTrigger,
        uiLockDepartment,
        uiLockGroupNames,
        uiLockMode,
        addUiLockRule,
        clearUiLockRules,
        removeUiLockRule,
        setEdges,
        nodes
    ]);

    return (
        <div className={`flow-shell${isPaletteDragging ? ' palette-dragging' : ''}`}>
            <div className="flow-layout">
                <aside className="flow-sidebar">
                    <div className="flow-sidebar-card">
                        <h3>Workflow settings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                <span>Workflow ID</span>
                                <input
                                    type="text"
                                    placeholder="Workflow id"
                                    value={workflowId}
                                    onChange={(event) => setWorkflowId(event.target.value)}
                                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                            </label>
                            <button
                                type="button"
                                className="flow-action-btn"
                                onClick={() => loadWorkflow()}
                                disabled={loading}
                                style={{ margin: 0 }}
                            >
                                {loading ? 'Loading…' : 'Load workflow'}
                            </button>
                            <button
                                type="button"
                                className="flow-action-btn"
                                onClick={saveWorkflow}
                                disabled={loading || !workflowId}
                                style={{ background: '#10b981', color: 'white', margin: 0 }}
                            >
                                Lưu sơ đồ (Save Layout)
                            </button>
                            <button
                                type="button"
                                className="flow-action-btn"
                                onClick={buildWorkflow}
                                disabled={loading || !workflowId}
                                style={{ background: '#0284c7', color: 'white', margin: 0 }}
                            >
                                Build Workflow (API)
                            </button>
                        </div>
                    </div>

                    <div className="flow-sidebar-card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
                        <h3>Tra cứu Instance</h3>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 8px 0' }}>Nhập Record GUID để định vị bước hiện tại của hồ sơ trên sơ đồ.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Nhập Record GUID..."
                                value={searchRecordGuid}
                                onChange={(event) => setSearchRecordGuid(event.target.value)}
                                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    className="flow-action-btn"
                                    onClick={traceInstanceWorkflow}
                                    disabled={loading || !searchRecordGuid}
                                    style={{ background: '#f59e0b', color: 'white', margin: 0, flex: 1 }}
                                >
                                    Kiểm tra (Trace)
                                </button>
                                {tracedStep && (
                                    <button
                                        type="button"
                                        className="flow-action-btn secondary"
                                        onClick={() => setTracedStep(null)}
                                        style={{ margin: 0, padding: '4px 8px' }}
                                    >
                                        Xóa Trace
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {lanesList.length > 0 && (
                        <div className="flow-sidebar-card">
                            <h3>Nodes đề cử (Lanes)</h3>
                            <p>Drag a lane onto canvas to add step, or drag lanes to reorder them.</p>
                            <div className="flow-palette-list">
                                {lanesList.map((lane, index) => (
                                    <div
                                        key={lane.id}
                                        className="flow-palette-item"
                                        style={{ borderLeft: '4px solid #10b981', background: '#f0fdf4', cursor: 'grab' }}
                                        draggable
                                        onDragStart={(event) => {
                                            setDraggedLaneIndex(index);
                                            setIsPaletteDragging(true);
                                            event.dataTransfer.setData('application/reactflow-lane', JSON.stringify(lane));
                                            event.dataTransfer.setData('text/plain', `lane:${JSON.stringify(lane)}`);
                                            event.dataTransfer.effectAllowed = 'copyMove';
                                        }}
                                        onDragEnd={(event) => {
                                            setDraggedLaneIndex(null);
                                            endPaletteDrag();
                                        }}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            if (draggedLaneIndex !== null && draggedLaneIndex !== index) {
                                                const nextLanes = [...lanesList];
                                                const [movedLane] = nextLanes.splice(draggedLaneIndex, 1);
                                                nextLanes.splice(index, 0, movedLane);
                                                setLanesList(nextLanes);
                                            }
                                            setDraggedLaneIndex(null);
                                            endPaletteDrag();
                                        }}
                                    >
                                        <strong>{lane.label || lane.id}</strong>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phân làn quy trình</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                        setIsPaletteDragging(true);
                                        event.dataTransfer.setData('application/reactflow', template.type);
                                        event.dataTransfer.setData('text/plain', template.type);
                                        event.dataTransfer.effectAllowed = 'copyMove';
                                    }}
                                    onDragEnd={endPaletteDrag}
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

                <Diagram
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    setEdges={setEdges}
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

                <aside className="flow-properties-panel">
                    <div className="flow-properties-scroll-container">
                        {error && <div className="flow-error">{error}</div>}
                        {nodeDetails}
                        {edgeDetails}
                        {!selectedNode && !selectedEdge && (
                            <div className="flow-empty-state">
                                <h3>Configure workflow</h3>
                                <p>Select a node or connect two nodes to edit transition attributes such as action name, step no and condition JSON.</p>
                            </div>
                        )}
                    </div>
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

                <div style={{ height: '350px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                    {activeStatsTab === 'nodes' ? (
                        <CustomGrid
                            key="nodes-grid"
                            columns={nodeColumns}
                            rows={flatNodes}
                            showSelectionCheckbox={false}
                            showCommandsColumn={false}
                            allowRowReordering={false}
                            onRowClick={(row) => {
                                const foundNode = nodes.find(n => n.id === row.id);
                                if (foundNode) {
                                    setSelectedNode(foundNode);
                                    setSelectedEdge(null);
                                }
                            }}
                        />
                    ) : (
                        <CustomGrid
                            key="edges-grid"
                            columns={transitionColumns}
                            rows={flatTransitions}
                            showSelectionCheckbox={false}
                            showCommandsColumn={false}
                            allowRowReordering={false}
                            onRowClick={(row) => {
                                const foundEdge = edges.find(e => e.id === row.id);
                                if (foundEdge) {
                                    setSelectedEdge(foundEdge);
                                    setSelectedNode(null);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Flow;
