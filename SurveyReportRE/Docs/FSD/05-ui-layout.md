# UI & Layout Specification

## 1. Management header/logo

- Logo đầy đủ: **Workflow Management**.
- Mini logo: **WM**.
- `margin-left: 12%` của logo được giữ cố định theo yêu cầu tỷ lệ màn hình.
- Container logo phải giới hạn overflow để không bay ra ngoài vùng side menu.
- Không thay đổi tỷ lệ chia layout hiện có.

## 2. Form tổng và section

- HTML tag trong `Management.cshtml` phải đóng/mở đúng để toggle không phá chiều rộng.
- Section header luôn hiển thị khi collapse.
- Body, comment, attachment và footer phải co giãn cùng section.
- Focused section có highlight nhưng không làm thay đổi kích thước.

## 3. DevExtreme DataGrid theme

Theme global sử dụng các CSS variables:

```css
--dx-grid-surface
--dx-grid-header
--dx-grid-header-strong
--dx-grid-header-text
--dx-grid-filter
--dx-grid-primary
--dx-grid-selected
```

### Visual rules

- Header dùng slate/gray gradient, không dùng xanh bão hòa thô.
- Filter row có nền trắng lạnh, tương phản với header.
- Search/filter focus có border và focus ring nhẹ.
- Row hover và selected state phải phân biệt rõ.
- Selected row có accent bar bên trái.
- Pager hiển thị dạng button.
- Action Edit/Delete có hover state riêng.
- Grid responsive nhưng không ghi đè column width/height do instance cấu hình.

## 4. Notification/Audit HTML layout protection

Mọi rich HTML preview phải áp dụng:

- `max-width: 100%` cho ảnh và child element.
- `overflow-wrap: anywhere` cho text dài.
- `table-layout: fixed` cho bảng.
- `max-height` cho preview.
- Viewer rộng cho nội dung đầy đủ.

## 5. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| Desktop | Two-column/group layouts khi có thể |
| Tablet | Thu hẹp search, padding và popup |
| Mobile | SLA card một cột, viewer padding nhỏ, header content wrap |

## 6. Accessibility

- Audit card hỗ trợ `tabindex`, Enter và Space.
- Button có text/icon rõ ràng.
- Màu không phải tín hiệu trạng thái duy nhất; luôn có status text.
- Nội dung overflow có nhãn **Click to view more**.
- Form required hiển thị validation message.

