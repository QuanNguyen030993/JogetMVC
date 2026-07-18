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

/*
    Policy Issuance receives a snapshot of ChecklistDefinition when PM accepts.
    Keep the definition id so the copy operation is idempotent and the snapshot
    remains independent from later master-data changes.
*/
IF OBJECT_ID(N'dbo.PolicyIssuanceChecklist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyIssuanceChecklist
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PolicyIssuanceChecklist PRIMARY KEY,
        [Guid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Guid DEFAULT NEWID(),
        PolicyIssuanceId BIGINT NOT NULL,
        ChecklistDefinitionId BIGINT NOT NULL,
        SequenceNo INT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_SequenceNo DEFAULT 0,
        PMCheck BIT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_PMCheck DEFAULT 0,
        Checkpoint NVARCHAR(100) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Checkpoint DEFAULT N'',
        NeedToCheck NVARCHAR(MAX) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_NeedToCheck DEFAULT N'',
        Result BIT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Result DEFAULT 0,
        LineId BIGINT NOT NULL,
        ProductId BIGINT NOT NULL,
        CreatedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_CreatedBy DEFAULT N'',
        CreatedDate DATETIME2 NULL CONSTRAINT DF_PolicyIssuanceChecklist_CreatedDate DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_ModifiedBy DEFAULT N'',
        ModifiedDate DATETIME2 NULL CONSTRAINT DF_PolicyIssuanceChecklist_ModifiedDate DEFAULT GETDATE(),
        Deleted BIT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Deleted DEFAULT 0,
        DeletedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_DeletedBy DEFAULT N'',
        DeletedDate DATETIME2 NULL,
        RowOrder BIGINT NULL,
        CopyFromGuid UNIQUEIDENTIFIER NULL,
        DraftGuid UNIQUEIDENTIFIER NULL
    );
END;

/* Upgrade the legacy one-row/boolean checklist table without dropping data. */
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'ChecklistDefinitionId') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD ChecklistDefinitionId BIGINT NULL;
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'SequenceNo') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD SequenceNo INT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_SequenceNo DEFAULT 0;
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'PMCheck') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD PMCheck BIT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_PMCheck DEFAULT 0;
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'Checkpoint') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD Checkpoint NVARCHAR(100) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Checkpoint DEFAULT N'';
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'NeedToCheck') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD NeedToCheck NVARCHAR(MAX) NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_NeedToCheck DEFAULT N'';
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'Result') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD Result BIT NOT NULL CONSTRAINT DF_PolicyIssuanceChecklist_Result DEFAULT 0;
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'LineId') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD LineId BIGINT NULL;
IF COL_LENGTH(N'dbo.PolicyIssuanceChecklist', N'ProductId') IS NULL
    ALTER TABLE dbo.PolicyIssuanceChecklist ADD ProductId BIGINT NULL;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_PolicyIssuanceChecklist_Definition'
      AND object_id = OBJECT_ID(N'dbo.PolicyIssuanceChecklist')
)
BEGIN
    CREATE UNIQUE INDEX UX_PolicyIssuanceChecklist_Definition
        ON dbo.PolicyIssuanceChecklist(PolicyIssuanceId, ChecklistDefinitionId)
        WHERE ChecklistDefinitionId IS NOT NULL AND Deleted = 0;
END;
