import React from "react";
import "../styles/templatePlaceholderHelp.css";

const PLACEHOLDER_TYPES = [
    {
        syntax: "@@TenBien",
        name: "Placeholder dữ liệu",
        meaning: "Được server thay bằng giá trị tương ứng. Giá trị có thể đến từ alias của SQL Query hoặc dữ liệu workflow tạo lúc chạy."
    },
    {
        syntax: "{{TenBien}}",
        name: "Placeholder Mustache",
        meaning: "Được giữ nguyên khi lưu và chỉ được thay bởi nơi xử lý có hỗ trợ cú pháp Mustache/Handlebars."
    },
    {
        syntax: "{0}, {1}, ...",
        name: "Biến theo vị trí",
        meaning: "Được xử lý theo thứ tự tham số bằng string.Format; không tra cứu theo tên biến."
    },
    {
        syntax: "<comment>",
        name: "Token xử lý riêng",
        meaning: "Được logic nghiệp vụ nhận diện và thay trực tiếp. Các thẻ HTML khác như <p>, <b> chỉ dùng để định dạng nội dung."
    }
];

export default function TemplatePlaceholderHelp() {
    return (
        <details className="template-placeholder-help">
            <summary title="Ý nghĩa các loại placeholder" aria-label="Ý nghĩa các loại placeholder">?</summary>
            <div className="template-placeholder-popover">
                <strong>Các loại placeholder</strong>
                <p>Phân biệt cú pháp đang được trình soạn thảo và server xử lý.</p>
                <div className="template-placeholder-types">
                    {PLACEHOLDER_TYPES.map((item) => (
                        <div className="template-placeholder-type" key={item.syntax}>
                            <code>{item.syntax}</code>
                            <div><b>{item.name}</b><span>{item.meaning}</span></div>
                        </div>
                    ))}
                </div>
                <div className="template-special-token">
                    <code>@TenBien</code> trong SQL là tham số đầu vào của query, không phải placeholder của nội dung.
                </div>
            </div>
        </details>
    );
}
