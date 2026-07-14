import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { getByPath, setByPath } from '../core/path';

function normalizeItems(items = []) {
  return items.map((item, index) => ({
    itemType: item.itemType || 'simple',
    name: item.name || item.dataField || `item_${index}`,
    visible: item.visible !== false,
    ...item,
    items: item.items ? normalizeItems(item.items) : item.items
  }));
}

function findItem(items, path) {
  const names = String(path).split('.');
  let currentItems = items;
  let found;
  for (const name of names) {
    found = currentItems.find((item) => item.name === name || item.dataField === name);
    if (!found) return null;
    currentItems = found.items || [];
  }
  return found;
}

function updateItem(items, path, updater) {
  const names = String(path).split('.');
  const walk = (list, depth) => list.map((item) => {
    const matches = item.name === names[depth] || item.dataField === names[depth];
    if (!matches) return item;
    if (depth === names.length - 1) return updater(item);
    return { ...item, items: walk(item.items || [], depth + 1) };
  });
  return walk(items, 0);
}

function DefaultEditor({ type, value, options, onChange, editorRef }) {
  const common = {
    ref: editorRef,
    disabled: options.disabled,
    readOnly: options.readOnly,
    value: value ?? '',
    onChange: (event) => onChange(event.target.type === 'checkbox' ? event.target.checked : event.target.value)
  };

  if (type === 'dxCheckBox') {
    return <input {...common} checked={Boolean(value)} type="checkbox" value={undefined} />;
  }
  if (type === 'dxTextArea') {
    return <textarea {...common} rows={options.height ? undefined : 4} style={{ height: options.height }} />;
  }
  if (type === 'dxSelectBox') {
    const data = options.items || options.dataSource || [];
    const valueExpr = options.valueExpr || 'value';
    const displayExpr = options.displayExpr || 'text';
    return (
      <select {...common}>
        <option value="">-- Select --</option>
        {data.map((entry, index) => {
          const itemValue = typeof entry === 'object' ? entry[valueExpr] : entry;
          const itemText = typeof entry === 'object' ? entry[displayExpr] : entry;
          return <option key={itemValue ?? index} value={itemValue}>{itemText}</option>;
        })}
      </select>
    );
  }
  if (type === 'dxDateBox') return <input {...common} type="date" />;
  if (type === 'dxNumberBox') return <input {...common} type="number" min={options.min} max={options.max} step={options.step} />;
  return <input {...common} type={options.mode || 'text'} placeholder={options.placeholder} />;
}

const Form = forwardRef(function Form({
  formData: initialFormData = {},
  items: initialItems = [],
  colCount = 1,
  labelLocation = 'top',
  readOnly = false,
  onFieldDataChanged,
  onContentReady,
  validationGroup
}, ref) {
  const [formData, setFormData] = useState(initialFormData || {});
  const [items, setItems] = useState(() => normalizeItems(initialItems));
  const editorRefs = useRef(new Map());
  const rootRef = useRef(null);

  useEffect(() => setFormData(initialFormData || {}), [initialFormData]);
  useEffect(() => setItems(normalizeItems(initialItems)), [initialItems]);
  useEffect(() => { onContentReady?.({ component: apiRef.current, element: rootRef.current }); }, []);

  const setFieldValue = (dataField, value) => {
    setFormData((current) => {
      const next = setByPath(current, dataField, value);
      onFieldDataChanged?.({ component: apiRef.current, dataField, value });
      return next;
    });
  };

  const validateItem = (item) => {
    const value = getByPath(formData, item.dataField);
    const rules = item.validationRules || [];
    for (const rule of rules) {
      if (rule.type === 'required' && (value === '' || value == null)) {
        return { isValid: false, message: rule.message || `${item.label?.text || item.dataField} is required.` };
      }
      if (rule.type === 'custom' && rule.validationCallback && !rule.validationCallback({ value, data: formData })) {
        return { isValid: false, message: rule.message || 'Invalid value.' };
      }
    }
    return { isValid: true };
  };

  const collectSimpleItems = (list) => list.flatMap((item) => item.itemType === 'group'
    ? collectSimpleItems(item.items || [])
    : item.itemType === 'simple' ? [item] : []);

  const apiRef = useRef(null);
  const api = useMemo(() => ({
    option(name, value) {
      if (arguments.length === 0) return { formData, items, colCount, labelLocation, readOnly };
      if (arguments.length === 1) {
        if (name === 'formData') return formData;
        if (name === 'items') return items;
        if (String(name).startsWith('formData.')) return getByPath(formData, String(name).slice(9));
        return { colCount, labelLocation, readOnly }[name];
      }
      if (name === 'formData') setFormData(value || {});
      else if (name === 'items') setItems(normalizeItems(value));
      else if (String(name).startsWith('formData.')) setFieldValue(String(name).slice(9), value);
      return apiRef.current;
    },
    updateData(fieldOrObject, value) {
      if (typeof fieldOrObject === 'object') {
        setFormData((current) => ({ ...current, ...fieldOrObject }));
      } else {
        setFieldValue(fieldOrObject, value);
      }
      return apiRef.current;
    },
    itemOption(path, optionName, value) {
      const item = findItem(items, path);
      if (arguments.length === 1) return item;
      if (arguments.length === 2 && typeof optionName === 'string') return item?.[optionName];
      const patch = typeof optionName === 'object' ? optionName : { [optionName]: value };
      setItems((current) => updateItem(current, path, (entry) => ({ ...entry, ...patch })));
      return apiRef.current;
    },
    getEditor(dataField) {
      const node = editorRefs.current.get(dataField);
      if (!node) return undefined;
      return {
        element: () => node,
        option(name, value) {
          if (arguments.length === 1) {
            if (name === 'value') return getByPath(formData, dataField);
            return node[name];
          }
          if (name === 'value') setFieldValue(dataField, value);
          else node[name] = value;
          return this;
        },
        focus: () => node.focus()
      };
    },
    validate() {
      const brokenRules = collectSimpleItems(items)
        .map((item) => ({ item, result: validateItem(item) }))
        .filter(({ result }) => !result.isValid)
        .map(({ item, result }) => ({ dataField: item.dataField, message: result.message }));
      return { isValid: brokenRules.length === 0, brokenRules, validationGroup };
    },
    repaint() { setItems((current) => [...current]); return apiRef.current; },
    element() { return rootRef.current; }
  }), [formData, items, colCount, labelLocation, readOnly, validationGroup]);
  apiRef.current = api;
  useImperativeHandle(ref, () => api, [api]);

  const renderItems = (list, inheritedCols = colCount) => (
    <div className="dxlite-form-grid" style={{ gridTemplateColumns: `repeat(${inheritedCols || 1}, minmax(0, 1fr))` }}>
      {list.filter((item) => item.visible !== false).map((item) => {
        const style = { gridColumn: `span ${item.colSpan || 1}` };
        if (item.itemType === 'group') {
          return (
            <fieldset key={item.name} className="dxlite-group" style={style}>
              {item.caption && <legend>{item.caption}</legend>}
              {renderItems(item.items || [], item.colCount || inheritedCols)}
            </fieldset>
          );
        }
        if (item.itemType === 'empty') return <div key={item.name} style={style} />;
        if (item.itemType === 'button') {
          const buttonOptions = item.buttonOptions || {};
          return <button key={item.name} style={style} disabled={buttonOptions.disabled} onClick={buttonOptions.onClick}>{buttonOptions.text || 'Button'}</button>;
        }
        if (item.itemType === 'tabbed') {
          return (
            <div key={item.name} className="dxlite-tabs" style={style}>
              {(item.tabs || []).map((tab) => <section key={tab.title}><h4>{tab.title}</h4>{renderItems(tab.items || [], tab.colCount || inheritedCols)}</section>)}
            </div>
          );
        }
        if (item.template) {
          return <TemplateHost key={item.name} item={item} formData={formData} component={api} style={style} />;
        }
        const value = getByPath(formData, item.dataField);
        const editorOptions = { ...(item.editorOptions || {}), disabled: readOnly || item.editorOptions?.disabled };
        return (
          <label key={item.name} className={`dxlite-form-item label-${labelLocation}`} style={style}>
            <span>{item.label?.text || item.dataField}</span>
            <DefaultEditor
              type={item.editorType || 'dxTextBox'}
              value={value}
              options={editorOptions}
              onChange={(next) => setFieldValue(item.dataField, next)}
              editorRef={(node) => node ? editorRefs.current.set(item.dataField, node) : editorRefs.current.delete(item.dataField)}
            />
          </label>
        );
      })}
    </div>
  );

  return <div ref={rootRef} className="dxlite-form">{renderItems(items)}</div>;
});

function TemplateHost({ item, formData, component, style }) {
  const host = useRef(null);
  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = '';
    item.template({ component, formData, dataField: item.dataField }, host.current);
  }, [item, formData, component]);
  return <div ref={host} style={style} />;
}

export default Form;
