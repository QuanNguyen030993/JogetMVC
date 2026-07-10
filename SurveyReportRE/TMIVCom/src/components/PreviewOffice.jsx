import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { CONFIG } from "../config";

const mimeToExt = {
    "text/plain": "txt",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.ms-word": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/bmp": "bmp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "text/csv": "csv",
    "application/rtf": "rtf"
};

function getConfiguredApiBase(apiBaseUrl) {
    return (
        apiBaseUrl ||
        window.CONFIG?.API_URL ||
        CONFIG.API_URL ||
        ""
    ).replace(/\/$/, "");
}

function getFileNameFromHeader(headerValue) {
    if (!headerValue) return "";

    const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
        return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    }

    const match = headerValue.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : "";
}

function getExtension(fileName, contentType) {
    const fileExt = fileName.includes(".")
        ? fileName.split(".").pop().toLowerCase()
        : "";

    return fileExt || mimeToExt[contentType] || "bin";
}

const LocalDocxRenderer = ({ mainState: { currentDocument } }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function renderDoc() {
            if (!currentDocument?.uri) return;

            setLoading(true);
            setError("");

            try {
                const response = await fetch(currentDocument.uri);
                if (!response.ok) {
                    throw new Error(`Cannot load Word document: ${response.status}`);
                }

                const blob = await response.blob();
                const { renderAsync } = await import("docx-preview");

                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = "";
                    await renderAsync(blob, containerRef.current, null, {
                        className: "tmivcom-previewoffice-docx",
                        inWrapper: true,
                        breakPages: true
                    });
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Error rendering Word document");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        renderDoc();

        return () => {
            isMounted = false;
        };
    }, [currentDocument]);

    return (
        <div className="tmivcom-previewoffice-docx-container">
            {loading && <div className="tmivcom-previewoffice-message">Rendering document...</div>}
            {error && <div className="tmivcom-previewoffice-error">{error}</div>}
            <div ref={containerRef} className="tmivcom-previewoffice-docx-area" />
        </div>
    );
};

LocalDocxRenderer.fileTypes = [
    "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const LocalExcelRenderer = ({ mainState: { currentDocument } }) => {
    const [workbook, setWorkbook] = useState(null);
    const [activeSheet, setActiveSheet] = useState("");
    const [sheetHtml, setSheetHtml] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function renderExcel() {
            if (!currentDocument?.uri) return;

            setLoading(true);
            setError("");

            try {
                const response = await fetch(currentDocument.uri);
                if (!response.ok) {
                    throw new Error(`Cannot load Excel file: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const XLSX = await import("xlsx");
                const nextWorkbook = XLSX.read(arrayBuffer, {
                    type: "array",
                    cellDates: true,
                    cellStyles: true
                });

                if (isMounted) {
                    const firstSheet = nextWorkbook.SheetNames[0] || "";
                    setWorkbook(nextWorkbook);
                    setActiveSheet(firstSheet);
                    setSheetHtml(firstSheet ? XLSX.utils.sheet_to_html(nextWorkbook.Sheets[firstSheet]) : "");
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Error rendering Excel file");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        renderExcel();

        return () => {
            isMounted = false;
        };
    }, [currentDocument]);

    async function handleSheetChange(sheetName) {
        setActiveSheet(sheetName);

        if (workbook) {
            const XLSX = await import("xlsx");
            setSheetHtml(XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]));
        }
    }

    return (
        <div className="tmivcom-previewoffice-excel-container">
            {loading && <div className="tmivcom-previewoffice-message">Rendering sheet...</div>}
            {error && <div className="tmivcom-previewoffice-error">{error}</div>}
            {workbook?.SheetNames?.length > 1 && (
                <div className="tmivcom-previewoffice-sheet-tabs">
                    {workbook.SheetNames.map((name) => (
                        <button
                            key={name}
                            type="button"
                            className={`tmivcom-previewoffice-sheet-tab ${activeSheet === name ? "active" : ""}`}
                            onClick={() => handleSheetChange(name)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
            {sheetHtml && (
                <div className="tmivcom-previewoffice-excel-wrapper">
                    <div
                        className="tmivcom-previewoffice-excel-area"
                        dangerouslySetInnerHTML={{ __html: sheetHtml }}
                    />
                </div>
            )}
        </div>
    );
};

LocalExcelRenderer.fileTypes = [
    "xlsx",
    "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
];

const previewRenderers = [
    LocalDocxRenderer,
    LocalExcelRenderer,
    ...DocViewerRenderers
];

const PreviewOffice = forwardRef(({
    id,
    apiBaseUrl,
    height = 650,
    showDownload = true,
    className = ""
}, ref) => {
    const [documentId, setDocumentId] = useState(id);
    const [previewUrl, setPreviewUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileType, setFileType] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const endpoint = useMemo(() => {
        if (!documentId) return "";
        const baseUrl = getConfiguredApiBase(apiBaseUrl);
        return `${baseUrl}/api/Document/StreamDocument?id=${documentId}`;
    }, [apiBaseUrl, documentId]);

    useEffect(() => {
        return () => {
            if (previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        setDocumentId(id);
    }, [id]);

    useEffect(() => {
        let isMounted = true;
        let nextBlobUrl = "";

        async function loadPreview() {
            if (!endpoint) {
                setPreviewUrl("");
                setFileName("");
                setFileType("");
                setMessage("No document selected.");
                return;
            }

            setLoading(true);
            setMessage("Loading preview...");

            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`Cannot load document: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                nextBlobUrl = URL.createObjectURL(blob);
                const headerFileName = getFileNameFromHeader(response.headers.get("content-disposition"));
                const nextFileName = headerFileName || `document-${documentId}`;
                const nextFileType = getExtension(nextFileName, blob.type);

                if (isMounted) {
                    setPreviewUrl(nextBlobUrl);
                    setFileName(nextFileName);
                    setFileType(nextFileType);
                    setMessage("");
                }
            } catch (err) {
                if (isMounted) {
                    setPreviewUrl("");
                    setFileName("");
                    setFileType("");
                    setMessage(err.message || "Unable to preview this document.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadPreview();

        return () => {
            isMounted = false;
            if (nextBlobUrl) {
                URL.revokeObjectURL(nextBlobUrl);
            }
        };
    }, [endpoint, documentId, refreshKey]);

    useImperativeHandle(ref, () => ({
        option(name, nextValue) {
            if (arguments.length === 1) {
                if (name === "id") return documentId;
                if (name === "apiBaseUrl") return apiBaseUrl;
                if (name === "height") return height;
                return undefined;
            }

            if (name === "id") {
                setDocumentId(nextValue);
            }
        },
        refresh() {
            setRefreshKey((value) => value + 1);
        },
        value() {
            return documentId;
        }
    }));

    const docs = previewUrl
        ? [{
            uri: previewUrl,
            fileName,
            fileType
        }]
        : [];

    return (
        <div className={`tmivcom-previewoffice ${className}`}>
            <div className="tmivcom-previewoffice-header">
                <div className="tmivcom-previewoffice-title">
                    {fileName || "Office Preview"}
                </div>
                {showDownload && previewUrl && (
                    <a
                        className="tmivcom-previewoffice-download"
                        href={previewUrl}
                        download={fileName}
                    >
                        Download
                    </a>
                )}
            </div>

            <div className="tmivcom-previewoffice-body" style={{ height }}>
                {loading && <div className="tmivcom-previewoffice-message">Loading preview...</div>}
                {!loading && message && <div className="tmivcom-previewoffice-message">{message}</div>}
                {previewUrl && (
                    <DocViewer
                        documents={docs}
                        pluginRenderers={previewRenderers}
                        config={{
                            header: {
                                disableHeader: true,
                                disableFileName: true
                            }
                        }}
                        style={{
                            height: "100%",
                            width: "100%"
                        }}
                    />
                )}
            </div>
        </div>
    );
});

PreviewOffice.displayName = "PreviewOffice";

export default PreviewOffice;
