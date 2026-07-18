import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config";
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import Flow from "../../../BusinessForm/src/components/Flow";
import { useNodesState, useEdgesState, MarkerType } from "@xyflow/react";
import Diagram, { createNodeStyle } from "./Diagram";

const getValue = (row, ...keys) => {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null) return row[key];
  }
  return "";
};

const normalizeWorkflow = (row = {}) => ({
  raw: row,
  id: getValue(row, "id", "Id"),
  recordGuid: getValue(row, "recordGuid", "RecordGuid"),
  workflowDefinitionId: getValue(row, "workflowDefinitionId", "WorkflowDefinitionId"),
  currentStep: getValue(row, "currentStep", "CurrentStep"),
  currentStepId: getValue(row, "currentStepId", "CurrentStepId"),
  createdDate: getValue(row, "createdDate", "CreatedDate"),
  updatedDate: getValue(row, "updatedDate", "UpdatedDate"),
});

const normalizeStep = (row = {}) => ({
  raw: row,
  id: getValue(row, "id", "Id"),
  workflowDefinitionId: getValue(row, "workflowDefinitionId", "WorkflowDefinitionId"),
  fromNodeId: getValue(row, "fromNodeId", "FromNodeId"),
  toNodeId: getValue(row, "toNodeId", "ToNodeId"),
  fNodeId: getValue(row, "fNodeId", "FNodeId"),
  tNodeId: getValue(row, "tNodeId", "TNodeId"),
  stepName: getValue(row, "stepName", "StepName"),
  statusName: getValue(row, "statusName", "StatusName"),
  statusId: getValue(row, "statusId", "StatusId"),
  actionName: getValue(row, "actionName", "ActionName", "displayStatus", "DisplayStatus"),
  isReturn: Boolean(getValue(row, "isReturn", "IsReturn")),
  isStart: Boolean(getValue(row, "isStart", "IsStart")),
});

const workflowGridOption = {
  filterRow: { visible: true },
  groupPanel: { visible: false },
  selection: { mode: "single" },
  export: { enabled: true, fileName: "InstanceWorkflow" },
};

const workflowColumns = [
  { field: "id", caption: "Id", width: "80px", dataType: "number" },
  { field: "recordGuid", caption: "RecordGuid", width: "260px" },
  { field: "workflowDefinitionId", caption: "WorkflowDefinitionId", width: "260px" },
  { field: "currentStep", caption: "CurrentStep", width: "120px" },
  { field: "currentStepId", caption: "CurrentStepId", width: "180px" },
  { field: "createdDate", caption: "CreatedDate", width: "170px", dataType: "date" },
  { field: "updatedDate", caption: "UpdatedDate", width: "170px", dataType: "date" },
];

// Helper mapping functions for Diagram renderer
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
          {actionPart && <span className="label-item label-action" style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', marginRight: '2px' }}>{actionPart}</span>}
          {statusPart && <span className="label-item label-status" style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', marginRight: '2px' }}>{statusPart}</span>}
          {commandPart && <span className="label-item label-command" style={{ display: 'inline-block', background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', borderRadius: '4px', padding: '1px 4px', fontSize: '10px' }}>{commandPart}</span>}
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
              transitionScript: transition.transitionScript || '',
              icon: transition.icon || '',
              buttonClass: transition.buttonClass || '',
              command: transition.command || 'None',
              commandConfig: transition.commandConfig || '',
              custom: transition.custom || '',
              controlX: Number.isFinite(transition.controlX) ? transition.controlX * scaleX : null,
              controlY: Number.isFinite(transition.controlY) ? transition.controlY * scaleY : null,
          },
      };
  });

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

export default function WorkflowRecover() {
  const gridRef = useRef(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [mode, setMode] = useState("Recover");
  const [note, setNote] = useState("");
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab state for Diagram vs BusinessForm Flow
  const [activeTab, setActiveTab] = useState("diagram"); // "diagram" | "businessForm"

  // React Flow states for direct Diagram rendering
  const [diagramNodes, setDiagramNodes, onDiagramNodesChange] = useNodesState([]);
  const [diagramEdges, setDiagramEdges, onDiagramEdgesChange] = useEdgesState([]);
  const [loadingDiagram, setLoadingDiagram] = useState(false);

  // Extract unique nodes dynamically from transition steps
  const uniqueNodes = useMemo(() => {
    const nodeMap = new Map();

    steps.forEach((step) => {
      // From node
      if (step.fNodeId && step.fromNodeId && step.fromNodeId !== "Start" && step.fromNodeId !== "End") {
        if (!nodeMap.has(step.fNodeId)) {
          nodeMap.set(step.fNodeId, {
            id: step.fNodeId,
            code: step.fromNodeId,
            isStart: false,
          });
        }
      }

      // To node
      if (step.tNodeId && step.toNodeId && step.toNodeId !== "Start" && step.toNodeId !== "End") {
        if (!nodeMap.has(step.tNodeId)) {
          nodeMap.set(step.tNodeId, {
            id: step.tNodeId,
            code: step.toNodeId,
            isStart: false,
          });
        }
      }
    });

    steps.forEach((step) => {
      if (step.isStart && step.tNodeId) {
        const node = nodeMap.get(step.tNodeId);
        if (node) {
          node.isStart = true;
        }
      }
    });

    const nodeList = Array.from(nodeMap.values());

    return nodeList.map((node) => {
      const outgoing = steps.filter((step) => String(step.fNodeId) === String(node.id));
      const outgoingStr = outgoing
        .map((step) => {
          const actionPart = step.actionName || step.stepName || "Next";
          const targetPart = step.toNodeId || "End";
          const statusPart = step.statusName ? ` [${step.statusName}]` : "";
          return `${actionPart} -> ${targetPart}${statusPart}`;
        })
        .join(", ");

      return {
        ...node,
        outgoingCount: outgoing.length,
        outgoingStr: outgoingStr || "(No outgoing transitions / End node)",
      };
    });
  }, [steps]);

  const currentStepNode = useMemo(
    () => uniqueNodes.find((node) => String(node.id) === String(selectedWorkflow?.currentStep)),
    [selectedWorkflow, uniqueNodes],
  );

  const firstStartNode = useMemo(
    () => uniqueNodes.find((node) => node.isStart) || uniqueNodes[0] || null,
    [uniqueNodes],
  );

  const selectedNode = useMemo(
    () => uniqueNodes.find((node) => String(node.id) === String(selectedNodeId)) || null,
    [selectedNodeId, uniqueNodes],
  );

  const targetNode = mode === "Revise" ? firstStartNode : selectedNode;

  // Load Diagram Nodes/Edges from WorkflowDefinition (ITAdmin version)
  const loadDiagram = useCallback(async (workflow) => {
    if (!workflow?.workflowDefinitionId) {
      setDiagramNodes([]);
      setDiagramEdges([]);
      return;
    }

    try {
      setLoadingDiagram(true);
      const res = await fetch(`${API_BASE_URL}/api/WorkflowDefinition/GetSingle/${workflow.workflowDefinitionId}`);
      if (res.ok) {
        const data = await res.json();
        const parsedPayload = typeof data.workflowNodes === 'string' ? JSON.parse(data.workflowNodes) : data.workflowNodes || {};
        const scaleX = parsedPayload._layoutConfig?.SCALE_X || 1.0;
        const scaleY = parsedPayload._layoutConfig?.SCALE_Y || 1.0;
        
        const nextNodes = Array.isArray(parsedPayload.workflowNodes)
            ? mapWorkflowNodes(parsedPayload.workflowNodes, scaleX, scaleY)
            : [];
        const nextEdges = Array.isArray(parsedPayload.workflowTransitions)
            ? mapWorkflowEdges(parsedPayload.workflowTransitions, scaleX, scaleY)
            : [];

        // Highlight current active step in workflow instance
        const currentStep = workflow.currentStep;
        const tracedNodes = nextNodes.map(n => ({
            ...n,
            data: {
                ...n.data,
                isTraced: String(n.id) === String(currentStep)
            }
        }));

        setDiagramNodes(tracedNodes.length ? layoutNodes(tracedNodes, nextEdges) : []);
        setDiagramEdges(nextEdges);
      }
    } catch (e) {
      console.error("Failed to fetch workflow definition for diagram", e);
    } finally {
      setLoadingDiagram(false);
    }
  }, [setDiagramNodes, setDiagramEdges]);

  const loadSteps = useCallback(async (workflow) => {
    if (!workflow?.workflowDefinitionId) {
      setSteps([]);
      setSelectedNodeId("");
      return;
    }

    try {
      setLoadingSteps(true);
      setMessage("");
      setSteps([]);
      setSelectedNodeId("");

      const response = await fetch(
        `${API_BASE_URL}/api/StepsWorkflow/GetAll?refField=WorkflowDefinitionId&refKey=${workflow.workflowDefinitionId}&take=9999`,
      );
      if (!response.ok) throw new Error("Load StepsWorkflow failed");

      const data = await response.json();
      const list = (Array.isArray(data) ? data : []).map(normalizeStep);
      setSteps(list);

      const nodeMap = new Map();
      list.forEach((step) => {
        if (step.fNodeId && step.fromNodeId && step.fromNodeId !== "Start" && step.fromNodeId !== "End") {
          if (!nodeMap.has(step.fNodeId)) {
            nodeMap.set(step.fNodeId, { id: step.fNodeId, code: step.fromNodeId, isStart: false });
          }
        }
        if (step.tNodeId && step.toNodeId && step.toNodeId !== "Start" && step.toNodeId !== "End") {
          if (!nodeMap.has(step.tNodeId)) {
            nodeMap.set(step.tNodeId, { id: step.tNodeId, code: step.toNodeId, isStart: false });
          }
        }
      });
      list.forEach((step) => {
        if (step.isStart && step.tNodeId) {
          const node = nodeMap.get(step.tNodeId);
          if (node) node.isStart = true;
        }
      });
      const nodeList = Array.from(nodeMap.values());
      const current = nodeList.find(node => String(node.id) === String(workflow.currentStep));
      const fallback = current || nodeList.find(node => node.isStart) || nodeList[0];
      if (fallback) setSelectedNodeId(String(fallback.id));
    } catch (error) {
      console.error(error);
      setMessage("Load StepsWorkflow failed.");
    } finally {
      setLoadingSteps(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      loadSteps(selectedWorkflow);
      loadDiagram(selectedWorkflow);
    }
  }, [loadSteps, loadDiagram, selectedWorkflow]);

  useEffect(() => {
    if (mode === "Revise" && firstStartNode) {
      setSelectedNodeId(String(firstStartNode.id));
    }
  }, [firstStartNode, mode]);

  const handleSelectWorkflow = (row) => {
    const workflow = normalizeWorkflow(row);
    setSelectedWorkflow(workflow);
    setMessage("");
  };

  const openSelectedWorkflow = () => {
    const rows = gridRef.current?.getSelectedRowsData?.() || [];
    if (!rows.length) {
      setMessage("Select one InstanceWorkflow row first.");
      return;
    }
    handleSelectWorkflow(rows[0]);
  };

  const submitRecover = async () => {
    if (!selectedWorkflow || !targetNode) {
      setMessage("Select InstanceWorkflow and target node first.");
      return;
    }

    const targetLabel = `${targetNode.code || "Node"} (#${targetNode.id})`;
    const confirmed = window.confirm(`${mode} workflow #${selectedWorkflow.id} to ${targetLabel}?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/InstanceWorkflow/RecoverWorkflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceWorkflowId: selectedWorkflow.id,
          targetNodeId: targetNode.id,
          targetDeptCode: targetNode.code === "Start" || targetNode.code === "End" ? "" : targetNode.code,
          mode,
          note,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Recover failed");
      }

      const result = await response.json().catch(() => null);
      const stageText = result?.quotationStageDept ? `, Quotation.StageDept: ${result.quotationStageDept}` : "";
      setMessage(`${mode} completed. CurrentStep: ${result?.currentStep || targetNode.id}${stageText}`);
      setRefreshKey((value) => value + 1);
      
      // Update local workflow state to reload steps and highlight new active step in React Flow diagram
      setSelectedWorkflow((prev) => prev ? { ...prev, currentStep: result?.currentStep || prev.currentStep } : prev);
    } catch (error) {
      console.error(error);
      setMessage(error.message || `${mode} failed.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workflow-recover">
      <div className="recover-toolbar">
        <div>
          <h2>Recover / Revise Flow</h2>
          <p>Filter RecordGuid in the InstanceWorkflow grid, select one row, then choose the flow step to recover.</p>
        </div>
        <div className="recover-actions">
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>
            Refresh Grid
          </button>
          <button type="button" className="primary" onClick={submitRecover} disabled={saving || !targetNode}>
            {saving ? "Processing..." : mode}
          </button>
        </div>
      </div>

      <div className="recover-workspace">
        <div className="recover-grid-panel">
          <div className="recover-panel-title">InstanceWorkflow</div>
          <CustomGrid
            key={refreshKey}
            ref={gridRef}
            modelName="InstanceWorkflow"
            apiBaseUrl={API_BASE_URL}
            columns={workflowColumns}
            gridOption={workflowGridOption}
            toolbarItems={[
              {
                text: "Open selected workflow",
                icon: "fa-folder-open",
                location: "after",
                onClick: openSelectedWorkflow,
              },
            ]}
            onRowClick={handleSelectWorkflow}
            showSelectionCheckbox
            showCommandsColumn={false}
            selectionMode="single"
          />
          
          {/* Diagrams Tab Panel */}
          <div className="recover-flow-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="recover-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span>Diagram Preview</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: activeTab === 'diagram' ? '#eff6ff' : '#fff',
                    color: activeTab === 'diagram' ? '#1d4ed8' : '#334155',
                    borderColor: activeTab === 'diagram' ? '#3b82f6' : '#cbd5e1',
                    fontWeight: activeTab === 'diagram' ? '600' : '400',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('diagram')}
                >
                  Sơ đồ Thực tế (React Flow)
                </button>
                <button 
                  type="button" 
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: activeTab === 'businessForm' ? '#eff6ff' : '#fff',
                    color: activeTab === 'businessForm' ? '#1d4ed8' : '#334155',
                    borderColor: activeTab === 'businessForm' ? '#3b82f6' : '#cbd5e1',
                    fontWeight: activeTab === 'businessForm' ? '600' : '400',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('businessForm')}
                >
                  BusinessForm Flow (Read-only)
                </button>
              </div>
            </div>

            {selectedWorkflow?.workflowDefinitionId ? (
              activeTab === 'diagram' ? (
                loadingDiagram ? (
                  <div className="recover-empty">Loading React Flow diagram...</div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '520px', background: '#f8fafc' }}>
                    <Diagram
                      nodes={diagramNodes}
                      edges={diagramEdges}
                      readOnly={true}
                    />
                  </div>
                )
              ) : (
                selectedWorkflow?.recordGuid ? (
                  <Flow
                    key={`${selectedWorkflow.workflowDefinitionId}-${selectedWorkflow.recordGuid}`}
                    id={selectedWorkflow.workflowDefinitionId}
                    guid={selectedWorkflow.recordGuid}
                  />
                ) : (
                  <div className="recover-empty">Selected workflow does not contain a RecordGuid (needed for BusinessForm Flow).</div>
                )
              )
            ) : (
              <div className="recover-empty">Select an InstanceWorkflow row to render its workflow.</div>
            )}
          </div>
        </div>

        <aside className="recover-detail-panel">
          <div className="recover-panel-title">BusinessForm Flow Position</div>

          {!selectedWorkflow ? (
            <div className="recover-empty">Select an InstanceWorkflow row to inspect its flow.</div>
          ) : (
            <>
              <div className="recover-summary">
                <div>
                  <span>Instance</span>
                  <strong>#{selectedWorkflow.id}</strong>
                </div>
                <div>
                  <span>RecordGuid</span>
                  <strong>{selectedWorkflow.recordGuid || "-"}</strong>
                </div>
                <div>
                  <span>CurrentStep</span>
                  <strong>{selectedWorkflow.currentStep || "-"}</strong>
                </div>
                <div>
                  <span>Current Dept</span>
                  <strong>{currentStepNode?.code || "-"}</strong>
                </div>
                <div>
                  <span>Current Node ID</span>
                  <strong>{selectedWorkflow.currentStep || "-"}</strong>
                </div>
              </div>

              <div className="recover-mode-row">
                <label className={mode === "Recover" ? "active" : ""}>
                  <input type="radio" value="Recover" checked={mode === "Recover"} onChange={(event) => setMode(event.target.value)} />
                  Recover to selected node
                </label>
                <label className={mode === "Revise" ? "active" : ""}>
                  <input type="radio" value="Revise" checked={mode === "Revise"} onChange={(event) => setMode(event.target.value)} />
                  Revise from beginning
                </label>
              </div>

              <label className="recover-note">
                Note
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reason or audit note" />
              </label>

              <div className="recover-panel-title">Workflow Nodes</div>
              <div className="recover-step-table">
                <div className="recover-step-head">
                  <span>Node ID</span>
                  <span>Dept</span>
                  <span>Transitions / Outgoing Routes (1 Line)</span>
                  <span>Type</span>
                </div>

                {loadingSteps ? <div className="recover-empty">Loading nodes...</div> : null}

                {uniqueNodes.map((node) => {
                  const active = String(node.id) === String(selectedNodeId);
                  const current = String(node.id) === String(selectedWorkflow.currentStep);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      className={`recover-step ${active ? "active" : ""} ${current ? "current" : ""}`}
                      onClick={() => mode !== "Revise" && setSelectedNodeId(String(node.id))}
                      disabled={mode === "Revise" && !node.isStart}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{node.id}</span>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{node.code}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={node.outgoingStr}>
                        {node.outgoingCount > 0 ? `(${node.outgoingCount} states) ${node.outgoingStr}` : node.outgoingStr}
                      </span>
                      <span className="recover-step-actions">
                        <em>{node.isStart ? "Start" : "Normal"}</em>
                        <b>Recover here</b>
                      </span>
                    </button>
                  );
                })}

                {!uniqueNodes.length && !loadingSteps ? <div className="recover-empty">No Nodes found.</div> : null}
              </div>
            </>
          )}

          {message ? <div className="recover-message">{message}</div> : null}
        </aside>
      </div>
    </section>
  );
}
