import { useState } from 'react';

const OFFICE_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
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

  const ext = file?.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  const isOfficeFile = OFFICE_EXTENSIONS.includes(ext);
  const isPdf = ext === '.pdf';

  return (
    <div className="app-shell">
      <div className="card">
        <h1>React Office Preview</h1>
        <p>Upload a Microsoft Office document or PDF and preview it in the browser.</p>

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
          <h2>Preview</h2>
          {isOfficeFile ? (
            <iframe
              title="Office preview"
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
              className="preview-frame"
            />
          ) : isPdf ? (
            <iframe title="PDF preview" src={previewUrl} className="preview-frame" />
          ) : (
            <p>This format is not supported by the preview viewer.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
