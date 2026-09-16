import { useMemo, useRef, useState } from 'react';
import appsettings from '../../../host.json';
import { notify } from '../../../TMIVCom/src/components/Notification';

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    return payload.message || 'Không thể xử lý file Excel.';
  } catch {
    return 'Không thể xử lý file Excel.';
  }
};

export default function TemplateExcelImport() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const selectedReadyCount = useMemo(() => (
    (preview?.sections || [])
      .filter((section) => selected.has(section.code))
      .reduce((sum, section) => sum + section.readyCount, 0)
  ), [preview, selected]);

  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      notify({ content: 'Chỉ hỗ trợ file Excel định dạng .xlsx.', type: 'warning', position: 'bottom-right' });
      return;
    }
    setFile(nextFile);
    setPreview(null);
    setSelected(new Set());
  };

  const previewFile = async () => {
    if (!file) {
      notify({ content: 'Vui lòng chọn file Excel.', type: 'warning', position: 'bottom-right' });
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/TemplateExcelImport/Preview`, {
        method: 'POST',
        body
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const data = await response.json();
      setPreview(data);
      setSelected(new Set((data.sections || []).filter((section) => section.canImport).map((section) => section.code)));
    } catch (error) {
      notify({ content: error.message, type: 'error', position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  };

  const importFile = async () => {
    if (!file || selected.size === 0) return;
    setLoading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('sections', Array.from(selected).join(','));
      const response = await fetch(`${appsettings.UrlConfig.Host}/api/TemplateExcelImport/Import`, {
        method: 'POST',
        body
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const data = await response.json();
      notify({ content: data.message || 'Import dữ liệu thành công.', type: 'success', position: 'bottom-right' });
      await previewFile();
    } catch (error) {
      notify({ content: error.message, type: 'error', position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    if (!section.canImport) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(section.code)) next.delete(section.code);
      else next.add(section.code);
      return next;
    });
  };

  return (
    <section className="template-import-page">
      <header className="template-import-header">
        <div>
          <span className="template-import-eyebrow">Excel Import</span>
          <h1>Import Template &amp; Status</h1>
          <p>Kiểm tra dữ liệu trước khi cập nhật MailTemplate, NotificationTemplate và EnumData.</p>
        </div>
        {preview && (
          <div className="template-import-summary">
            <span><strong>{preview.readyCount}</strong> sẵn sàng</span>
            <span className={preview.errorCount ? 'has-error' : ''}><strong>{preview.errorCount}</strong> lỗi</span>
          </div>
        )}
      </header>

      <div className="template-import-workspace">
        <aside className="template-import-upload-panel">
          <div
            className={`template-import-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseFile(event.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => chooseFile(event.target.files?.[0])}
              hidden
            />
            <span className="template-import-file-icon" aria-hidden="true">XLSX</span>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <small>{formatSize(file.size)} · Nhấn để chọn file khác</small>
              </>
            ) : (
              <>
                <strong>Kéo thả file Excel vào đây</strong>
                <small>hoặc nhấn để chọn file .xlsx, tối đa 20 MB</small>
              </>
            )}
          </div>

          <div className="template-import-map">
            <h2>Cấu trúc cập nhật</h2>
            <div><i className="mail" /><span><b>Email / Mail</b><small>TemplateName → Title, Content</small></span></div>
            <div><i className="notification" /><span><b>Notification</b><small>TemplateName hoặc Code → Title, Content</small></span></div>
            <div><i className="status" /><span><b>Status</b><small>Id → Status Name, General Status Dashboard</small></span></div>
          </div>

          <button type="button" className="template-import-preview-button" disabled={!file || loading} onClick={previewFile}>
            {loading ? 'Đang xử lý…' : 'Kiểm tra dữ liệu'}
          </button>
        </aside>

        <div className="template-import-results">
          {!preview ? (
            <div className="template-import-empty">
              <span aria-hidden="true">↥</span>
              <h2>Chưa có dữ liệu xem trước</h2>
              <p>Chọn file Excel và nhấn “Kiểm tra dữ liệu”.</p>
            </div>
          ) : (
            <>
              <div className="template-import-section-list">
                {preview.sections.map((section) => (
                  <article key={section.code} className={`template-import-section-card ${section.canImport ? 'ready' : 'invalid'} ${selected.has(section.code) ? 'selected' : ''}`}>
                    <header>
                      <label>
                        <input
                          type="checkbox"
                          checked={selected.has(section.code)}
                          disabled={!section.canImport}
                          onChange={() => toggleSection(section)}
                        />
                        <span className="template-import-check" />
                        <span>
                          <strong>{section.label}</strong>
                          <small>Sheet: {section.sheetName || 'Không tìm thấy'}</small>
                        </span>
                      </label>
                      <div className="template-import-counts">
                        <span className="ready">{section.readyCount} sẵn sàng</span>
                        <span className={section.errorCount ? 'error' : ''}>{section.errorCount} lỗi</span>
                      </div>
                    </header>

                    {section.error && <div className="template-import-section-error">{section.error}</div>}
                    {section.rows.length > 0 && (
                      <div className="template-import-table-wrap">
                        <table>
                          <thead><tr><th>Dòng</th><th>Key / Id</th><th>Title / Status Name</th><th>Content / MappingField</th><th>Trạng thái</th></tr></thead>
                          <tbody>
                            {section.rows.map((row) => (
                              <tr key={`${section.code}-${row.excelRow}`} className={row.isValid ? '' : 'row-error'}>
                                <td>{row.excelRow}</td>
                                <td title={row.key}>{row.key || '—'}</td>
                                <td title={row.title}>{row.title || '—'}</td>
                                <td title={row.content}>{row.contentPreview || '—'}</td>
                                <td><span className={row.isValid ? 'status-ready' : 'status-error'}>{row.isValid ? 'Sẵn sàng' : row.error}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <footer className="template-import-actions">
                <span>Đã chọn <strong>{selected.size}</strong> nhóm · <strong>{selectedReadyCount}</strong> bản ghi</span>
                <button type="button" disabled={!selectedReadyCount || loading} onClick={importFile}>
                  {loading ? 'Đang cập nhật…' : 'Import dữ liệu đã chọn'}
                </button>
              </footer>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
