import React from 'react';
import ReactDOM from 'react-dom/client';
import $ from 'jquery';
import App from './App';
import Form from './components/Form';
import DataGrid from './components/DataGrid';
import { installJQueryControl } from './core/jqueryBridge';
import './styles/app.css';

installJQueryControl($, 'dxFormLite', Form);
installJQueryControl($, 'dxDataGridLite', DataGrid);

window.$ = window.jQuery = $;
window.TMIVControls = { Form, DataGrid };

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
