# SLA Configuration — Business User Guide

## 1. Mục tiêu

SLA Configuration cho phép business user nhập thời gian xử lý kỳ vọng theo department mà không cần hiểu cấu trúc JSON hoặc logic kỹ thuật của SLA designer.

## 2. Màn danh sách

Màn danh sách hiển thị các SLA đã cấu hình. Người dùng chọn department/SLA cần cập nhật và mở form cấu hình.

```text
┌───────────────────────────────────────────────────────────┐
│ SLA configuration                                        │
│ Choose a department to update expected processing time.  │
├───────────────────────────────────────────────────────────┤
│ Department │ SLA code │ Unit │ Current value │ Action     │
└───────────────────────────────────────────────────────────┘
```

## 3. Màn cấu hình cho người dùng

```text
┌───────────────────────────────────────────────────────────┐
│ SLA settings — TS                                        │
│ Set the expected handling time for this department.      │
├───────────────────────────────────────────────────────────┤
│ How to configure                                         │
│ Enter target values; allowed range and unit are shown.    │
├───────────────────────────────────────────────────────────┤
│ RESPONSE_TIME · hours                                    │
│ Target response time  [  4  ]                            │
│ Allowed range: 1–24                                     │
├───────────────────────────────────────────────────────────┤
│ PROCESS_TIME · days                                      │
│ Target processing time [  2  ]                           │
│ Minimum: 0                                               │
├───────────────────────────────────────────────────────────┤
│                              [ Save SLA settings ]        │
└───────────────────────────────────────────────────────────┘
```

## 4. Cách sử dụng

1. Chọn department.
2. Đọc tên SLA và đơn vị ở đầu từng card.
3. Nhập giá trị trong giới hạn được hiển thị.
4. Hoàn thành các trường Required.
5. Click **Save SLA settings**.
6. Hệ thống hiển thị thông báo lưu thành công.

## 5. Validation

- Trường Required không được để trống.
- Number phải nằm trong min/max do SLA definition quy định.
- Date dùng date picker.
- Text dùng text input.
- Khi validation không hợp lệ, hệ thống không thực hiện lưu.

## 6. SLA Definition

Màn definition dành cho người được phân quyền cấu hình nghiệp vụ nâng cao:

- Department: FO, TS, UW, LMKT, PM.
- SLA code: mã ngắn, dễ nhận biết.
- Values users can configure: danh sách field hiển thị cho business user.
- Input type: number, text hoặc date.
- Required, Minimum, Maximum.
- Calculation method: nhập trực tiếp hoặc chênh lệch ngày.
- Time unit: day hoặc hour.

Các giá trị kỹ thuật vẫn được lưu trong `attributes`, nhưng UI không yêu cầu business user chỉnh JSON.

## 7. Lưu dữ liệu

Khi lưu, hệ thống:

1. Cập nhật value của từng field vào SLA attributes.
2. Giữ đầy đủ tất cả fields, không chỉ field đầu tiên.
3. Tính SLA result theo calculation method.
4. Cập nhật `value`, `decimalValue` và `attributes`.

## 8. Empty state

Nếu department chưa có SLA definition, hệ thống hiển thị hướng dẫn liên hệ administrator thay vì một form trống.

