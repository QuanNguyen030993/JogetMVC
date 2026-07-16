import React from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    ConnectionLineType,
    EdgeLabelRenderer,
    useReactFlow,
    MarkerType,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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

    const isSourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
    const isTargetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

    let edgePath = '';
    let labelX = controlX;
    let labelY = controlY - 20;

    if (isSourceHorizontal && !isTargetHorizontal) {
        edgePath = `M ${sourceX},${sourceY} H ${controlX} V ${controlY} H ${targetX} V ${targetY}`;
    } else if (!isSourceHorizontal && isTargetHorizontal) {
        edgePath = `M ${sourceX},${sourceY} V ${controlY} H ${controlX} V ${targetY} H ${targetX}`;
    } else if (isSourceHorizontal && isTargetHorizontal) {
        edgePath = `M ${sourceX},${sourceY} H ${controlX} V ${targetY} H ${targetX}`;
        labelY = (sourceY + targetY) / 2 - 20;
    } else {
        edgePath = `M ${sourceX},${sourceY} V ${controlY} H ${targetX} V ${targetY}`;
        labelX = (sourceX + targetX) / 2;
    }

    const onCorner1MouseDown = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const startMouseX = event.clientX;
        const startMouseY = event.clientY;
        const startControlX = controlX;
        const startControlY = controlY;
        const zoom = getZoom();

        const handleMouseMove = (moveEvent) => {
            if (isSourceHorizontal) {
                // Horizontal first segment -> vertical resize (ns-resize) adjusting controlY
                const dy = moveEvent.clientY - startMouseY;
                const nextControlY = startControlY + dy / zoom;
                setEdges((currentEdges) =>
                    currentEdges.map((edge) => {
                        if (edge.id === id) {
                            return { ...edge, data: { ...edge.data, controlY: nextControlY } };
                        }
                        return edge;
                    })
                );
            } else {
                // Vertical first segment -> horizontal resize (ew-resize) adjusting controlX
                const dx = moveEvent.clientX - startMouseX;
                const nextControlX = startControlX + dx / zoom;
                setEdges((currentEdges) =>
                    currentEdges.map((edge) => {
                        if (edge.id === id) {
                            return { ...edge, data: { ...edge.data, controlX: nextControlX } };
                        }
                        return edge;
                    })
                );
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const onCorner2MouseDown = (event) => {
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

    const onCorner3MouseDown = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const startMouseX = event.clientX;
        const startMouseY = event.clientY;
        const startControlX = controlX;
        const startControlY = controlY;
        const zoom = getZoom();

        const handleMouseMove = (moveEvent) => {
            if (isTargetHorizontal) {
                // Horizontal last segment -> vertical resize (ns-resize) adjusting controlY
                const dy = moveEvent.clientY - startMouseY;
                const nextControlY = startControlY + dy / zoom;
                setEdges((currentEdges) =>
                    currentEdges.map((edge) => {
                        if (edge.id === id) {
                            return { ...edge, data: { ...edge.data, controlY: nextControlY } };
                        }
                        return edge;
                    })
                );
            } else {
                // Vertical last segment -> horizontal resize (ew-resize) adjusting controlX
                const dx = moveEvent.clientX - startMouseX;
                const nextControlX = startControlX + dx / zoom;
                setEdges((currentEdges) =>
                    currentEdges.map((edge) => {
                        if (edge.id === id) {
                            return { ...edge, data: { ...edge.data, controlX: nextControlX } };
                        }
                        return edge;
                    })
                );
            }
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
            {/* Corner 1: Dynamic start axis adjust */}
            <circle
                cx={isSourceHorizontal ? controlX : sourceX}
                cy={isSourceHorizontal ? sourceY : controlY}
                r={selected ? 7 : 5}
                fill={selected ? '#2563eb' : '#94a3b8'}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ cursor: isSourceHorizontal ? 'ns-resize' : 'ew-resize', pointerEvents: 'all', opacity: selected ? 1.0 : 0.6 }}
                onMouseDown={onCorner1MouseDown}
            />
            {/* Corner 2: Both axes adjust (Midpoint handle) */}
            <circle
                cx={controlX}
                cy={controlY}
                r={selected ? 8 : 6}
                fill={selected ? '#d97706' : '#d1d5db'}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: 'move', pointerEvents: 'all', opacity: selected ? 1.0 : 0.6 }}
                onMouseDown={onCorner2MouseDown}
            />
            {/* Corner 3: Dynamic end axis adjust */}
            <circle
                cx={isTargetHorizontal ? controlX : targetX}
                cy={isTargetHorizontal ? targetY : controlY}
                r={selected ? 7 : 5}
                fill={selected ? '#10b981' : '#64748b'}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ cursor: isTargetHorizontal ? 'ns-resize' : 'ew-resize', pointerEvents: 'all', opacity: selected ? 1.0 : 0.6 }}
                onMouseDown={onCorner3MouseDown}
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
        };
    }
    if (styleColor === 'green' || type === 'start' || flowType === 'start' || name === 'start') {
        return {
            background: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '50px',
            color: '#065f46',
            fontWeight: '600',
        };
    }
    if (styleColor === 'orange' || type === 'decision') {
        return {
            background: '#fff7ed',
            border: '1px solid #f97316',
            borderRadius: '14px',
            color: '#c2410c',
        };
    }
    if (styleColor === 'lightorange') {
        return {
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '14px',
            color: '#b45309',
        };
    }
    if (styleColor === 'blue' || type === 'department') {
        return {
            background: '#e0f2fe',
            border: '1px solid #0284c7',
            borderRadius: '14px',
            color: '#0369a1',
        };
    }
    if (type === 'review') {
        return {
            background: '#f3e8ff',
            border: '1px solid #8b5cf6',
            borderRadius: '14px',
            color: '#6b21a8',
        };
    }
    return {
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '14px',
        color: '#1e293b',
    };
};

const WorkflowNode = ({ data, selected }) => {
    const style = createNodeStyle({
        nodeType: data?.nodeType,
        flowType: data?.flowType,
        nodeName: data?.label,
        styleColor: data?.styleColor
    });

    return (
        <div
            style={{
                ...style,
                padding: '10px 15px',
                minWidth: '120px',
                textAlign: 'center',
                position: 'relative',
                boxShadow: data?.isTraced
                    ? '0 0 20px #f59e0b'
                    : (selected ? '0 0 0 2px #2563eb' : (style.boxShadow || '0 1px 3px rgba(0,0,0,0.1)')),
                border: data?.isTraced
                    ? '3px solid #f59e0b'
                    : (selected ? '2px solid #2563eb' : style.border),
                animation: data?.isTraced ? 'pulse 1.5s infinite alternate' : 'none'
            }}
        >
            <div>{data.label}</div>
            {data.subtitle && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{data.subtitle}</div>}
            
            {/* Top handles */}
            <Handle type="source" position={Position.Top} id="top-src-1" style={{ left: '15%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Top} id="top-src-2" style={{ left: '25%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Top} id="top-src-3" style={{ left: '35%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Top} id="top-src" style={{ left: '48%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Top} id="top-tgt" style={{ left: '52%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Top} id="top-tgt-1" style={{ left: '65%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Top} id="top-tgt-2" style={{ left: '75%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Top} id="top-tgt-3" style={{ left: '85%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />

            {/* Bottom handles */}
            <Handle type="source" position={Position.Bottom} id="bottom-src-1" style={{ left: '15%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Bottom} id="bottom-src-2" style={{ left: '25%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Bottom} id="bottom-src-3" style={{ left: '35%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Bottom} id="bottom-src" style={{ left: '48%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Bottom} id="bottom-tgt" style={{ left: '52%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Bottom} id="bottom-tgt-1" style={{ left: '65%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Bottom} id="bottom-tgt-2" style={{ left: '75%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Bottom} id="bottom-tgt-3" style={{ left: '85%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />

            {/* Left handles */}
            <Handle type="source" position={Position.Left} id="left-src-1" style={{ top: '15%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Left} id="left-src-2" style={{ top: '25%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Left} id="left-src-3" style={{ top: '35%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Left} id="left-src" style={{ top: '48%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Left} id="left-tgt" style={{ top: '52%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Left} id="left-tgt-1" style={{ top: '65%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Left} id="left-tgt-2" style={{ top: '75%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Left} id="left-tgt-3" style={{ top: '85%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />

            {/* Right handles */}
            <Handle type="source" position={Position.Right} id="right-src-1" style={{ top: '15%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Right} id="right-src-2" style={{ top: '25%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Right} id="right-src-3" style={{ top: '35%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="source" position={Position.Right} id="right-src" style={{ top: '48%', background: '#3b82f6', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Right} id="right-tgt" style={{ top: '52%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Right} id="right-tgt-1" style={{ top: '65%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Right} id="right-tgt-2" style={{ top: '75%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
            <Handle type="target" position={Position.Right} id="right-tgt-3" style={{ top: '85%', background: '#10b981', width: '8px', height: '8px', border: '1px solid white' }} />
        </div>
    );
};

const nodeTypes = {
    workflowNode: WorkflowNode,
};

const getMiniMapNodeColor = (node) => {
    const style = createNodeStyle(node.data);
    return style.background || '#ffffff';
};

export { CustomEdge, WorkflowNode, edgeTypes, nodeTypes, getMiniMapNodeColor, createNodeStyle };

export default function Diagram({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    setReactFlowInstance,
    onDrop,
    onDragOver,
    onNodeDragStop,
    loading,
}) {
    return (
        <div
            className="flow-canvas-panel"
            style={{ position: 'relative' }}
            onDrop={onDrop}
            onDragEnter={onDragOver}
            onDragOver={onDragOver}
        >
            {loading && (
                <div className="flow-loading-overlay" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <div className="flow-spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #cbd5e1',
                        borderTop: '4px solid #0284c7',
                        borderRadius: '50%',
                        animation: 'flow-spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500', fontFamily: 'sans-serif' }}>
                        Loading diagram...
                    </span>
                    <style>{`
                        @keyframes flow-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            <ReactFlow
                className="workflow-canvas"
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                connectionMode="loose"
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
                onNodeDragStop={onNodeDragStop}
                onInit={setReactFlowInstance}
                connectionLineType={ConnectionLineType.SmoothStep}
                edgeTypes={edgeTypes}
                nodeTypes={nodeTypes}
                fitView
            >
                <Panel position="top-right" className="info-panel">
                    <strong>
                        {selectedNode
                            ? `Selected node: ${selectedNode.data.label || selectedNode.id}`
                            : selectedEdge
                                ? 'Selected transition'
                                : 'Select a node or transition'}
                    </strong>
                </Panel>

                <MiniMap
                    pannable
                    zoomable
                    nodeColor={getMiniMapNodeColor}
                    nodeStrokeWidth={3}
                    maskColor="rgba(15, 23, 42, 0.12)"
                    style={{
                        width: 180,
                        height: 120,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                    }}
                />
                <Controls />
                <Background gap={16} size={1} />
            </ReactFlow>
        </div>
    );
}
