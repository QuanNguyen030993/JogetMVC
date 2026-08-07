import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import appsettings from '../../../host.json';
import CustomGrid from "../../../TMIVCom/src/components/CustomGrid";
import Flow from "../../../BusinessForm/src/components/Flow";

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

export default function WorkflowRecover() {
  const gridRef = useRef(null);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [mode, setMode] = useState("Recover"); // "Recover" | "Revise"
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // WorkflowDefinition query state
  const [workflowDefDbId, setWorkflowDefDbId] = useState(null);
  const [loadingWorkflowDef, setLoadingWorkflowDef] = useState(false);
   
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

  // Query WorkflowDefinition to retrieve its database ID for Flow loader
  const loadWorkflowDefinition = useCallback(async (workflow) => {
    if (!workflow?.workflowDefinitionId) {
      setWorkflowDefDbId(null);
      return;
    }

    try {
      setLoadingWorkflowDef(true);
      const res = await fetch(`${appsettings.UrlConfig.Host}/api/WorkflowDefinition/GetAll?refKey=${workflow.workflowDefinitionId}&refField1=guid&take=999`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          const dbId = list[0].id || list[0].Id;
          setWorkflowDefDbId(dbId);
        } else {
          setWorkflowDefDbId(null);
        }
      }
    } catch (e) {
      console.error("Failed to query workflow definition", e);
      setWorkflowDefDbId(null);
    } finally {
      setLoadingWorkflowDef(false);
    }
  }, []);

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
        `${appsettings.UrlConfig.Host}/api/StepsWorkflow/GetAll?refField=WorkflowDefinitionId&refKey=${workflow.workflowDefinitionId}&take=9999`,
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
      loadWorkflowDefinition(selectedWorkflow);
    }
  }, [loadSteps, loadWorkflowDefinition, selectedWorkflow]);

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

      const response = await fetch(`${appsettings.UrlConfig.Host}/api/InstanceWorkflow/RecoverWorkflow`, {
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
            apiBaseUrl={appsettings.UrlConfig.Host}
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
          
          {/* Workflow Flow Panel */}
          <div className="recover-flow-panel" style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
            <div className="recover-panel-title" style={{ marginBottom: '12px' }}>
              Workflow Flow (Read-only)
            </div>

            {selectedWorkflow ? (
              workflowDefDbId ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '520px', background: '#f8fafc' }}>
                  <Flow
                    id={workflowDefDbId}
                    guid={selectedWorkflow.recordGuid}
                  />
                </div>
              ) : loadingWorkflowDef ? (
                <div className="recover-empty">Loading workflow definition...</div>
              ) : (
                <div className="recover-empty">Could not find a WorkflowDefinition record with guid matching: {selectedWorkflow.workflowDefinitionId}.</div>
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
