DECLARE @WorkflowDefinitionId UNIQUEIDENTIFIER = 'D0F64478-7D93-4444-8526-006D6662AA8D';
INSERT INTO StepsWorkflow
(
    WorkflowDefinitionId,
    StepCode,
    StepName,
    StepType,
    RoleCode,
    SortOrder,
    IsStart,
    IsEnd,
    IsActive,
    StepNo,
    NodeId,
    FromNodeId,
    ToNodeId,
    ActionCode
)
VALUES
(@WorkflowDefinitionId, 'FO_SUBMIT_TS',   N'FO Submit To TS',                2, 'FO',   2, 0, 0, 1, 1, 'FO',   'FO',  'TS',   'Submit'),
(@WorkflowDefinitionId, 'TS_REVIEW_UW',   N'TS Review And Route To UW',      3, 'TS',   3, 0, 0, 1, 2, 'TS',   'TS',  'UW',   'Approve'),
(@WorkflowDefinitionId, 'UW_APPROVE_LMKT',N'UW Approve And Route To LMKT',   3, 'UW',   4, 0, 0, 1, 3, 'UW',   'UW',  'LMKT', 'Approve'),
(@WorkflowDefinitionId, 'LMKT_COMPLETE',  N'LMKT Complete Workflow',         9, 'LMKT', 5, 0, 1, 1, 4, 'LMKT', 'LMKT',NULL,   'Complete'),
(@WorkflowDefinitionId, 'UW_REJECT_FO',   N'UW Reject Back To FO',           4, 'UW',   6, 0, 0, 1, 5, 'UW',   'UW',  'FO',   'Reject');
SET @WorkflowDefinitionId  = '3691A203-F1C1-44EA-A3FF-4BB26E6D8C1F';

INSERT INTO StepsWorkflow
(
       WorkflowDefinitionId,    StepCode,    StepName,    StepType,    RoleCode,    SortOrder,    IsStart,    IsEnd,    IsActive,    CanEdit,    CanComment,    CanUpload,    DisplayStatus,    UiMode,    LevelNo,    FlowType,    AllowLoop,    LoopGroup,    StepNo,    NodeId,    FromNodeId,    ToNodeId,    ActionCode,    Data
)
VALUES
(
       @WorkflowDefinitionId,    'FO_TO_UW',    N'FO Submit To UW',    2,    'FO',    1,    1,    0,    1,    1,    1,    1,    N'Submit To UW',    'EditQuotation',    1,    'Quotation',    0,    NULL,    1,    'FO',    'FO',    'UW',    'SUBMIT_UW',    N'{"fromNodeId":"FO",toNodeId":"UW",actionName":"Submit To UW"}'
),(
      @WorkflowDefinitionId,    'UW_TO_FO',    N'UW Return To FO',    3,    'UW',    2,    0,    0,    1,    1,    1,    1,    N'Return To FO',    'Approval',    2,    'Quotation',    1,    'UW_FO_LOOP',    2,    'UW',    'UW',    'FO',    'RETURN_FO',    N'{"fromNodeId":"UW",toNodeId":"FO",actionName":"Return To FO",isLoop":true}'
),(
        @WorkflowDefinitionId,    'FO_TO_MKTMGR',    N'FO Submit To MKT Manager',    2,    'FO',    3,    0,    0,    1,    1,    1,    1,    N'Submit To MKT Manager',    'EditQuotation',    1,    'Quotation',    0,    NULL,    3,    'FO',    'FO',    'MKT_MGR',    'SUBMIT_MKT_MGR',    N'{"fromNodeId":"FO",toNodeId":"MKT_MGR",actionName":"Submit To MKT Manager"}'
),(
      @WorkflowDefinitionId,    'MKTMGR_COMPLETE',    N'MKT Manager Complete',    9,    'MKT_MGR',    4,    0,    1,    1,    0,    1,    0,    N'Completed',    'ReadOnly',    3,    'Quotation',    0,    NULL,    4,    'MKT_MGR',    'MKT_MGR',    NULL,    'COMPLETE',    N'{"fromNodeId":"MKT_MGR",toNodeId":null,actionName":"Complete"}'
);



UPDATE Quotation SET StageDept = 'FO' WHERE Id = 125
UPDATE InstanceWorkflow SET CurrentStep = 3 WHERE Id = 36
UPDATE Quotation SET PIC = REPLACE(PIC,'"MKT"', '"FO"')
UPDATE PolicyIssuance SET PIC = REPLACE(PIC,'"MKT"', '"FO"')
UPDATE Quotation SET TurnAroundTimeAttributes = REPLACE(TurnAroundTimeAttributes,'"MKT"', '"FO"')
UPDATE PolicyIssuance SET TurnAroundTimeAttributes = REPLACE(TurnAroundTimeAttributes,'"MKT"', '"FO"')
UPDATE PolicyIssuance SET TurnAroundTimeAttributes = N'{
  "FO": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 10:30:00" },
  "TS": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },
  "UW": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },
  "LMKT": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },
  "PM": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" }
}'

UPDATE PolicyIssuance SET PIC = '{"FO":"thao.bp","TS":"hien.ttt","PM":"nguyen.dt"}'
UPDATE PolicyIssuance SET StageDept = 'FO'
UPDATE StepsWorkflow SET RoleCode = 'LMKT' WHERE RoleCode = 'MKT_MGR'
UPDATE StepsWorkflow SET FromNodeId = 'LMKT' WHERE FromNodeId = 'MKT_MGR'
UPDATE StepsWorkflow SET ToNodeId = 'LMKT' WHERE ToNodeId = 'MKT_MGR'
UPDATE StepsWorkflow SET NodeId = 'LMKT' WHERE NodeId = 'MKT_MGR'
