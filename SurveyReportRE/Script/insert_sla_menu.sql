-- =========================================================================
-- SLA AND MENU INSERT SCRIPT FOR UW, PM, FO, LMKT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Get parent SLA menu ID
    DECLARE @ParentId INT;
    SELECT @ParentId = Id FROM Menu WHERE Name = 'SLA' AND ParentId IS NULL AND Deleted = 0;

    IF @ParentId IS NULL
    BEGIN
        PRINT 'Parent SLA menu not found!';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Insert/Update Child Menus and Role Permissions
    -- SLA TS (Existing menu, update permission)
    UPDATE Menu
    SET PageSystem = '{"permission": "TS"}'
    WHERE ParentId = @ParentId AND Caption = 'SLA TS' AND Deleted = 0;
    PRINT 'Updated menu SLA TS permission';

    -- SLA UW
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA UW' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA UW', NULL, @ParentId, NULL, '/Config/SLA_Form/UW', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 2, '{"permission": "UW"}', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA UW';
    END
    ELSE
    BEGIN
        UPDATE Menu SET PageSystem = '{"permission": "UW"}' WHERE ParentId = @ParentId AND Caption = 'SLA UW' AND Deleted = 0;
        PRINT 'Updated menu SLA UW permission';
    END

    -- SLA PM
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA PM' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA PM', NULL, @ParentId, NULL, '/Config/SLA_Form/PM', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 3, '{"permission": "PM"}', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA PM';
    END
    ELSE
    BEGIN
        UPDATE Menu SET PageSystem = '{"permission": "PM"}' WHERE ParentId = @ParentId AND Caption = 'SLA PM' AND Deleted = 0;
        PRINT 'Updated menu SLA PM permission';
    END

    -- SLA FO
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA FO' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA FO', NULL, @ParentId, NULL, '/Config/SLA_Form/FO', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 4, '{"permission": "FO"}', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA FO';
    END
    ELSE
    BEGIN
        UPDATE Menu SET PageSystem = '{"permission": "FO"}' WHERE ParentId = @ParentId AND Caption = 'SLA FO' AND Deleted = 0;
        PRINT 'Updated menu SLA FO permission';
    END

    -- SLA LMKT
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA LMKT' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA LMKT', NULL, @ParentId, NULL, '/Config/SLA_Form/LMKT', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 5, '{"permission": "LMKT"}', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA LMKT';
    END
    ELSE
    BEGIN
        UPDATE Menu SET PageSystem = '{"permission": "LMKT"}' WHERE ParentId = @ParentId AND Caption = 'SLA LMKT' AND Deleted = 0;
        PRINT 'Updated menu SLA LMKT permission';
    END

    -- 3. Insert default SLA entries for FO and LMKT
    -- FO: WAIT_SUBMIT_DAY
    IF NOT EXISTS (SELECT 1 FROM SLA WHERE Dept = 'FO' AND Code = 'WAIT_SUBMIT_DAY' AND Deleted = 0)
    BEGIN
        INSERT INTO SLA (
            Dept, Attributes, Code, Value, DecimalValue, FromDate, ToDate, Duration, Guid,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate, BooleanValue
        ) VALUES (
            'FO', 
            N'{"fields":[{"name":"waitingDay","label":"Số ngày nộp đơn","control":"number","required":true,"min":0,"max":30,"value":5}],"calculation":{"type":"manual","unit":"day"}}',
            'WAIT_SUBMIT_DAY', '5', 5, NULL, NULL, NULL, NEWID(),
            'quan.nh', GETDATE(), '', GETDATE(), 0, NULL, NULL, 0
        );
        PRINT 'Inserted SLA record for FO';
    END

    -- LMKT: WAIT_LMKT_PROCESS
    IF NOT EXISTS (SELECT 1 FROM SLA WHERE Dept = 'LMKT' AND Code = 'WAIT_LMKT_PROCESS' AND Deleted = 0)
    BEGIN
        INSERT INTO SLA (
            Dept, Attributes, Code, Value, DecimalValue, FromDate, ToDate, Duration, Guid,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate, BooleanValue
        ) VALUES (
            'LMKT', 
            N'{"fields":[{"name":"processDay","label":"Số ngày xử lý LMKT","control":"number","required":true,"min":0,"max":30,"value":7}],"calculation":{"type":"manual","unit":"day"}}',
            'WAIT_LMKT_PROCESS', '7', 7, NULL, NULL, NULL, NEWID(),
            'quan.nh', GETDATE(), '', GETDATE(), 0, NULL, NULL, 0
        );
        PRINT 'Inserted SLA record for LMKT';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Menu & SLA items configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
INSERT INTO SLA
(
    Dept, Attributes, Code, Value, DecimalValue,
    FromDate, ToDate, Duration, Guid,
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
    Deleted, DeletedBy, DeletedDate, RowOrder,
    CopyFromGuid, DraftGuid, BooleanValue, Unit
)
VALUES
('FO', N'{"fields":[{"name":"gapTatDay","label":"Số ngày Gap TAT","control":"number","required":true,"min":0,"max":30,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'GAP_TAT_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 1, NULL, NULL, 0, 'day'),

('FO', N'{"fields":[{"name":"tatDay","label":"Số ngày TAT","control":"number","required":true,"min":0,"max":90,"value":5}],"calculation":{"type":"manual","unit":"day"}}', 'TAT_DAY', 5, 5, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 2, NULL, NULL, 0, 'day'),

('TS', N'{"fields":[{"name":"gapTatDay","label":"Số ngày Gap TAT","control":"number","required":true,"min":0,"max":30,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'GAP_TAT_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 3, NULL, NULL, 0, 'day'),

('TS', N'{"fields":[{"name":"tatDay","label":"Số ngày TAT","control":"number","required":true,"min":0,"max":90,"value":21}],"calculation":{"type":"manual","unit":"day"}}', 'TAT_DAY', 21, 21, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 4, NULL, NULL, 0, 'day'),

('TS', N'{"fields":[{"name":"renewQuotationDay","label":"Số ngày nhắc renew hợp đồng báo giá","control":"number","required":true,"min":1,"max":365,"value":60}],"calculation":{"type":"beforeDate","unit":"day"}}', 'RENEW_QUOTATION_DAY', 60, 60, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 5, NULL, NULL, 0, 'calendar_day'),

('TS', N'{"fields":[{"name":"signReminderDay","label":"Số ngày nhắc ký","control":"number","required":true,"min":1,"max":30,"value":7}],"calculation":{"type":"beforeDate","unit":"day"}}', 'SIGN_REMINDER_DAY', 7, 7, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 6, NULL, NULL, 0, 'calendar_day'),

('UW', N'{"fields":[{"name":"gapTatDay","label":"Số ngày Gap TAT","control":"number","required":true,"min":0,"max":30,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'GAP_TAT_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 7, NULL, NULL, 0, 'day'),

('UW', N'{"fields":[{"name":"tatDay","label":"Số ngày TAT","control":"number","required":true,"min":0,"max":90,"value":5}],"calculation":{"type":"manual","unit":"day"}}', 'TAT_DAY', 5, 5, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 8, NULL, NULL, 0, 'day'),

('LMKT', N'{"fields":[{"name":"gapTatDay","label":"Số ngày Gap TAT","control":"number","required":true,"min":0,"max":30,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'GAP_TAT_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 9, NULL, NULL, 0, 'day'),

('LMKT', N'{"fields":[{"name":"tatDay","label":"Số ngày TAT","control":"number","required":true,"min":0,"max":90,"value":7}],"calculation":{"type":"manual","unit":"day"}}', 'TAT_DAY', 7, 7, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 10, NULL, NULL, 0, 'day'),

('PM', N'{"fields":[{"name":"gapTatDay","label":"Số ngày Gap TAT","control":"number","required":true,"min":0,"max":30,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'GAP_TAT_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 11, NULL, NULL, 0, 'day'),

('PM', N'{"fields":[{"name":"tatDay","label":"Số ngày TAT","control":"number","required":true,"min":0,"max":90,"value":7}],"calculation":{"type":"manual","unit":"day"}}', 'TAT_DAY', 7, 7, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 12, NULL, NULL, 0, 'day');

INSERT INTO SLA
(
    Dept, Attributes, Code, Value, DecimalValue,
    FromDate, ToDate, Duration, Guid,
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
    Deleted, DeletedBy, DeletedDate, RowOrder,
    CopyFromGuid, DraftGuid, BooleanValue, Unit
)
VALUES
('FO', N'{"fields":[{"name":"overdueApplicationDay","label":"Số ngày quá hạn xử lý đơn","control":"number","required":true,"min":0,"max":90,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'OVERDUE_APPLICATION_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 13, NULL, NULL, 0, 'day'),

('TS', N'{"fields":[{"name":"overdueApplicationDay","label":"Số ngày quá hạn xử lý đơn","control":"number","required":true,"min":0,"max":90,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'OVERDUE_APPLICATION_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 14, NULL, NULL, 0, 'day'),

('UW', N'{"fields":[{"name":"overdueApplicationDay","label":"Số ngày quá hạn xử lý đơn","control":"number","required":true,"min":0,"max":90,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'OVERDUE_APPLICATION_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 15, NULL, NULL, 0, 'day'),

('LMKT', N'{"fields":[{"name":"overdueApplicationDay","label":"Số ngày quá hạn xử lý đơn","control":"number","required":true,"min":0,"max":90,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'OVERDUE_APPLICATION_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 16, NULL, NULL, 0, 'day'),

('PM', N'{"fields":[{"name":"overdueApplicationDay","label":"Số ngày quá hạn xử lý đơn","control":"number","required":true,"min":0,"max":90,"value":3}],"calculation":{"type":"manual","unit":"day"}}', 'OVERDUE_APPLICATION_DAY', 3, 3, NULL, NULL, NULL, NEWID(), 'quan.nh', GETDATE(), NULL, NULL, 0, NULL, NULL, 17, NULL, NULL, 0, 'day');


/* =========================================================
   1. MKT MANAGER REVIEW REQUEST
   Icon tại bước Review của MKT-MGR
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - MKT Manager Review Request',

    N'<p>Dear @@RecipientName,</p>
      <p>A quotation has been submitted for your review and approval.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Submitted by:</strong> @@MakerName
      </p>
      <p>Please review the quotation and provide your decision.</p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review quotation
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    10,
    NULL,
    NULL,
    N'',
    N'',
    N'[Quotation Review Request]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''MKT Manager Review Request'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   2. FO REVIEW QUOTATION
   Icon tại bước Review Quotation của FO
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - FO Review Notification',

    N'<p>Dear @@RecipientName,</p>
      <p>A quotation has been routed to you for review.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Submitted by:</strong> @@MakerName
      </p>
      <p>Please check the quotation information and select the appropriate next action.</p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review quotation
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    20,
    NULL,
    NULL,
    N'',
    N'',
    N'[Quotation Review]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''FO Review Notification'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   3. REFER QUOTATION TO UW
   Icon tại decision Refer UW
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - UW Referral Request',

    N'<p>Dear @@RecipientName,</p>
      <p>A quotation has been referred to Underwriting for review.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Referred by:</strong> @@MakerName
      </p>
      <p><strong>Referral comment:</strong></p>
      <p>@@Comment</p>
      <p>Please review the quotation and provide your underwriting assessment.</p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review quotation
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    30,
    NULL,
    NULL,
    N'',
    N'',
    N'[UW Referral Request]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''UW Referral Request'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          ISNULL(i.Comment, '''') AS Comment,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   4. SEND QUOTATION TO CLIENT
   Icon tại Send Quotation Client
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - Send Quotation To Client',

    N'<p>Dear Valued Client,</p>
      <p>Thank you for your interest in our insurance services.</p>
      <p>Please find the quotation prepared for your review.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName
      </p>
      <p>
          You can review and confirm the quotation by accessing the following link:
      </p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review quotation
          </a>
      </p>
      <p>Please contact us if you require any clarification or revision.</p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    40,
    NULL,
    NULL,
    N'',
    N'',
    N'[Insurance Quotation]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''Send Quotation To Client'' AS MailType,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   5. TS ROUTE BACK TO FO
   Icon dưới action Route To của FO/TS
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - TS Route Back To FO',

    N'<p>Dear @@RecipientName,</p>
      <p>The Technical Survey task has been completed and routed back to FO.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Processed by:</strong> @@MakerName
      </p>
      <p><strong>Comment:</strong></p>
      <p>@@Comment</p>
      <p>Please continue reviewing and processing the quotation.</p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review quotation
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    50,
    NULL,
    NULL,
    N'',
    N'',
    N'[TS Completed]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''TS Route Back To FO'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          ISNULL(i.Comment, '''') AS Comment,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   6. UW REVIEW ASSIGNMENT
   Icon tại bước UW Review
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - UW Review Assignment',

    N'<p>Dear @@RecipientName,</p>
      <p>A quotation has been assigned to you for underwriting review.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Assigned by:</strong> @@MakerName
      </p>
      <p><strong>Referral comment:</strong></p>
      <p>@@Comment</p>
      <p>Please review the risk information and provide your assessment.</p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to perform UW review
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    60,
    NULL,
    NULL,
    N'',
    N'',
    N'[UW Review Assignment]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''UW Review Assignment'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          ISNULL(i.Comment, '''') AS Comment,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);


/* =========================================================
   7. HIGHER AUTHORITY REFERRAL
   Icon tại Fill in Referral Form & Remark
   ========================================================= */

INSERT INTO [MailTemplate]
(
    TemplateName,
    TemplateContent,
    Guid,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    Deleted,
    DeletedBy,
    DeletedDate,
    RowOrder,
    CopyFromGuid,
    DraftGuid,
    BCC,
    CC,
    PrefixTitleMail,
    TemplateMailTitle,
    [To],
    MailQuery,
    IsActive
)
VALUES
(
    N'Quotation - Higher Authority Referral Request',

    N'<p>Dear @@RecipientName,</p>
      <p>A quotation requires review by a higher underwriting authority.</p>
      <p>
          <strong>Quotation ID:</strong> @@QuotationId<br>
          <strong>Client:</strong> @@ShortName<br>
          <strong>Referred by:</strong> @@MakerName
      </p>
      <p><strong>Referral reason and remarks:</strong></p>
      <p>@@Comment</p>
      <p>
          Please review the referral information, provide your comments
          and assign the appropriate PIC.
      </p>
      <p>
          <a href="@@urlCallView"
             rel="noopener noreferrer"
             target="_blank"
             style="color: rgb(51, 122, 183);">
             Click here to review referral
          </a>
      </p>
      <p>Thanks &amp; Best Regards!</p>',

    NEWID(),
    N'quan.nh',
    GETDATE(),
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    70,
    NULL,
    NULL,
    N'',
    N'',
    N'[Higher Authority Referral]',
    N'- Quotation #@@QuotationId - @@ShortName',
    N'',

    N'SELECT
          N''Higher Authority Referral Request'' AS MailType,
          u2.name AS RecipientName,
          u2.email AS RecipientEmail,
          u1.name AS MakerName,
          ISNULL(c.ShortName, '''') AS ShortName,
          ISNULL(i.Comment, '''') AS Comment,
          q.Id AS QuotationId,
          q.*
      FROM Quotation q
      INNER JOIN InstanceWorkflow i
          ON q.Guid = i.RecordGuid
      INNER JOIN UserWorkflow uf
          ON uf.Id = i.UserWorkflowId
      LEFT JOIN Users u1
          ON q.CreatedBy = u1.username
      LEFT JOIN Users u2
          ON uf.CheckerUsersId = u2.Id
      LEFT JOIN Client c
          ON c.Id = q.ClientId
      WHERE q.Id = @QuotationId',

    1
);