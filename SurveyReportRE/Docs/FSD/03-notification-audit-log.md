# Notification, Comment & Audit Log

## 1. Notification types

Notification sử dụng enum `NotificationType`. UI filter so sánh bằng enum ID, không phụ thuộc hoàn toàn vào text.

| Type | Ý nghĩa | Badge |
|---|---|---|
| Assign | Giao việc cho người dùng/department | ASG |
| Route | Workflow chuyển bước | RTE |
| Quotation | Sự kiện của Quotation | QT |
| Policy Issuance | Sự kiện của Policy Issuance | PI |
| Default | Thông báo hệ thống/legacy | SYS |

Backward compatibility vẫn nhận diện `[QT]`, `[PI]` hoặc tên type cũ khi record chưa có Type ID.

## 2. Notification list

Người dùng có thể:

- Lọc All, Unread, Assign, Route, Quotation, Policy Issuance.
- Search theo title/message.
- Mark read hoặc Mark all as read.
- Open record đích.
- View message.

## 3. HTML preview rule

Message có thể chứa HTML và ảnh paste từ editor.

- HTML được render trong preview.
- Preview giới hạn chiều cao.
- Ảnh, bảng và element có inline width không được vượt chiều rộng card.
- Khi nội dung thực sự overflow, UI hiển thị **Click to view more**.
- Ảnh load chậm sẽ kích hoạt đo overflow lại.

## 4. Rich Message Viewer

Notification và Audit Log dùng chung viewer.

```text
┌──────────────────────────────────────────────────────────────┐
│ Message title                                             ×  │
├──────────────────────────────────────────────────────────────┤
│ [NOTIFICATION/AUDIT LOG]  From: ...  Date: ...               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────── Document content ────────────────────┐   │
│   │ HTML text, pasted images, tables, video, code block  │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Viewer hỗ trợ:

- Responsive theo viewport.
- Drag và resize.
- Scroll riêng cho nội dung.
- Ảnh responsive.
- Table fixed layout và wrap text.
- Iframe/video không vượt container.
- Code block có scrollbar.

## 5. Audit Log card

- Hover card có hiệu ứng nổi.
- Department được phân màu FO/TS/UW/LMKT/PM.
- Nội dung HTML bị giới hạn trong preview.
- Card overflow hiển thị **Click to view more**.
- Click card hoặc dùng Enter/Space mở Rich Message Viewer.

## 6. Section comments

- Quotation sử dụng module key `qt`.
- Policy Issuance sử dụng module key `pi`.
- Comment được truy vấn bằng `RecordGuid` và `CurrentDepartment`.
- FO/TS/PM comment của Policy Issuance không được dùng ID/module của Quotation.

## 7. Data mapping tham khảo

| UI field | Data field |
|---|---|
| Title | `Notification.Title` |
| HTML content | `Notification.Message` |
| Read state | `Notification.IsRead` |
| Type filter | `Notification.Type` / Type ID |
| Receiver | `Notification.ReceivedBy` |
| Target | `Notification.Url` |
| Comment content | `SectionCommentNote.Content` |
| Comment record | `SectionCommentNote.RecordGuid` |
| Department | `SectionCommentNote.CurrentDepartment` |

