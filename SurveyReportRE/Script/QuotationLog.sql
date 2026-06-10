CREATE TABLE dbo.QuotationCommentLog (
    CommentId         BIGINT IDENTITY(1,1) PRIMARY KEY,
    QuotationId       BIGINT NOT NULL,
    --QuotationCode     NVARCHAR(50) NULL,          -- denormalize để query nhanh (optional)

    DeptCode          NVARCHAR(20) NULL,              -- MKT/TS/UW/LMKT/PM
    CommentOrder      INT NULL,                       -- c.order (900,901,...)
    CommentBy         NVARCHAR(150) NULL,             -- c.user
    CommentTime       DATETIME2(0) NULL,              -- parse từ c.time
    CommentText       NVARCHAR(MAX) NULL,             -- c.comment

    SourceSystem      NVARCHAR(50) NULL,              -- Joget / Portal / API...
    SourceRef         NVARCHAR(200) NULL,             -- id bên hệ nguồn (nếu có)
    RawJson           NVARCHAR(MAX) NULL,             -- lưu nguyên payload item nếu cần

    CreatedAtUtc      DATETIME2(0) NOT NULL CONSTRAINT DF_QCL_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),


);
GO

CREATE INDEX IX_QCL_QuotationId_Time ON dbo.QuotationCommentLog(QuotationId, CommentTime DESC);
--CREATE INDEX IX_QCL_QuotationCode_Time ON dbo.QuotationCommentLog(QuotationCode, CommentTime DESC);
GO
CREATE TABLE dbo.QuotationWorkflowHistory (
    HistoryId         BIGINT IDENTITY(1,1) PRIMARY KEY,
    QuotationId       BIGINT NOT NULL,
    --QuotationCode     NVARCHAR(50) NULL,          -- denormalize (optional)

    StepNo            NVARCHAR(100) NULL,                       -- thứ tự nếu hệ nguồn có, hoặc bạn tự generate
    DeptCode          NVARCHAR(20) NOT NULL,          -- x.dept
    ActionTime        DATETIME2(0) NULL,              -- x.time
    ActionNote        NVARCHAR(500) NULL,             -- x.note

    FromDeptCode      NVARCHAR(20) NULL,              -- nếu hệ nguồn có (transition)
    ToDeptCode        NVARCHAR(20) NULL,              -- nếu hệ nguồn có
    ActionCode        NVARCHAR(50) NULL,              -- Submitted/Approved/Returned/...
    Actor             NVARCHAR(150) NULL,             -- nếu API có user thực hiện
    SourceSystem      NVARCHAR(50) NULL,
    SourceRef         NVARCHAR(200) NULL,
    RawJson           NVARCHAR(MAX) NULL,

    CreatedAtUtc      DATETIME2(0) NOT NULL CONSTRAINT DF_QWH_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),


);
GO

CREATE INDEX IX_QWH_QuotationId_Time ON dbo.QuotationWorkflowHistory(QuotationId, ActionTime DESC);
--CREATE INDEX IX_QWH_QuotationCode_Time ON dbo.QuotationWorkflowHistory(QuotationCode, ActionTime DESC);
GO
