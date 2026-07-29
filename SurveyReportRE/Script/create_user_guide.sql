SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.Employee', N'TotalLoginHours') IS NULL
BEGIN
    ALTER TABLE dbo.Employee
        ADD TotalLoginHours DECIMAL(18,4) NOT NULL
            CONSTRAINT DF_Employee_TotalLoginHours DEFAULT 0;
END;

IF OBJECT_ID(N'dbo.GuideStep', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GuideStep
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_GuideStep PRIMARY KEY,
        [Guid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_GuideStep_Guid DEFAULT NEWID(),
        GuideKey NVARCHAR(100) NOT NULL,
        GuideTitle NVARCHAR(255) NOT NULL,
        GuideVersion INT NOT NULL CONSTRAINT DF_GuideStep_GuideVersion DEFAULT 1,
        Route NVARCHAR(500) NOT NULL CONSTRAINT DF_GuideStep_Route DEFAULT N'',
        SourceType NVARCHAR(30) NOT NULL CONSTRAINT DF_GuideStep_SourceType DEFAULT N'manual',
        WikiUrl NVARCHAR(1000) NOT NULL CONSTRAINT DF_GuideStep_WikiUrl DEFAULT N'',
        MaxLoginHours DECIMAL(18,4) NOT NULL CONSTRAINT DF_GuideStep_MaxLoginHours DEFAULT 0,
        AutoStart BIT NOT NULL CONSTRAINT DF_GuideStep_AutoStart DEFAULT 0,
        StepNumber INT NOT NULL,
        StepTitle NVARCHAR(255) NOT NULL,
        Selector NVARCHAR(1000) NOT NULL CONSTRAINT DF_GuideStep_Selector DEFAULT N'',
        Placement NVARCHAR(20) NOT NULL CONSTRAINT DF_GuideStep_Placement DEFAULT N'auto',
        Content NVARCHAR(MAX) NOT NULL CONSTRAINT DF_GuideStep_Content DEFAULT N'',
        ContentFormat NVARCHAR(20) NOT NULL CONSTRAINT DF_GuideStep_ContentFormat DEFAULT N'markdown',
        WaitTimeoutMs INT NOT NULL CONSTRAINT DF_GuideStep_WaitTimeoutMs DEFAULT 5000,
        IsEnabled BIT NOT NULL CONSTRAINT DF_GuideStep_IsEnabled DEFAULT 1,
        CreatedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_GuideStep_CreatedBy DEFAULT N'',
        CreatedDate DATETIME2 NULL CONSTRAINT DF_GuideStep_CreatedDate DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_GuideStep_ModifiedBy DEFAULT N'',
        ModifiedDate DATETIME2 NULL CONSTRAINT DF_GuideStep_ModifiedDate DEFAULT GETDATE(),
        Deleted BIT NOT NULL CONSTRAINT DF_GuideStep_Deleted DEFAULT 0,
        DeletedBy NVARCHAR(255) NOT NULL CONSTRAINT DF_GuideStep_DeletedBy DEFAULT N'',
        DeletedDate DATETIME2 NULL,
        RowOrder BIGINT NULL,
        CopyFromGuid UNIQUEIDENTIFIER NULL,
        DraftGuid UNIQUEIDENTIFIER NULL
    );

    CREATE INDEX IX_GuideStep_Route
        ON dbo.GuideStep(Route, IsEnabled, Deleted);

    CREATE UNIQUE INDEX UX_GuideStep_KeyStep
        ON dbo.GuideStep(GuideKey, StepNumber)
        WHERE Deleted = 0;
END;

/* Backfill the aggregate for existing session data. */
;WITH ValidSessions AS
(
    SELECT
        Id,
        UserName,
        LoginTime AS SessionStart,
        CASE
            WHEN COALESCE(LogoutTime, GETDATE()) < LoginTime THEN LoginTime
            ELSE COALESCE(LogoutTime, GETDATE())
        END AS SessionEnd
    FROM dbo.UsersSession WITH (NOLOCK)
    WHERE LoginTime IS NOT NULL AND Deleted = 0
),
RunningSessions AS
(
    SELECT *,
        MAX(SessionEnd) OVER
        (
            PARTITION BY UserName
            ORDER BY SessionStart, Id
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS PreviousMaxEnd
    FROM ValidSessions
),
SessionGroups AS
(
    SELECT *,
        SUM(CASE WHEN PreviousMaxEnd IS NULL OR SessionStart > PreviousMaxEnd THEN 1 ELSE 0 END)
        OVER (PARTITION BY UserName ORDER BY SessionStart, Id) AS SessionGroup
    FROM RunningSessions
),
MergedSessions AS
(
    SELECT UserName, SessionGroup, MIN(SessionStart) AS SessionStart, MAX(SessionEnd) AS SessionEnd
    FROM SessionGroups
    GROUP BY UserName, SessionGroup
),
LoginUsage AS
(
    SELECT
        UserName,
        CAST(SUM(DATEDIFF_BIG(MILLISECOND, SessionStart, SessionEnd)) / 3600000.0 AS DECIMAL(18,4)) AS TotalHours
    FROM MergedSessions
    GROUP BY UserName
)
UPDATE employee
SET employee.TotalLoginHours = usage.TotalHours
FROM dbo.Employee employee
INNER JOIN LoginUsage usage
    ON usage.UserName = employee.AccountName;

COMMIT TRANSACTION;
