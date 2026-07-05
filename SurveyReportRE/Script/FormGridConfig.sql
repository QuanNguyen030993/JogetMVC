SET QUOTED_IDENTIFIER ON
SET ANSI_NULLS ON
GO

ALTER PROCEDURE dbo.usp_FormGridConfig
(	
    --EXEC usp_FormGridConfig
	 @TableName VARCHAR(100) = ''
	 , @TableId   INT = NULL
)
AS 
BEGIN 	

     SELECT 
         col.column_id AS Id,  
         STUFF(LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name)), 1, LEN(col.name), LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name))) AS DataField, 
         CASE 
             WHEN typ.name IN ('varchar', 'nvarchar', 'char', 'text', 'ntext') THEN 'string'
             WHEN typ.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money') THEN 'number'
             WHEN typ.name IN ('bit') THEN 'boolean' 
             ELSE 'other' 
         END AS DataType,  
        CASE 
              WHEN typ.name IN ('varchar', 'nvarchar', 'char', 'text', 'ntext') THEN 'dxTextBox'
             WHEN typ.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money') THEN 'dxNumberBox'
             WHEN typ.name IN ('bit') THEN 'dxCheckBox' 
             ELSE 'dxTextBox' 
         END AS FormDataType,  
         1 AS AllowGrouping,  
         1 AS AllowHeaderFiltering,  
         col.name AS Caption,
		 @TableId AS SysTableId,
		 1 AS [Order],
		 1 AS Visible
		 INTO #Tmp_NewTable
     FROM sys.columns col
     JOIN sys.types typ ON col.user_type_id = typ.user_type_id
     WHERE col.object_id = OBJECT_ID(@TableName) AND col.name NOT IN ('Id', 'CreatedBy', 'CreatedDate', 'ModifiedDate', 'ModifiedBy','Deleted','DeletedBy','DeletedDate')
	 INSERT INTO dbo.DataGridConfig
	 (
	     AllowGrouping,
	     AllowHeaderFiltering,
	     Caption,
	     DataField,
	     DataType,
	     SysTableId,
	     FormDataType,
	     [Order],
	     Visible
      )
	  SELECT AllowGrouping,
	     AllowHeaderFiltering,
	     Caption,
	     DataField,
	     DataType,
	     SysTableId,
	     FormDataType,
	     [Order],
	     Visible
		 FROM #Tmp_NewTable
		 WHERE NOT EXISTS (SELECT TOP 1 1 FROM dbo.DataGridConfig WHERE SysTableId = @TableId)
END  


GO

CREATE TABLE [dbo].[HttpRequestAuditLog]
(
[Id] [bigint] NOT NULL IDENTITY(1, 1),
[TraceId] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[RequestTimeUtc] [datetimeoffset] NOT NULL,
[Scheme] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Method] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Path] [nvarchar] (1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,          -- Tăng từ 120 -> 1000 (Cho URL Path dài)
[QueryString] [nvarchar] (2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,   -- Tăng từ 120 -> 2000 (Cho Query parameters)
[FullUrl] [nvarchar] (2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Controller] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Action] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[RouteValues] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,    -- Tăng từ 120 -> MAX (Chứa JSON Route data)
[ClientIp] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[UserAgent] [nvarchar] (1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,     -- Tăng từ 120 -> 1000 (Chứa User-Agent trình duyệt)
[Referer] [nvarchar] (2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,       -- Tăng từ 120 -> 2000 (Chứa Referrer URL)
[UserName] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[IsAuthenticated] [bit] NOT NULL CONSTRAINT [DF__HttpReque__IsAut__690797E6] DEFAULT ((0)),
[AuthenticationType] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Claims] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,         -- Tăng từ 120 -> MAX (Chứa JSON Claims của User)
[ContentType] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[ContentLength] [bigint] NULL,
[RequestBody] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,    -- Tăng từ 120 -> MAX (Chứa JSON Request Body)
[StatusCode] [int] NOT NULL,
[ElapsedMilliseconds] [bigint] NOT NULL,
[HasException] [bit] NOT NULL CONSTRAINT [DF__HttpReque__HasEx__69FBBC1F] DEFAULT ((0)),
[Exception] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,      -- Tăng từ 120 -> MAX (Chứa Stack trace khi crash)
[Source] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[CustomTags] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,     -- Tăng từ 120 -> MAX (Cho tags tùy chỉnh dạng JSON)
[Token] [nvarchar] (max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,          -- Tăng từ 120 -> MAX (Chứa Bearer JWT Tokens dài)
[EncryptMethod] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[Guid] [uniqueidentifier] NOT NULL CONSTRAINT [DF__HttpReques__Guid__6AEFE058] DEFAULT (newid()),
[CreatedBy] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[CreatedDate] [datetime2] NULL CONSTRAINT [DF__HttpReque__Creat__6BE40491] DEFAULT (getdate()),
[ModifiedBy] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[ModifiedDate] [datetime2] NULL,
[Deleted] [bit] NOT NULL CONSTRAINT [DF__HttpReque__Delet__6CD828CA] DEFAULT ((0)),
[DeletedBy] [nvarchar] (120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
[DeletedDate] [datetime2] NULL,
[RowOrder] [bigint] NULL,
[CopyFromGuid] [uniqueidentifier] NULL,
[DraftGuid] [uniqueidentifier] NULL
) ON [PRIMARY]
GO