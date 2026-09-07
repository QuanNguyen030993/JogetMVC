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
INSERT INTO SLA
(
    Dept,
    Attributes,
    Code,
    Value,
    DecimalValue,
    Guid
)
VALUES
(
    'TS',
    N'{
        "fields":[
            {
                "name":"waitingDay",
                "label":"Số ngày accept đơn",
                "control":"number",
                "required":true,
                "min":0,
                "max":30,
                "value":3
            }
        ],
        "calculation":{
            "type":"manual",
            "unit":"day"
        }
    }',
    'WAIT_APCEPT_DAY',
    '3',
    3,
    NEWID()
),
(
    'TS',
    N'{
        "fields":[
            {
                "name":"processDay",
                "label":"Số xử lý đơn",
                "control":"number",
                "required":true,
                "min":0,
                "max":30,
                "value":3
            }
        ],
        "calculation":{
            "type":"manual",
            "unit":"day"
        }
    }',
    'WAIT_PROCESS_DAY',
    '3',
    3,
    NEWID()
),
(
    'UW',
    N'{
        "fields":[
            {
                "name":"waitingDay",
                "label":"Số ngày chờ thông tin",
                "control":"number",
                "required":true,
                "min":0,
                "max":60,
                "value":5
            }
        ],
        "calculation":{
            "type":"manual",
            "unit":"day"
        }
    }',
    'WAIT_INFORMATION_DAY',
    '5',
    5,
    NEWID()
),
(
    'PM',
    N'{
        "fields":[
            {
                "name":"fromDate",
                "label":"Từ ngày",
                "control":"date",
                "required":true
            },
            {
                "name":"toDate",
                "label":"Đến ngày",
                "control":"date",
                "required":true
            }
        ],
        "calculation":{
            "type":"dateDiff",
            "fieldFrom":"fromDate",
            "fieldTo":"toDate",
            "unit":"day"
        }
    }',
    'WAIT_ACCEPT_CUSTOM',
    '7',
    7,
    NEWID()
);


INSERT INTO Country (
    Name, Code, IsActive, Attributes, Guid,
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
    Deleted, DeletedBy, DeletedDate,
    RowOrder, CopyFromGuid, DraftGuid
)
VALUES
(N'Afghanistan', N'Afghanistan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 1, NULL, NULL),
(N'Albania', N'Albania', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 2, NULL, NULL),
(N'Algeria', N'Algeria', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 3, NULL, NULL),
(N'Andorra', N'Andorra', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 4, NULL, NULL),
(N'Angola', N'Angola', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 5, NULL, NULL),
(N'Antigua and Barbuda', N'Antigua and Barbuda', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 6, NULL, NULL),
(N'Argentina', N'Argentina', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 7, NULL, NULL),
(N'Armenia', N'Armenia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 8, NULL, NULL),
(N'Australia', N'Australia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 9, NULL, NULL),
(N'Austria', N'Austria', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 10, NULL, NULL),
(N'Azerbaijan', N'Azerbaijan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 11, NULL, NULL),
(N'Bahamas', N'Bahamas', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 12, NULL, NULL),
(N'Bahrain', N'Bahrain', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 13, NULL, NULL),
(N'Bangladesh', N'Bangladesh', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 14, NULL, NULL),
(N'Barbados', N'Barbados', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 15, NULL, NULL),
(N'Belarus', N'Belarus', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 16, NULL, NULL),
(N'Belgium', N'Belgium', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 17, NULL, NULL),
(N'Belize', N'Belize', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 18, NULL, NULL),
(N'Benin', N'Benin', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 19, NULL, NULL),
(N'Bhutan', N'Bhutan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 20, NULL, NULL),
(N'Bolivia', N'Bolivia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 21, NULL, NULL),
(N'Bosnia and Herzegovina', N'Bosnia and Herzegovina', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 22, NULL, NULL),
(N'Botswana', N'Botswana', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 23, NULL, NULL),
(N'Brazil', N'Brazil', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 24, NULL, NULL),
(N'Brunei', N'Brunei', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 25, NULL, NULL),
(N'Bulgaria', N'Bulgaria', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 26, NULL, NULL),
(N'Burkina Faso', N'Burkina Faso', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 27, NULL, NULL),
(N'Burundi', N'Burundi', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 28, NULL, NULL),
(N'Cabo Verde', N'Cabo Verde', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 29, NULL, NULL),
(N'Cambodia', N'Cambodia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 30, NULL, NULL),
(N'Cameroon', N'Cameroon', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 31, NULL, NULL),
(N'Canada', N'Canada', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 32, NULL, NULL),
(N'Central African Republic', N'Central African Republic', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 33, NULL, NULL),
(N'Chad', N'Chad', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 34, NULL, NULL),
(N'Chile', N'Chile', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 35, NULL, NULL),
(N'China', N'China', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 36, NULL, NULL),
(N'Colombia', N'Colombia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 37, NULL, NULL),
(N'Comoros', N'Comoros', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 38, NULL, NULL),
(N'Congo (Congo-Brazzaville)', N'Congo (Congo-Brazzaville)', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 39, NULL, NULL),
(N'Costa Rica', N'Costa Rica', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 40, NULL, NULL),
(N'Côte d''Ivoire', N'Côte d''Ivoire', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 41, NULL, NULL),
(N'Croatia', N'Croatia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 42, NULL, NULL),
(N'Cuba', N'Cuba', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 43, NULL, NULL),
(N'Cyprus', N'Cyprus', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 44, NULL, NULL),
(N'Czechia (Czech Republic)', N'Czechia (Czech Republic)', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 45, NULL, NULL),
(N'Democratic Republic of the Congo', N'Democratic Republic of the Congo', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 46, NULL, NULL),
(N'Denmark', N'Denmark', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 47, NULL, NULL),
(N'Djibouti', N'Djibouti', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 48, NULL, NULL),
(N'Dominica', N'Dominica', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 49, NULL, NULL),
(N'Dominican Republic', N'Dominican Republic', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 50, NULL, NULL),
(N'Ecuador', N'Ecuador', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 51, NULL, NULL),
(N'Egypt', N'Egypt', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 52, NULL, NULL),
(N'El Salvador', N'El Salvador', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 53, NULL, NULL),
(N'Equatorial Guinea', N'Equatorial Guinea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 54, NULL, NULL),
(N'Eritrea', N'Eritrea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 55, NULL, NULL),
(N'Estonia', N'Estonia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 56, NULL, NULL),
(N'Eswatini (fmr. "Swaziland")', N'Eswatini (fmr. "Swaziland")', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 57, NULL, NULL),
(N'Ethiopia', N'Ethiopia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 58, NULL, NULL),
(N'Fiji', N'Fiji', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 59, NULL, NULL),
(N'Finland', N'Finland', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 60, NULL, NULL),
(N'France', N'France', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 61, NULL, NULL),
(N'Gabon', N'Gabon', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 62, NULL, NULL),
(N'Gambia', N'Gambia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 63, NULL, NULL),
(N'Georgia', N'Georgia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 64, NULL, NULL),
(N'Germany', N'Germany', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 65, NULL, NULL),
(N'Ghana', N'Ghana', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 66, NULL, NULL),
(N'Greece', N'Greece', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 67, NULL, NULL),
(N'Grenada', N'Grenada', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 68, NULL, NULL),
(N'Guatemala', N'Guatemala', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 69, NULL, NULL),
(N'Guinea', N'Guinea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 70, NULL, NULL),
(N'Guinea-Bissau', N'Guinea-Bissau', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 71, NULL, NULL),
(N'Guyana', N'Guyana', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 72, NULL, NULL),
(N'Haiti', N'Haiti', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 73, NULL, NULL),
(N'Holy See', N'Holy See', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 74, NULL, NULL),
(N'Honduras', N'Honduras', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 75, NULL, NULL),
(N'Hungary', N'Hungary', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 76, NULL, NULL),
(N'Iceland', N'Iceland', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 77, NULL, NULL),
(N'India', N'India', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 78, NULL, NULL),
(N'Indonesia', N'Indonesia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 79, NULL, NULL),
(N'Iran', N'Iran', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 80, NULL, NULL),
(N'Iraq', N'Iraq', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 81, NULL, NULL),
(N'Ireland', N'Ireland', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 82, NULL, NULL),
(N'Israel', N'Israel', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 83, NULL, NULL),
(N'Italy', N'Italy', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 84, NULL, NULL),
(N'Jamaica', N'Jamaica', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 85, NULL, NULL),
(N'Japan', N'Japan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 86, NULL, NULL),
(N'Jordan', N'Jordan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 87, NULL, NULL),
(N'Kazakhstan', N'Kazakhstan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 88, NULL, NULL),
(N'Kenya', N'Kenya', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 89, NULL, NULL),
(N'Kiribati', N'Kiribati', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 90, NULL, NULL),
(N'Kuwait', N'Kuwait', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 91, NULL, NULL),
(N'Kyrgyzstan', N'Kyrgyzstan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 92, NULL, NULL),
(N'Laos', N'Laos', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 93, NULL, NULL),
(N'Latvia', N'Latvia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 94, NULL, NULL),
(N'Lebanon', N'Lebanon', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 95, NULL, NULL),
(N'Lesotho', N'Lesotho', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 96, NULL, NULL),
(N'Liberia', N'Liberia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 97, NULL, NULL),
(N'Libya', N'Libya', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 98, NULL, NULL),
(N'Liechtenstein', N'Liechtenstein', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 99, NULL, NULL),
(N'Lithuania', N'Lithuania', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 100, NULL, NULL),
(N'Luxembourg', N'Luxembourg', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 101, NULL, NULL),
(N'Madagascar', N'Madagascar', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 102, NULL, NULL),
(N'Malawi', N'Malawi', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 103, NULL, NULL),
(N'Malaysia', N'Malaysia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 104, NULL, NULL),
(N'Maldives', N'Maldives', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 105, NULL, NULL),
(N'Mali', N'Mali', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 106, NULL, NULL),
(N'Malta', N'Malta', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 107, NULL, NULL),
(N'Marshall Islands', N'Marshall Islands', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 108, NULL, NULL),
(N'Mauritania', N'Mauritania', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 109, NULL, NULL),
(N'Mauritius', N'Mauritius', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 110, NULL, NULL),
(N'Mexico', N'Mexico', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 111, NULL, NULL),
(N'Micronesia', N'Micronesia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 112, NULL, NULL),
(N'Moldova', N'Moldova', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 113, NULL, NULL),
(N'Monaco', N'Monaco', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 114, NULL, NULL),
(N'Mongolia', N'Mongolia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 115, NULL, NULL),
(N'Montenegro', N'Montenegro', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 116, NULL, NULL),
(N'Morocco', N'Morocco', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 117, NULL, NULL),
(N'Mozambique', N'Mozambique', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 118, NULL, NULL),
(N'Myanmar (formerly Burma)', N'Myanmar (formerly Burma)', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 119, NULL, NULL),
(N'Namibia', N'Namibia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 120, NULL, NULL),
(N'Nauru', N'Nauru', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 121, NULL, NULL),
(N'Nepal', N'Nepal', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 122, NULL, NULL),
(N'Netherlands', N'Netherlands', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 123, NULL, NULL),
(N'New Zealand', N'New Zealand', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 124, NULL, NULL),
(N'Nicaragua', N'Nicaragua', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 125, NULL, NULL),
(N'Niger', N'Niger', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 126, NULL, NULL),
(N'Nigeria', N'Nigeria', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 127, NULL, NULL),
(N'North Korea', N'North Korea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 128, NULL, NULL),
(N'North Macedonia', N'North Macedonia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 129, NULL, NULL),
(N'Norway', N'Norway', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 130, NULL, NULL),
(N'Oman', N'Oman', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 131, NULL, NULL),
(N'Pakistan', N'Pakistan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 132, NULL, NULL),
(N'Palau', N'Palau', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 133, NULL, NULL),
(N'Palestine State', N'Palestine State', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 134, NULL, NULL),
(N'Panama', N'Panama', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 135, NULL, NULL),
(N'Papua New Guinea', N'Papua New Guinea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 136, NULL, NULL),
(N'Paraguay', N'Paraguay', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 137, NULL, NULL),
(N'Peru', N'Peru', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 138, NULL, NULL),
(N'Philippines', N'Philippines', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 139, NULL, NULL),
(N'Poland', N'Poland', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 140, NULL, NULL),
(N'Portugal', N'Portugal', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 141, NULL, NULL),
(N'Qatar', N'Qatar', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 142, NULL, NULL),
(N'Romania', N'Romania', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 143, NULL, NULL),
(N'Russia', N'Russia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 144, NULL, NULL),
(N'Rwanda', N'Rwanda', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 145, NULL, NULL),
(N'Saint Kitts and Nevis', N'Saint Kitts and Nevis', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 146, NULL, NULL),
(N'Saint Lucia', N'Saint Lucia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 147, NULL, NULL),
(N'Saint Vincent and the Grenadines', N'Saint Vincent and the Grenadines', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 148, NULL, NULL),
(N'Samoa', N'Samoa', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 149, NULL, NULL),
(N'San Marino', N'San Marino', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 150, NULL, NULL),
(N'Sao Tome and Principe', N'Sao Tome and Principe', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 151, NULL, NULL),
(N'Saudi Arabia', N'Saudi Arabia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 152, NULL, NULL),
(N'Senegal', N'Senegal', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 153, NULL, NULL),
(N'Serbia', N'Serbia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 154, NULL, NULL),
(N'Seychelles', N'Seychelles', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 155, NULL, NULL),
(N'Sierra Leone', N'Sierra Leone', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 156, NULL, NULL),
(N'Singapore', N'Singapore', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 157, NULL, NULL),
(N'Slovakia', N'Slovakia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 158, NULL, NULL),
(N'Slovenia', N'Slovenia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 159, NULL, NULL),
(N'Solomon Islands', N'Solomon Islands', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 160, NULL, NULL),
(N'Somalia', N'Somalia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 161, NULL, NULL),
(N'South Africa', N'South Africa', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 162, NULL, NULL),
(N'South Korea', N'South Korea', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 163, NULL, NULL),
(N'South Sudan', N'South Sudan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 164, NULL, NULL),
(N'Spain', N'Spain', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 165, NULL, NULL),
(N'Sri Lanka', N'Sri Lanka', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 166, NULL, NULL),
(N'Sudan', N'Sudan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 167, NULL, NULL),
(N'Suriname', N'Suriname', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 168, NULL, NULL),
(N'Sweden', N'Sweden', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 169, NULL, NULL),
(N'Switzerland', N'Switzerland', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 170, NULL, NULL),
(N'Syria', N'Syria', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 171, NULL, NULL),
(N'Taiwan', N'Taiwan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 172, NULL, NULL),
(N'Tajikistan', N'Tajikistan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 173, NULL, NULL),
(N'Tanzania', N'Tanzania', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 174, NULL, NULL),
(N'Thailand', N'Thailand', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 175, NULL, NULL),
(N'Timor-Leste', N'Timor-Leste', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 176, NULL, NULL),
(N'Togo', N'Togo', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 177, NULL, NULL),
(N'Tonga', N'Tonga', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 178, NULL, NULL),
(N'Trinidad and Tobago', N'Trinidad and Tobago', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 179, NULL, NULL),
(N'Tunisia', N'Tunisia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 180, NULL, NULL),
(N'Turkey', N'Turkey', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 181, NULL, NULL),
(N'Turkmenistan', N'Turkmenistan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 182, NULL, NULL),
(N'Tuvalu', N'Tuvalu', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 183, NULL, NULL),
(N'Uganda', N'Uganda', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 184, NULL, NULL),
(N'Ukraine', N'Ukraine', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 185, NULL, NULL),
(N'United Arab Emirates', N'United Arab Emirates', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 186, NULL, NULL),
(N'United Kingdom', N'United Kingdom', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 187, NULL, NULL),
(N'United States of America', N'United States of America', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 188, NULL, NULL),
(N'Uruguay', N'Uruguay', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 189, NULL, NULL),
(N'Uzbekistan', N'Uzbekistan', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 190, NULL, NULL),
(N'Vanuatu', N'Vanuatu', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 191, NULL, NULL),
(N'Venezuela', N'Venezuela', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 192, NULL, NULL),
(N'Vietnam', N'Vietnam', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 193, NULL, NULL),
(N'Yemen', N'Yemen', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 194, NULL, NULL),
(N'Zambia', N'Zambia', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 195, NULL, NULL),
(N'Zimbabwe', N'Zimbabwe', 1, NULL, NEWID(), NULL, GETDATE(), NULL, NULL, 0, NULL, NULL, 196, NULL, NULL)


DECLARE @PolicyIssuanceId BIGINT = 59;

WITH Q AS
(
    SELECT *
    FROM
    (
        VALUES
        ('PPPPPP','QT-000381',1128,N'DAO DUY THANG'),
        ('PPPPPP','QT-000433',1128,N'DAO DUY THANG'),
        ('DEMO-1784166047382','QT-000448',1128,N'DAO DUY THANG'),
        ('DEMO-1784558065768','QT-000505',1128,N'DAO DUY THANG'),
        ('DEMO-1784770837586','QT-000529',1128,N'DAO DUY THANG'),
        ('DEMO-1786526300398','QT-000556',1121,N'TRAN MANH HUNG'),
        ('DEMO-1787661592380','QT-000627',1128,N'DAO DUY THANG')
    ) X
    (
        PolicyNo,
        QuotationCode,
        ClientId,
        ClientName
    )
),
R AS
(
    SELECT 'R1' Renew
    UNION ALL SELECT 'R2'
    UNION ALL SELECT 'R3'
),
E AS
(
    SELECT NULL Endorsement
    UNION ALL SELECT 'E1'
    UNION ALL SELECT 'E2'
    UNION ALL SELECT 'E3'
)
INSERT INTO dbo.PolicyIssuanceSubDetails
(
    PolicyIssuanceId,
    TranNo,
    Renew,
    Guid,
    CreatedBy,
    CreatedDate,
    Deleted,
    RowOrder,
    PolicyNo,
    QuotationCode,
    ClientId,
    ClientName,
    Endorsement
)
SELECT
    @PolicyIssuanceId,
    ROW_NUMBER() OVER(ORDER BY Q.QuotationCode,R.Renew,E.Endorsement),
    R.Renew,
    NEWID(),
    'System',
    GETDATE(),
    0,
    ROW_NUMBER() OVER(ORDER BY Q.QuotationCode,R.Renew,E.Endorsement),
    Q.PolicyNo,
    Q.QuotationCode,
    Q.ClientId,
    Q.ClientName,
    E.Endorsement
FROM Q
CROSS JOIN R
CROSS JOIN E
ORDER BY
    Q.QuotationCode,
    R.Renew,
    E.Endorsement;


    
 UPDATE NotificationTemplate SET NotificationQuery = N'SELECT PolicyIssuanceCode AS ''MaCapDon'',
PolicyIssuanceCode AS ''MaDonCapDon'',
LineCode AS ''LineCode'',
QuotationCode AS ''MaBaoGia'',
PolicyIssuanceRequest AS ''MaRequest'',
p.ModifiedBy AS ''NguoiThucHien'',
PolicyNo AS ''PolicyNo'',
p1.ProductCode AS ''ProductCode'',
ProductName AS ''ProductName'',
RequestType AS ''RequestType'',
ClientName AS ''TenKhachHang''
FROM PolicyIssuance p
LEFT JOIN [Product] p1 ON  p.ProductCode = p1.ProductCode
WHERE Id = @PolicyIssuanceId' WHERE Id IN (6,17)


 UPDATE NotificationTemplate SET NotificationQuery = N'SELECT LineCode AS ''LineCode'',
p.QuotationCode AS ''MaBaoGia'',
p.RequestNo AS ''MaRequest'',
p.ModifiedBy AS ''NguoiThucHien'',
PolicyNo AS ''PolicyNo'',
p.ProductCode AS ''ProductCode'',
p1.ProductName AS ''ProductName'',
RequestType AS ''RequestType'',
ClientName AS ''TenKhachHang''
FROM Quotation  p
LEFT JOIN [Product] p1 ON  p.ProductCode = p1.ProductCode
WHERE Id = @QuotationId' WHERE Id IN (7
,9
,10
,12
,13
,14
,15
,16)