import { useState, useEffect, useRef } from 'react';

// Sub-component to render Word (.docx) documents locally
function DocxPreview({ url }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadDocx = async () => {
      if (!url) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Word document.');
        const blob = await response.blob();
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = '';
          if (window.docx && typeof window.docx.renderAsync === 'function') {
            await window.docx.renderAsync(blob, containerRef.current, null, {
              className: "docx-viewer",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
          } else {
            throw new Error('docx-preview library is not loaded.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error rendering Word document.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocx();
    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className="docx-container">
      {loading && <div className="spinner">Rendering Word document...</div>}
      {error && <div className="error-message">{error}</div>}
      <div ref={containerRef} className="docx-render-area" />
    </div>
  );
}

// Sub-component to render Excel (.xlsx, .xls) files locally
function ExcelPreview({ url }) {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [sheetHtml, setSheetHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadExcel = async () => {
      if (!url) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Excel file.');
        const arrayBuffer = await response.arrayBuffer();
        
        if (window.XLSX) {
          const wb = window.XLSX.read(arrayBuffer, { type: 'array' });
          if (isMounted) {
            setWorkbook(wb);
            if (wb.SheetNames.length > 0) {
              const firstSheet = wb.SheetNames[0];
              setActiveSheet(firstSheet);
              const html = window.XLSX.utils.sheet_to_html(wb.Sheets[firstSheet]);
              setSheetHtml(html);
            }
          }
        } else {
          throw new Error('SheetJS (XLSX) library is not loaded.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error rendering Excel file.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadExcel();
    return () => {
      isMounted = false;
    };
  }, [url]);

  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
    if (workbook) {
      const html = window.XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]);
      setSheetHtml(html);
    }
  };

  return (
    <div className="excel-container">
      {loading && <div className="spinner">Rendering sheet data...</div>}
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
}

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [message, setMessage] = useState('Choose a Word, Excel, PowerPoint, or PDF file to preview.');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please choose a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    setMessage('Uploading and preparing preview...');

    try {
      const response = await fetch('http://127.0.0.1:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed.');
      }

      setPreviewUrl(`http://127.0.0.1:3001${data.url}`);
      setPreviewFileName(data.fileName);
      setMessage(`Preview ready: ${data.fileName}`);
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

  const previewExt = previewFileName ? previewFileName.slice(previewFileName.lastIndexOf('.')).toLowerCase() : '';
  const isDocx = previewExt === '.docx';
  const isExcel = previewExt === '.xlsx' || previewExt === '.xls';
  const isPdf = previewExt === '.pdf';
  const isUnsupported = previewExt === '.doc' || previewExt === '.ppt' || previewExt === '.pptx';

  return (
    <div className="app-shell">
      <div className="card">
        <h1>React Local Office Preview</h1>
        <p>Upload documents and preview them securely entirely offline in your browser.</p>

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

          <div className="preview-body">
            {isDocx ? (
              <DocxPreview url={previewUrl} />
            ) : isExcel ? (
              <ExcelPreview url={previewUrl} />
            ) : isPdf ? (
              <iframe title="PDF preview" src={previewUrl} className="preview-frame" />
            ) : isUnsupported ? (
              <div className="unsupported-preview">
                <p>
                  In-browser local preview for <strong>{previewExt}</strong> is not supported to ensure offline privacy.
                </p>
                <p>You can still download the file to view it on your machine.</p>
              </div>
            ) : (
              <p>This file format is not supported for preview.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

