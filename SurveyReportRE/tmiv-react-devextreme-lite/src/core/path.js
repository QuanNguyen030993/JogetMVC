export function getByPath(source, path) {
  if (!path) return source;
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
}

export function setByPath(source, path, value) {
  const keys = String(path).split('.');
  const clone = Array.isArray(source) ? [...source] : { ...(source || {}) };
  let cursor = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const current = cursor[key];
    cursor[key] = Array.isArray(current) ? [...current] : { ...(current || {}) };
    cursor = cursor[key];
  }

  cursor[keys.at(-1)] = value;
  return clone;
}
