import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

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
    
    // Formatting as dd/MM/yyyy HH:mm
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
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
    controllerName = "Document",
    uploadUrl = "/api/Attachment/AsyncUploadFile",
    onUploaded,
    onDeleted,
    onChange
}, ref) => {
    const [filesList, setFilesList] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const fileInputRef = useRef(null);

    // Helpers to resolve folder & query paths
    const getFolderCombine = () => {
        let combine = data?.SectionName || "";
        if (baseOnAttributes && data && data[baseOnAttributes]) {
            combine = data[baseOnAttributes];
        }
        return combine;
    };

    const fetchAttachments = async () => {
        if (!guid) return;
        const combine = getFolderCombine();
        let queryUrl = `/api/${controllerName}/GetByKey?recordGuid=${guid}&folder=${encodeURIComponent(combine)}`;
        if (baseOnAttributes) {
            queryUrl += "&isOutOfRule=true";
        }
        
        try {
            const response = await fetch(queryUrl);
            if (response.ok) {
                const data = await response.json();
                setFilesList(data || []);
                onChange?.(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch attachments:", error);
        }
    };

    useEffect(() => {
        fetchAttachments();
    }, [guid, getFolderCombine(), controllerName]);

    // Handle Upload AJAX action
    const handleFilesUpload = async (files) => {
        if (disabled || isUploading) return;
        const validFiles = Array.from(files).filter(file => {
            if (file.size > maxFileSize) {
                const maxMB = Math.round((maxFileSize / 1024 / 1024) * 100) / 100;
                alert(`${file.name} exceeds the ${maxMB} MB upload limit.`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                const formData = new FormData();
                formData.append("file", file);

                const combine = getFolderCombine();
                // Determine folder path mimicking buildFolder
                const moduleName = data?.ModuleName || "";
                const isQt = (typeof moduleName === 'string' && moduleName.toLowerCase().includes('qt'));
                const folderBase = isQt ? "Quotation" : "PolicyIssuance";
                const folderCode = data?.code || "";
                const specFolderSuffix = specificFolder ? `\\${specificFolder}` : "";
                const folder = `${folderBase}${folderCode ? `\\${folderCode}` : ""}${specFolderSuffix}`;
                const sectionName = `${data?.SectionName || ""}${specificFolder ? `_${specificFolder}` : ""}`;
                const dept = data?.SectionName || "";

                // Send request with headers
                const headers = {
                    "RecordGuid": guid,
                    "Folder": folder,
                    "SectionName": sectionName,
                    "Department": dept
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
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }
            }

            // Upload complete success
            setIsUploading(false);
            setUploadProgress(100);
            fetchAttachments();
            onUploaded?.();
        } catch (error) {
            console.error("Upload error:", error);
            setIsUploading(false);
            alert("File upload failed. Please try again.");
        }
    };

    const handleFileSelectChange = (e) => {
        if (e.target.files) {
            handleFilesUpload(e.target.files);
        }
    };

    const triggerFilePicker = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    // Drag-and-drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files) {
            handleFilesUpload(e.dataTransfer.files);
        }
    };

    // Attachment Actions: Preview, Download, Delete, Copy to clipboard
    const handlePreview = (item) => {
        const id = item.id || item.Id || item.attachmentId;
        const fileName = item.fileName || item.FileName || item.name || "Unnamed";
        const ext = (item.extension || item.Extension || "").toLowerCase();
        if (window.previewAttachment) {
            window.previewAttachment(id, ext, fileName);
        } else {
            console.log("previewAttachment not defined in window context", id, ext, fileName);
        }
    };

    const handleDownload = (e, item) => {
        e.stopPropagation();
        const downloadUrl = item.downloadUrl || item.DownloadUrl || item.url;
        if (downloadUrl) {
            window.open(downloadUrl, "_blank");
        } else {
            alert("No download URL available");
        }
    };

    const handleDelete = async (e, item) => {
        e.stopPropagation();
        const id = item.id || item.Id || item.attachmentId;
        if (!id) return;
        
        if (!window.confirm("Are you sure you want to delete this attachment?")) {
            return;
        }

        try {
            const response = await fetch(`/api/${controllerName}/DeleteDocumentData?id=${encodeURIComponent(id)}`, {
                method: "GET"
            });
            if (response.ok) {
                fetchAttachments();
                onDeleted?.(item);
            } else {
                throw new Error("Deletion failed");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete document failed.");
        }
    };

    const handleCopyLink = async (e, item) => {
        e.stopPropagation();
        const downloadUrl = item.downloadUrl || item.DownloadUrl || item.url;
        const fileName = item.fileName || item.FileName || item.name || "Unnamed";
        if (window.copyAttachmentToClipboard) {
            await window.copyAttachmentToClipboard(item, downloadUrl, fileName);
        } else {
            // Fallback clipboard write
            const link = window.location.origin + downloadUrl;
            navigator.clipboard.writeText(link);
            alert("Link copied to clipboard!");
        }
    };

    // Exposing imperative options & API
    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (name === 'value') {
                if (arguments.length === 1 || nextValue === undefined) {
                    return filesList;
                }
                setFilesList(nextValue || []);
            }
        },
        value() {
            return filesList;
        },
        refresh() {
            fetchAttachments();
        }
    }));

    return (
        <div className="tmivcom-fileuploader-container" style={{ width: "100%" }}>
            {/* Input Element (hidden) */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                multiple={multiple} 
                accept={accept} 
                onChange={handleFileSelectChange}
                disabled={disabled}
            />

            

            {/* Preview List */}
            <div className="att-preview" style={{ marginTop: "10px" }}>
                {filesList.length === 0 ? (
                    <div style={{ opacity: 0.7, padding: "6px 2px" }}>No attachments</div>
                ) : (
                    filesList.map((item, index) => {
                        const fileName = item.fileName || item.FileName || item.name || "Unnamed";
                        const ext = (item.extension || item.Extension || "").toLowerCase();
                        const size = item.size || item.fileSize || item.FileSize || 0;
                        const author = item.author || item.Author || "System";
                        const date = item.date || item.Date || item.createdDate || "";

                        return (
                            <div 
                                key={item.id || item.Id || index} 
                                className="att-item-wrapper"
                                style={{
                                    display: "flex",
                                    flexDirection: "left",
                                    gap: "6px",
                                    width: "100%",
                                    opacity: 1,
                                    transform: "translateY(0)"
                                }}
                            >
                                <div 
                                    className="att-item" 
                                    onClick={() => handlePreview(item)}
                                    style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div className="att-ico">{getIconByExt(ext)}</div>
                                        <div className="att-meta">
                                            <div className="att-name" title={fileName}>{fileName}</div>
                                            <div className="att-sub">
                                                {(ext ? ext.toUpperCase() : "FILE")} • {formatBytes(size)} • {author} • {fmtTimeLocal(date)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="att-actions" onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "4px" }}>
                                        <button 
                                            type="button" 
                                            className="dx-button dx-button-normal dx-widget dx-button-has-icon" 
                                            title="Copy file link"
                                            onClick={(e) => handleCopyLink(e, item)}
                                        >
                                            <div className="dx-button-content">
                                                <i className="dx-icon dx-icon-email" />
                                            </div>
                                        </button>
                                        <button 
                                            type="button" 
                                            className="dx-button dx-button-normal dx-widget dx-button-has-icon" 
                                            title="Download"
                                            onClick={(e) => handleDownload(e, item)}
                                        >
                                            <div className="dx-button-content">
                                                <i className="dx-icon dx-icon-download" />
                                            </div>
                                        </button>
                                        {!disabled && (
                                            <button 
                                                type="button" 
                                                className="dx-button dx-button-danger dx-widget dx-button-has-icon attachment-delete-action" 
                                                title="Delete"
                                                onClick={(e) => handleDelete(e, item)}
                                            >
                                                <div className="dx-button-content">
                                                    <i className="dx-icon dx-icon-trash" />
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Drop Zone */}
            <div 
                className={`attachment-drop-zone ${disabled ? "is-disabled" : ""} ${isDragging ? "is-dragging" : ""} ${isUploading ? "is-uploading" : ""}`}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={triggerFilePicker}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <span className="dx-icon dx-icon-upload attachment-drop-zone__icon"></span>
                <span className="attachment-drop-zone__content">
                    {isUploading ? (
                        <strong>Uploading file...</strong>
                    ) : (
                        <>
                            <strong>
                                <span className="attachment-drop-zone__compact-label">{titleName}</span>
                                <span className="attachment-drop-zone__drop-label">Drop files here</span>
                            </strong>
                            <span className="attachment-drop-zone__hint">or click to browse from your computer</span>
                        </>
                    )}
                </span>
            </div>
        </div>
    );
});

FileUploader.displayName = "FileUploader";
export default FileUploader;
