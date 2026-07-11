import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config";
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
  const [selectedStepId, setSelectedStepId] = useState("");
  const [mode, setMode] = useState("Recover");
  const [note, setNote] = useState("");
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const currentStep = useMemo(
    () => steps.find((step) => String(step.tNodeId) === String(selectedWorkflow?.currentStep))
      || steps.find((step) => String(step.fNodeId) === String(selectedWorkflow?.currentStep)),
    [selectedWorkflow, steps],
  );

  const firstStartStep = useMemo(
    () => steps.find((step) => step.isStart) || steps[0] || null,
    [steps],
  );

  const selectedStep = useMemo(
    () => steps.find((step) => String(step.id) === String(selectedStepId)) || null,
    [selectedStepId, steps],
  );

  const targetStep = mode === "Revise" ? firstStartStep : selectedStep;

  const loadSteps = useCallback(async (workflow) => {
    if (!workflow?.workflowDefinitionId) {
      setSteps([]);
      setSelectedStepId("");
      return;
    }

    try {
      setLoadingSteps(true);
      setMessage("");
      setSteps([]);
      setSelectedStepId("");

      const response = await fetch(
        `${API_BASE_URL}/api/StepsWorkflow/GetAll?refField=WorkflowDefinitionId&refKey=${workflow.workflowDefinitionId}&take=9999`,
      );
      if (!response.ok) throw new Error("Load StepsWorkflow failed");

      const data = await response.json();
      const list = (Array.isArray(data) ? data : []).map(normalizeStep);
      setSteps(list);

      const current = list.find((step) => String(step.fNodeId) === String(workflow.currentStep));
      const fallback = current || list.find((step) => step.isStart) || list[0];
      if (fallback) setSelectedStepId(String(fallback.id));
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
    }
  }, [loadSteps, selectedWorkflow]);

  useEffect(() => {
    if (mode === "Revise" && firstStartStep) {
      setSelectedStepId(String(firstStartStep.id));
    }
  }, [firstStartStep, mode]);

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
    if (!selectedWorkflow || !targetStep) {
      setMessage("Select InstanceWorkflow and target step first.");
      return;
    }

    const targetLabel = `${targetStep.fromNodeId || "-"} -> ${targetStep.toNodeId || "-"}`;
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
          stepsWorkflowId: targetStep.id,
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
      setMessage(`${mode} completed. CurrentStep: ${result?.currentStep || targetStep.fNodeId || targetStep.tNodeId || "-"}${stageText}`);
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
          <button type="button" className="primary" onClick={submitRecover} disabled={saving || !targetStep}>
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
          <div className="recover-flow-panel">
            <div className="recover-panel-title">BusinessForm Workflow</div>
            {selectedWorkflow?.workflowDefinitionId && selectedWorkflow?.recordGuid ? (
              <Flow
                key={`${selectedWorkflow.workflowDefinitionId}-${selectedWorkflow.recordGuid}`}
                id={selectedWorkflow.workflowDefinitionId}
                guid={selectedWorkflow.recordGuid}
              />
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
                  <span>Current route</span>
                  <strong>{currentStep ? `${currentStep.fromNodeId} -> ${currentStep.toNodeId}` : "-"}</strong>
                </div>
                <div>
                  <span>Current node</span>
                  <strong>{currentStep?.toNodeId || selectedWorkflow.currentStep || "-"}</strong>
                </div>
              </div>

              <div className="recover-mode-row">
                <label className={mode === "Recover" ? "active" : ""}>
                  <input type="radio" value="Recover" checked={mode === "Recover"} onChange={(event) => setMode(event.target.value)} />
                  Recover to selected step
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

              <div className="recover-panel-title">StepsWorkflow</div>
              <div className="recover-step-table">
                <div className="recover-step-head">
                  <span>Step</span>
                  <span>Route</span>
                  <span>Status</span>
                  <span>Type</span>
                </div>

                {loadingSteps ? <div className="recover-empty">Loading steps...</div> : null}

                {steps.map((step) => {
                  const active = String(step.id) === String(selectedStepId);
                  const current = String(step.tNodeId) === String(selectedWorkflow.currentStep);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={`recover-step ${active ? "active" : ""} ${current ? "current" : ""}`}
                      onClick={() => mode !== "Revise" && setSelectedStepId(String(step.id))}
                      disabled={mode === "Revise" && !step.isStart}
                    >
                      <span>{step.fNodeId || "-"}</span>
                      <span>{step.fromNodeId || "-"} {"->"} {step.toNodeId || "-"}</span>
                      <span>{step.statusName || step.stepName || "-"}</span>
                      <span className="recover-step-actions">
                        <em>{step.isStart ? "Start" : step.isReturn ? "Return" : "Forward"}</em>
                        <b>Recover here</b>
                      </span>
                    </button>
                  );
                })}

                {!steps.length && !loadingSteps ? <div className="recover-empty">No StepsWorkflow found.</div> : null}
              </div>
            </>
          )}

          {message ? <div className="recover-message">{message}</div> : null}
        </aside>
      </div>
    </section>
  );
}
