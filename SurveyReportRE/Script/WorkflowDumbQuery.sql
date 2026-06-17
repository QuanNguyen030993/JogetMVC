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
UPDATE Quotation SET TurnAroundTimeAttributes = N'{
  "FO": { "AcceptDate": "2026-03-16 09:15:00", "CompleteDate": "2026-03-16 10:30:00" },
  "TS": { "AcceptDate": "2026-03-16 09:15:00", "CompleteDate": "2026-03-16 09:15:00" },
  "UW": { "AcceptDate": "2026-03-16 09:15:00", "CompleteDate": "2026-03-16 09:15:00" },
  "LMKT": { "AcceptDate": "2026-03-16 09:15:00", "CompleteDate": "2026-03-16 09:15:00" },
  "PM": { "AcceptDate": "2026-03-16 09:15:00", "CompleteDate": "2026-03-16 09:15:00" }
}'
UPDATE PolicyIssuance SET PIC = '{"FO":"thao.bp","TS":"hien.ttt","PM":"nguyen.dt"}'
UPDATE PolicyIssuance SET StageDept = 'FO'
UPDATE StepsWorkflow SET RoleCode = 'LMKT' WHERE RoleCode = 'MKT_MGR'
UPDATE StepsWorkflow SET FromNodeId = 'LMKT' WHERE FromNodeId = 'MKT_MGR'
UPDATE StepsWorkflow SET ToNodeId = 'LMKT' WHERE ToNodeId = 'MKT_MGR'
UPDATE StepsWorkflow SET NodeId = 'LMKT' WHERE NodeId = 'MKT_MGR'
UPDATE Document SET SubDirectory = REPLACE(SubDirectory,'MKT\','FO\') WHERE SubDirectory LIKE 'MKT'

UPDATE QuotationWorkflowHistory SET DeptCode = 'FO', FromDeptCode = 'FO', ToDeptCode = 'UW', ActionNote = 'Submit To UW' WHERE HistoryId = 1

INSERT INTO QuotationCommentLog (QuotationId,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem)
            VALUES (125,'UW',0,'Nguyen Hong Quan IT','2026-04-01 10:40:58',N'Return to FO','WEB')


            DECLARE @RecordGuid UNIQUEIDENTIFIER = 'FB6EC2DB-67F1-415F-85AD-05D2FD05D921';
INSERT INTO SectionCommentNote
(
    RecordGuid,
    FromDepartment,
    ToDepartment,
    CurrentDepartment,
    Type,
    Content,
    IsPrimaryNote,
    IsPinned,
    IsUrgent,
    IsRead,
    IsResolved,
    ParentCommentId,
    LinkedPrimaryNoteId
)
VALUES

-- 11
(
    @RecordGuid,
    'FO',
    'TS',
    'FO',
    'Request',
    N'Nhờ TS kiểm tra lại wording phần deductible và endorsement số 03. Nếu có thay đổi thì update lại quotation note trước khi chuyển qua UW.

Ngoài ra client đang hỏi thêm việc áp dụng limit cho branch phụ, nên nếu team thấy wording hiện tại chưa đủ chặt thì comment ngược lại giúp FO để team chốt lại mail trả lời.

Điểm này khá quan trọng vì client muốn confirm trong ngày và có thể ảnh hưởng đến bước phê duyệt tiếp theo.',
    1,
    1,
    0,
    0,
    0,
    NULL,
    NULL
),

-- 12
(
    @RecordGuid,
    'TS',
    'FO',
    'FO',
    'Blocker',
    N'TS chưa thể chốt tiếp vì file wording đính kèm hiện đang là version cũ. Nhờ FO upload lại bản final hoặc xác nhận dùng bản ngày 08/04/2026.

Nếu chưa có file final thì TS chỉ review tạm theo summary và có rủi ro lệch wording ở bước submit.',
    0,
    0,
    1,
    1,
    0,
    NULL,
    NULL
),

-- 13
(
    @RecordGuid,
    'UW',
    'TS',
    'FO',
    'Discussion',
    N'Khi TS review xong phần wording thì ping lại UW giúp để team xem tiếp impact tới referral note. Có thể chưa cần formal submit, chỉ cần note nhanh các thay đổi chính là được.',
    0,
    0,
    0,
    1,
    0,
    NULL,
    NULL
),

-- 14
(
    @RecordGuid,
    'TS',
    'TS',
    'FO',
    'Internal',
    N'Team lưu ý giữ riêng phần trao đổi technical trong section TS để tránh làm loãng luồng giao việc chính từ FO/UW. Chỉ những việc cần action liên section mới nên đẩy ra pinned note hoặc request tag.',
    0,
    0,
    0,
    1,
    0,
    NULL,
    NULL
),

-- 15
(
    @RecordGuid,
    'FO',
    'UW',
    'UW',
    'Request',
    N'Nhờ UW xem nhanh referral note vì client đang đợi xác nhận. Nếu có điều kiện loại trừ thêm, note lại giúp FO để trả lời trong email cùng ngày.',
    1,
    1,
    0,
    0,
    0,
    NULL,
    NULL
),

-- 16
(
    @RecordGuid,
    'FO',
    'UW',
    'PM',
    'Request',
    N'Nhờ PM xem nhanh referral note vì client đang đợi xác nhận. Nếu có điều kiện loại trừ thêm, note lại giúp FO để trả lời trong email cùng ngày.',
    1,
    1,
    0,
    0,
    0,
    NULL,
    NULL
),

-- 17
(
    @RecordGuid,
    'FO',
    'UW',
    'LMKT',
    'Request',
    N'Nhờ LMKT xem nhanh referral note vì client đang đợi xác nhận. Nếu có điều kiện loại trừ thêm, note lại giúp FO để trả lời trong email cùng ngày.',
    1,
    1,
    0,
    0,
    0,
    NULL,
    NULL
),

-- 18
(
    @RecordGuid,
    'FO',
    'UW',
    'TS',
    'Request',
    N'Nhờ TS xem nhanh referral note vì client đang đợi xác nhận. Nếu có điều kiện loại trừ thêm, note lại giúp FO để trả lời trong email cùng ngày.',
    1,
    1,
    0,
    0,
    0,
    NULL,
    NULL
);

INSERT INTO CommentLog (DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem,SourceRef,RawJson,CreatedAtUtc,RecordGuid)
SELECT DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem,SourceRef,RawJson,CreatedAtUtc,q.Guid
FROM QuotationCommentLog l
LEFT JOIN WorkflowManagement.dbo.Quotation   q ON q.Id = l.QuotationId


INSERT INTO WorkflowHistory (StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem,SourceRef,RawJson,CreatedAtUtc,RecordGuid)
SELECT StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem,SourceRef,RawJson,CreatedAtUtc,q.Guid
FROM QuotationWorkflowHistory l
LEFT JOIN WorkflowManagement.dbo.Quotation   q ON q.Id = l.QuotationId
