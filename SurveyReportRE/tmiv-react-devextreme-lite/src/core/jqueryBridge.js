import React from 'react';
import { createRoot } from 'react-dom/client';

const instances = new WeakMap();

function createMountedInstance(element, Component, options) {
  const root = createRoot(element);
  const ref = React.createRef();
  const record = { root, ref, Component, options: options || {} };

  record.render = () => {
    record.root.render(React.createElement(Component, { ...record.options, ref }));
  };

  record.render();
  instances.set(element, record);
  return record;
}

function getRecord(element) {
  return instances.get(element);
}

export function installJQueryControl($, pluginName, Component) {
  if (!$ || !$.fn) throw new Error('A valid jQuery instance is required.');

  $.fn[pluginName] = function plugin(arg1, ...args) {
    const firstElement = this[0];

    if (typeof arg1 === 'string') {
      const record = firstElement ? getRecord(firstElement) : null;
      if (!record) {
        if (arg1 === 'instance') return undefined;
        throw new Error(`${pluginName} is not initialized.`);
      }

      if (arg1 === 'instance') return record.ref.current;
      if (arg1 === 'dispose') {
        this.each(function disposeEach() {
          const item = getRecord(this);
          if (item) {
            item.root.unmount();
            instances.delete(this);
          }
        });
        return this;
      }

      const api = record.ref.current;
      const method = api?.[arg1];
      if (typeof method !== 'function') {
        throw new Error(`${pluginName}.${arg1} is not implemented.`);
      }
      return method(...args);
    }

    return this.each(function initEach() {
      const existing = getRecord(this);
      if (existing) {
        existing.options = { ...existing.options, ...(arg1 || {}) };
        existing.render();
      } else {
        createMountedInstance(this, Component, arg1 || {});
      }
    });
  };
}
