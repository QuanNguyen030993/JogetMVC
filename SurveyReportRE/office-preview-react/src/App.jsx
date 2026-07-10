import { useState, useEffect, useRef } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

// Custom local Word document (.docx) renderer plugin for @cyntler/react-doc-viewer
const LocalDocxRenderer = ({ mainState: { currentDocument } }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const renderDoc = async () => {
      if (!currentDocument?.uri) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(currentDocument.uri);
        if (!response.ok) throw new Error('Failed to fetch docx file.');
        const blob = await response.blob();
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = '';
          const { renderAsync } = await import('docx-preview');
          await renderAsync(blob, containerRef.current, null, {
            className: "docx-viewer",
            inWrapper: true,
          });
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error rendering DOCX');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    renderDoc();
    return () => { isMounted = false; };
  }, [currentDocument]);

  return (
    <div className="docx-container">
      {loading && <div className="spinner">Rendering document...</div>}
      {error && <div className="error-message">{error}</div>}
      <div ref={containerRef} className="docx-render-area" />
    </div>
  );
};
LocalDocxRenderer.fileTypes = ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Custom local Excel (.xlsx, .xls) renderer plugin for @cyntler/react-doc-viewer
const LocalExcelRenderer = ({ mainState: { currentDocument } }) => {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [sheetHtml, setSheetHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const renderExcel = async () => {
      if (!currentDocument?.uri) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(currentDocument.uri);
        if (!response.ok) throw new Error('Failed to fetch Excel file.');
        const arrayBuffer = await response.arrayBuffer();
        
        const XLSX = await import('xlsx');
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (isMounted) {
          setWorkbook(wb);
          if (wb.SheetNames.length > 0) {
            const firstSheet = wb.SheetNames[0];
            setActiveSheet(firstSheet);
            const html = XLSX.utils.sheet_to_html(wb.Sheets[firstSheet]);
            setSheetHtml(html);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error rendering Excel');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    renderExcel();
    return () => { isMounted = false; };
  }, [currentDocument]);

  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
    if (workbook) {
      import('xlsx').then((XLSX) => {
        const html = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]);
        setSheetHtml(html);
      });
    }
  };

  return (
    <div className="excel-container">
      {loading && <div className="spinner">Rendering sheet...</div>}
      {error && <div className="error-message">{error}</div>}
      {workbook && workbook.SheetNames.length > 1 && (
        <div className="sheet-tabs">
          {workbook.SheetNames.map((name) => (
            <button
              key={name}
              onClick={() => handleSheetChange(name)}
              className={`sheet-tab ${activeSheet === name ? 'active' : ''}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {sheetHtml && (
        <div className="excel-render-wrapper">
          <div
            className="excel-render-area"
            dangerouslySetInnerHTML={{ __html: sheetHtml }}
          />
        </div>
      )}
    </div>
  );
};
LocalExcelRenderer.fileTypes = [
  "xlsx", "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
];

// Register our local renderers before default renderers to take precedence
const customRenderers = [LocalDocxRenderer, LocalExcelRenderer, ...DocViewerRenderers];

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');
  const [message, setMessage] = useState('Choose a Word, Excel, PowerPoint, or PDF file to preview.');
  const [isLoading, setIsLoading] = useState(false);

  // Revoke Blob URLs to prevent memory leaks when changing documents
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please choose a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    setMessage('Uploading file to C# backend...');

    try {
      // 1. Upload to the C# AsyncUploadSingleFile endpoint
      // const response = await fetch('/api/Document/AsyncUploadSingleFile', {
      //   method: 'POST',
      //   headers: {
      //     'Folder': 'Uploads',
      //     'RecordGuid': '00000000-0000-0000-0000-000000000000',
      //     'SectionName': 'Preview',
      //     'Department': 'IT'
      //   },
      //   body: formData
      // });
      
      // const data = await response.json();
      // if (!response.ok || !data.success) {
      //   throw new Error(data.message || 'Upload failed.');
      // }

      // const docId = data.attachment?.id || data.attachment?.Id;
      // const fileType = data.attachment?.fileType || data.attachment?.FileType || '';
      // const fileName = data.attachment?.fileName || data.attachment?.FileName || '';

      // if (!docId) {
      //   throw new Error('Upload succeeded but no document ID was returned.');
      // }

      // // Check if it is an Office format that needs LibreOffice conversion
      // const ext = fileType.toLowerCase();
      // const isOffice = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext);

      // setMessage(isOffice ? 'Converting Office document to PDF...' : 'Loading file preview...');

      // 2. Fetch converted PDF (for Office files) or direct stream (for PDFs/images)
      const previewEndpoint =`https://localhost:7254/api/Document/StreamDocument?id=10372` 
        ;

      const fileResponse = await fetch(previewEndpoint);
      console.log(fileResponse);
      if (!fileResponse.ok) {
        throw new Error('Failed to retrieve file content or convert document.');
      }

      const blob = await fileResponse.blob();
      const localBlobUrl = URL.createObjectURL(blob);

      setPreviewUrl(localBlobUrl);
      setPreviewFileName(fileName);
      // If we used LibreConvert, the output format is PDF
      setPreviewFileType(isOffice ? '.pdf' : ext);
      setMessage(`Preview ready (loaded from C# API): ${fileName}`);
    } catch (error) {
      setMessage(error.message || 'Unable to preview this file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setMessage(`Selected: ${selected.name}`);
    }
  };

  const docs = previewUrl ? [{ 
    uri: previewUrl, 
    fileName: previewFileName,
    fileType: previewFileType.replace('.', '')
  }] : [];

  return (
    <div className="app-shell">
      <div className="card">
        <h1>React Office Preview (@cyntler)</h1>
        <p>Tải tài liệu và xem trước qua C# ASP.NET Core API (`LibreConvert` và `StreamDocument`).</p>

        <form onSubmit={handleSubmit} className="upload-form">
          <input type="file" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf" onChange={handleFileChange} />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Preview file'}
          </button>
        </form>

        <p className="status">{message}</p>
      </div>

      {previewUrl && (
        <div className="preview-card">
          <div className="preview-header">
            <h2>Preview: {previewFileName}</h2>
            <a href={previewUrl} download={previewFileName} className="download-btn">
              Download File
            </a>
          </div>

          <div className="preview-body-viewer">
            <DocViewer
              documents={docs}
              pluginRenderers={customRenderers}
              config={{
                header: {
                  disableHeader: true,
                  disableFileName: true,
                }
              }}
              style={{ height: 650, borderRadius: '8px', overflow: 'hidden' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
