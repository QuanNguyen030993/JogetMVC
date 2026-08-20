import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { notify } from "./Notification.jsx";

const safeNotify = (msgOrOptions, type = "info") => {
    if (typeof notify === "function") {
        notify(msgOrOptions, type);
    } else if (window.TMIVCom && typeof window.TMIVCom.notify === "function") {
        window.TMIVCom.notify(msgOrOptions, type);
    } else {
        alert(typeof msgOrOptions === "string" ? msgOrOptions : (msgOrOptions.content || msgOrOptions.message || ""));
    }
};

const getIconByExt = (ext) => {
    ext = (ext || "").toLowerCase();
    if (ext === "not found on server") return "!";
    if (ext === "pdf") return "📕";
    if (ext === "xls" || ext === "xlsx" || ext === "csv") return "📗";
    if (ext === "doc" || ext === "docx") return "📘";
    if (ext === "ppt" || ext === "pptx") return "📙";
    if (ext === "msg" || ext === "eml") return "✉️";
    if (ext === "xml" || ext === "json") return "🧾";
    if (ext === "zip" || ext === "rar" || ext === "7z") return "🗜️";
    if (["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)) return "🖼️";
    return "📎";
};

const formatBytes = (bytes) => {
    const n = Number(bytes || 0);
    if (n < 1024) return n + " B";
    const kb = n / 1024;
    if (kb < 1024) return kb.toFixed(1) + " KB";
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(1) + " MB";
    const gb = mb / 1024;
    return gb.toFixed(1) + " GB";
};

const fmtTimeLocal = (dateInput) => {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const FileUploader = forwardRef(({
    guid = "",
    data = {},
    specificFolder = "",
    baseOnAttributes = "",
    maxFileSize = 52428800, // 50MB
    accept = "*/*",
    multiple = true,
    titleName = "Upload Attachments",
    disabled = false,
    showUploader = true,
    controllerName = "Document",
    uploadUrl = "/api/Attachment/AsyncUploadFile",
    onUploaded,
    onDeleted,
    onChange
}, ref) => {
    const [filesList, setFilesList] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Progress theo số lượng file đã upload xong.
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [uploadTotal, setUploadTotal] = useState(0);
    const [currentUploadFile, setCurrentUploadFile] = useState("");

    const fileInputRef = useRef(null);

    const getFolderCombine = () => {
        let combine = data?.SectionName || "";
        if (baseOnAttributes && data && data[baseOnAttributes]) {
            combine = data[baseOnAttributes];
        }
        return combine;
    };

    // const fetchAttachments = async () => {
    //     if (!guid) return;
    //     const combine = getFolderCombine();
    //     let queryUrl = `/api/${controllerName}/GetByKey?recordGuid=${guid}&folder=${encodeURIComponent(combine)}`;
    //     if (baseOnAttributes) {
    //         queryUrl += "&isOutOfRule=true";
    //     }
    //
    //     try {
    //         const response = await fetch(queryUrl);
    //         if (response.ok) {
    //             const result = await response.json();
    //             setFilesList(result || []);
    //             onChange?.(result || []);
    //         }
    //     } catch (error) {
    //         console.error("Failed to fetch attachments:", error);
    //     }
    // };

    useEffect(() => {
        // fetchAttachments();
    }, [guid, getFolderCombine(), controllerName]);

    const handleFilesUpload = async (files) => {
        if (disabled || isUploading) return;

        const validFiles = Array.from(files).filter(file => {
            if (file.size > maxFileSize) {
                const maxMB = Math.round((maxFileSize / 1024 / 1024) * 100) / 100;
                safeNotify(`${file.name} exceeds the ${maxMB} MB upload limit.`, "warning");
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const totalFiles = validFiles.length;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadedCount(0);
        setUploadTotal(totalFiles);
        setCurrentUploadFile(validFiles[0]?.name || "");

        try {
            for (let i = 0; i < totalFiles; i++) {
                const file = validFiles[i];

                setCurrentUploadFile(file.name);

                const formData = new FormData();
                formData.append("file", file);

                const moduleName = data?.ModuleName || "";
                const isQt =
                    typeof moduleName === "string" &&
                    moduleName.toLowerCase().includes("qt");

                const folderBase = isQt ? "Quotation" : "PolicyIssuance";
                const folderCode = data?.code || "";
                const specFolderSuffix = specificFolder ? `\\${specificFolder}` : "";

                const folder =
                    `${folderBase}` +
                    `${folderCode ? `\\${folderCode}` : ""}` +
                    `${specFolderSuffix}`;

                const sectionName =
                    `${data?.SectionName || ""}` +
                    `${specificFolder ? `_${specificFolder}` : ""}`;

                const dept = data?.SectionName || "";

                const headers = {
                    RecordGuid: guid,
                    Folder: folder,
                    SectionName: sectionName,
                    Department: dept
                };

                if (window.appToken) {
                    headers["Authorization"] = "Bearer " + window.appToken;
                }

                if (data) {
                    headers["Data"] = JSON.stringify(data);
                }

                const response = await fetch(uploadUrl, {
                    method: "POST",
                    body: formData,
                    headers
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }
                if (response.ok) {
                    const result = await response.json();
                    setFilesList(result || []);
                    onChange?.(result || []);
                }
                const completedFiles = i + 1;
                setUploadedCount(completedFiles);
                setUploadProgress(
                    Math.round((completedFiles / totalFiles) * 100)
                );
            }

            setUploadProgress(100);

            safeNotify(
                `Uploaded ${totalFiles} attachment${totalFiles > 1 ? "s" : ""} successfully! ✅`,
                "success"
            );

            // fetchAttachments();
            onUploaded?.(files);
        } catch (error) {
            console.error("Upload error:", error);

            safeNotify(
                "Fail to upload attachment, please try again! ❌",
                "error"
            );
        } finally {
            setIsUploading(false);
            setCurrentUploadFile("");

            if (fileInputRef.current) {
                // Cho phép chọn lại chính file vừa upload.
                fileInputRef.current.value = "";
            }
        }
    };

    const handleFileSelectChange = (e) => {
        if (e.target.files) {
            handleFilesUpload(e.target.files);
        }
    };

    const triggerFilePicker = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!disabled && !isUploading && e.dataTransfer.files) {
            handleFilesUpload(e.dataTransfer.files);
        }
    };

    const handlePreview = (item) => {
        const id = item.id || item.Id || item.attachmentId;
        const fileName = item.fileName || item.FileName || item.name || "Unnamed";
        const ext = (item.extension || item.Extension || "").toLowerCase();

        if (window.previewAttachment) {
            window.previewAttachment(id, ext, fileName);
        } else {
            console.log(
                "previewAttachment not defined in window context",
                id,
                ext,
                fileName
            );
        }
    };

    const handleDownload = (e, item) => {
        e.stopPropagation();

        const downloadUrl =
            item.downloadUrl ||
            item.DownloadUrl ||
            item.url;

        if (downloadUrl) {
            window.open(downloadUrl, "_blank");
        } else {
            safeNotify("Không có đường dẫn tải tệp", "warning");
        }
    };

    const handleDelete = async (e, item) => {
        e.stopPropagation();

        const id = item.id || item.Id || item.attachmentId;
        if (!id) return;

        if (!window.confirm("Are you sure to delete this file?")) {
            return;
        }

        try {
            const response = await fetch(
                `/api/${controllerName}/DeleteDocumentData?id=${encodeURIComponent(id)}`,
                {
                    method: "GET"
                }
            );

            if (response.ok) {
                safeNotify("Deleted attachment successfully! 🗑️", "success");
                // fetchAttachments();
                onDeleted?.(item);
            } else {
                throw new Error("Deletion failed");
            }
        } catch (error) {
            console.error("Delete error:", error);
            safeNotify("Fail to delete attachment!", "error");
        }
    };

    const handleCopyLink = async (e, item) => {
        e.stopPropagation();

        const downloadUrl =
            item.downloadUrl ||
            item.DownloadUrl ||
            item.url;

        const fileName =
            item.fileName ||
            item.FileName ||
            item.name ||
            "Unnamed";

        if (window.copyAttachmentToClipboard) {
            await window.copyAttachmentToClipboard(
                item,
                downloadUrl,
                fileName
            );

            safeNotify("Đã sao chép đường dẫn!", "success");
        } else {
            const link = window.location.origin + downloadUrl;
            await navigator.clipboard.writeText(link);

            safeNotify(
                "Đã sao chép liên kết vào clipboard!",
                "success"
            );
        }
    };

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === "value") {
                console.log("access to fileList", filesList);
                if (nextValue.length === 1 || nextValue === undefined) {
                    return filesList;
                }

                setFilesList(nextValue || []);
            }
        },

        value() {
            return filesList;
        },

        refresh() {
            // fetchAttachments();
        }
    }));

    const currentFileNumber =
        isUploading && uploadTotal > 0
            ? Math.min(uploadedCount + 1, uploadTotal)
            : uploadedCount;

    return (showUploader && (
        <div
            className="tmivcom-fileuploader-container"
            style={{ width: "100%" }}
        >
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple={multiple}
                accept={accept}
                onChange={handleFileSelectChange}
                disabled={disabled || isUploading}
            />

            <div
                className={
                    `attachment-drop-zone ` +
                    `${disabled ? "is-disabled" : ""} ` +
                    `${isDragging ? "is-dragging" : ""} ` +
                    `${isUploading ? "is-uploading" : ""}`
                }
                role="button"
                tabIndex={disabled || isUploading ? -1 : 0}
                onClick={triggerFilePicker}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <span className="dx-icon dx-icon-upload attachment-drop-zone__icon"></span>

                <span className="attachment-drop-zone__content">
                    {isUploading ? (
                        <div className="attachment-upload-status">
                            <div className="attachment-upload-status__header">
                                <strong>
                                    Uploading {currentFileNumber}/{uploadTotal} files...
                                </strong>

                                <span className="attachment-upload-status__percent">
                                    {uploadProgress}%
                                </span>
                            </div>

                            <div
                                className="attachment-upload-status__filename"
                                title={currentUploadFile}
                            >
                                {currentUploadFile}
                            </div>

                            <div className="attachment-upload-progress">
                                <div
                                    className="attachment-upload-progress__bar"
                                    style={{
                                        width: `${uploadProgress}%`
                                    }}
                                />
                            </div>

                            <div className="attachment-upload-status__completed">
                                {uploadedCount} of {uploadTotal} completed
                            </div>
                        </div>
                    ) : (
                        <>
                            <strong>
                                <span className="attachment-drop-zone__compact-label">
                                    {titleName}
                                </span>

                                <span className="attachment-drop-zone__drop-label">
                                    Drop files here
                                </span>
                            </strong>

                            <span className="attachment-drop-zone__hint">
                                or click to browse from your computer
                            </span>
                        </>
                    )}
                </span>
            </div>

            {/*
                Progress CSS được đặt inline tại đây để file JSX có thể dùng ngay.
                Nếu project của bạn đã có file CSS riêng, có thể chuyển block này
                sang stylesheet.
            */}
            <style>{`
                .attachment-upload-status {
                    width: 100%;
                    min-width: 220px;
                }

                .attachment-upload-status__header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    width: 100%;
                }

                .attachment-upload-status__percent {
                    flex: 0 0 auto;
                    font-size: 12px;
                    font-weight: 600;
                    opacity: .8;
                }

                .attachment-upload-status__filename {
                    width: 100%;
                    margin-top: 3px;
                    overflow: hidden;
                    font-size: 11px;
                    line-height: 1.3;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    opacity: .75;
                }

                .attachment-upload-progress {
                    position: relative;
                    width: 100%;
                    height: 5px;
                    margin-top: 6px;
                    overflow: hidden;
                    background: rgba(0, 0, 0, .12);
                    border-radius: 999px;
                }

                .attachment-upload-progress__bar {
                    height: 100%;
                    background: #337ab7;
                    border-radius: 999px;
                    transition: width .25s ease;
                }

                .attachment-upload-status__completed {
                    margin-top: 4px;
                    font-size: 10px;
                    line-height: 1.2;
                    opacity: .65;
                }

                .attachment-drop-zone.is-uploading {
                    cursor: wait;
                }
            `}</style>

            {/* Attachment preview giữ nguyên trạng thái comment như file gốc. */}
            {/* <div className="att-preview" style={{ marginTop: "10px" }}>
                ...
            </div> */}
        </div>
    )
    );
});

FileUploader.displayName = "FileUploader";

export default FileUploader;
