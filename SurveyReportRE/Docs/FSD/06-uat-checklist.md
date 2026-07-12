# UAT Checklist

## A. Role và form permission

- [ ] Mở Quotation với từng role FO/TS/UW/LMKT/PM.
- [ ] Chỉ section đúng role được edit.
- [ ] Switch role cập nhật Save và uploader ngay lập tức.
- [ ] Policy Issuance áp dụng giống Quotation.
- [ ] Super User có quyền đúng cấu hình.

## B. Decision

- [ ] UW Accept ghi nhận đúng UW, không ghi PM.
- [ ] Accept status xuất hiện phía trên button.
- [ ] Thời gian accept hiển thị đúng timezone/format.
- [ ] Reload vẫn giữ accept status.
- [ ] Policy Issuance có style Accept/Reject giống Quotation.
- [ ] Màu decision lấy từ global variables.

## C. Reload/render

- [ ] Accept xong render đủ partial.
- [ ] Submit xong render đủ partial.
- [ ] Refresh tab không cần đóng/mở tab.
- [ ] Remarks vẫn là HTML editor sau reload.
- [ ] Không render trùng control hoặc duplicate ID.

## D. Section

- [ ] Click header collapse toàn bộ body/comment/footer.
- [ ] Expand phục hồi đầy đủ nội dung.
- [ ] Workflow tree click mở đúng section.
- [ ] `resAttachment` mặc định ẩn.
- [ ] `resAttachment` hiện tại node có condition Show.

## E. Attachment

- [ ] Role đúng section upload/delete được.
- [ ] Role khác section chỉ preview/copy.
- [ ] Preview image đúng.
- [ ] Preview Office đúng.
- [ ] Preview PDF đúng.
- [ ] Preview text đúng.
- [ ] Preview không có download link.
- [ ] Copy binary hoạt động trên browser hỗ trợ.
- [ ] Fallback copy link hoạt động.

## F. Comment/Audit Log

- [ ] Comment Quotation lưu với module `qt`.
- [ ] Comment Policy Issuance lưu với module `pi`.
- [ ] Comment hiển thị đúng department.
- [ ] Audit card hover nổi lên.
- [ ] HTML và ảnh không phá layout.
- [ ] Nội dung overflow hiện Click to view more.
- [ ] Click mở rich message viewer.

## G. Notification

- [ ] Filter so sánh đúng NotificationType ID.
- [ ] Assign/Route/Quotation/Policy Issuance có badge đúng.
- [ ] HTML message render đúng.
- [ ] Ảnh load chậm vẫn xác định overflow đúng.
- [ ] Mark read cập nhật count.
- [ ] Open đi đúng record đích.

## H. SLA

- [ ] Danh sách SLA hiển thị dễ hiểu.
- [ ] Form nhóm field theo từng SLA.
- [ ] Unit hiển thị đúng hour/day.
- [ ] Min/max hiển thị và validation đúng.
- [ ] Required field chặn lưu.
- [ ] Date field dùng date picker.
- [ ] Save giữ đầy đủ tất cả fields.
- [ ] Department không có config hiển thị empty state.

## I. DataGrid/UI

- [ ] Header slate/gray không bị theme ghi đè thành xanh thô.
- [ ] Filter row tương phản với header.
- [ ] Hover/selection rõ ràng.
- [ ] Pager và command button hoạt động bình thường.
- [ ] Grid không thay đổi column width ngoài cấu hình.
- [ ] Layout không vỡ ở desktop/tablet/mobile.

