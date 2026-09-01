var on = Object.defineProperty;
var sn = (e, n, i) => n in e ? on(e, n, { enumerable: !0, configurable: !0, writable: !0, value: i }) : e[n] = i;
var Oe = (e, n, i) => sn(e, typeof n != "symbol" ? n + "" : n, i);
import { jsxs as x, jsx as u, Fragment as Ce } from "react/jsx-runtime";
import { useState as T, useMemo as ae, useEffect as ye, useCallback as p, memo as Vt, forwardRef as Wt, useRef as et, useImperativeHandle as dn } from "react";
const _ = (e) => String(e.field ?? e.dataField ?? e.name ?? ""), H = (e, n) => {
  if (!(!e || !n))
    return n.split(".").reduce((i, s) => {
      if (!(i == null || typeof i != "object"))
        return i[s];
    }, e);
}, se = (e, n) => n.valueGetter ? n.valueGetter(e) : n.calculateCellValue ? n.calculateCellValue(e) : H(e, _(n)), it = (e, n) => {
  if (n.calculateDisplayValue) return n.calculateDisplayValue(e);
  const i = se(e, n);
  if (!n.lookup) return i;
  const s = n.lookup.dataSource.find((d) => {
    var r;
    return String(H(d, String((r = n.lookup) == null ? void 0 : r.valueExpr)) ?? "") === String(i ?? "");
  });
  return s ? H(s, String(n.lookup.displayExpr)) : i;
}, j = (e, n) => {
  const i = typeof n == "function" ? n(e) : H(e, String(n));
  if (typeof i != "string" && typeof i != "number")
    throw new Error(`DataGrid keyExpr "${String(n)}" must resolve to a string or number.`);
  return i;
}, cn = (e, n) => (e != null && e.length ? e : Object.keys(n[0] ?? {}).map((s) => ({ field: s, caption: s }))).map((s, d) => ({
  ...s,
  field: s.field ?? s.dataField,
  caption: s.caption ?? String(s.field ?? s.dataField ?? s.name ?? ""),
  visibleIndex: s.visibleIndex ?? d,
  allowSorting: s.allowSorting !== !1
})).filter((s) => s.visible !== !1).sort((s, d) => (s.visibleIndex ?? 0) - (d.visibleIndex ?? 0)), Ge = (e, n) => Object.is(e, n) ? 0 : e == null ? 1 : n == null ? -1 : typeof e == "number" && typeof n == "number" ? e - n : e instanceof Date && n instanceof Date ? e.getTime() - n.getTime() : String(e).localeCompare(String(n), void 0, { numeric: !0, sensitivity: "base" }), gn = (e, n, i) => {
  if (!i.length) return e;
  const s = e.map((d, r) => ({ row: d, index: r }));
  return s.sort((d, r) => {
    for (const g of i) {
      const o = n.find((w) => _(w) === g.field);
      if (!o) continue;
      const y = se(d.row, o), m = se(r.row, o), b = o.sortComparator ? o.sortComparator(y, m, d.row, r.row) : Ge(y, m);
      if (b !== 0) return g.direction === "desc" ? -b : b;
    }
    return d.index - r.index;
  }), s.map((d) => d.row);
}, un = (e, n, i) => e.slice(n * i, n * i + i), nt = (e) => String(e ?? "").toLocaleLowerCase(), fn = (e, n, i) => {
  const s = se(e, n), d = i.value;
  if (d === "" || d === void 0 || d === null || Array.isArray(d) && !d.length) return !0;
  if (i.operator === "in") return Array.isArray(d) && d.some((y) => Object.is(y, s) || String(y) === String(s));
  if (i.operator === "between" && Array.isArray(d)) {
    const [y, m] = d;
    return (y === "" || Ge(s, y) >= 0) && (m === "" || Ge(s, m) <= 0);
  }
  const r = nt(s), g = nt(d);
  if (i.operator === "contains") return r.includes(g);
  if (i.operator === "notContains") return !r.includes(g);
  if (i.operator === "startsWith") return r.startsWith(g);
  if (i.operator === "endsWith") return r.endsWith(g);
  if (i.operator === "equals") return r === g;
  if (i.operator === "notEquals") return r !== g;
  const o = Ge(s, d);
  return i.operator === ">" ? o > 0 : i.operator === ">=" ? o >= 0 : i.operator === "<" ? o < 0 : i.operator === "<=" ? o <= 0 : !0;
}, hn = (e, n, i) => i.length ? e.filter((s) => i.every((d) => {
  const r = n.find((g) => _(g) === d.field);
  return r ? fn(s, r, d) : !0;
})) : e, yn = (e, n, i) => {
  const s = nt(i).trim();
  if (!s) return e;
  const d = n.filter((r) => r.allowFiltering !== !1);
  return e.filter((r) => d.some((g) => nt(it(r, g)).includes(s)));
}, tt = (e, n, i, s = 0, d = "") => {
  const r = i[s];
  if (!r) return [];
  const g = n.find((y) => _(y) === r.field);
  if (!g) return [];
  const o = /* @__PURE__ */ new Map();
  return e.forEach((y) => {
    const m = it(y, g), b = `${typeof m}:${String(m ?? "")}`, w = o.get(b) ?? { value: m, rows: [] };
    w.rows.push(y), o.set(b, w);
  }), [...o.values()].sort((y, m) => Ge(y.value, m.value) * (r.direction === "desc" ? -1 : 1)).map((y) => {
    const m = `${d}/${r.field}:${String(y.value ?? "")}`;
    return {
      id: m,
      field: r.field,
      value: y.value,
      level: s,
      rows: y.rows,
      children: tt(y.rows, n, i, s + 1, m)
    };
  });
}, qt = (e, n) => {
  var s;
  if (n.type === "custom") return (s = n.calculate) == null ? void 0 : s.call(n, e);
  if (n.type === "count") return n.field ? e.filter((d) => H(d, String(n.field)) !== void 0).length : e.length;
  const i = e.map((d) => H(d, String(n.field ?? ""))).filter((d) => typeof d == "number" && Number.isFinite(d));
  if (i.length) {
    if (n.type === "sum") return i.reduce((d, r) => d + r, 0);
    if (n.type === "avg") return i.reduce((d, r) => d + r, 0) / i.length;
    if (n.type === "min") return Math.min(...i);
    if (n.type === "max") return Math.max(...i);
  }
}, mn = (e, n, i) => {
  const s = e.find((r) => r.field === n), d = e.filter((r) => r.field !== n);
  if (!s) return i ? [...d, { field: n, direction: "asc" }] : [{ field: n, direction: "asc" }];
  if (s.direction === "asc") {
    const r = { field: n, direction: "desc" };
    return i ? [...d, r] : [r];
  }
  return i ? d : [];
}, Bt = (e, n, i, s = "en") => {
  if (i.format instanceof Function) return i.format(e, n);
  if (e == null) return "";
  const d = i.format ?? i.dataType;
  if (d === "currency" && typeof e == "number")
    return new Intl.NumberFormat(s, { style: "currency", currency: "USD" }).format(e);
  if (d === "percent" && typeof e == "number")
    return new Intl.NumberFormat(s, { style: "percent" }).format(e);
  if ((d === "decimal" || i.dataType === "number") && typeof e == "number")
    return new Intl.NumberFormat(s).format(e);
  if (d === "date" || d === "datetime" || i.dataType === "date" || i.dataType === "datetime") {
    const r = e instanceof Date ? e : new Date(String(e));
    if (!Number.isNaN(r.getTime()))
      return new Intl.DateTimeFormat(s, d === "datetime" || i.dataType === "datetime" ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(r);
  }
  return typeof e == "boolean" ? e ? "Yes" : "No" : typeof e == "object" ? JSON.stringify(e) : String(e);
}, wn = ({ column: e, rows: n, selected: i, searchable: s, onChange: d }) => {
  const [r, g] = T(!1), [o, y] = T(""), m = ae(() => {
    const b = /* @__PURE__ */ new Map();
    return n.forEach((w) => {
      const v = se(w, e);
      b.set(`${typeof v}:${String(v ?? "")}`, { value: v, label: it(w, e) });
    }), [...b.values()].filter((w) => String(w.label ?? "").toLocaleLowerCase().includes(o.toLocaleLowerCase()));
  }, [n, e, o]);
  return /* @__PURE__ */ x("span", { className: "tmiv-grid__header-filter", onClick: (b) => b.stopPropagation(), children: [
    /* @__PURE__ */ u("button", { type: "button", "aria-label": `Filter values ${e.caption}`, "aria-expanded": r, className: i.length ? "is-active" : "", onClick: () => g((b) => !b), children: "▽" }),
    r && /* @__PURE__ */ x("div", { className: "tmiv-grid__header-filter-popover", children: [
      s && /* @__PURE__ */ u("input", { type: "search", "aria-label": `Search values ${e.caption}`, placeholder: "Search values...", value: o, onChange: (b) => y(b.target.value) }),
      /* @__PURE__ */ x("label", { children: [
        /* @__PURE__ */ u("input", { type: "checkbox", checked: i.length === 0, onChange: () => d([]) }),
        " All"
      ] }),
      /* @__PURE__ */ u("div", { className: "tmiv-grid__header-filter-values", children: m.map(({ value: b, label: w }) => {
        const v = i.some((N) => Object.is(N, b) || String(N) === String(b));
        return /* @__PURE__ */ x("label", { children: [
          /* @__PURE__ */ u("input", { type: "checkbox", checked: v, onChange: () => d(v ? i.filter((N) => !Object.is(N, b) && String(N) !== String(b)) : [...i, b]) }),
          " ",
          String(w ?? "(Blank)")
        ] }, `${typeof b}:${String(b)}`);
      }) }),
      /* @__PURE__ */ u("button", { type: "button", onClick: () => g(!1), children: "Close" })
    ] })
  ] });
}, bn = ({
  column: e,
  columnIndex: n,
  sort: i,
  onSort: s,
  rows: d,
  headerFilterVisible: r,
  headerFilterSearchable: g,
  headerFilterValues: o,
  reorderable: y,
  dragEnabled: m,
  dragging: b,
  dropTarget: w,
  onHeaderFilterChange: v,
  onDragStart: N,
  onDragEnd: V,
  onDragOver: O,
  onDrop: R
}) => {
  const G = _(e), q = i.findIndex((D) => D.field === G), X = q >= 0 ? i[q] : void 0, A = e.allowSorting !== !1 && !!G;
  return /* @__PURE__ */ u(
    "th",
    {
      role: "columnheader",
      "aria-colindex": n + 1,
      "aria-sort": X ? X.direction === "asc" ? "ascending" : "descending" : "none",
      draggable: m,
      className: `tmiv-grid__header-cell ${A ? "tmiv-grid__header-cell--sortable" : ""} ${b ? "tmiv-grid__header-cell--dragging" : ""} ${w ? "tmiv-grid__header-cell--drop-target" : ""}`,
      style: {
        width: e.width,
        minWidth: e.minWidth,
        maxWidth: e.maxWidth,
        textAlign: e.alignment
      },
      onClick: (D) => A && s(G, D.shiftKey),
      onDragStart: (D) => {
        D.dataTransfer.effectAllowed = "move", D.dataTransfer.setData("application/x-tmiv-grid-column", G), N();
      },
      onDragEnd: V,
      onDragOver: (D) => {
        y && (D.preventDefault(), O());
      },
      onDrop: (D) => {
        D.preventDefault(), R();
      },
      children: /* @__PURE__ */ x("div", { className: "tmiv-grid__header-content", children: [
        e.renderHeader ? e.renderHeader({ column: e, columnIndex: n }) : e.caption,
        X && /* @__PURE__ */ x("span", { className: "tmiv-grid__sort", "aria-hidden": "true", children: [
          X.direction === "asc" ? "▲" : "▼",
          i.length > 1 && /* @__PURE__ */ u("small", { children: q + 1 })
        ] }),
        r && e.allowFiltering !== !1 && /* @__PURE__ */ u(wn, { column: e, rows: d, selected: o, searchable: g, onChange: v })
      ] })
    }
  );
}, Sn = (e) => e.filterOperation ?? (e.dataType === "number" || e.dataType === "date" || e.dataType === "datetime" ? "equals" : "contains"), vn = (e) => e.dataType === "number" || e.dataType === "date" || e.dataType === "datetime" ? [["equals", "="], ["notEquals", "≠"], [">", ">"], [">=", "≥"], ["<", "<"], ["<=", "≤"], ["between", "Between"]] : [["contains", "Contains"], ["notContains", "Not contains"], ["startsWith", "Starts with"], ["endsWith", "Ends with"], ["equals", "="], ["notEquals", "≠"]], Cn = ({ columns: e, filters: n, columnOffset: i, commandOffset: s = 0, onChange: d }) => /* @__PURE__ */ x("tr", { role: "row", className: "tmiv-grid__filter-row", children: [
  Array.from({ length: i }, (r, g) => /* @__PURE__ */ u("th", { className: "tmiv-grid__filter-cell" }, g)),
  e.map((r) => {
    const g = _(r), o = n.find((w) => w.field === g), y = (o == null ? void 0 : o.operator) ?? Sn(r);
    if (r.allowFiltering === !1 || !g) return /* @__PURE__ */ u("th", { className: "tmiv-grid__filter-cell" }, g);
    if (r.dataType === "boolean")
      return /* @__PURE__ */ u("th", { className: "tmiv-grid__filter-cell", children: /* @__PURE__ */ x("select", { "aria-label": `Filter ${r.caption}`, value: String((o == null ? void 0 : o.value) ?? ""), onChange: (w) => d(g, "equals", w.target.value === "" ? "" : w.target.value === "true"), children: [
        /* @__PURE__ */ u("option", { value: "", children: "All" }),
        /* @__PURE__ */ u("option", { value: "true", children: "True" }),
        /* @__PURE__ */ u("option", { value: "false", children: "False" })
      ] }) }, g);
    const m = r.dataType === "number" ? "number" : r.dataType === "date" || r.dataType === "datetime" ? "date" : "search", b = Array.isArray(o == null ? void 0 : o.value) ? o.value : [(o == null ? void 0 : o.value) ?? "", ""];
    return /* @__PURE__ */ u("th", { className: "tmiv-grid__filter-cell", children: /* @__PURE__ */ x("div", { className: "tmiv-grid__filter-editor", children: [
      /* @__PURE__ */ u("select", { "aria-label": `Filter operation ${r.caption}`, value: y, onChange: (w) => {
        const v = w.target.value;
        d(g, v, v === "between" ? b : b[0]);
      }, children: vn(r).map(([w, v]) => /* @__PURE__ */ u("option", { value: w, children: v }, w)) }),
      y === "between" ? /* @__PURE__ */ x("span", { className: "tmiv-grid__filter-range", children: [
        /* @__PURE__ */ u("input", { "aria-label": `Filter ${r.caption} from`, type: m, value: String(b[0] ?? ""), onChange: (w) => d(g, y, [w.target.value, b[1]]) }),
        /* @__PURE__ */ u("input", { "aria-label": `Filter ${r.caption} to`, type: m, value: String(b[1] ?? ""), onChange: (w) => d(g, y, [b[0], w.target.value]) })
      ] }) : /* @__PURE__ */ u("input", { "aria-label": `Filter ${r.caption}`, type: m, value: String(Array.isArray(o == null ? void 0 : o.value) ? (o == null ? void 0 : o.value[0]) ?? "" : (o == null ? void 0 : o.value) ?? ""), onChange: (w) => d(g, y, w.target.value) })
    ] }) }, g);
  }),
  Array.from({ length: s }, (r, g) => /* @__PURE__ */ u("th", { className: "tmiv-grid__filter-cell" }, `command-${g}`))
] }), _n = ({ config: e, value: n, onChange: i }) => {
  const [s, d] = T(n);
  return ye(() => d(n), [n]), ye(() => {
    const r = window.setTimeout(() => i(s), e.debounce ?? 250);
    return () => window.clearTimeout(r);
  }, [s, e.debounce, i]), /* @__PURE__ */ x("label", { className: "tmiv-grid__search", style: { width: e.width }, children: [
    /* @__PURE__ */ u("span", { "aria-hidden": "true", children: "⌕" }),
    /* @__PURE__ */ u(
      "input",
      {
        type: "search",
        "aria-label": e.placeholder ?? "Search",
        placeholder: e.placeholder ?? "Search...",
        value: s,
        onChange: (r) => d(r.target.value)
      }
    )
  ] });
}, xn = ({ columns: e, groups: n, emptyText: i, allowDragging: s, onChange: d }) => /* @__PURE__ */ x("div", { className: "tmiv-grid__group-panel", onDragOver: (g) => s && g.preventDefault(), onDrop: (g) => {
  if (g.preventDefault(), !s) return;
  const o = g.dataTransfer.getData("application/x-tmiv-grid-column"), y = e.find((m) => _(m) === o);
  o && (y == null ? void 0 : y.allowGrouping) !== !1 && !n.some((m) => m.field === o) && d([...n, { field: o, direction: "asc" }]);
}, children: [
  !n.length && /* @__PURE__ */ u("span", { children: i }),
  n.map((g) => {
    const o = e.find((y) => _(y) === g.field);
    return /* @__PURE__ */ x("span", { className: "tmiv-grid__group-chip", children: [
      /* @__PURE__ */ x("button", { type: "button", "aria-label": `Toggle group direction ${(o == null ? void 0 : o.caption) ?? g.field}`, onClick: () => d(n.map((y) => y.field === g.field ? { ...y, direction: y.direction === "desc" ? "asc" : "desc" } : y)), children: [
        (o == null ? void 0 : o.caption) ?? g.field,
        " ",
        g.direction === "desc" ? "▼" : "▲"
      ] }),
      /* @__PURE__ */ u("button", { type: "button", "aria-label": `Remove group ${(o == null ? void 0 : o.caption) ?? g.field}`, onClick: () => d(n.filter((y) => y.field !== g.field)), children: "×" })
    ] }, g.field);
  })
] }), kn = ({ node: e, column: n, colSpan: i, expanded: s, collapsible: d, summaries: r, onToggle: g }) => /* @__PURE__ */ u("tr", { role: "row", className: "tmiv-grid__group-row", children: /* @__PURE__ */ x("td", { role: "gridcell", colSpan: i, style: { paddingLeft: 12 + e.level * 22 }, children: [
  /* @__PURE__ */ u("button", { type: "button", disabled: !d, "aria-expanded": s, onClick: g, children: s ? "▾" : "▸" }),
  /* @__PURE__ */ x("strong", { children: [
    (n == null ? void 0 : n.caption) ?? e.field,
    ":"
  ] }),
  " ",
  String(e.value ?? "(Blank)"),
  /* @__PURE__ */ x("span", { className: "tmiv-grid__group-count", children: [
    "(",
    e.rows.length,
    ")"
  ] }),
  r.map((o, y) => {
    var w;
    const m = qt(e.rows, o), b = ((w = o.displayFormat) == null ? void 0 : w.replace("{0}", String(m ?? ""))) ?? `${String(o.field ?? o.name ?? o.type)}: ${String(m ?? "")}`;
    return /* @__PURE__ */ u("span", { className: "tmiv-grid__group-summary", children: b }, o.name ?? `${String(o.field)}-${o.type}-${y}`);
  })
] }) }), Ne = (e) => e == null || e === "", Rn = (e, n) => e.type === "required" ? `${n} is required.` : e.type === "email" ? `${n} must be a valid email.` : e.type === "numeric" ? `${n} must be numeric.` : e.type === "stringLength" ? `${n} has an invalid length.` : e.type === "range" ? `${n} is outside the allowed range.` : e.type === "pattern" ? `${n} has an invalid format.` : e.type === "compare" ? `${n} does not match.` : `${n} is invalid.`, En = async (e, n, i) => {
  var s, d;
  for (const r of i.validationRules ?? []) {
    let g = !0;
    if (r.type === "required") g = !Ne(e);
    else if (!Ne(e) && r.type === "numeric") g = Number.isFinite(Number(e));
    else if (!Ne(e) && r.type === "email") g = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e));
    else if (!Ne(e) && r.type === "stringLength") {
      const o = String(e).length;
      g = (r.min === void 0 || o >= r.min) && (r.max === void 0 || o <= r.max);
    } else if (!Ne(e) && r.type === "range") {
      const o = Number(e);
      g = (r.min === void 0 || o >= r.min) && (r.max === void 0 || o <= r.max);
    } else if (!Ne(e) && r.type === "pattern")
      g = (r.pattern instanceof RegExp ? r.pattern : new RegExp(r.pattern ?? "")).test(String(e));
    else if (r.type === "compare") {
      const o = ((s = r.comparisonTarget) == null ? void 0 : s.call(r)) ?? H(n, String(r.compareField ?? ""));
      g = Object.is(e, o) || String(e ?? "") === String(o ?? "");
    } else if (r.type === "custom" || r.type === "async") {
      const o = await ((d = r.validationCallback) == null ? void 0 : d.call(r, { value: e, row: n, column: i }));
      if (typeof o == "string") return o;
      g = o !== !1;
    }
    if (!g) return r.message ?? Rn(r, i.caption ?? _(i));
  }
}, jt = async (e, n) => {
  const i = {};
  return await Promise.all(n.map(async (s) => {
    const d = _(s);
    if (!d || s.allowEditing === !1) return;
    const r = await En(H(e, d), e, s);
    r && (i[d] = r);
  })), i;
}, Dn = (e, n) => {
  if (e === "") return e;
  if (n.dataType === "number") {
    const i = Number(e);
    return Number.isFinite(i) ? i : e;
  }
  return n.dataType === "boolean" ? !!e : e;
}, Ut = ({ row: e, column: n, value: i, error: s, disabled: d = !1, autoFocus: r, onChange: g, onCommit: o, onCancel: y }) => {
  var V, O, R, G, q, X, A;
  const m = {
    disabled: d,
    autoFocus: r,
    "aria-invalid": !!s,
    "aria-label": `Edit ${n.caption ?? String(n.field ?? "")}`,
    onKeyDown: (D) => {
      D.key === "Escape" && (D.preventDefault(), y == null || y()), D.key === "Enter" && !D.shiftKey && (D.preventDefault(), o == null || o()), D.key === "Tab" && (o == null || o());
    }
  }, b = (D) => g(Dn(D, n)), w = { row: e, data: e, value: i, displayValue: i, column: n, rowIndex: -1, columnIndex: -1, setValue: b, error: s, disabled: d };
  if (n.renderEditCell) return /* @__PURE__ */ u(Ce, { children: n.renderEditCell(w) });
  const v = (V = n.editorType) == null ? void 0 : V.toLocaleLowerCase();
  if (n.lookup || v === "selectbox") {
    const D = ((O = n.lookup) == null ? void 0 : O.dataSource) ?? ((R = n.editorOptions) == null ? void 0 : R.dataSource) ?? [], S = String(((G = n.lookup) == null ? void 0 : G.valueExpr) ?? ((q = n.editorOptions) == null ? void 0 : q.valueExpr) ?? "value"), B = String(((X = n.lookup) == null ? void 0 : X.displayExpr) ?? ((A = n.editorOptions) == null ? void 0 : A.displayExpr) ?? "text");
    return /* @__PURE__ */ x("select", { ...m, value: String(i ?? ""), onChange: (F) => {
      const ce = D.find((c) => String(H(c, S) ?? "") === F.target.value);
      b(ce ? H(ce, S) : F.target.value);
    }, children: [
      /* @__PURE__ */ u("option", { value: "", children: "--" }),
      D.map((F, ce) => /* @__PURE__ */ u("option", { value: String(H(F, S) ?? ""), children: String(H(F, B) ?? "") }, String(H(F, S) ?? ce)))
    ] });
  }
  if (n.dataType === "boolean" || v === "checkbox")
    return /* @__PURE__ */ u("input", { ...m, type: "checkbox", checked: !!i, onChange: (D) => b(D.target.checked) });
  if (v === "textarea")
    return /* @__PURE__ */ u("textarea", { ...m, value: String(i ?? ""), onChange: (D) => b(D.target.value) });
  const N = n.dataType === "number" || v === "numberbox" ? "number" : n.dataType === "date" || v === "datebox" ? "date" : n.dataType === "datetime" || v === "datetimebox" ? "datetime-local" : "text";
  return /* @__PURE__ */ u("input", { ...m, type: N, value: String(i ?? ""), onChange: (D) => b(D.target.value), onBlur: o });
}, Nn = ({ row: e, columns: n, errors: i, colCount: s, title: d, saving: r, popup: g, width: o, onChange: y, onSave: m, onCancel: b }) => {
  const w = /* @__PURE__ */ x("div", { className: `tmiv-grid__edit-form ${g ? "tmiv-grid__edit-form--popup" : ""}`, style: { width: o }, role: g ? "dialog" : "form", "aria-modal": g || void 0, "aria-label": d ?? "Edit row", children: [
    d && /* @__PURE__ */ u("h3", { children: d }),
    /* @__PURE__ */ u("div", { className: "tmiv-grid__edit-form-fields", style: { gridTemplateColumns: `repeat(${Math.max(1, s)}, minmax(0, 1fr))` }, children: n.filter((v) => v.allowEditing !== !1 && _(v)).map((v) => {
      const N = _(v);
      return /* @__PURE__ */ x("label", { children: [
        /* @__PURE__ */ u("span", { children: v.caption ?? N }),
        /* @__PURE__ */ u(Ut, { row: e, column: v, value: H(e, N), error: i[N], disabled: r, onChange: (V) => y(N, V) }),
        i[N] && /* @__PURE__ */ u("small", { role: "alert", children: i[N] })
      ] }, N);
    }) }),
    /* @__PURE__ */ x("div", { className: "tmiv-grid__edit-form-actions", children: [
      /* @__PURE__ */ u("button", { type: "button", disabled: r, onClick: m, children: "Save" }),
      /* @__PURE__ */ u("button", { type: "button", disabled: r, onClick: b, children: "Cancel" })
    ] })
  ] });
  return g ? /* @__PURE__ */ u("div", { className: "tmiv-grid__popup-backdrop", children: w }) : w;
}, An = (e) => !Array.isArray(e) && typeof (e == null ? void 0 : e.load) == "function", Fn = (e, n, i) => {
  const [s, d] = T(Array.isArray(e) ? e : []), [r, g] = T(Array.isArray(e) ? e.length : 0), [o, y] = T(!Array.isArray(e)), [m, b] = T(null), w = p(async () => {
    if (!An(e)) {
      d(e), g(e.length), b(null);
      return;
    }
    y(!0), b(null);
    try {
      const v = await e.load(n), N = Array.isArray(v) ? v : v.data;
      d(N), g(Array.isArray(v) ? v.length : v.totalCount);
    } catch (v) {
      const N = v instanceof Error ? v : new Error(String(v));
      b(N), i == null || i(N);
    } finally {
      y(!1);
    }
  }, [e, n, i]);
  return ye(() => {
    w();
  }, [w]), { rows: s, totalCount: r, loading: o, error: m, reload: w };
}, pn = (e) => {
  const { selectedRowKeys: n, defaultSelectedRowKeys: i, onSelectedRowKeysChange: s } = e, [d, r] = T(i ?? []), [g, o] = T(e.pageIndex), [y, m] = T(e.pageSize), [b, w] = T(e.sort), [v, N] = T([]), [V, O] = T(""), [R, G] = T([]), [q, X] = T(null), A = n ?? d, D = p((S) => {
    const B = typeof S == "function" ? S(A) : S;
    n === void 0 && r(B), s == null || s(B);
  }, [A, n, s]);
  return {
    selection: A,
    setSelection: D,
    pageIndex: g,
    setPageIndex: o,
    pageSize: y,
    setPageSize: m,
    sort: b,
    setSort: w,
    filters: v,
    setFilters: N,
    search: V,
    setSearch: O,
    groups: R,
    setGroups: G,
    focusedCell: q,
    setFocusedCell: X
  };
}, $n = ({
  pageIndex: e,
  pageSize: n,
  pageCount: i,
  totalCount: s,
  allowedPageSizes: d,
  showPageSizeSelector: r,
  showNavigationButtons: g,
  showInfo: o,
  messages: y,
  onPageIndexChange: m,
  onPageSizeChange: b
}) => /* @__PURE__ */ x("div", { className: "tmiv-grid__pager", role: "navigation", "aria-label": "Grid pagination", children: [
  /* @__PURE__ */ x("div", { className: "tmiv-grid__pager-navigation", children: [
    g && /* @__PURE__ */ x(Ce, { children: [
      /* @__PURE__ */ u("button", { type: "button", "aria-label": "First page", disabled: e <= 0, onClick: () => m(0), children: "«" }),
      /* @__PURE__ */ u("button", { type: "button", "aria-label": "Previous page", disabled: e <= 0, onClick: () => m(e - 1), children: "‹" })
    ] }),
    /* @__PURE__ */ u("span", { children: y.page }),
    /* @__PURE__ */ u(
      "input",
      {
        "aria-label": "Page number",
        type: "number",
        min: 1,
        max: i,
        value: e + 1,
        onChange: (w) => m(Math.min(i - 1, Math.max(0, Number(w.target.value) - 1)))
      }
    ),
    /* @__PURE__ */ x("span", { children: [
      y.of,
      " ",
      i
    ] }),
    g && /* @__PURE__ */ x(Ce, { children: [
      /* @__PURE__ */ u("button", { type: "button", "aria-label": "Next page", disabled: e >= i - 1, onClick: () => m(e + 1), children: "›" }),
      /* @__PURE__ */ u("button", { type: "button", "aria-label": "Last page", disabled: e >= i - 1, onClick: () => m(i - 1), children: "»" })
    ] }),
    r && /* @__PURE__ */ x("label", { children: [
      y.rowsPerPage,
      /* @__PURE__ */ u("select", { value: n, onChange: (w) => b(Number(w.target.value)), children: d.map((w) => /* @__PURE__ */ u("option", { value: w, children: w }, w)) })
    ] })
  ] }),
  o && /* @__PURE__ */ x("span", { className: "tmiv-grid__pager-info", children: [
    s,
    " ",
    y.records
  ] })
] }), Pn = (e, n) => {
  const i = n.trim();
  if (!i) return e;
  const s = [], d = e.toLocaleLowerCase(), r = i.toLocaleLowerCase();
  let g = 0, o = d.indexOf(r);
  for (; o >= 0; )
    s.push(e.slice(g, o)), s.push(/* @__PURE__ */ u("mark", { children: e.slice(o, o + i.length) }, `${o}-${s.length}`)), g = o + i.length, o = d.indexOf(r, g);
  return s.push(e.slice(g)), s;
}, Tn = ({
  row: e,
  value: n,
  displayValue: i,
  column: s,
  rowIndex: d,
  columnIndex: r,
  locale: g,
  focused: o,
  onClick: y,
  onDoubleClick: m,
  onFocus: b,
  searchText: w = "",
  highlightSearchText: v = !1,
  editing: N = !1,
  changed: V = !1,
  error: O,
  saving: R = !1,
  onValueChange: G,
  onCommitEdit: q,
  onCancelEdit: X
}) => {
  const A = { row: e, data: e, value: n, displayValue: i, column: s, rowIndex: d, columnIndex: r }, D = typeof s.cellClassName == "function" ? s.cellClassName(A) : s.cellClassName ?? "", S = s.renderCell ? s.renderCell(A) : Bt(i, e, s, g), B = v && typeof S == "string" ? Pn(S, w) : S;
  return /* @__PURE__ */ u(
    "td",
    {
      role: "gridcell",
      "aria-colindex": r + 1,
      tabIndex: o ? 0 : -1,
      "data-grid-row": d,
      "data-grid-column": r,
      className: `tmiv-grid__cell ${o ? "tmiv-grid__cell--focused" : ""} ${N ? "tmiv-grid__cell--editing" : ""} ${V ? "tmiv-grid__cell--modified" : ""} ${O ? "tmiv-grid__cell--invalid" : ""} ${D}`.trim(),
      style: { textAlign: s.alignment },
      onClick: y,
      onDoubleClick: m,
      onFocus: b,
      title: typeof S == "string" ? S : void 0,
      children: N ? /* @__PURE__ */ x("div", { className: "tmiv-grid__cell-editor", onClick: (F) => F.stopPropagation(), children: [
        /* @__PURE__ */ u(Ut, { row: e, column: s, value: n, error: O, disabled: R, autoFocus: !0, onChange: (F) => G == null ? void 0 : G(F), onCommit: q, onCancel: X }),
        O && /* @__PURE__ */ u("small", { role: "alert", children: O })
      ] }) : /* @__PURE__ */ u("div", { className: "tmiv-grid__cell-content", children: B })
    }
  );
}, In = Vt(Tn), Kn = ({
  row: e,
  rowKey: n,
  rowIndex: i,
  absoluteRowIndex: s,
  columns: d,
  locale: r,
  selected: g,
  focusedCell: o,
  showSelection: y,
  showRowNumber: m,
  searchText: b,
  highlightSearchText: w,
  editingFields: v = /* @__PURE__ */ new Set(),
  changedFields: N = /* @__PURE__ */ new Set(),
  errors: V = {},
  saving: O,
  showCommands: R,
  canEdit: G,
  canDelete: q,
  rowEditing: X,
  onValueChange: A,
  onCommitCell: D,
  onCancelCell: S,
  onEdit: B,
  onSave: F,
  onCancel: ce,
  onDelete: c,
  commandTexts: _e = { edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel" },
  onSelect: P,
  onRowClick: me,
  onRowDoubleClick: ze,
  onCellClick: re,
  onCellDoubleClick: xe,
  onCellFocus: Le
}) => /* @__PURE__ */ x(
  "tr",
  {
    role: "row",
    "aria-rowindex": s + 2,
    "aria-selected": g,
    "data-row-key": String(n),
    className: `tmiv-grid__row ${g ? "tmiv-grid__row--selected" : ""}`,
    onClick: me,
    onDoubleClick: ze,
    children: [
      y && /* @__PURE__ */ u("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--selection", children: /* @__PURE__ */ u(
        "input",
        {
          type: "checkbox",
          "aria-label": `Select row ${s + 1}`,
          checked: g,
          onClick: (I) => I.stopPropagation(),
          onChange: P
        }
      ) }),
      m && /* @__PURE__ */ u("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--row-number", children: s + 1 }),
      d.map((I, le) => /* @__PURE__ */ u(
        In,
        {
          row: e,
          data: e,
          value: se(e, I),
          displayValue: it(e, I),
          column: I,
          rowIndex: i,
          columnIndex: le,
          locale: r,
          focused: (o == null ? void 0 : o.rowIndex) === i && o.columnIndex === le,
          searchText: b,
          highlightSearchText: w,
          editing: v.has(String(I.field ?? I.dataField ?? I.name ?? "")),
          changed: N.has(String(I.field ?? I.dataField ?? I.name ?? "")),
          error: V[String(I.field ?? I.dataField ?? I.name ?? "")],
          saving: O,
          onValueChange: (ge) => A == null ? void 0 : A(String(I.field ?? I.dataField ?? I.name ?? ""), ge),
          onCommitEdit: () => D == null ? void 0 : D(String(I.field ?? I.dataField ?? I.name ?? "")),
          onCancelEdit: S,
          onClick: (ge) => re(le, ge),
          onDoubleClick: (ge) => xe(le, ge),
          onFocus: () => Le(le)
        },
        String(I.field ?? I.dataField ?? I.name ?? le)
      )),
      R && /* @__PURE__ */ u("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--commands", onClick: (I) => I.stopPropagation(), children: X ? /* @__PURE__ */ x(Ce, { children: [
        /* @__PURE__ */ u("button", { type: "button", disabled: O, onClick: F, children: _e.save }),
        /* @__PURE__ */ u("button", { type: "button", disabled: O, onClick: ce, children: _e.cancel })
      ] }) : /* @__PURE__ */ x(Ce, { children: [
        G && /* @__PURE__ */ u("button", { type: "button", disabled: O, onClick: B, children: _e.edit }),
        q && /* @__PURE__ */ u("button", { type: "button", disabled: O, onClick: c, children: _e.delete })
      ] }) })
    ]
  }
), Mn = Vt(Kn), On = ({ rows: e, columns: n, items: i, columnOffset: s, commandOffset: d = 0, locale: r }) => /* @__PURE__ */ u("tfoot", { className: "tmiv-grid__summary", children: /* @__PURE__ */ x("tr", { role: "row", children: [
  Array.from({ length: s }, (g, o) => /* @__PURE__ */ u("td", {}, o)),
  n.map((g) => {
    const o = _(g), y = i.filter((m) => String(m.field ?? "") === o || !m.field && o === _(n[0]));
    return /* @__PURE__ */ u("td", { role: "gridcell", children: y.map((m, b) => {
      var N;
      const w = qt(e, m), v = m.valueFormat instanceof Function ? m.valueFormat(w) : Bt(w, e[0], { ...g, format: m.valueFormat ?? g.format }, r);
      return /* @__PURE__ */ u("div", { children: ((N = m.displayFormat) == null ? void 0 : N.replace("{0}", v)) ?? `${m.type}: ${v}` }, m.name ?? `${m.type}-${b}`);
    }) }, o);
  }),
  Array.from({ length: d }, (g, o) => /* @__PURE__ */ u("td", {}, `command-${o}`))
] }) }), Gn = {
  noData: "No data",
  loading: "Loading...",
  retry: "Retry",
  page: "Page",
  of: "of",
  records: "records",
  rowsPerPage: "Rows per page",
  selectAll: "Select all rows",
  groupPanel: "Drag a column here to group",
  add: "Add row",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  saveAll: "Save all",
  cancelAll: "Cancel all"
}, wt = (e) => e === void 0 ? void 0 : e;
function zn(e, n) {
  var Pt, Tt, It, Kt, Mt, Ot, Gt, zt;
  const {
    dataSource: i,
    rows: s,
    columns: d,
    keyExpr: r,
    selection: g = {},
    sorting: o = {},
    paging: y = {},
    pager: m = {},
    filterRow: b = {},
    headerFilter: w = {},
    searchPanel: v = {},
    grouping: N = {},
    groupPanel: V = {},
    summary: O = {},
    editing: R = {},
    remoteOperations: G = !1,
    plugins: q = [],
    locale: X = "en"
  } = e, A = i ?? s ?? [], D = Array.isArray(A) ? void 0 : A.key, S = r ?? D ?? "id", B = y.enabled !== !1, F = typeof G == "boolean" ? { paging: G, sorting: G, filtering: G, grouping: G, summary: G } : G, ce = ae(
    () => (d ?? []).filter((t) => t.sortOrder).sort((t, a) => (t.sortIndex ?? 0) - (a.sortIndex ?? 0)).map((t) => ({ field: _(t), direction: t.sortOrder })),
    [d]
  ), c = pn({
    selectedRowKeys: e.selectedRowKeys,
    defaultSelectedRowKeys: e.defaultSelectedRowKeys,
    pageIndex: y.pageIndex ?? 0,
    pageSize: y.pageSize ?? 20,
    sort: ce,
    onSelectedRowKeysChange: e.onSelectedRowKeysChange
  }), _e = ae(() => ({
    skip: B && F.paging ? c.pageIndex * c.pageSize : 0,
    take: B && F.paging ? c.pageSize : Number.MAX_SAFE_INTEGER,
    sort: F.sorting ? c.sort : [],
    filter: F.filtering ? c.filters : void 0,
    search: F.filtering ? c.search : void 0,
    group: F.grouping ? c.groups : void 0,
    summary: F.summary ? O.totalItems : void 0
  }), [B, F.paging, F.sorting, F.filtering, F.grouping, F.summary, c.pageIndex, c.pageSize, c.sort, c.filters, c.search, c.groups, O.totalItems]), P = Fn(A, _e, e.onDataError), me = et(null), ze = et(!1), re = et(/* @__PURE__ */ new Set()), xe = et(null), [Le, I] = T({}), [le, ge] = T([]), [Ae, at] = T(null), [Ht, rt] = T(null), [Xt, je] = T(() => /* @__PURE__ */ new Set()), [lt, ue] = T(null), [L, bt] = T([]), [J, Ve] = T(null), [ne, We] = T(null), [ie, ke] = T({}), [St, fe] = T({}), [Fe, vt] = T(!1), [Ct, qe] = T(null), W = R.mode ?? "row", Re = R.allowAdding === !0 || R.allowUpdating === !0 || typeof R.allowUpdating == "function" || R.allowDeleting === !0 || typeof R.allowDeleting == "function";
  ye(() => {
    ue(null), bt([]), re.current.clear();
  }, [A]);
  const _t = ae(() => cn(d, P.rows), [d, P.rows]), pe = ae(() => q.reduce(
    (t, a) => a.transformColumns ? a.transformColumns(t) : t,
    _t
  ), [_t, q]), C = ae(() => {
    if (!le.length) return pe;
    const t = new Map(le.map((a, l) => [a, l]));
    return [...pe].sort((a, l) => (t.get(_(a)) ?? Number.MAX_SAFE_INTEGER) - (t.get(_(l)) ?? Number.MAX_SAFE_INTEGER));
  }, [pe, le]);
  ye(() => {
    ge((t) => {
      const a = pe.map(_), l = [...t.filter((h) => a.includes(h)), ...a.filter((h) => !t.includes(h))];
      return l.join("|") === t.join("|") ? t : l;
    });
  }, [pe]);
  const K = lt ?? P.rows, ot = ae(() => q.reduce(
    (t, a) => a.transformRows ? a.transformRows(t, { columns: C, rows: t }) : t,
    K
  ), [K, C, q]), st = ae(
    () => F.filtering ? ot : yn(hn(ot, C, c.filters), C, c.search),
    [ot, C, c.filters, c.search, F.filtering]
  ), $e = ae(
    () => F.sorting ? st : gn(st, C, c.sort),
    [st, C, c.sort, F.sorting]
  ), $ = ae(
    () => B && !F.paging ? un($e, c.pageIndex, c.pageSize) : $e,
    [B, F.paging, $e, c.pageIndex, c.pageSize]
  ), Be = F.paging ? P.totalCount : $e.length, we = B ? Math.max(1, Math.ceil(Be / c.pageSize)) : 1, be = g.mode ?? "single", Ue = be !== "none" && (g.showCheckBoxes ?? be === "multiple"), He = ((Pt = e.rowNumber) == null ? void 0 : Pt.visible) === !0, Se = { ...Gn, ...e.messages }, ve = { ...Se, ...R.texts }, Pe = p((t) => t.map((a) => j(a, S)), [S]), Jt = ae(() => {
    const t = new Set(c.selection);
    return P.rows.filter((a) => t.has(j(a, S)));
  }, [P.rows, c.selection, S]), oe = p((t) => {
    var a;
    c.setSelection(t), (a = e.onSelectionChanged) == null || a.call(e, { selectedRowKeys: t, selectedRowsData: P.rows.filter((l) => t.includes(j(l, S))) });
  }, [c.setSelection, e.onSelectionChanged, P.rows, S]), Te = p((t) => {
    ue(t);
  }, []), ee = p((t) => {
    var a;
    bt(t), (a = e.onChangesChange) == null || a.call(e, t);
  }, [e.onChangesChange]), dt = p((t) => typeof R.allowUpdating == "function" ? R.allowUpdating(t) : R.allowUpdating === !0, [R.allowUpdating]), ct = p((t) => typeof R.allowDeleting == "function" ? R.allowDeleting(t) : R.allowDeleting === !0, [R.allowDeleting]), Ee = p(() => {
    Ve(null), We(null), ke({}), fe({}), qe(null);
  }, []), Ie = p((t, a) => {
    const l = K.find((h) => j(h, S) === t);
    !l || !dt(l) || (Ve(t), We(a ? { key: t, field: a } : null), ke(a ? { [a]: se(l, C.find((h) => _(h) === a)) } : { ...l }), fe({}), qe(null));
  }, [K, S, dt, C]), xt = p(() => {
    var k;
    if (R.allowAdding !== !0) return;
    const t = K.map((f) => j(f, S)), a = ((k = R.newRowKey) == null ? void 0 : k.call(R)) ?? (t.every((f) => typeof f == "number") ? Math.max(0, ...t) + 1 : `__new_${Date.now()}`);
    re.current.add(a);
    const l = C.reduce((f, z) => {
      const Y = _(z);
      if (!Y) return f;
      const te = typeof z.defaultValue == "function" ? z.defaultValue() : z.defaultValue;
      return te !== void 0 && (f[Y] = te), f;
    }, {});
    typeof S == "string" && (l[S] = a);
    const h = l;
    Te(R.newRowPosition === "first" ? [h, ...K] : [...K, h]), ee([...L, { type: "insert", key: a, data: h }]), Ve(a), We(null), ke({ ...h }), fe({});
  }, [R.allowAdding, R.newRowPosition, R.newRowKey, C, S, Te, K, ee, L]), Ke = p((t, a) => K.map((l) => j(l, S) === t ? { ...l, ...a } : l), [K, S]), kt = p((t, a) => {
    const l = L.find((f) => f.key === t), h = K.find((f) => j(f, S) === t), k = (l == null ? void 0 : l.type) === "insert" ? L.map((f) => f === l ? { ...f, data: { ...f.data, ...a } } : f) : (l == null ? void 0 : l.type) === "update" ? L.map((f) => f === l ? { ...f, data: { ...f.data, ...a } } : f) : [...L, { type: "update", key: t, data: a, oldData: h }];
    ee(k), Te(Ke(t, a));
  }, [L, K, S, ee, Te, Ke]), he = p(async (t, a) => {
    var l, h, k, f, z, Y, te, Qe, Ze, M, Q, U;
    if (!t.length) return !0;
    vt(!0), qe(null);
    try {
      for (const E of t) {
        if (E.type === "remove") continue;
        const Z = E.type === "insert" ? E.data : { ...E.oldData, ...E.data }, de = await jt(Z, C);
        if (Object.keys(de).length)
          return fe(de), (l = e.onValidationError) == null || l.call(e, de), !1;
      }
      await ((h = e.onSaving) == null ? void 0 : h.call(e, t));
      for (const E of t) {
        const Z = { key: E.key, data: E.data, oldData: E.oldData, cancel: !1 };
        if (E.type === "insert") {
          if (await ((k = e.onRowInserting) == null ? void 0 : k.call(e, Z)), Z.cancel) continue;
          if (!Array.isArray(A)) {
            if (!A.insert) throw new Error("Insert is not supported by this data source.");
            const de = { ...E.data };
            typeof S == "string" && E.key !== void 0 && re.current.has(E.key) && delete de[S], await A.insert(de);
          }
          (f = e.onRowInserted) == null || f.call(e, Z), E.key !== void 0 && re.current.delete(E.key);
        } else if (E.type === "update") {
          if (await ((z = e.onRowUpdating) == null ? void 0 : z.call(e, Z)), Z.cancel) continue;
          if (!Array.isArray(A) && E.key !== void 0) {
            if (!A.update) throw new Error("Update is not supported by this data source.");
            await A.update(E.key, E.data);
          }
          (Y = e.onRowUpdated) == null || Y.call(e, Z);
        } else if (E.type === "remove") {
          if (await ((te = e.onRowRemoving) == null ? void 0 : te.call(e, Z)), Z.cancel) continue;
          if (!Array.isArray(A) && E.key !== void 0) {
            if (!A.remove) throw new Error("Remove is not supported by this data source.");
            await A.remove(E.key);
          }
          (Qe = e.onRowRemoved) == null || Qe.call(e, Z);
        }
      }
      return (Ze = e.onSaved) == null || Ze.call(e, t), ee([]), fe({}), Ee(), Array.isArray(A) ? (M = e.onRowsChange) == null || M.call(e, a ?? lt ?? K) : (ue(null), await P.reload()), !0;
    } catch (E) {
      const Z = E instanceof Error ? E : new Error(String(E)), de = E == null ? void 0 : E.errors;
      if (de) {
        const Lt = Object.fromEntries(Object.entries(de).map(([ln, mt]) => [ln, Array.isArray(mt) ? mt.join(", ") : mt]));
        fe(Lt), (Q = e.onValidationError) == null || Q.call(e, Lt);
      }
      return qe(Z), (U = e.onDataError) == null || U.call(e, Z), !1;
    } finally {
      vt(!1);
    }
  }, [C, e.onValidationError, e.onSaving, e.onRowInserting, e.onRowInserted, e.onRowUpdating, e.onRowUpdated, e.onRowRemoving, e.onRowRemoved, e.onSaved, e.onRowsChange, e.onDataError, A, S, ee, Ee, lt, K, P.reload]), Rt = p(async () => {
    if (J === null) return !1;
    const t = K.find((f) => j(f, S) === J);
    if (!t) return !1;
    const a = { ...t, ...ie }, l = K.map((f) => j(f, S) === J ? a : f);
    ue(l);
    const h = L.find((f) => f.key === J && f.type === "insert"), k = h ? { ...h, data: a } : { type: "update", key: J, data: ie, oldData: t };
    return he([k], l);
  }, [J, K, S, ie, L, he]), Yt = p(async () => {
    var k;
    if (!ne) return;
    const t = K.find((f) => j(f, S) === ne.key);
    if (!t) return;
    const a = C.find((f) => _(f) === ne.field), l = { ...t, ...ie };
    if (a) {
      const f = await jt(l, [a]);
      if (Object.keys(f).length) {
        fe(f), (k = e.onValidationError) == null || k.call(e, f);
        return;
      }
    }
    const h = Ke(ne.key, ie);
    ue(h), W === "batch" ? (kt(ne.key, ie), We(null), Ve(null), ke({}), fe({})) : await he([{ type: "update", key: ne.key, data: ie, oldData: t }], h);
  }, [ne, K, S, C, ie, Ke, W, kt, he, e.onValidationError]), Et = p(() => {
    var t;
    ue(null), re.current.clear(), ee([]), Ee(), (t = e.onEditCanceled) == null || t.call(e);
  }, [ee, Ee, e.onEditCanceled]), Dt = p(async (t) => {
    const a = K.find((f) => j(f, S) === t);
    if (!a || !ct(a) || R.confirmDelete !== !1 && typeof window < "u" && !window.confirm("Delete this row?")) return;
    const l = K.filter((f) => j(f, S) !== t);
    ue(l);
    const h = L.find((f) => f.key === t && f.type === "insert"), k = h ? L.filter((f) => f !== h) : [...L, { type: "remove", key: t, data: {}, oldData: a }];
    W === "batch" ? ee(k) : await he(h ? [] : [{ type: "remove", key: t, data: {}, oldData: a }], l);
  }, [K, S, ct, R.confirmDelete, W, L, ee, he]), gt = p((t, a) => {
    if (be === "none") return;
    const l = j($[t], S);
    if (be === "single")
      oe(c.selection.includes(l) ? [] : [l]);
    else if (a.shiftKey && xe.current !== null) {
      const h = Math.min(xe.current, t), k = Math.max(xe.current, t);
      oe([.../* @__PURE__ */ new Set([...c.selection, ...Pe($.slice(h, k + 1))])]);
    } else a.ctrlKey || a.metaKey ? oe(c.selection.includes(l) ? c.selection.filter((h) => h !== l) : [...c.selection, l]) : oe([l]);
    xe.current = t;
  }, [be, $, S, oe, c.selection, Pe]), Xe = p((t) => {
    var l;
    const a = Math.min(Math.max(0, t), we - 1);
    c.setPageIndex(a), (l = e.onPageIndexChange) == null || l.call(e, a);
  }, [we, c.setPageIndex, e.onPageIndexChange]), Nt = p((t) => {
    var l;
    const a = Math.max(1, t);
    c.setPageSize(a), c.setPageIndex(0), (l = e.onPageSizeChange) == null || l.call(e, a);
  }, [c.setPageSize, c.setPageIndex, e.onPageSizeChange]);
  ye(() => {
    c.pageIndex >= we && Xe(we - 1);
  }, [we, c.pageIndex, Xe]);
  const Qt = p((t, a) => {
    var k;
    if (o.mode === "none") return;
    const l = o.mode === "multiple" && a, h = mn(c.sort, t, l);
    c.setSort(h), c.setPageIndex(0), (k = e.onSortingChanged) == null || k.call(e, h);
  }, [o.mode, c.sort, c.setSort, c.setPageIndex, e.onSortingChanged]), De = p((t) => {
    var a;
    c.setFilters(t), c.setPageIndex(0), (a = e.onFilterChanged) == null || a.call(e, t);
  }, [c.setFilters, c.setPageIndex, e.onFilterChanged]), Zt = p((t, a, l) => {
    const h = c.filters.filter((f) => f.field !== t || f.operator === "in"), k = l === "" || l === void 0 || Array.isArray(l) && l.every((f) => f === "" || f === void 0);
    De(k ? h : [...h, { field: t, operator: a, value: l }]);
  }, [c.filters, De]), en = p((t, a) => {
    const l = c.filters.filter((h) => h.field !== t || h.operator !== "in");
    De(a.length ? [...l, { field: t, operator: "in", value: a }] : l);
  }, [c.filters, De]), ut = p((t) => {
    var a;
    c.setSearch(t), c.setPageIndex(0), (a = e.onSearchValueChanged) == null || a.call(e, t);
  }, [c.setSearch, c.setPageIndex, e.onSearchValueChanged]), At = p((t) => {
    var a;
    c.setGroups(t), c.setPageIndex(0), je(N.autoExpandAll === !1 ? new Set(tt($, C, t).map((l) => l.id)) : /* @__PURE__ */ new Set()), (a = e.onGroupingChanged) == null || a.call(e, t);
  }, [c.setGroups, c.setPageIndex, e.onGroupingChanged, N.autoExpandAll, $, C]), tn = p((t) => {
    var z, Y;
    if (!Ae || Ae === t) return;
    const a = C.findIndex((te) => _(te) === Ae), l = C.findIndex((te) => _(te) === t);
    if (a < 0 || l < 0 || C[a].allowReordering === !1 || C[l].allowReordering === !1) return;
    const h = [...C], [k] = h.splice(a, 1);
    h.splice(l, 0, k), ge(h.map(_));
    const f = { column: k, fromIndex: a, toIndex: l, columns: h };
    (z = e.onColumnReorder) == null || z.call(e, f), (Y = e.onColumnOrderChanged) == null || Y.call(e, h), at(null), rt(null);
  }, [Ae, C, e.onColumnReorder, e.onColumnOrderChanged]), Ft = p((t) => {
    const a = C.find((f) => _(f) === t);
    if (!a) return;
    const l = $.slice(0, 100).map((f) => String(se(f, a) ?? "")), h = Math.max(String(a.caption ?? t).length, ...l.map((f) => f.length)), k = Math.min(a.maxWidth ?? 520, Math.max(a.minWidth ?? 64, h * 8 + 32));
    I((f) => ({ ...f, [t]: k }));
  }, [C, $]), nn = p((t, a) => {
    const l = $.findIndex((f) => j(f, S) === t), h = C.findIndex((f) => _(f) === a);
    if (l < 0 || h < 0) return;
    const k = { rowIndex: l, columnIndex: h, rowKey: t, field: a };
    c.setFocusedCell(k), requestAnimationFrame(() => {
      var f, z;
      return (z = (f = me.current) == null ? void 0 : f.querySelector(`[data-grid-row="${l}"][data-grid-column="${h}"]`)) == null ? void 0 : z.focus();
    });
  }, [$, C, S, c.setFocusedCell]), ft = p(() => {
    var t;
    J !== null && re.current.has(J) && (ue(K.filter((a) => j(a, S) !== J)), ee(L.filter((a) => a.key !== J)), re.current.delete(J)), Ee(), (t = e.onEditCanceled) == null || t.call(e);
  }, [J, K, S, ee, L, Ee, e.onEditCanceled]), Je = {
    refresh: P.reload,
    reload: P.reload,
    repaint: () => {
      var t;
      return (t = me.current) == null ? void 0 : t.getBoundingClientRect();
    },
    selectRows: (t, a = !1) => oe(a ? [.../* @__PURE__ */ new Set([...c.selection, ...t])] : t),
    deselectRows: (t) => oe(c.selection.filter((a) => !t.includes(a))),
    selectAll: () => oe(Pe(g.selectAllMode === "page" ? $ : P.rows)),
    deselectAll: () => oe([]),
    getSelectedRowKeys: () => c.selection,
    getSelectedRowsData: () => Jt,
    getVisibleRows: () => $,
    getVisibleColumns: () => C,
    getRowIndexByKey: (t) => $.findIndex((a) => j(a, S) === t),
    getKeyByRowIndex: (t) => $[t] ? j($[t], S) : void 0,
    pageIndex: (t) => (t !== void 0 && Xe(t), t ?? c.pageIndex),
    pageSize: (t) => (t !== void 0 && Nt(t), t ?? c.pageSize),
    pageCount: () => we,
    totalCount: () => Be,
    sort: (t) => {
      var a;
      return t && (c.setSort(t), (a = e.onSortingChanged) == null || a.call(e, t)), t ?? c.sort;
    },
    search: (t) => (t !== void 0 && ut(t), t ?? c.search),
    filter: (t) => (t && De(t), t ?? c.filters),
    clearFilter: () => {
      De([]), ut("");
    },
    group: (t) => (t && At(t), t ?? c.groups),
    expandAllGroups: () => je(/* @__PURE__ */ new Set()),
    collapseAllGroups: () => {
      const t = tt($, C, c.groups), a = [], l = (h) => h.forEach((k) => {
        a.push(k.id), l(k.children);
      });
      l(t), je(new Set(a));
    },
    addRow: xt,
    editRow: (t) => Ie(t),
    editCell: (t, a) => Ie(t, a),
    deleteRow: Dt,
    getChanges: () => L,
    saveChanges: () => he(L, K),
    cancelChanges: Et,
    autoFitColumn: Ft,
    autoFitColumns: () => C.forEach((t) => Ft(_(t))),
    navigateToCell: nn,
    focus: () => {
      var t;
      return (t = me.current) == null ? void 0 : t.focus();
    },
    getDataSource: () => A
  };
  dn(n, () => Je), ye(() => {
    var t;
    ze.current || (ze.current = !0, (t = e.onInitialized) == null || t.call(e, Je));
  }, [e.onInitialized]), ye(() => {
    var t;
    P.loading || (t = e.onContentReady) == null || t.call(e, Je);
  }, [P.loading, $]);
  const ht = p((t) => {
    var l, h;
    c.setFocusedCell(t), (l = e.onFocusedCellChanged) == null || l.call(e, t);
    const a = $[t.rowIndex];
    a && ((h = e.onFocusedRowChanged) == null || h.call(e, { data: a, key: j(a, S), rowIndex: t.rowIndex }));
  }, [c.setFocusedCell, e.onFocusedCellChanged, e.onFocusedRowChanged, $, S]), Ye = Number(Ue) + Number(He), yt = Number(Re), Me = C.length + Ye + yt, an = (t) => {
    if (e.disabled || !C.length || !$.length || t.target.matches("input, select, textarea, button")) return;
    if ((t.ctrlKey || t.metaKey) && t.key.toLowerCase() === "a" && be === "multiple") {
      t.preventDefault(), Je.selectAll();
      return;
    }
    const a = c.focusedCell ?? { rowIndex: 0, columnIndex: 0 };
    let l = a.rowIndex, h = a.columnIndex;
    if (t.key === "ArrowDown") l++;
    else if (t.key === "ArrowUp") l--;
    else if (t.key === "ArrowRight" || t.key === "Tab" && !t.shiftKey) h++;
    else if (t.key === "ArrowLeft" || t.key === "Tab" && t.shiftKey) h--;
    else if (t.key === "Home") h = 0;
    else if (t.key === "End") h = C.length - 1;
    else if (t.key === "PageDown") l += Math.max(1, Math.floor($.length / 2));
    else if (t.key === "PageUp") l -= Math.max(1, Math.floor($.length / 2));
    else if (t.key === " " && be !== "none") {
      t.preventDefault(), gt(l, t);
      return;
    } else return;
    t.preventDefault(), l = Math.max(0, Math.min($.length - 1, l)), h = Math.max(0, Math.min(C.length - 1, h));
    const k = j($[l], S), f = _(C[h]);
    ht({ rowIndex: l, columnIndex: h, rowKey: k, field: f }), requestAnimationFrame(() => {
      var z, Y;
      return (Y = (z = me.current) == null ? void 0 : z.querySelector(`[data-grid-row="${l}"][data-grid-column="${h}"]`)) == null ? void 0 : Y.focus();
    });
  }, pt = (t, a) => {
    const l = j(t, S), h = J === l, k = re.current.has(l), f = h ? { ...t, ...ie } : t, z = new Set(C.filter((M) => M.allowEditing !== !1).map(_)), Y = /* @__PURE__ */ new Set();
    h && (W === "row" || k) && z.forEach((M) => Y.add(M)), (ne == null ? void 0 : ne.key) === l && Y.add(ne.field);
    const te = L.find((M) => M.key === l), Qe = new Set(Object.keys((te == null ? void 0 : te.data) ?? {})), Ze = F.paging || B ? c.pageIndex * c.pageSize + a : a;
    return /* @__PURE__ */ u(
      Mn,
      {
        row: f,
        rowKey: l,
        rowIndex: a,
        absoluteRowIndex: Ze,
        columns: C,
        locale: X,
        selected: c.selection.includes(l),
        focusedCell: c.focusedCell,
        showSelection: Ue,
        showRowNumber: He,
        searchText: c.search,
        highlightSearchText: v.highlightSearchText === !0,
        editingFields: Y,
        changedFields: Qe,
        errors: h ? St : {},
        saving: Fe,
        showCommands: Re,
        canEdit: dt(t) && W !== "cell" && W !== "batch",
        canDelete: ct(t),
        rowEditing: h && (W === "row" || k && W !== "batch"),
        onValueChange: (M, Q) => {
          const U = { ...ie, [M]: Q };
          ke(U), W === "batch" && k && (Te(Ke(l, U)), ee(L.map((E) => E.key === l && E.type === "insert" ? { ...E, data: U } : E)));
        },
        onCommitCell: () => void Yt(),
        onCancelCell: ft,
        onEdit: () => Ie(l),
        onSave: () => void Rt(),
        onCancel: ft,
        onDelete: () => void Dt(l),
        commandTexts: { edit: ve.edit, delete: ve.delete, save: ve.save, cancel: ve.cancel },
        onSelect: () => gt(a, {}),
        onRowClick: (M) => {
          var Q;
          gt(a, M), (Q = e.onRowClick) == null || Q.call(e, { data: t, key: l, rowIndex: a, event: M });
        },
        onRowDoubleClick: (M) => {
          var Q;
          return (Q = e.onRowDoubleClick) == null ? void 0 : Q.call(e, { data: t, key: l, rowIndex: a, event: M });
        },
        onCellClick: (M, Q) => {
          var E;
          const U = C[M];
          ht({ rowIndex: a, columnIndex: M, rowKey: l, field: _(U) }), (E = e.onCellClick) == null || E.call(e, { data: t, key: l, rowIndex: a, column: U, columnIndex: M, value: se(t, U), event: Q }), (W === "cell" || W === "batch") && R.startEditAction !== "doubleClick" && U.allowEditing !== !1 && Ie(l, _(U));
        },
        onCellDoubleClick: (M, Q) => {
          var E;
          const U = C[M];
          (E = e.onCellDoubleClick) == null || E.call(e, { data: t, key: l, rowIndex: a, column: U, columnIndex: M, value: se(t, U), event: Q }), (W === "cell" || W === "batch") && U.allowEditing !== !1 && Ie(l, _(U));
        },
        onCellFocus: (M) => ht({ rowIndex: a, columnIndex: M, rowKey: l, field: _(C[M]) })
      },
      l
    );
  }, rn = tt($, C, c.groups), $t = (t) => t.flatMap((a) => {
    const l = !Xt.has(a.id), h = C.find((f) => _(f) === a.field), k = [
      /* @__PURE__ */ u(
        kn,
        {
          node: a,
          column: h,
          colSpan: Me,
          expanded: l,
          collapsible: N.allowCollapsing !== !1,
          summaries: O.groupItems ?? [],
          onToggle: () => je((f) => {
            const z = new Set(f);
            return z.has(a.id) ? z.delete(a.id) : z.add(a.id), z;
          })
        },
        `group-${a.id}`
      )
    ];
    return l && (a.children.length ? k.push(...$t(a.children)) : k.push(...a.rows.map((f) => pt(f, $.indexOf(f))))), k;
  });
  return e.visible === !1 ? null : /* @__PURE__ */ x(
    "div",
    {
      ref: me,
      role: "grid",
      "aria-rowcount": Be,
      "aria-colcount": Me,
      "aria-disabled": e.disabled,
      tabIndex: e.disabled ? -1 : 0,
      className: [
        "tmiv-grid",
        e.showBorders !== !1 && "tmiv-grid--borders",
        e.showRowLines !== !1 && "tmiv-grid--row-lines",
        e.showColumnLines !== !1 && "tmiv-grid--column-lines",
        e.rowAlternationEnabled && "tmiv-grid--alternating",
        e.hoverStateEnabled !== !1 && "tmiv-grid--hover",
        e.disabled && "tmiv-grid--disabled",
        e.className
      ].filter(Boolean).join(" "),
      style: { width: wt(e.width), height: wt(e.height), minHeight: wt(e.minHeight), ...e.style },
      onKeyDown: an,
      children: [
        (v.visible || V.visible || Re) && /* @__PURE__ */ x("div", { className: "tmiv-grid__toolbar", children: [
          Re && /* @__PURE__ */ x("div", { className: "tmiv-grid__editing-toolbar", children: [
            R.allowAdding === !0 && /* @__PURE__ */ x("button", { type: "button", disabled: Fe || J !== null, onClick: xt, children: [
              "＋ ",
              ve.add
            ] }),
            W === "batch" && /* @__PURE__ */ x(Ce, { children: [
              /* @__PURE__ */ u("button", { type: "button", disabled: Fe || !L.length, onClick: () => void he(L, K), children: ve.saveAll }),
              /* @__PURE__ */ u("button", { type: "button", disabled: Fe || !L.length, onClick: Et, children: ve.cancelAll })
            ] }),
            Ct && /* @__PURE__ */ u("span", { role: "alert", className: "tmiv-grid__edit-error", children: Ct.message })
          ] }),
          V.visible && /* @__PURE__ */ u(
            xn,
            {
              columns: C,
              groups: c.groups,
              emptyText: V.emptyText ?? Se.groupPanel,
              allowDragging: V.allowColumnDragging !== !1,
              onChange: At
            }
          ),
          v.visible && /* @__PURE__ */ u(_n, { config: v, value: c.search, onChange: ut })
        ] }),
        (W === "form" || W === "popup") && J !== null && /* @__PURE__ */ u(
          Nn,
          {
            row: ie,
            columns: C,
            errors: St,
            colCount: ((Tt = R.form) == null ? void 0 : Tt.colCount) ?? 2,
            title: W === "popup" ? ((It = R.popup) == null ? void 0 : It.title) ?? "Edit row" : void 0,
            saving: Fe,
            popup: W === "popup",
            width: (Kt = R.popup) == null ? void 0 : Kt.width,
            onChange: (t, a) => ke((l) => ({ ...l, [t]: a })),
            onSave: () => void Rt(),
            onCancel: ft
          }
        ),
        /* @__PURE__ */ u("div", { className: "tmiv-grid__viewport", children: /* @__PURE__ */ x("table", { className: `tmiv-grid__table ${e.columnAutoWidth ? "tmiv-grid__table--auto" : ""}`, children: [
          /* @__PURE__ */ x("colgroup", { children: [
            Ue && /* @__PURE__ */ u("col", { style: { width: 44 } }),
            He && /* @__PURE__ */ u("col", { style: { width: 60 } }),
            C.map((t, a) => {
              const l = _(t);
              return /* @__PURE__ */ u("col", { style: { width: Le[l] ?? t.width, minWidth: t.minWidth, maxWidth: t.maxWidth } }, l || a);
            }),
            Re && /* @__PURE__ */ u("col", { style: { width: 150 } })
          ] }),
          /* @__PURE__ */ x("thead", { className: "tmiv-grid__head", children: [
            /* @__PURE__ */ x("tr", { role: "row", children: [
              Ue && /* @__PURE__ */ u("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--selection", children: /* @__PURE__ */ u(
                "input",
                {
                  type: "checkbox",
                  "aria-label": Se.selectAll,
                  checked: $.length > 0 && Pe($).every((t) => c.selection.includes(t)),
                  onChange: () => {
                    const t = Pe($), a = t.every((l) => c.selection.includes(l));
                    oe(a ? c.selection.filter((l) => !t.includes(l)) : [.../* @__PURE__ */ new Set([...c.selection, ...t])]);
                  }
                }
              ) }),
              He && /* @__PURE__ */ u("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--row-number", children: "#" }),
              C.map((t, a) => {
                var l;
                return /* @__PURE__ */ u(
                  bn,
                  {
                    column: { ...t, width: Le[_(t)] ?? t.width },
                    columnIndex: a + Ye,
                    sort: c.sort,
                    onSort: Qt,
                    rows: P.rows,
                    headerFilterVisible: w.visible === !0,
                    headerFilterSearchable: w.searchable !== !1,
                    headerFilterValues: ((l = c.filters.find((h) => h.field === _(t) && h.operator === "in")) == null ? void 0 : l.value) ?? [],
                    reorderable: e.allowColumnReordering === !0 && t.allowReordering !== !1,
                    dragEnabled: e.allowColumnReordering === !0 && t.allowReordering !== !1 || V.visible === !0 && V.allowColumnDragging !== !1 && t.allowGrouping !== !1,
                    dragging: Ae === _(t),
                    dropTarget: Ht === _(t),
                    onHeaderFilterChange: (h) => en(_(t), h),
                    onDragStart: () => at(_(t)),
                    onDragEnd: () => {
                      at(null), rt(null);
                    },
                    onDragOver: () => rt(_(t)),
                    onDrop: () => tn(_(t))
                  },
                  _(t) || a
                );
              }),
              Re && /* @__PURE__ */ u("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--commands", children: "Actions" })
            ] }),
            b.visible && /* @__PURE__ */ u(Cn, { columns: C, filters: c.filters.filter((t) => t.operator !== "in"), columnOffset: Ye, commandOffset: yt, onChange: Zt })
          ] }),
          /* @__PURE__ */ x("tbody", { className: "tmiv-grid__body", children: [
            P.loading && /* @__PURE__ */ u("tr", { role: "row", children: /* @__PURE__ */ u("td", { role: "gridcell", colSpan: Me, className: "tmiv-grid__state", children: ((Mt = e.loadingRender) == null ? void 0 : Mt.call(e)) ?? Se.loading }) }),
            !P.loading && P.error && /* @__PURE__ */ u("tr", { role: "row", children: /* @__PURE__ */ u("td", { role: "gridcell", colSpan: Me, className: "tmiv-grid__state tmiv-grid__state--error", children: ((Ot = e.errorRender) == null ? void 0 : Ot.call(e, P.error, P.reload)) ?? /* @__PURE__ */ x(Ce, { children: [
              /* @__PURE__ */ u("span", { children: P.error.message }),
              /* @__PURE__ */ u("button", { type: "button", onClick: () => void P.reload(), children: Se.retry })
            ] }) }) }),
            !P.loading && !P.error && $.length === 0 && /* @__PURE__ */ u("tr", { role: "row", children: /* @__PURE__ */ u("td", { role: "gridcell", colSpan: Me, className: "tmiv-grid__state", children: ((Gt = e.noDataRender) == null ? void 0 : Gt.call(e)) ?? Se.noData }) }),
            !P.loading && !P.error && (c.groups.length ? $t(rn) : $.map(pt))
          ] }),
          !!((zt = O.totalItems) != null && zt.length) && /* @__PURE__ */ u(On, { rows: $e, columns: C, items: O.totalItems, columnOffset: Ye, commandOffset: yt, locale: X })
        ] }) }),
        B && m.visible !== !1 && /* @__PURE__ */ u(
          $n,
          {
            pageIndex: c.pageIndex,
            pageSize: c.pageSize,
            pageCount: we,
            totalCount: Be,
            allowedPageSizes: m.allowedPageSizes ?? [10, 20, 50, 100],
            showPageSizeSelector: m.showPageSizeSelector !== !1,
            showNavigationButtons: m.showNavigationButtons !== !1,
            showInfo: m.showInfo !== !1,
            messages: Se,
            onPageIndexChange: Xe,
            onPageSizeChange: Nt
          }
        )
      ]
    }
  );
}
const Ln = Wt(zn);
function jn(e, n) {
  var o, y;
  const { gridOption: i = {}, showSelectionCheckbox: s, ...d } = e, r = (e.columns ?? []).map((m) => ({
    ...m,
    field: m.field ?? m.dataField,
    allowSorting: m.allowSorting !== !1
  })), g = {
    ...i.selection ?? {},
    ...e.selection ?? {},
    showCheckBoxes: s ?? ((o = e.selection) == null ? void 0 : o.showCheckBoxes) ?? ((y = i.selection) == null ? void 0 : y.showCheckBoxes)
  };
  return /* @__PURE__ */ u(
    Ln,
    {
      ...i,
      ...d,
      ref: n,
      dataSource: e.dataSource ?? e.rows ?? [],
      columns: r,
      selection: g,
      sorting: e.sorting ?? i.sorting ?? { mode: "multiple" },
      paging: e.paging ?? i.paging,
      pager: e.pager ?? i.pager
    }
  );
}
const Bn = Wt(jn);
class Un {
  constructor(n, i = "id") {
    Oe(this, "key");
    Oe(this, "items");
    this.items = [...n], this.key = i;
  }
  async load(n) {
    return {
      data: this.items.slice(n.skip, n.skip + n.take),
      totalCount: this.items.length
    };
  }
  async byKey(n) {
    return this.items.find((i) => H(i, String(this.key)) === n);
  }
  async insert(n) {
    const i = n;
    return this.items.push(i), i;
  }
  async update(n, i) {
    const s = this.items.findIndex((d) => H(d, String(this.key)) === n);
    if (s < 0) throw new Error(`Row with key ${String(n)} was not found.`);
    return this.items[s] = { ...this.items[s], ...i }, this.items[s];
  }
  async remove(n) {
    this.items = this.items.filter((i) => H(i, String(this.key)) !== n);
  }
}
class Hn {
  constructor(n) {
    Oe(this, "key");
    Oe(this, "options");
    this.options = n, this.key = n.key;
  }
  load(n) {
    return this.options.load(n);
  }
  byKey(n) {
    return this.options.byKey ? this.options.byKey(n) : Promise.resolve(void 0);
  }
  insert(n) {
    return this.options.insert ? this.options.insert(n) : Promise.reject(new Error("Insert is not supported by this data source."));
  }
  update(n, i) {
    return this.options.update ? this.options.update(n, i) : Promise.reject(new Error("Update is not supported by this data source."));
  }
  remove(n) {
    return this.options.remove ? this.options.remove(n) : Promise.reject(new Error("Remove is not supported by this data source."));
  }
}
export {
  Ln as DataGrid,
  Bn as DxCompatibleDataGrid,
  Un as GridArrayStore,
  Hn as GridCustomStore
};
