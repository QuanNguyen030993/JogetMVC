IF OBJECT_ID(N'dbo.SignedBackPolicyIssuance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SignedBackPolicyIssuance
    (
        Id BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_SignedBackPolicyIssuance PRIMARY KEY,
        [Guid] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_Guid DEFAULT NEWID(),
        PolicyIssuanceId BIGINT NOT NULL,
        ReminderCount INT NOT NULL,
        ReminderDate DATETIME2 NULL,
        Note NVARCHAR(4000) NULL,
        CreatedBy NVARCHAR(255) NOT NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_CreatedBy DEFAULT N'',
        CreatedDate DATETIME2 NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_CreatedDate DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(255) NOT NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_ModifiedBy DEFAULT N'',
        ModifiedDate DATETIME2 NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_ModifiedDate DEFAULT GETDATE(),
        Deleted BIT NOT NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_Deleted DEFAULT 0,
        DeletedBy NVARCHAR(255) NOT NULL
            CONSTRAINT DF_SignedBackPolicyIssuance_DeletedBy DEFAULT N'',
        DeletedDate DATETIME2 NULL,
        RowOrder BIGINT NULL,
        CopyFromGuid UNIQUEIDENTIFIER NULL,
        DraftGuid UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_SignedBackPolicyIssuance_PolicyIssuance
            FOREIGN KEY (PolicyIssuanceId) REFERENCES dbo.PolicyIssuance(Id),
        CONSTRAINT CK_SignedBackPolicyIssuance_ReminderCount
            CHECK (ReminderCount > 0)
    );

    CREATE INDEX IX_SignedBackPolicyIssuance_PolicyIssuanceId
        ON dbo.SignedBackPolicyIssuance(PolicyIssuanceId, ReminderCount)
        WHERE Deleted = 0;
END;
