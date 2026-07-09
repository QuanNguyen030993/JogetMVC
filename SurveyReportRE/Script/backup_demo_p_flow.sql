-- =========================================================================
-- WORKFLOW BACKUP SCRIPT FOR DEMO_P_FLOW (PolicyIssuance)
-- Generated: 2026-07-09
-- Target Database: WorkflowManagement
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. UPDATE WORKFLOWDEFINITION LAYOUT
    PRINT 'Updating WorkflowDefinition for DEMO_P_FLOW...';
    UPDATE WorkflowDefinition 
    SET WorkflowNodes = '{
  "workflowDefinition": {},
  "workflowNodes": [
    {
      "id": "NODE_FO_START",
      "parentId": null,
      "nodeName": "FO",
      "nodeType": "department",
      "nodeCode": "FO",
      "orderNo": 1,
      "stepRole": "1",
      "departmentName": "FO",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 100,
      "y": 100
    },
    {
      "id": "NODE_TS_ACCEPT",
      "parentId": "NODE_FO_START",
      "nodeName": "TS",
      "nodeType": "department",
      "nodeCode": "TS",
      "orderNo": 2,
      "stepRole": "2",
      "departmentName": "TS",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 300,
      "y": 100
    },
    {
      "id": "NODE_PM_DECISION",
      "parentId": "NODE_TS_ACCEPT",
      "nodeName": "PM",
      "nodeType": "department",
      "nodeCode": "PM",
      "orderNo": 3,
      "stepRole": "3",
      "departmentName": "PM",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 500,
      "y": 100
    },
    {
      "id": "NODE_FO_WAIT",
      "parentId": "NODE_PM_DECISION",
      "nodeName": "FO",
      "nodeType": "department",
      "nodeCode": "FO",
      "orderNo": 4,
      "stepRole": "1",
      "departmentName": "FO",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 500,
      "y": 300
    },
    {
      "id": "NODE_TS_WAIT",
      "parentId": "NODE_PM_DECISION",
      "nodeName": "TS",
      "nodeType": "department",
      "nodeCode": "TS",
      "orderNo": 5,
      "stepRole": "2",
      "departmentName": "TS",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 700,
      "y": 300
    },
    {
      "id": "NODE_PM_COMPLETE",
      "parentId": null,
      "nodeName": "PM",
      "nodeType": "department",
      "nodeCode": "PM",
      "orderNo": 6,
      "stepRole": "3",
      "departmentName": "PM",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 600,
      "y": 500
    },
    {
      "id": "NODE_END",
      "parentId": null,
      "nodeName": "End",
      "nodeType": "complete",
      "nodeCode": "End",
      "orderNo": 7,
      "stepRole": "",
      "departmentName": "End",
      "levelNo": 1,
      "flowType": "PolicyIssuance",
      "allowLoop": false,
      "loopGroup": "",
      "x": 900,
      "y": 100
    }
  ],
  "workflowTransitions": [
    {
      "fromNodeId": "NODE_FO_START",
      "toNodeId": "NODE_TS_ACCEPT",
      "statusId": 201,
      "statusCode": "",
      "statusName": "TS Pending",
      "stepNo": "1",
      "actionCode": "SUBMIT_TO_TS",
      "actionName": "Submit to TS",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_TS_ACCEPT",
      "toNodeId": "NODE_PM_DECISION",
      "statusId": 198,
      "statusCode": "",
      "statusName": "PM Pending",
      "stepNo": "2",
      "actionCode": "SUBMIT_TO_PM",
      "actionName": "Accept & Send to PM",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_PM_DECISION",
      "toNodeId": "NODE_FO_WAIT",
      "statusId": 200,
      "statusCode": "",
      "statusName": "FO Pending",
      "stepNo": "3.1",
      "actionCode": "SUBMIT_FOLLOWUP",
      "actionName": "Submit but follow up",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_PM_DECISION",
      "toNodeId": "NODE_TS_WAIT",
      "statusId": 201,
      "statusCode": "",
      "statusName": "TS Pending",
      "stepNo": "3.2",
      "actionCode": "SUBMIT_FOLLOWUP",
      "actionName": "Submit but follow up",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_PM_DECISION",
      "toNodeId": "NODE_END",
      "statusId": 184,
      "statusCode": "",
      "statusName": "Completed",
      "stepNo": "3",
      "actionCode": "SUBMIT_NO_FOLLOWUP",
      "actionName": "Submit no follow up",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_FO_WAIT",
      "toNodeId": "NODE_PM_COMPLETE",
      "statusId": 198,
      "statusCode": "",
      "statusName": "PM Pending",
      "stepNo": "4.1",
      "actionCode": "FO_SUBMIT_PM",
      "actionName": "Client Signed & Return",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_TS_WAIT",
      "toNodeId": "NODE_PM_COMPLETE",
      "statusId": 198,
      "statusCode": "",
      "statusName": "PM Pending",
      "stepNo": "4.2",
      "actionCode": "TS_SUBMIT_PM",
      "actionName": "Client Signed & Return",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    },
    {
      "fromNodeId": "NODE_PM_COMPLETE",
      "toNodeId": "NODE_END",
      "statusId": 184,
      "statusCode": "",
      "statusName": "Completed",
      "stepNo": "5",
      "actionCode": "COMPLETE",
      "actionName": "Complete Task",
      "flowType": "PolicyIssuance",
      "isReturn": false,
      "isLoop": false,
      "loopGroup": "",
      "loopExitMode": "None",
      "maxLoopCount": null,
      "isExitTransition": false,
      "userDecisionLabel": "",
      "conditionJson": {},
      "command": null,
      "commandConfig": null
    }
  ]
}'
    WHERE WorkflowCode = 'DEMO_P_FLOW';

    -- 2. CLEAR OLD STEPS
    PRINT 'Deleting old StepsWorkflow records...';
    DELETE FROM StepsWorkflow WHERE WorkflowDefinitionId = '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a';

    -- 3. INSERT NEW STEPS
    PRINT 'Inserting new StepsWorkflow records...';
    
    INSERT INTO StepsWorkflow (
        Guid, SortOrder, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate,
        StepType, AllowLoop, CanComment, CanEdit, CanUpload, DepartmentCode, FlowType, IsActive, IsEnd, IsStart,
        LevelNo, RoleCode, StepCode, StepName, UiMode, WorkflowDefinitionId, ActionCode, Data,
        FromNodeId, ToNodeId, FNodeId, TNodeId, StepNo, StatusCode, StatusId, StatusName, Command, CommandConfig
    ) VALUES
    (NEWID(), 1, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'FO', 'PolicyIssuance', 1, 0, 1, 1, 'FO', 'NODE_FO_START_SUBMIT_TO_TS', 'FO Submit to TS', 'Forward', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'SUBMIT_TO_TS', '{}', 'FO', 'TS', 'NODE_FO_START', 'NODE_TS_ACCEPT', '1', '', 201, 'TS Pending', NULL, NULL),
    (NEWID(), 2, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'TS', 'PolicyIssuance', 1, 0, 0, 1, 'TS', 'NODE_TS_ACCEPT_SUBMIT_TO_PM', 'TS Accept & Send to PM', 'Forward', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'SUBMIT_TO_PM', '{}', 'TS', 'PM', 'NODE_TS_ACCEPT', 'NODE_PM_DECISION', '2', '', 198, 'PM Pending', NULL, NULL),
    (NEWID(), 3, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'PM', 'PolicyIssuance', 1, 0, 0, 1, 'PM', 'NODE_PM_DECISION_SUBMIT_FOLLOWUP', 'PM Submit but follow up', 'Forward', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'SUBMIT_FOLLOWUP', '{}', 'PM', 'FO', 'NODE_PM_DECISION', 'NODE_FO_WAIT', '3.1', '', 200, 'FO Pending', NULL, NULL),
    (NEWID(), 4, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'PM', 'PolicyIssuance', 1, 0, 0, 1, 'PM', 'NODE_PM_DECISION_SUBMIT_FOLLOWUP', 'PM Submit but follow up', 'Forward', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'SUBMIT_FOLLOWUP', '{}', 'PM', 'TS', 'NODE_PM_DECISION', 'NODE_TS_WAIT', '3.2', '', 201, 'TS Pending', NULL, NULL),
    (NEWID(), 5, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 9, 0, 1, 0, 0, 'PM', 'PolicyIssuance', 1, 1, 0, 1, 'PM', 'NODE_PM_DECISION_SUBMIT_NO_FOLLOWUP', 'PM Submit no follow up', 'Forward', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'SUBMIT_NO_FOLLOWUP', '{}', 'PM', 'End', 'NODE_PM_DECISION', 'NODE_END', '3', '', 184, 'Completed', NULL, NULL),
    (NEWID(), 6, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'FO', 'PolicyIssuance', 1, 0, 0, 1, 'FO', 'NODE_FO_WAIT_FO_SUBMIT_PM', 'FO Client Signed & Return', 'Start', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'FO_SUBMIT_PM', '{}', 'FO', 'PM', 'NODE_FO_WAIT', 'NODE_PM_COMPLETE', '4.1', '', 198, 'PM Pending', NULL, NULL),
    (NEWID(), 7, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 2, 0, 1, 1, 1, 'TS', 'PolicyIssuance', 1, 0, 0, 1, 'TS', 'NODE_TS_WAIT_TS_SUBMIT_PM', 'TS Client Signed & Return', 'Start', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'TS_SUBMIT_PM', '{}', 'TS', 'PM', 'NODE_TS_WAIT', 'NODE_PM_COMPLETE', '4.2', '', 198, 'PM Pending', NULL, NULL),
    (NEWID(), 8, 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 9, 0, 1, 0, 0, 'PM', 'PolicyIssuance', 1, 1, 0, 1, 'PM', 'NODE_PM_COMPLETE_COMPLETE', 'PM Complete Task', 'Start', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'COMPLETE', '{}', 'PM', 'End', 'NODE_PM_COMPLETE', 'NODE_END', '5', '', 184, 'Completed', NULL, NULL);

    -- 4. CLEAR OLD INSTANCE NODES
    PRINT 'Deleting old WorkflowInstanceNode records...';
    DELETE FROM WorkflowInstanceNode 
    WHERE WorkflowDefinitionId = '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a';

    -- 5. INSERT NEW INSTANCE NODES
    PRINT 'Inserting new WorkflowInstanceNode records...';
    INSERT INTO WorkflowInstanceNode (
        Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate,
        Code, WorkflowDefinitionId, NodeStatus, LoopCount
    ) VALUES
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_FO_START', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_TS_ACCEPT', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_PM_DECISION', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_FO_WAIT', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_TS_WAIT', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_PM_COMPLETE', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0),
    (NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0, '', GETDATE(), 'NODE_END', '38f2b0a5-3c03-47ec-ab48-4ad3d1703e0a', 'Pending', 0);

    COMMIT TRANSACTION;
    PRINT 'Transaction successfully committed. Workflow updated and built successfully! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
