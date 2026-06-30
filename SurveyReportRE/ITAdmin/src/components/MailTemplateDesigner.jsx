import { useEffect, useRef } from 'react';
import '../styles/mailTemplateDesigner.css';

const FIELDS = [
  { id: 'checkerName', label: 'Checker Name' },
  { id: 'makerName', label: 'Maker Name' },
  { id: 'shortName', label: 'Client Name' },
  { id: 'shortLocationName', label: 'Location' },
  { id: 'typeCheckerApprove', label: 'Approval Type' }
];

let editor = null;
let previewWindow = null;

function MailTemplateDesigner() {
  const editorRef = useRef(null);

  useEffect(() => {
    const loadGrapesJS = async () => {
      // Load GrapesJS library dynamically
      if (!window.grapesjs) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/grapesjs';
        script.async = true;
        script.onload = () => {
          initializeEditor();
        };
        document.head.appendChild(script);
      } else {
        initializeEditor();
      }
    };

    const initializeEditor = () => {
      if (editor) editor.destroy();

      editor = window.grapesjs.init({
        container: '#gjs',
        height: '100%',
        fromElement: false,
        storageManager: false,
        canvas: {
          styles: ['https://unpkg.com/grapesjs/dist/css/grapes.min.css']
        }
      });

      // Register custom field component
      editor.DomComponents.addType('tmiv-field', {
        model: {
          defaults: {
            tagName: 'span',
            content: '{{field}}',
            attributes: {
              'data-bind': '',
              class: 'tmiv-field'
            }
          }
        }
      });

      // Set initial content
      editor.setComponents(`
        <h2>Approval Mail</h2>
        <p>Dear {{checkerName}}</p>
        <p>Your report was approved!</p>
        <p>Client: {{shortName}}</p>
      `);

      // Setup drag and drop
      setupDragDrop();
    };

    loadGrapesJS();

    return () => {
      // Clean up
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
    };
  }, []);

  const setupDragDrop = () => {
    const fieldPanelItems = document.querySelectorAll('.field-item');
    const canvas = editor.Canvas.getBody();

    fieldPanelItems.forEach(el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('field', el.dataset.field);
      });
    });

    canvas.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    canvas.addEventListener('drop', e => {
      e.preventDefault();
      const field = e.dataTransfer.getData('field');

      if (field) {
        editor.addComponents({
          type: 'tmiv-field',
          content: `{{${field}}}`,
          attributes: {
            'data-bind': field
          }
        });
      }
    });
  };

  const saveTemplate = () => {
    const projectData = editor.getProjectData();
    const html = editor.getHtml();

    console.log('Project Data:', projectData);
    console.log('HTML:', html);

    // In a real app, send to backend
    // await fetch('/api/mail-template/save', { method: 'POST', body: JSON.stringify({ html, projectData }) });

    alert('Template saved successfully!');
  };

  const previewTemplate = () => {
    const html = editor.getHtml();
    const css = editor.getCss();

    // Sample data for preview
    const sampleData = {
      checkerName: 'Nguyễn Văn A',
      makerName: 'Trần Thị B',
      shortName: 'ABC Insurance',
      shortLocationName: 'Hà Nội',
      typeCheckerApprove: 'Manager Approval'
    };

    let previewHtml = html.replace(/\{\{(.*?)\}\}/g, (_, k) => sampleData[k.trim()] || _);

    if (previewWindow && !previewWindow.closed) {
      previewWindow.close();
    }

    previewWindow = window.open('', 'preview', 'width=800,height=600');
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Mail Template Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .tmiv-field { background: #e8f4f8; padding: 2px 4px; border-radius: 3px; }
            ${css}
          </style>
        </head>
        <body>
          <div class="container">
            ${previewHtml}
          </div>
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  const clearTemplate = () => {
    if (confirm('Are you sure you want to clear the template?')) {
      editor.setComponents('');
    }
  };

  return (
    <div className="mail-template-designer">
      <div className="designer-container">
        <div className="field-panel">
          <div className="panel-header">
            <h3>Database Fields</h3>
          </div>
          <div className="fields-list">
            {FIELDS.map(field => (
              <div
                key={field.id}
                className="field-item"
                draggable="true"
                data-field={field.id}
                title="Drag to canvas"
              >
                {field.label}
              </div>
            ))}
          </div>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={saveTemplate}>
              Save Template
            </button>
            <button className="btn btn-secondary" onClick={previewTemplate}>
              Preview
            </button>
            <button className="btn btn-danger" onClick={clearTemplate}>
              Clear
            </button>
          </div>
        </div>

        <div className="editor-wrapper">
          <div id="gjs" ref={editorRef}></div>
        </div>
      </div>
    </div>
  );
}

export default MailTemplateDesigner;
