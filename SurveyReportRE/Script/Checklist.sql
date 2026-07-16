IF OBJECT_ID(N'dbo.ChecklistDefinition', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChecklistDefinition
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ChecklistDefinition PRIMARY KEY,
        [Guid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ChecklistDefinition_Guid DEFAULT NEWID(),
        SequenceNo INT NOT NULL CONSTRAINT DF_ChecklistDefinition_SequenceNo DEFAULT 0,
        PMCheck BIT NOT NULL CONSTRAINT DF_ChecklistDefinition_PMCheck DEFAULT 0,
        Checkpoint NVARCHAR(100) NOT NULL CONSTRAINT DF_ChecklistDefinition_Checkpoint DEFAULT N'',
        NeedToCheck NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ChecklistDefinition_NeedToCheck DEFAULT N'',
        Result BIT NOT NULL CONSTRAINT DF_ChecklistDefinition_Result DEFAULT 0,
        LineId BIGINT NOT NULL CONSTRAINT DF_ChecklistDefinition_LineId DEFAULT 0,
        ProductId BIGINT NOT NULL CONSTRAINT DF_ChecklistDefinition_ProductId DEFAULT 0,
        CreatedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_ChecklistDefinition_CreatedBy DEFAULT N'',
        CreatedDate DATETIME2 NULL CONSTRAINT DF_ChecklistDefinition_CreatedDate DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_ChecklistDefinition_ModifiedBy DEFAULT N'',
        ModifiedDate DATETIME2 NULL CONSTRAINT DF_ChecklistDefinition_ModifiedDate DEFAULT GETDATE(),
        Deleted BIT NOT NULL CONSTRAINT DF_ChecklistDefinition_Deleted DEFAULT 0,
        DeletedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_ChecklistDefinition_DeletedBy DEFAULT N'',
        DeletedDate DATETIME2 NULL,
        RowOrder BIGINT NULL,
        CopyFromGuid UNIQUEIDENTIFIER NULL,
        DraftGuid UNIQUEIDENTIFIER NULL
    );
END;

IF OBJECT_ID(N'dbo.Checklist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Checklist
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Checklist PRIMARY KEY,
        [Guid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Checklist_Guid DEFAULT NEWID(),
        RecordGuid UNIQUEIDENTIFIER NOT NULL,
        SequenceNo INT NOT NULL CONSTRAINT DF_Checklist_SequenceNo DEFAULT 0,
        PMCheck BIT NOT NULL CONSTRAINT DF_Checklist_PMCheck DEFAULT 0,
        Checkpoint NVARCHAR(100) NOT NULL CONSTRAINT DF_Checklist_Checkpoint DEFAULT N'',
        NeedToCheck NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Checklist_NeedToCheck DEFAULT N'',
        Result BIT NOT NULL CONSTRAINT DF_Checklist_Result DEFAULT 0,
        LineId BIGINT NOT NULL CONSTRAINT DF_Checklist_LineId DEFAULT 0,
        ProductId BIGINT NOT NULL CONSTRAINT DF_Checklist_ProductId DEFAULT 0,
        CreatedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_Checklist_CreatedBy DEFAULT N'',
        CreatedDate DATETIME2 NULL CONSTRAINT DF_Checklist_CreatedDate DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_Checklist_ModifiedBy DEFAULT N'',
        ModifiedDate DATETIME2 NULL CONSTRAINT DF_Checklist_ModifiedDate DEFAULT GETDATE(),
        Deleted BIT NOT NULL CONSTRAINT DF_Checklist_Deleted DEFAULT 0,
        DeletedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_Checklist_DeletedBy DEFAULT N'',
        DeletedDate DATETIME2 NULL,
        RowOrder BIGINT NULL,
        CopyFromGuid UNIQUEIDENTIFIER NULL,
        DraftGuid UNIQUEIDENTIFIER NULL
    );

    CREATE INDEX IX_Checklist_RecordGuid
        ON dbo.Checklist(RecordGuid);
END;
