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




/****** Object:  Table [dbo].[QuotationCommentLog]    Script Date: 6/17/2026 9:07:39 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE  TABLE [dbo].[CommentLog](
	[CommentId] [bigint] IDENTITY(1,1) NOT NULL,
	[DeptCode] [nvarchar](1000) NULL,
	[CommentOrder] [int] NULL,
	[CommentBy] [nvarchar](255) NULL,
	[CommentTime] [datetime2](0) NULL,
	[CommentText] [nvarchar](max) NULL,
	[SourceSystem] [nvarchar](50) NULL,
	[SourceRef] [nvarchar](200) NULL,
	[RawJson] [nvarchar](max) NULL,
	[CreatedAtUtc] [datetime2](0) NOT NULL,
	[RecordGuid] [uniqueidentifier] NULL
PRIMARY KEY CLUSTERED 
(
	[CommentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[CommentLog] ADD  CONSTRAINT [DF_CL_CREATE dAtUtc]  DEFAULT (sysutcdatetime()) FOR [CREATE dAtUtc]
GO


USE [WorkflowManagementLog]
GO

/****** Object:  Table [dbo].[QuotationWorkflowHistory]    Script Date: 6/17/2026 9:07:46 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE  TABLE [dbo].[WorkflowHistory](
	[HistoryId] [bigint] IDENTITY(1,1) NOT NULL,
	[StepNo] [nvarchar](255) NULL,
	[DeptCode] [nvarchar](20) NOT NULL,
	[ActionTime] [datetime2](0) NULL,
	[ActionNote] [nvarchar](500) NULL,
	[FromDeptCode] [nvarchar](20) NULL,
	[ToDeptCode] [nvarchar](20) NULL,
	[ActionCode] [nvarchar](50) NULL,
	[Actor] [nvarchar](255) NULL,
	[SourceSystem] [nvarchar](50) NULL,
	[SourceRef] [nvarchar](200) NULL,
	[RawJson] [nvarchar](max) NULL,
	[CreatedAtUtc] [datetime2](0) NOT NULL,
	[RecordGuid] [uniqueidentifier] NULL
PRIMARY KEY CLUSTERED 
(
	[HistoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[WorkflowHistory] ADD  CONSTRAINT [DF_WH_CREATE dAtUtc]  DEFAULT (sysutcdatetime()) FOR [CREATE dAtUtc]
GO




