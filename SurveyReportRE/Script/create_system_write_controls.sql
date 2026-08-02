SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @Controls TABLE
(
    ParameterName NVARCHAR(255) NOT NULL,
    [Value] NVARCHAR(50) NOT NULL
);

INSERT INTO @Controls (ParameterName, [Value])
VALUES
    (N'HttpAuditRequest', N'true'),
    (N'ErrorClientLog', N'true'),
    (N'SignalR', N'true'),
    (N'InitialNotificationITAllRegions', N'true');

INSERT INTO dbo.Constant
(
    ParameterName, [Value], [Guid],
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
)
SELECT
    source.ParameterName,
    source.[Value],
    NEWID(),
    N'system', GETDATE(), N'system', GETDATE(), 0
FROM @Controls source
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.Constant target
    WHERE target.ParameterName = source.ParameterName
      AND target.Deleted = 0
);

COMMIT TRANSACTION;
