import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './datebox.css';

function DateBox({ value: initialValue, onChange, placeholder = 'Select date' }) {
  const [value, setValue] = useState(initialValue || '');
  const [open, setOpen] = useState(false);

  const handleChange = (event) => {
    setValue(event.target.value);
    onChange?.(event.target.value);
  };

  const toggleOpen = () => setOpen((current) => !current);

  return (
    <div className="tmivcom-datebox">
      <div className="tmivcom-datebox-input" onClick={toggleOpen}>
        <input
          type="text"
          readOnly
          value={value}
          placeholder={placeholder}
          aria-label="Date input"
        />
        <button type="button" onClick={toggleOpen} className="tmivcom-datebox-button">
          📅
        </button>
      </div>
      {open && (
        <input
          type="date"
          className="tmivcom-datebox-picker"
          value={value}
          onChange={handleChange}
          onBlur={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function renderDateBox(selector, props = {}) {
  const container = document.querySelector(selector);
  if (!container) {
    throw new Error(`TMIVCom DateBox target not found: ${selector}`);
  }

  const root = ReactDOM.createRoot(container);
  root.render(<DateBox {...props} />);

  return {
    setValue: (value) => root.render(<DateBox {...props} value={value} />),
  };
}

export default DateBox;
