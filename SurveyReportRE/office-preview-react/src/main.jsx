import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register jQuery plugin control (similar to TMIVCom export pattern)
if (window.jQuery) {
  const $ = window.jQuery;
  const roots = new WeakMap();

  $.fn.officepreview = function(options) {
    return this.each(function() {
      let instance = roots.get(this);
      if (!instance) {
        const root = ReactDOM.createRoot(this);
        instance = { root, options: {} };
        roots.set(this, instance);
      }
      instance.options = { ...instance.options, ...options };
      instance.root.render(
        <React.StrictMode>
          <App {...instance.options} />
        </React.StrictMode>
      );
    });
  };
}

// Keep default react mount for standalone testing
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

