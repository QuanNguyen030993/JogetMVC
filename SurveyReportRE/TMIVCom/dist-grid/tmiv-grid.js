var zn = Object.defineProperty;
var Tn = (e, n, r) => n in e ? zn(e, n, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[n] = r;
var Qe = (e, n, r) => Tn(e, typeof n != "symbol" ? n + "" : n, r);
import { jsxs as x, jsx as c, Fragment as ze } from "react/jsx-runtime";
import { useState as I, useMemo as ne, useRef as Ee, useEffect as ye, useCallback as P, memo as hn, forwardRef as mn, useImperativeHandle as Mn } from "react";
const v = (e) => String(e.field ?? e.dataField ?? e.name ?? ""), ie = (e, n) => {
  if (!(!e || !n))
    return n.split(".").reduce((r, d) => {
      if (!(r == null || typeof r != "object"))
        return r[d];
    }, e);
}, we = (e, n) => n.valueGetter ? n.valueGetter(e) : n.calculateCellValue ? n.calculateCellValue(e) : ie(e, v(n)), ut = (e, n) => {
  if (n.calculateDisplayValue) return n.calculateDisplayValue(e);
  const r = we(e, n);
  if (!n.lookup) return r;
  const d = n.lookup.dataSource.find((l) => {
    var s;
    return String(ie(l, String((s = n.lookup) == null ? void 0 : s.valueExpr)) ?? "") === String(r ?? "");
  });
  return d ? ie(d, String(n.lookup.displayExpr)) : r;
}, X = (e, n) => {
  const r = typeof n == "function" ? n(e) : ie(e, String(n));
  if (typeof r != "string" && typeof r != "number")
    throw new Error(`DataGrid keyExpr "${String(n)}" must resolve to a string or number.`);
  return r;
}, On = (e, n) => {
  const r = e != null && e.length ? e : Object.keys(n[0] ?? {}).map((l) => ({ field: l, caption: l })), d = (l, s = []) => l.flatMap((g) => {
    var m;
    const o = g.caption ?? String(g.field ?? g.dataField ?? g.name ?? "");
    return (m = g.columns) != null && m.length ? d(g.columns, [...s, o]) : [{ ...g, bandPath: g.bandPath ?? s }];
  });
  return d(r).map((l, s) => ({
    ...l,
    field: l.field ?? l.dataField,
    caption: l.caption ?? String(l.field ?? l.dataField ?? l.name ?? ""),
    visibleIndex: l.visibleIndex ?? s,
    allowSorting: l.allowSorting !== !1
  })).sort((l, s) => (l.visibleIndex ?? 0) - (s.visibleIndex ?? 0));
}, Ze = (e, n) => Object.is(e, n) ? 0 : e == null ? 1 : n == null ? -1 : typeof e == "number" && typeof n == "number" ? e - n : e instanceof Date && n instanceof Date ? e.getTime() - n.getTime() : String(e).localeCompare(String(n), void 0, { numeric: !0, sensitivity: "base" }), Kn = (e, n, r) => {
  if (!r.length) return e;
  const d = e.map((l, s) => ({ row: l, index: s }));
  return d.sort((l, s) => {
    for (const g of r) {
      const o = n.find((b) => v(b) === g.field);
      if (!o) continue;
      const m = we(l.row, o), w = we(s.row, o), u = o.sortComparator ? o.sortComparator(m, w, l.row, s.row) : Ze(m, w);
      if (u !== 0) return g.direction === "desc" ? -u : u;
    }
    return l.index - s.index;
  }), d.map((l) => l.row);
}, Ln = (e, n, r) => e.slice(n * r, n * r + r), ft = (e) => String(e ?? "").toLocaleLowerCase(), Wn = (e, n, r) => {
  const d = we(e, n), l = r.value;
  if (l === "" || l === void 0 || l === null || Array.isArray(l) && !l.length) return !0;
  if (r.operator === "in") return Array.isArray(l) && l.some((m) => Object.is(m, d) || String(m) === String(d));
  if (r.operator === "between" && Array.isArray(l)) {
    const [m, w] = l;
    return (m === "" || Ze(d, m) >= 0) && (w === "" || Ze(d, w) <= 0);
  }
  const s = ft(d), g = ft(l);
  if (r.operator === "contains") return s.includes(g);
  if (r.operator === "notContains") return !s.includes(g);
  if (r.operator === "startsWith") return s.startsWith(g);
  if (r.operator === "endsWith") return s.endsWith(g);
  if (r.operator === "equals") return s === g;
  if (r.operator === "notEquals") return s !== g;
  const o = Ze(d, l);
  return r.operator === ">" ? o > 0 : r.operator === ">=" ? o >= 0 : r.operator === "<" ? o < 0 : r.operator === "<=" ? o <= 0 : !0;
}, Gn = (e, n, r) => r.length ? e.filter((d) => r.every((l) => {
  const s = n.find((g) => v(g) === l.field);
  return s ? Wn(d, s, l) : !0;
})) : e, Vn = (e, n, r) => {
  const d = ft(r).trim();
  if (!d) return e;
  const l = n.filter((s) => s.allowFiltering !== !1);
  return e.filter((s) => l.some((g) => ft(ut(s, g)).includes(d)));
}, gt = (e, n, r, d = 0, l = "") => {
  const s = r[d];
  if (!s) return [];
  const g = n.find((m) => v(m) === s.field);
  if (!g) return [];
  const o = /* @__PURE__ */ new Map();
  return e.forEach((m) => {
    const w = ut(m, g), u = `${typeof w}:${String(w ?? "")}`, b = o.get(u) ?? { value: w, rows: [] };
    b.rows.push(m), o.set(u, b);
  }), [...o.values()].sort((m, w) => Ze(m.value, w.value) * (s.direction === "desc" ? -1 : 1)).map((m) => {
    const w = `${l}/${s.field}:${String(m.value ?? "")}`;
    return {
      id: w,
      field: s.field,
      value: m.value,
      level: d,
      rows: m.rows,
      children: gt(m.rows, n, r, d + 1, w)
    };
  });
}, yn = (e, n) => {
  var d;
  if (n.type === "custom") return (d = n.calculate) == null ? void 0 : d.call(n, e);
  if (n.type === "count") return n.field ? e.filter((l) => ie(l, String(n.field)) !== void 0).length : e.length;
  const r = e.map((l) => ie(l, String(n.field ?? ""))).filter((l) => typeof l == "number" && Number.isFinite(l));
  if (r.length) {
    if (n.type === "sum") return r.reduce((l, s) => l + s, 0);
    if (n.type === "avg") return r.reduce((l, s) => l + s, 0) / r.length;
    if (n.type === "min") return Math.min(...r);
    if (n.type === "max") return Math.max(...r);
  }
}, jn = (e, n, r) => {
  const d = e.find((s) => s.field === n), l = e.filter((s) => s.field !== n);
  if (!d) return r ? [...l, { field: n, direction: "asc" }] : [{ field: n, direction: "asc" }];
  if (d.direction === "asc") {
    const s = { field: n, direction: "desc" };
    return r ? [...l, s] : [s];
  }
  return r ? l : [];
}, wn = (e, n, r, d = "en") => {
  if (r.format instanceof Function) return r.format(e, n);
  if (e == null) return "";
  const l = r.format ?? r.dataType;
  if (l === "currency" && typeof e == "number")
    return new Intl.NumberFormat(d, { style: "currency", currency: "USD" }).format(e);
  if (l === "percent" && typeof e == "number")
    return new Intl.NumberFormat(d, { style: "percent" }).format(e);
  if ((l === "decimal" || r.dataType === "number") && typeof e == "number")
    return new Intl.NumberFormat(d).format(e);
  if (l === "date" || l === "datetime" || r.dataType === "date" || r.dataType === "datetime") {
    const s = e instanceof Date ? e : new Date(String(e));
    if (!Number.isNaN(s.getTime()))
      return new Intl.DateTimeFormat(d, l === "datetime" || r.dataType === "datetime" ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(s);
  }
  return typeof e == "boolean" ? e ? "Yes" : "No" : typeof e == "object" ? JSON.stringify(e) : String(e);
}, Bn = ({ column: e, rows: n, selected: r, searchable: d, onChange: l }) => {
  const [s, g] = I(!1), [o, m] = I(""), w = ne(() => {
    const u = /* @__PURE__ */ new Map();
    return n.forEach((b) => {
      const y = we(b, e);
      u.set(`${typeof y}:${String(y ?? "")}`, { value: y, label: ut(b, e) });
    }), [...u.values()].filter((b) => String(b.label ?? "").toLocaleLowerCase().includes(o.toLocaleLowerCase()));
  }, [n, e, o]);
  return /* @__PURE__ */ x("span", { className: "tmiv-grid__header-filter", onClick: (u) => u.stopPropagation(), children: [
    /* @__PURE__ */ c("button", { type: "button", "aria-label": `Filter values ${e.caption}`, "aria-expanded": s, className: r.length ? "is-active" : "", onClick: () => g((u) => !u), children: "▽" }),
    s && /* @__PURE__ */ x("div", { className: "tmiv-grid__header-filter-popover", children: [
      d && /* @__PURE__ */ c("input", { type: "search", "aria-label": `Search values ${e.caption}`, placeholder: "Search values...", value: o, onChange: (u) => m(u.target.value) }),
      /* @__PURE__ */ x("label", { children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: r.length === 0, onChange: () => l([]) }),
        " All"
      ] }),
      /* @__PURE__ */ c("div", { className: "tmiv-grid__header-filter-values", children: w.map(({ value: u, label: b }) => {
        const y = r.some((p) => Object.is(p, u) || String(p) === String(u));
        return /* @__PURE__ */ x("label", { children: [
          /* @__PURE__ */ c("input", { type: "checkbox", checked: y, onChange: () => l(y ? r.filter((p) => !Object.is(p, u) && String(p) !== String(u)) : [...r, u]) }),
          " ",
          String(b ?? "(Blank)")
        ] }, `${typeof u}:${String(u)}`);
      }) }),
      /* @__PURE__ */ c("button", { type: "button", onClick: () => g(!1), children: "Close" })
    ] })
  ] });
}, qn = ({
  column: e,
  columnIndex: n,
  sort: r,
  onSort: d,
  rows: l,
  headerFilterVisible: s,
  headerFilterSearchable: g,
  headerFilterValues: o,
  reorderable: m,
  dragEnabled: w,
  dragging: u,
  dropTarget: b,
  onHeaderFilterChange: y,
  onDragStart: p,
  onDragEnd: G,
  onDragOver: M,
  onDrop: S,
  resizable: E,
  resizing: V,
  layoutStyle: q,
  onResizeStart: U,
  onAutoFit: O
}) => {
  const z = v(e), Q = r.findIndex((N) => N.field === z), _ = Q >= 0 ? r[Q] : void 0, B = e.allowSorting !== !1 && !!z;
  return /* @__PURE__ */ x(
    "th",
    {
      role: "columnheader",
      "aria-colindex": n + 1,
      "aria-sort": _ ? _.direction === "asc" ? "ascending" : "descending" : "none",
      draggable: w,
      className: `tmiv-grid__header-cell ${B ? "tmiv-grid__header-cell--sortable" : ""} ${u ? "tmiv-grid__header-cell--dragging" : ""} ${b ? "tmiv-grid__header-cell--drop-target" : ""} ${e.fixed ? `tmiv-grid__cell--fixed-${e.fixedPosition === "right" ? "right" : "left"}` : ""}`,
      style: {
        width: e.width,
        minWidth: e.minWidth,
        maxWidth: e.maxWidth,
        textAlign: e.alignment,
        ...q,
        ...q ? { zIndex: 6 } : {}
      },
      onClick: (N) => B && d(z, N.shiftKey),
      onDragStart: (N) => {
        N.dataTransfer.effectAllowed = "move", N.dataTransfer.setData("application/x-tmiv-grid-column", z), p();
      },
      onDragEnd: G,
      onDragOver: (N) => {
        m && (N.preventDefault(), M());
      },
      onDrop: (N) => {
        N.preventDefault(), S();
      },
      children: [
        /* @__PURE__ */ x("div", { className: "tmiv-grid__header-content", children: [
          e.renderHeader ? e.renderHeader({ column: e, columnIndex: n }) : e.caption,
          _ && /* @__PURE__ */ x("span", { className: "tmiv-grid__sort", "aria-hidden": "true", children: [
            _.direction === "asc" ? "▲" : "▼",
            r.length > 1 && /* @__PURE__ */ c("small", { children: Q + 1 })
          ] }),
          s && e.allowFiltering !== !1 && /* @__PURE__ */ c(Bn, { column: e, rows: l, selected: o, searchable: g, onChange: y })
        ] }),
        E && /* @__PURE__ */ c(
          "span",
          {
            role: "separator",
            "aria-label": `Resize ${e.caption ?? z}`,
            "aria-orientation": "vertical",
            className: `tmiv-grid__resize-handle ${V ? "is-resizing" : ""}`,
            onClick: (N) => N.stopPropagation(),
            onDoubleClick: (N) => {
              N.stopPropagation(), O();
            },
            onPointerDown: (N) => {
              N.preventDefault(), N.stopPropagation(), U(N.clientX);
            }
          }
        )
      ]
    }
  );
}, Un = ({ config: e, columns: n, visibleFields: r, buttonText: d, resetText: l, onVisibilityChange: s, onOrderChange: g, onReset: o }) => {
  const [m, w] = I(!1), [u, b] = I(""), [y, p] = I(null), G = n.filter((S) => String(S.caption ?? v(S)).toLocaleLowerCase().includes(u.toLocaleLowerCase())), M = (S) => {
    if (!y || y === S) return;
    const E = n.map(v), V = E.indexOf(y), q = E.indexOf(S), [U] = E.splice(V, 1);
    E.splice(q, 0, U), g(E), p(null);
  };
  return /* @__PURE__ */ x("div", { className: "tmiv-grid__column-chooser", children: [
    /* @__PURE__ */ x("button", { type: "button", "aria-label": d, "aria-expanded": m, onClick: () => w((S) => !S), children: [
      "☷ ",
      d
    ] }),
    m && /* @__PURE__ */ x("div", { role: "dialog", "aria-label": e.title ?? d, className: "tmiv-grid__column-chooser-popover", children: [
      /* @__PURE__ */ x("div", { className: "tmiv-grid__column-chooser-title", children: [
        /* @__PURE__ */ c("strong", { children: e.title ?? d }),
        /* @__PURE__ */ c("button", { type: "button", "aria-label": "Close column chooser", onClick: () => w(!1), children: "×" })
      ] }),
      e.searchable !== !1 && /* @__PURE__ */ c("input", { type: "search", "aria-label": "Search columns", placeholder: "Search columns...", value: u, onChange: (S) => b(S.target.value) }),
      e.allowSelectAll !== !1 && /* @__PURE__ */ x("label", { children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: n.every((S) => r.has(v(S))), onChange: (S) => n.forEach((E) => s(v(E), S.target.checked)) }),
        " Select all"
      ] }),
      /* @__PURE__ */ c("div", { className: "tmiv-grid__column-chooser-list", children: G.map((S) => {
        const E = v(S);
        return /* @__PURE__ */ x("label", { draggable: e.mode === "dragAndDrop", onDragStart: () => p(E), onDragOver: (V) => V.preventDefault(), onDrop: () => M(E), children: [
          e.mode === "dragAndDrop" && /* @__PURE__ */ c("span", { "aria-hidden": "true", children: "⋮⋮" }),
          /* @__PURE__ */ c("input", { type: "checkbox", checked: r.has(E), onChange: (V) => s(E, V.target.checked) }),
          " ",
          S.caption ?? E
        ] }, E);
      }) }),
      /* @__PURE__ */ c("button", { type: "button", onClick: o, children: l })
    ] })
  ] });
}, Ge = (e, n) => {
  if (n !== void 0) return n;
  if (typeof e.width == "number") return e.width;
  if (typeof e.width == "string") {
    const r = Number.parseFloat(e.width);
    if (Number.isFinite(r) && e.width.includes("px")) return r;
  }
  return Math.max(e.minWidth ?? 80, 140);
}, Hn = (e, n, r, d = 0) => {
  const l = new Set(e.filter((o) => !o.fixed && o.minScreenWidth && n < o.minScreenWidth).map(v));
  let s = e.filter((o) => !l.has(v(o))).reduce((o, m) => o + Ge(m, r[v(m)]), d);
  const g = e.filter((o) => o.hidingPriority !== void 0 && !o.fixed && !l.has(v(o))).sort((o, m) => (o.hidingPriority ?? 0) - (m.hidingPriority ?? 0));
  for (const o of g) {
    if (s <= n) break;
    l.add(v(o)), s -= Ge(o, r[v(o)]);
  }
  return l;
}, Xn = (e, n, r = 0, d = 0) => {
  const l = {};
  let s = r;
  e.forEach((o) => {
    if (o.fixed && o.fixedPosition !== "right") {
      const m = v(o);
      l[m] = { position: "sticky", left: s, zIndex: 3 }, s += Ge(o, n[m]);
    }
  });
  let g = d;
  return [...e].reverse().forEach((o) => {
    if (o.fixed && o.fixedPosition === "right") {
      const m = v(o);
      l[m] = { position: "sticky", right: g, zIndex: 3 }, g += Ge(o, n[m]);
    }
  }), l;
}, Jn = (e) => {
  const n = Math.max(0, ...e.map((r) => {
    var d;
    return ((d = r.bandPath) == null ? void 0 : d.length) ?? 0;
  }));
  return Array.from({ length: n }, (r, d) => {
    const l = [];
    return e.forEach((s) => {
      var u;
      const g = ((u = s.bandPath) == null ? void 0 : u[d]) ?? "", o = (s.bandPath ?? []).slice(0, d + 1).join("\0"), m = e[l.reduce((b, y) => b + y.colSpan, 0) - 1], w = m ? (m.bandPath ?? []).slice(0, d + 1).join("\0") : void 0;
      l.length && o === w ? l[l.length - 1].colSpan += 1 : l.push({ caption: g, colSpan: 1 });
    }), l;
  });
}, Yn = (e) => e.filterOperation ?? (e.dataType === "number" || e.dataType === "date" || e.dataType === "datetime" ? "equals" : "contains"), Qn = (e) => e.dataType === "number" || e.dataType === "date" || e.dataType === "datetime" ? [["equals", "="], ["notEquals", "≠"], [">", ">"], [">=", "≥"], ["<", "<"], ["<=", "≤"], ["between", "Between"]] : [["contains", "Contains"], ["notContains", "Not contains"], ["startsWith", "Starts with"], ["endsWith", "Ends with"], ["equals", "="], ["notEquals", "≠"]], Zn = ({ caption: e, operator: n, items: r, active: d, onChange: l }) => {
  var w;
  const [s, g] = I(!1), o = Ee(null), m = ((w = r.find(([u]) => u === n)) == null ? void 0 : w[1]) ?? n;
  return ye(() => {
    if (!s) return;
    const u = (b) => {
      var y;
      (y = o.current) != null && y.contains(b.target) || g(!1);
    };
    return document.addEventListener("pointerdown", u), () => document.removeEventListener("pointerdown", u);
  }, [s]), /* @__PURE__ */ x("div", { className: "tmiv-grid__filter-operation", ref: o, onKeyDown: (u) => {
    u.key === "Escape" && (u.stopPropagation(), g(!1));
  }, children: [
    /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        "aria-label": `Filter operation ${e}`,
        "aria-haspopup": "menu",
        "aria-expanded": s,
        className: d ? "is-active" : "",
        title: `${e}: ${m}`,
        onClick: () => g((u) => !u),
        children: /* @__PURE__ */ x("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", width: "15", height: "15", children: [
          /* @__PURE__ */ c("circle", { cx: "10.5", cy: "10.5", r: "6.5", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
          /* @__PURE__ */ c("path", { d: "m15.5 15.5 5 5", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
        ] })
      }
    ),
    s && /* @__PURE__ */ c("div", { role: "menu", "aria-label": `Filter operations ${e}`, className: "tmiv-grid__filter-operation-menu", children: r.map(([u, b]) => /* @__PURE__ */ x(
      "button",
      {
        type: "button",
        role: "menuitemradio",
        "aria-checked": u === n,
        className: u === n ? "is-selected" : "",
        onClick: () => {
          l(u), g(!1);
        },
        children: [
          /* @__PURE__ */ c("span", { children: b }),
          u === n && /* @__PURE__ */ c("span", { "aria-hidden": "true", children: "✓" })
        ]
      },
      u
    )) })
  ] });
}, ei = ({ columns: e, filters: n, columnOffset: r, commandOffset: d = 0, columnStyles: l = {}, offsetStyles: s = [], commandStyle: g, onChange: o }) => {
  const [m, w] = I({});
  return /* @__PURE__ */ x("tr", { role: "row", className: "tmiv-grid__filter-row", children: [
    Array.from({ length: r }, (u, b) => /* @__PURE__ */ c("th", { className: "tmiv-grid__filter-cell tmiv-grid__cell--fixed-left", style: s[b] }, b)),
    e.map((u) => {
      const b = v(u), y = n.find((E) => E.field === b), p = (y == null ? void 0 : y.operator) ?? m[b] ?? Yn(u), G = u.fixed ? `tmiv-grid__cell--fixed-${u.fixedPosition === "right" ? "right" : "left"}` : "";
      if (u.allowFiltering === !1 || !b) return /* @__PURE__ */ c("th", { className: `tmiv-grid__filter-cell ${G}`, style: l[b] }, b);
      if (u.dataType === "boolean")
        return /* @__PURE__ */ c("th", { className: `tmiv-grid__filter-cell ${G}`, style: l[b], children: /* @__PURE__ */ x("select", { "aria-label": `Filter ${u.caption}`, value: String((y == null ? void 0 : y.value) ?? ""), onChange: (E) => o(b, "equals", E.target.value === "" ? "" : E.target.value === "true"), children: [
          /* @__PURE__ */ c("option", { value: "", children: "All" }),
          /* @__PURE__ */ c("option", { value: "true", children: "True" }),
          /* @__PURE__ */ c("option", { value: "false", children: "False" })
        ] }) }, b);
      const M = u.dataType === "number" ? "number" : u.dataType === "date" || u.dataType === "datetime" ? "date" : "search", S = Array.isArray(y == null ? void 0 : y.value) ? y.value : [(y == null ? void 0 : y.value) ?? "", ""];
      return /* @__PURE__ */ c("th", { className: `tmiv-grid__filter-cell ${G}`, style: l[b], children: /* @__PURE__ */ x("div", { className: "tmiv-grid__filter-editor", children: [
        /* @__PURE__ */ c(Zn, { caption: String(u.caption ?? b), operator: p, items: Qn(u), active: !!y, onChange: (E) => {
          w((V) => ({ ...V, [b]: E })), o(b, E, E === "between" ? S : S[0]);
        } }),
        p === "between" ? /* @__PURE__ */ x("span", { className: "tmiv-grid__filter-range", children: [
          /* @__PURE__ */ c("input", { "aria-label": `Filter ${u.caption} from`, type: M, value: String(S[0] ?? ""), onChange: (E) => o(b, p, [E.target.value, S[1]]) }),
          /* @__PURE__ */ c("input", { "aria-label": `Filter ${u.caption} to`, type: M, value: String(S[1] ?? ""), onChange: (E) => o(b, p, [S[0], E.target.value]) })
        ] }) : /* @__PURE__ */ c("input", { "aria-label": `Filter ${u.caption}`, type: M, value: String(Array.isArray(y == null ? void 0 : y.value) ? (y == null ? void 0 : y.value[0]) ?? "" : (y == null ? void 0 : y.value) ?? ""), onChange: (E) => o(b, p, E.target.value) })
      ] }) }, b);
    }),
    Array.from({ length: d }, (u, b) => /* @__PURE__ */ c("th", { className: "tmiv-grid__filter-cell tmiv-grid__cell--fixed-right", style: g }, `command-${b}`))
  ] });
}, ti = ({ config: e, value: n, onChange: r }) => {
  const [d, l] = I(n);
  return ye(() => l(n), [n]), ye(() => {
    const s = window.setTimeout(() => r(d), e.debounce ?? 250);
    return () => window.clearTimeout(s);
  }, [d, e.debounce, r]), /* @__PURE__ */ x("label", { className: "tmiv-grid__search", style: { width: e.width }, children: [
    /* @__PURE__ */ c("span", { "aria-hidden": "true", children: "⌕" }),
    /* @__PURE__ */ c(
      "input",
      {
        type: "search",
        "aria-label": e.placeholder ?? "Search",
        placeholder: e.placeholder ?? "Search...",
        value: d,
        onChange: (s) => l(s.target.value)
      }
    )
  ] });
}, ni = ({ columns: e, groups: n, emptyText: r, allowDragging: d, onChange: l }) => /* @__PURE__ */ x("div", { className: "tmiv-grid__group-panel", onDragOver: (g) => d && g.preventDefault(), onDrop: (g) => {
  if (g.preventDefault(), !d) return;
  const o = g.dataTransfer.getData("application/x-tmiv-grid-column"), m = e.find((w) => v(w) === o);
  o && (m == null ? void 0 : m.allowGrouping) !== !1 && !n.some((w) => w.field === o) && l([...n, { field: o, direction: "asc" }]);
}, children: [
  !n.length && /* @__PURE__ */ c("span", { children: r }),
  n.map((g) => {
    const o = e.find((m) => v(m) === g.field);
    return /* @__PURE__ */ x("span", { className: "tmiv-grid__group-chip", children: [
      /* @__PURE__ */ x("button", { type: "button", "aria-label": `Toggle group direction ${(o == null ? void 0 : o.caption) ?? g.field}`, onClick: () => l(n.map((m) => m.field === g.field ? { ...m, direction: m.direction === "desc" ? "asc" : "desc" } : m)), children: [
        (o == null ? void 0 : o.caption) ?? g.field,
        " ",
        g.direction === "desc" ? "▼" : "▲"
      ] }),
      /* @__PURE__ */ c("button", { type: "button", "aria-label": `Remove group ${(o == null ? void 0 : o.caption) ?? g.field}`, onClick: () => l(n.filter((m) => m.field !== g.field)), children: "×" })
    ] }, g.field);
  })
] }), ii = ({ node: e, column: n, colSpan: r, expanded: d, collapsible: l, summaries: s, onToggle: g }) => /* @__PURE__ */ c("tr", { role: "row", className: "tmiv-grid__group-row", children: /* @__PURE__ */ x("td", { role: "gridcell", colSpan: r, style: { paddingLeft: 12 + e.level * 22 }, children: [
  /* @__PURE__ */ c("button", { type: "button", disabled: !l, "aria-expanded": d, onClick: g, children: d ? "▾" : "▸" }),
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
  s.map((o, m) => {
    var b;
    const w = yn(e.rows, o), u = ((b = o.displayFormat) == null ? void 0 : b.replace("{0}", String(w ?? ""))) ?? `${String(o.field ?? o.name ?? o.type)}: ${String(w ?? "")}`;
    return /* @__PURE__ */ c("span", { className: "tmiv-grid__group-summary", children: u }, o.name ?? `${String(o.field)}-${o.type}-${m}`);
  })
] }) }), We = (e) => e == null || e === "", ri = (e, n) => e.type === "required" ? `${n} is required.` : e.type === "email" ? `${n} must be a valid email.` : e.type === "numeric" ? `${n} must be numeric.` : e.type === "stringLength" ? `${n} has an invalid length.` : e.type === "range" ? `${n} is outside the allowed range.` : e.type === "pattern" ? `${n} has an invalid format.` : e.type === "compare" ? `${n} does not match.` : `${n} is invalid.`, ai = async (e, n, r) => {
  var d, l;
  for (const s of r.validationRules ?? []) {
    let g = !0;
    if (s.type === "required") g = !We(e);
    else if (!We(e) && s.type === "numeric") g = Number.isFinite(Number(e));
    else if (!We(e) && s.type === "email") g = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e));
    else if (!We(e) && s.type === "stringLength") {
      const o = String(e).length;
      g = (s.min === void 0 || o >= s.min) && (s.max === void 0 || o <= s.max);
    } else if (!We(e) && s.type === "range") {
      const o = Number(e);
      g = (s.min === void 0 || o >= s.min) && (s.max === void 0 || o <= s.max);
    } else if (!We(e) && s.type === "pattern")
      g = (s.pattern instanceof RegExp ? s.pattern : new RegExp(s.pattern ?? "")).test(String(e));
    else if (s.type === "compare") {
      const o = ((d = s.comparisonTarget) == null ? void 0 : d.call(s)) ?? ie(n, String(s.compareField ?? ""));
      g = Object.is(e, o) || String(e ?? "") === String(o ?? "");
    } else if (s.type === "custom" || s.type === "async") {
      const o = await ((l = s.validationCallback) == null ? void 0 : l.call(s, { value: e, row: n, column: r }));
      if (typeof o == "string") return o;
      g = o !== !1;
    }
    if (!g) return s.message ?? ri(s, r.caption ?? v(r));
  }
}, un = async (e, n) => {
  const r = {};
  return await Promise.all(n.map(async (d) => {
    const l = v(d);
    if (!l || d.allowEditing === !1) return;
    const s = await ai(ie(e, l), e, d);
    s && (r[l] = s);
  })), r;
}, li = (e, n) => {
  if (e === "") return e;
  if (n.dataType === "number") {
    const r = Number(e);
    return Number.isFinite(r) ? r : e;
  }
  return n.dataType === "boolean" ? !!e : e;
}, bn = ({ row: e, column: n, value: r, error: d, disabled: l = !1, autoFocus: s, onChange: g, onCommit: o, onCancel: m }) => {
  var G, M, S, E, V, q, U;
  const w = {
    disabled: l,
    autoFocus: s,
    "aria-invalid": !!d,
    "aria-label": `Edit ${n.caption ?? String(n.field ?? "")}`,
    onKeyDown: (O) => {
      O.key === "Escape" && (O.preventDefault(), m == null || m()), O.key === "Enter" && !O.shiftKey && (O.preventDefault(), o == null || o()), O.key === "Tab" && (o == null || o());
    },
    onBlur: o
  }, u = (O) => g(li(O, n)), b = { row: e, data: e, value: r, displayValue: r, column: n, rowIndex: -1, columnIndex: -1, setValue: u, error: d, disabled: l };
  if (n.renderEditCell) return /* @__PURE__ */ c(ze, { children: n.renderEditCell(b) });
  const y = (G = n.editorType) == null ? void 0 : G.toLocaleLowerCase();
  if (n.lookup || y === "selectbox") {
    const O = ((M = n.lookup) == null ? void 0 : M.dataSource) ?? ((S = n.editorOptions) == null ? void 0 : S.dataSource) ?? [], z = String(((E = n.lookup) == null ? void 0 : E.valueExpr) ?? ((V = n.editorOptions) == null ? void 0 : V.valueExpr) ?? "value"), Q = String(((q = n.lookup) == null ? void 0 : q.displayExpr) ?? ((U = n.editorOptions) == null ? void 0 : U.displayExpr) ?? "text");
    return /* @__PURE__ */ x("select", { ...w, value: String(r ?? ""), onChange: (_) => {
      const B = O.find((N) => String(ie(N, z) ?? "") === _.target.value);
      u(B ? ie(B, z) : _.target.value);
    }, children: [
      /* @__PURE__ */ c("option", { value: "", children: "--" }),
      O.map((_, B) => /* @__PURE__ */ c("option", { value: String(ie(_, z) ?? ""), children: String(ie(_, Q) ?? "") }, String(ie(_, z) ?? B)))
    ] });
  }
  if (n.dataType === "boolean" || y === "checkbox")
    return /* @__PURE__ */ c("input", { ...w, type: "checkbox", checked: !!r, onChange: (O) => u(O.target.checked) });
  if (y === "textarea")
    return /* @__PURE__ */ c("textarea", { ...w, value: String(r ?? ""), onChange: (O) => u(O.target.value) });
  const p = n.dataType === "number" || y === "numberbox" ? "number" : n.dataType === "date" || y === "datebox" ? "date" : n.dataType === "datetime" || y === "datetimebox" ? "datetime-local" : "text";
  return /* @__PURE__ */ c("input", { ...w, type: p, value: String(r ?? ""), onChange: (O) => u(O.target.value) });
}, oi = ({ row: e, columns: n, errors: r, colCount: d, title: l, saving: s, popup: g, width: o, onChange: m, onSave: w, onCancel: u }) => {
  const b = /* @__PURE__ */ x("div", { className: `tmiv-grid__edit-form ${g ? "tmiv-grid__edit-form--popup" : ""}`, style: { width: o }, role: g ? "dialog" : "form", "aria-modal": g || void 0, "aria-label": l ?? "Edit row", children: [
    l && /* @__PURE__ */ c("h3", { children: l }),
    /* @__PURE__ */ c("div", { className: "tmiv-grid__edit-form-fields", style: { gridTemplateColumns: `repeat(${Math.max(1, d)}, minmax(0, 1fr))` }, children: n.filter((y) => y.allowEditing !== !1 && v(y)).map((y) => {
      const p = v(y);
      return /* @__PURE__ */ x("label", { children: [
        /* @__PURE__ */ c("span", { children: y.caption ?? p }),
        /* @__PURE__ */ c(bn, { row: e, column: y, value: ie(e, p), error: r[p], disabled: s, onChange: (G) => m(p, G) }),
        r[p] && /* @__PURE__ */ c("small", { role: "alert", children: r[p] })
      ] }, p);
    }) }),
    /* @__PURE__ */ x("div", { className: "tmiv-grid__edit-form-actions", children: [
      /* @__PURE__ */ c("button", { type: "button", disabled: s, onClick: w, children: "Save" }),
      /* @__PURE__ */ c("button", { type: "button", disabled: s, onClick: u, children: "Cancel" })
    ] })
  ] });
  return g ? /* @__PURE__ */ c("div", { className: "tmiv-grid__popup-backdrop", children: b }) : b;
}, si = (e) => !Array.isArray(e) && typeof (e == null ? void 0 : e.load) == "function", di = (e, n, r) => {
  const [d, l] = I(Array.isArray(e) ? e : []), [s, g] = I(Array.isArray(e) ? e.length : 0), [o, m] = I(!Array.isArray(e)), [w, u] = I(null), b = P(async () => {
    if (!si(e)) {
      l(e), g(e.length), u(null);
      return;
    }
    m(!0), u(null);
    try {
      const y = await e.load(n), p = Array.isArray(y) ? y : y.data;
      l(p), g(Array.isArray(y) ? y.length : y.totalCount);
    } catch (y) {
      const p = y instanceof Error ? y : new Error(String(y));
      u(p), r == null || r(p);
    } finally {
      m(!1);
    }
  }, [e, n, r]);
  return ye(() => {
    b();
  }, [b]), { rows: d, totalCount: s, loading: o, error: w, reload: b };
}, ci = (e) => {
  const { selectedRowKeys: n, defaultSelectedRowKeys: r, onSelectedRowKeysChange: d } = e, [l, s] = I(r ?? []), [g, o] = I(e.pageIndex), [m, w] = I(e.pageSize), [u, b] = I(e.sort), [y, p] = I([]), [G, M] = I(""), [S, E] = I([]), [V, q] = I(null), U = n ?? l, O = P((z) => {
    const Q = typeof z == "function" ? z(U) : z;
    n === void 0 && s(Q), d == null || d(Q);
  }, [U, n, d]);
  return {
    selection: U,
    setSelection: O,
    pageIndex: g,
    setPageIndex: o,
    pageSize: m,
    setPageSize: w,
    sort: u,
    setSort: b,
    filters: y,
    setFilters: p,
    search: G,
    setSearch: M,
    groups: S,
    setGroups: E,
    focusedCell: V,
    setFocusedCell: q
  };
}, gi = ({
  pageIndex: e,
  pageSize: n,
  pageCount: r,
  totalCount: d,
  allowedPageSizes: l,
  showPageSizeSelector: s,
  showNavigationButtons: g,
  showInfo: o,
  messages: m,
  onPageIndexChange: w,
  onPageSizeChange: u
}) => /* @__PURE__ */ x("div", { className: "tmiv-grid__pager", role: "navigation", "aria-label": "Grid pagination", children: [
  /* @__PURE__ */ x("div", { className: "tmiv-grid__pager-navigation", children: [
    g && /* @__PURE__ */ x(ze, { children: [
      /* @__PURE__ */ c("button", { type: "button", "aria-label": "First page", disabled: e <= 0, onClick: () => w(0), children: "«" }),
      /* @__PURE__ */ c("button", { type: "button", "aria-label": "Previous page", disabled: e <= 0, onClick: () => w(e - 1), children: "‹" })
    ] }),
    /* @__PURE__ */ c("span", { children: m.page }),
    /* @__PURE__ */ c(
      "input",
      {
        "aria-label": "Page number",
        type: "number",
        min: 1,
        max: r,
        value: e + 1,
        onChange: (b) => w(Math.min(r - 1, Math.max(0, Number(b.target.value) - 1)))
      }
    ),
    /* @__PURE__ */ x("span", { children: [
      m.of,
      " ",
      r
    ] }),
    g && /* @__PURE__ */ x(ze, { children: [
      /* @__PURE__ */ c("button", { type: "button", "aria-label": "Next page", disabled: e >= r - 1, onClick: () => w(e + 1), children: "›" }),
      /* @__PURE__ */ c("button", { type: "button", "aria-label": "Last page", disabled: e >= r - 1, onClick: () => w(r - 1), children: "»" })
    ] }),
    s && /* @__PURE__ */ x("label", { children: [
      m.rowsPerPage,
      /* @__PURE__ */ c("select", { value: n, onChange: (b) => u(Number(b.target.value)), children: l.map((b) => /* @__PURE__ */ c("option", { value: b, children: b }, b)) })
    ] })
  ] }),
  o && /* @__PURE__ */ x("span", { className: "tmiv-grid__pager-info", children: [
    d,
    " ",
    m.records
  ] })
] }), fi = (e, n) => {
  const r = n.trim();
  if (!r) return e;
  const d = [], l = e.toLocaleLowerCase(), s = r.toLocaleLowerCase();
  let g = 0, o = l.indexOf(s);
  for (; o >= 0; )
    d.push(e.slice(g, o)), d.push(/* @__PURE__ */ c("mark", { children: e.slice(o, o + r.length) }, `${o}-${d.length}`)), g = o + r.length, o = l.indexOf(s, g);
  return d.push(e.slice(g)), d;
}, ui = ({
  row: e,
  value: n,
  displayValue: r,
  column: d,
  rowIndex: l,
  columnIndex: s,
  locale: g,
  focused: o,
  onClick: m,
  onDoubleClick: w,
  onFocus: u,
  searchText: b = "",
  highlightSearchText: y = !1,
  editing: p = !1,
  changed: G = !1,
  error: M,
  saving: S = !1,
  onValueChange: E,
  onCommitEdit: V,
  onCancelEdit: q,
  layoutStyle: U
}) => {
  const O = { row: e, data: e, value: n, displayValue: r, column: d, rowIndex: l, columnIndex: s }, z = typeof d.cellClassName == "function" ? d.cellClassName(O) : d.cellClassName ?? "", Q = d.renderCell ? d.renderCell(O) : wn(r, e, d, g), _ = y && typeof Q == "string" ? fi(Q, b) : Q;
  return /* @__PURE__ */ c(
    "td",
    {
      role: "gridcell",
      "aria-colindex": s + 1,
      tabIndex: o ? 0 : -1,
      "data-grid-row": l,
      "data-grid-column": s,
      className: `tmiv-grid__cell ${o ? "tmiv-grid__cell--focused" : ""} ${p ? "tmiv-grid__cell--editing" : ""} ${G ? "tmiv-grid__cell--modified" : ""} ${M ? "tmiv-grid__cell--invalid" : ""} ${d.fixed ? `tmiv-grid__cell--fixed-${d.fixedPosition === "right" ? "right" : "left"}` : ""} ${z}`.trim(),
      style: { textAlign: d.alignment, ...U },
      onClick: m,
      onDoubleClick: w,
      onFocus: u,
      title: typeof Q == "string" ? Q : void 0,
      children: p ? /* @__PURE__ */ x("div", { className: "tmiv-grid__cell-editor", onClick: (B) => B.stopPropagation(), children: [
        /* @__PURE__ */ c(bn, { row: e, column: d, value: n, error: M, disabled: S, autoFocus: !0, onChange: (B) => E == null ? void 0 : E(B), onCommit: V, onCancel: q }),
        M && /* @__PURE__ */ c("small", { role: "alert", children: M })
      ] }) : /* @__PURE__ */ c("div", { className: "tmiv-grid__cell-content", children: _ })
    }
  );
}, hi = hn(ui), mi = ({
  row: e,
  rowKey: n,
  rowIndex: r,
  absoluteRowIndex: d,
  columns: l,
  locale: s,
  selected: g,
  focusedCell: o,
  showSelection: m,
  showRowNumber: w,
  searchText: u,
  highlightSearchText: b,
  editingFields: y = /* @__PURE__ */ new Set(),
  changedFields: p = /* @__PURE__ */ new Set(),
  errors: G = {},
  saving: M,
  showCommands: S,
  canEdit: E,
  canDelete: V,
  rowEditing: q,
  onValueChange: U,
  onCommitCell: O,
  onCancelCell: z,
  onEdit: Q,
  onSave: _,
  onCancel: B,
  onDelete: N,
  commandTexts: Te = { edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel" },
  onSelect: f,
  onRowClick: ht,
  onRowDoubleClick: L,
  onCellClick: se,
  onCellDoubleClick: et,
  onCellFocus: de,
  columnStyles: xe = {},
  selectionStyle: be,
  rowNumberStyle: pe,
  commandStyle: Me
}) => /* @__PURE__ */ x(
  "tr",
  {
    role: "row",
    "aria-rowindex": d + 2,
    "aria-selected": g,
    "data-row-key": String(n),
    className: `tmiv-grid__row ${g ? "tmiv-grid__row--selected" : ""}`,
    onClick: ht,
    onDoubleClick: L,
    children: [
      m && /* @__PURE__ */ c("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--selection tmiv-grid__cell--fixed-left", style: be, children: /* @__PURE__ */ c(
        "input",
        {
          type: "checkbox",
          "aria-label": `Select row ${d + 1}`,
          checked: g,
          onClick: (A) => A.stopPropagation(),
          onChange: f
        }
      ) }),
      w && /* @__PURE__ */ c("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--row-number tmiv-grid__cell--fixed-left", style: pe, children: d + 1 }),
      l.map((A, ce) => /* @__PURE__ */ c(
        hi,
        {
          row: e,
          data: e,
          value: we(e, A),
          displayValue: ut(e, A),
          column: A,
          rowIndex: r,
          columnIndex: ce,
          locale: s,
          focused: (o == null ? void 0 : o.rowIndex) === r && o.columnIndex === ce,
          searchText: u,
          highlightSearchText: b,
          editing: y.has(String(A.field ?? A.dataField ?? A.name ?? "")),
          changed: p.has(String(A.field ?? A.dataField ?? A.name ?? "")),
          error: G[String(A.field ?? A.dataField ?? A.name ?? "")],
          saving: M,
          onValueChange: (ve) => U == null ? void 0 : U(String(A.field ?? A.dataField ?? A.name ?? ""), ve),
          onCommitEdit: () => O == null ? void 0 : O(String(A.field ?? A.dataField ?? A.name ?? "")),
          onCancelEdit: z,
          onClick: (ve) => se(ce, ve),
          onDoubleClick: (ve) => et(ce, ve),
          onFocus: () => de(ce),
          layoutStyle: xe[String(A.field ?? A.dataField ?? A.name ?? "")]
        },
        String(A.field ?? A.dataField ?? A.name ?? ce)
      )),
      S && /* @__PURE__ */ c("td", { role: "gridcell", className: "tmiv-grid__cell tmiv-grid__cell--commands tmiv-grid__cell--fixed-right", style: Me, onClick: (A) => A.stopPropagation(), children: q ? /* @__PURE__ */ x(ze, { children: [
        /* @__PURE__ */ c("button", { type: "button", disabled: M, onClick: _, children: Te.save }),
        /* @__PURE__ */ c("button", { type: "button", disabled: M, onClick: B, children: Te.cancel })
      ] }) : /* @__PURE__ */ x(ze, { children: [
        E && /* @__PURE__ */ c("button", { type: "button", disabled: M, onClick: Q, children: Te.edit }),
        V && /* @__PURE__ */ c("button", { type: "button", disabled: M, onClick: N, children: Te.delete })
      ] }) })
    ]
  }
), yi = hn(mi), wi = ({ rows: e, columns: n, items: r, columnOffset: d, commandOffset: l = 0, locale: s, columnStyles: g = {}, offsetStyles: o = [], commandStyle: m }) => /* @__PURE__ */ c("tfoot", { className: "tmiv-grid__summary", children: /* @__PURE__ */ x("tr", { role: "row", children: [
  Array.from({ length: d }, (w, u) => /* @__PURE__ */ c("td", { className: "tmiv-grid__cell--fixed-left", style: o[u] }, u)),
  n.map((w) => {
    const u = v(w), b = r.filter((y) => String(y.field ?? "") === u || !y.field && u === v(n[0]));
    return /* @__PURE__ */ c("td", { role: "gridcell", className: w.fixed ? `tmiv-grid__cell--fixed-${w.fixedPosition === "right" ? "right" : "left"}` : void 0, style: g[u], children: b.map((y, p) => {
      var S;
      const G = yn(e, y), M = y.valueFormat instanceof Function ? y.valueFormat(G) : wn(G, e[0], { ...w, format: y.valueFormat ?? w.format }, s);
      return /* @__PURE__ */ c("div", { children: ((S = y.displayFormat) == null ? void 0 : S.replace("{0}", M)) ?? `${y.type}: ${M}` }, y.name ?? `${y.type}-${p}`);
    }) }, u);
  }),
  Array.from({ length: l }, (w, u) => /* @__PURE__ */ c("td", { className: "tmiv-grid__cell--fixed-right", style: m }, `command-${u}`))
] }) }), bi = {
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
  cancelAll: "Cancel all",
  columns: "Columns",
  resetColumns: "Reset columns"
}, zt = (e) => e === void 0 ? void 0 : e;
function vi(e, n) {
  var rn, an, ln, on, sn, dn, cn, gn;
  const {
    dataSource: r,
    rows: d,
    columns: l,
    keyExpr: s,
    selection: g = {},
    sorting: o = {},
    paging: m = {},
    pager: w = {},
    filterRow: u = {},
    headerFilter: b = {},
    searchPanel: y = {},
    grouping: p = {},
    groupPanel: G = {},
    summary: M = {},
    editing: S = {},
    columnChooser: E = {},
    responsive: V = {},
    remoteOperations: q = !1,
    plugins: U = [],
    locale: O = "en"
  } = e, z = r ?? d ?? [], Q = Array.isArray(z) ? void 0 : z.key, _ = s ?? Q ?? "id", B = m.enabled !== !1, N = typeof q == "boolean" ? { paging: q, sorting: q, filtering: q, grouping: q, summary: q } : q, Te = ne(
    () => (l ?? []).filter((t) => t.sortOrder).sort((t, i) => (t.sortIndex ?? 0) - (i.sortIndex ?? 0)).map((t) => ({ field: v(t), direction: t.sortOrder })),
    [l]
  ), f = ci({
    selectedRowKeys: e.selectedRowKeys,
    defaultSelectedRowKeys: e.defaultSelectedRowKeys,
    pageIndex: m.pageIndex ?? 0,
    pageSize: m.pageSize ?? 20,
    sort: Te,
    onSelectedRowKeysChange: e.onSelectedRowKeysChange
  }), ht = ne(() => ({
    skip: B && N.paging ? f.pageIndex * f.pageSize : 0,
    take: B && N.paging ? f.pageSize : Number.MAX_SAFE_INTEGER,
    sort: N.sorting ? f.sort : [],
    filter: N.filtering ? f.filters : void 0,
    search: N.filtering ? f.search : void 0,
    group: N.grouping ? f.groups : void 0,
    summary: N.summary ? M.totalItems : void 0
  }), [B, N.paging, N.sorting, N.filtering, N.grouping, N.summary, f.pageIndex, f.pageSize, f.sort, f.filters, f.search, f.groups, M.totalItems]), L = di(z, ht, e.onDataError), se = Ee(null), et = Ee(!1), de = Ee(/* @__PURE__ */ new Set()), xe = Ee([]), be = Ee([]), pe = Ee(null), Me = Ee(null), [A, ce] = I({}), [ve, tt] = I([]), [mt, Tt] = I({}), [Mt, Ot] = I({}), [yt, vn] = I(0), [Sn, Kt] = I(null), [Ve, wt] = I(null), [Cn, bt] = I(null), [_n, nt] = I(() => /* @__PURE__ */ new Set()), [xn, Oe] = I(null), [ae, Lt] = I([]), [re, vt] = I(null), [J, St] = I(null), [ge, je] = I({}), [Wt, Ne] = I({}), [Be, Gt] = I(!1), [Vt, it] = I(null), H = S.mode ?? "row", fe = S.allowAdding === !0 || S.allowUpdating === !0 || typeof S.allowUpdating == "function" || S.allowDeleting === !0 || typeof S.allowDeleting == "function";
  ye(() => {
    Oe(null), Lt([]), de.current.clear();
  }, [z]);
  const jt = ne(() => On(l, L.rows), [l, L.rows]), De = ne(() => U.reduce(
    (t, i) => i.transformColumns ? i.transformColumns(t) : t,
    jt
  ), [jt, U]), ue = ne(() => {
    if (!ve.length) return De;
    const t = new Map(ve.map((i, a) => [i, a]));
    return [...De].sort((i, a) => (t.get(v(i)) ?? Number.MAX_SAFE_INTEGER) - (t.get(v(a)) ?? Number.MAX_SAFE_INTEGER));
  }, [De, ve]), Bt = ne(() => ue.map((t) => {
    const i = Mt[v(t)];
    return i === void 0 ? t : { ...t, fixed: i !== null, fixedPosition: i ?? void 0 };
  }), [ue, Mt]), rt = ne(() => Bt.filter((t) => mt[v(t)] ?? t.visible !== !1), [Bt, mt]), qt = ne(() => V.enabled && yt > 0 ? Hn(rt, yt, A, V.padding) : /* @__PURE__ */ new Set(), [V.enabled, V.padding, yt, rt, A]), R = ne(() => rt.filter((t) => !qt.has(v(t))), [rt, qt]);
  ye(() => {
    tt((t) => {
      const i = De.map(v), a = [...t.filter((h) => i.includes(h)), ...i.filter((h) => !t.includes(h))];
      return a.join("|") === t.join("|") ? t : a;
    });
  }, [De]), ye(() => {
    if (!V.enabled || !se.current) return;
    const t = () => {
      var a;
      return vn(((a = se.current) == null ? void 0 : a.clientWidth) ?? 0);
    };
    if (t(), typeof ResizeObserver > "u")
      return window.addEventListener("resize", t), () => window.removeEventListener("resize", t);
    const i = new ResizeObserver(t);
    return i.observe(se.current), () => i.disconnect();
  }, [V.enabled]);
  const Z = xn ?? L.rows;
  be.current = Z, xe.current = ae;
  const Ct = ne(() => U.reduce(
    (t, i) => i.transformRows ? i.transformRows(t, { columns: R, rows: t }) : t,
    Z
  ), [Z, R, U]), _t = ne(
    () => N.filtering ? Ct : Vn(Gn(Ct, R, f.filters), R, f.search),
    [Ct, R, f.filters, f.search, N.filtering]
  ), qe = ne(
    () => N.sorting ? _t : Kn(_t, R, f.sort),
    [_t, R, f.sort, N.sorting]
  ), T = ne(
    () => B && !N.paging ? Ln(qe, f.pageIndex, f.pageSize) : qe,
    [B, N.paging, qe, f.pageIndex, f.pageSize]
  ), at = N.paging ? L.totalCount : qe.length, Fe = B ? Math.max(1, Math.ceil(at / f.pageSize)) : 1, Ae = g.mode ?? "single", Se = Ae !== "none" && (g.showCheckBoxes ?? Ae === "multiple"), ke = ((rn = e.rowNumber) == null ? void 0 : rn.visible) === !0, he = { ...bi, ...e.messages }, $e = { ...he, ...S.texts }, Pe = P((t) => t.map((i) => X(i, _)), [_]), kn = ne(() => {
    const t = new Set(f.selection);
    return L.rows.filter((i) => t.has(X(i, _)));
  }, [L.rows, f.selection, _]), oe = P((t) => {
    var i;
    f.setSelection(t), (i = e.onSelectionChanged) == null || i.call(e, { selectedRowKeys: t, selectedRowsData: L.rows.filter((a) => t.includes(X(a, _))) });
  }, [f.setSelection, e.onSelectionChanged, L.rows, _]), Ke = P((t) => {
    be.current = t, Oe(t);
  }, []), le = P((t) => {
    var i;
    xe.current = t, Lt(t), (i = e.onChangesChange) == null || i.call(e, t);
  }, [e.onChangesChange]), xt = P((t) => typeof S.allowUpdating == "function" ? S.allowUpdating(t) : S.allowUpdating === !0, [S.allowUpdating]), kt = P((t) => typeof S.allowDeleting == "function" ? S.allowDeleting(t) : S.allowDeleting === !0, [S.allowDeleting]), Re = P(() => {
    vt(null), St(null), je({}), Ne({}), it(null);
  }, []), lt = P((t, i) => {
    const a = Z.find((h) => X(h, _) === t);
    !a || !xt(a) || (vt(t), St(i ? { key: t, field: i } : null), je(i ? { [i]: we(a, R.find((h) => v(h) === i)) } : { ...a }), Ne({}), it(null));
  }, [Z, _, xt, R]), Ut = P(() => {
    var C, K;
    if (S.allowAdding !== !0) return;
    const t = Z.map((W) => X(W, _)), i = ((C = S.newRowKey) == null ? void 0 : C.call(S)) ?? (t.every((W) => typeof W == "number") ? Math.max(0, ...t) + 1 : `__new_${Date.now()}`);
    de.current.add(i);
    const a = R.reduce((W, F) => {
      const j = v(F);
      if (!j) return W;
      const me = typeof F.defaultValue == "function" ? F.defaultValue() : F.defaultValue;
      return me !== void 0 && (W[j] = me), W;
    }, {});
    typeof _ == "string" && (a[_] = i);
    const h = a;
    Ke(S.newRowPosition === "first" ? [h, ...Z] : [...Z, h]), le([...ae, { type: "insert", key: i, data: h }]);
    const k = (K = R.find((W) => W.allowEditing !== !1 && v(W))) == null ? void 0 : K.field;
    vt(i), St((H === "cell" || H === "batch") && k ? { key: i, field: String(k) } : null), je({ ...h }), Ne({});
  }, [S.allowAdding, S.newRowPosition, S.newRowKey, R, _, Ke, Z, le, ae, H]), Rt = P((t, i) => {
    const a = xe.current, h = be.current, k = a.find((F) => F.key === t), C = h.find((F) => X(F, _) === t), K = (k == null ? void 0 : k.type) === "insert" ? a.map((F) => F === k ? { ...F, data: { ...F.data, ...i } } : F) : (k == null ? void 0 : k.type) === "update" ? a.map((F) => F === k ? { ...F, data: { ...F.data, ...i } } : F) : [...a, { type: "update", key: t, data: i, oldData: C }], W = h.map((F) => X(F, _) === t ? { ...F, ...i } : F);
    le(K), Ke(W);
  }, [_, le, Ke]), Ce = P(async (t, i) => {
    var a, h, k, C, K, W, F, j, me, $, ee, Y;
    if (!t.length) return !0;
    Gt(!0), it(null);
    try {
      for (const D of t) {
        if (D.type === "remove") continue;
        const te = D.type === "insert" ? D.data : { ...D.oldData, ...D.data }, _e = await un(te, R);
        if (Object.keys(_e).length)
          return Ne(_e), (a = e.onValidationError) == null || a.call(e, _e), !1;
      }
      await ((h = e.onSaving) == null ? void 0 : h.call(e, t));
      for (const D of t) {
        const te = { key: D.key, data: D.data, oldData: D.oldData, cancel: !1 };
        if (D.type === "insert") {
          if (await ((k = e.onRowInserting) == null ? void 0 : k.call(e, te)), te.cancel) continue;
          if (!Array.isArray(z)) {
            if (!z.insert) throw new Error("Insert is not supported by this data source.");
            const _e = { ...D.data };
            typeof _ == "string" && D.key !== void 0 && de.current.has(D.key) && delete _e[_], await z.insert(_e);
          }
          (C = e.onRowInserted) == null || C.call(e, te), D.key !== void 0 && de.current.delete(D.key);
        } else if (D.type === "update") {
          if (await ((K = e.onRowUpdating) == null ? void 0 : K.call(e, te)), te.cancel) continue;
          if (!Array.isArray(z) && D.key !== void 0) {
            if (!z.update) throw new Error("Update is not supported by this data source.");
            await z.update(D.key, D.data);
          }
          (W = e.onRowUpdated) == null || W.call(e, te);
        } else if (D.type === "remove") {
          if (await ((F = e.onRowRemoving) == null ? void 0 : F.call(e, te)), te.cancel) continue;
          if (!Array.isArray(z) && D.key !== void 0) {
            if (!z.remove) throw new Error("Remove is not supported by this data source.");
            await z.remove(D.key);
          }
          (j = e.onRowRemoved) == null || j.call(e, te);
        }
      }
      if ((me = e.onSaved) == null || me.call(e, t), le([]), Ne({}), Re(), Array.isArray(z)) {
        const D = i ?? be.current;
        Ke(D), ($ = e.onRowsChange) == null || $.call(e, D);
      } else
        Oe(null), await L.reload();
      return !0;
    } catch (D) {
      const te = D instanceof Error ? D : new Error(String(D)), _e = D == null ? void 0 : D.errors;
      if (_e) {
        const fn = Object.fromEntries(Object.entries(_e).map(([In, It]) => [In, Array.isArray(It) ? It.join(", ") : It]));
        Ne(fn), (ee = e.onValidationError) == null || ee.call(e, fn);
      }
      return it(te), (Y = e.onDataError) == null || Y.call(e, te), !1;
    } finally {
      Gt(!1);
    }
  }, [R, e.onValidationError, e.onSaving, e.onRowInserting, e.onRowInserted, e.onRowUpdating, e.onRowUpdated, e.onRowRemoving, e.onRowRemoved, e.onSaved, e.onRowsChange, e.onDataError, z, _, le, Ke, Re, L.reload]), Ht = P(async () => {
    if (re === null) return !1;
    const t = Z.find((C) => X(C, _) === re);
    if (!t) return !1;
    const i = { ...t, ...ge }, a = Z.map((C) => X(C, _) === re ? i : C), h = xe.current.find((C) => C.key === re && C.type === "insert"), k = h ? { ...h, data: i } : { type: "update", key: re, data: ge, oldData: t };
    return Ce([k], a);
  }, [re, Z, _, ge, Ce]), Ue = P(() => {
    if (pe.current) return pe.current;
    if (!J) return Promise.resolve(!0);
    const i = (async () => {
      var F;
      const a = be.current.find((j) => X(j, _) === J.key);
      if (!a) return !1;
      const h = R.find((j) => v(j) === J.field), k = { ...a, ...ge };
      if (h) {
        const j = await un(k, [h]);
        if (Object.keys(j).length)
          return Ne(j), (F = e.onValidationError) == null || F.call(e, j), !1;
      }
      const C = be.current.map((j) => X(j, _) === J.key ? k : j), K = xe.current.find((j) => j.key === J.key && j.type === "insert");
      if (H === "batch")
        return Rt(J.key, ge), Re(), !0;
      const W = K ? { ...K, data: k } : { type: "update", key: J.key, data: ge, oldData: a };
      return Ce([W], C);
    })().finally(() => {
      pe.current === i && (pe.current = null);
    });
    return pe.current = i, i;
  }, [J, _, R, ge, H, Rt, Ce, e.onValidationError, Re]), Rn = P(async () => await Ue() ? Ce(xe.current, be.current) : !1, [Ue, Ce]), Et = P(async (t, i) => {
    (J == null ? void 0 : J.key) === t && J.field === i || J && !await Ue() || lt(t, i);
  }, [J, Ue, lt]), Xt = P(() => {
    var t;
    Oe(null), de.current.clear(), le([]), Re(), (t = e.onEditCanceled) == null || t.call(e);
  }, [le, Re, e.onEditCanceled]), Jt = P(async (t) => {
    const i = Z.find((C) => X(C, _) === t);
    if (!i || !kt(i) || S.confirmDelete !== !1 && typeof window < "u" && !window.confirm("Delete this row?")) return;
    const a = Z.filter((C) => X(C, _) !== t);
    Oe(a);
    const h = ae.find((C) => C.key === t && C.type === "insert"), k = h ? ae.filter((C) => C !== h) : [...ae, { type: "remove", key: t, data: {}, oldData: i }];
    H === "batch" ? le(k) : await Ce(h ? [] : [{ type: "remove", key: t, data: {}, oldData: i }], a);
  }, [Z, _, kt, S.confirmDelete, H, ae, le, Ce]), pt = P((t, i) => {
    if (Ae === "none") return;
    const a = X(T[t], _);
    if (Ae === "single")
      oe(f.selection.includes(a) ? [] : [a]);
    else if (i.shiftKey && Me.current !== null) {
      const h = Math.min(Me.current, t), k = Math.max(Me.current, t);
      oe([.../* @__PURE__ */ new Set([...f.selection, ...Pe(T.slice(h, k + 1))])]);
    } else i.ctrlKey || i.metaKey ? oe(f.selection.includes(a) ? f.selection.filter((h) => h !== a) : [...f.selection, a]) : oe([a]);
    Me.current = t;
  }, [Ae, T, _, oe, f.selection, Pe]), ot = P((t) => {
    var a;
    const i = Math.min(Math.max(0, t), Fe - 1);
    f.setPageIndex(i), (a = e.onPageIndexChange) == null || a.call(e, i);
  }, [Fe, f.setPageIndex, e.onPageIndexChange]), Yt = P((t) => {
    var a;
    const i = Math.max(1, t);
    f.setPageSize(i), f.setPageIndex(0), (a = e.onPageSizeChange) == null || a.call(e, i);
  }, [f.setPageSize, f.setPageIndex, e.onPageSizeChange]);
  ye(() => {
    f.pageIndex >= Fe && ot(Fe - 1);
  }, [Fe, f.pageIndex, ot]);
  const En = P((t, i) => {
    var k;
    if (o.mode === "none") return;
    const a = o.mode === "multiple" && i, h = jn(f.sort, t, a);
    f.setSort(h), f.setPageIndex(0), (k = e.onSortingChanged) == null || k.call(e, h);
  }, [o.mode, f.sort, f.setSort, f.setPageIndex, e.onSortingChanged]), Le = P((t) => {
    var i;
    f.setFilters(t), f.setPageIndex(0), (i = e.onFilterChanged) == null || i.call(e, t);
  }, [f.setFilters, f.setPageIndex, e.onFilterChanged]), pn = P((t, i, a) => {
    const h = f.filters.filter((C) => C.field !== t || C.operator === "in"), k = a === "" || a === void 0 || Array.isArray(a) && a.every((C) => C === "" || C === void 0);
    Le(k ? h : [...h, { field: t, operator: i, value: a }]);
  }, [f.filters, Le]), Nn = P((t, i) => {
    const a = f.filters.filter((h) => h.field !== t || h.operator !== "in");
    Le(i.length ? [...a, { field: t, operator: "in", value: i }] : a);
  }, [f.filters, Le]), Nt = P((t) => {
    var i;
    f.setSearch(t), f.setPageIndex(0), (i = e.onSearchValueChanged) == null || i.call(e, t);
  }, [f.setSearch, f.setPageIndex, e.onSearchValueChanged]), Qt = P((t) => {
    var i;
    f.setGroups(t), f.setPageIndex(0), nt(p.autoExpandAll === !1 ? new Set(gt(T, R, t).map((a) => a.id)) : /* @__PURE__ */ new Set()), (i = e.onGroupingChanged) == null || i.call(e, t);
  }, [f.setGroups, f.setPageIndex, e.onGroupingChanged, p.autoExpandAll, T, R]), Dn = P((t) => {
    var K, W;
    if (!Ve || Ve === t) return;
    const i = ue.findIndex((F) => v(F) === Ve), a = ue.findIndex((F) => v(F) === t);
    if (i < 0 || a < 0 || ue[i].allowReordering === !1 || ue[a].allowReordering === !1) return;
    const h = [...ue], [k] = h.splice(i, 1);
    h.splice(a, 0, k), tt(h.map(v));
    const C = { column: k, fromIndex: i, toIndex: a, columns: h };
    (K = e.onColumnReorder) == null || K.call(e, C), (W = e.onColumnOrderChanged) == null || W.call(e, h), wt(null), bt(null);
  }, [Ve, ue, e.onColumnReorder, e.onColumnOrderChanged]), Dt = P((t, i) => {
    var a;
    Tt((h) => ({ ...h, [t]: i })), (a = e.onColumnVisibilityChanged) == null || a.call(e, t, i);
  }, [e.onColumnVisibilityChanged]), Zt = P((t, i) => {
    var a;
    Ot((h) => ({ ...h, [t]: i })), (a = e.onColumnFixedChanged) == null || a.call(e, t, i);
  }, [e.onColumnFixedChanged]), en = P(() => {
    ce({}), tt(De.map(v)), Tt({}), Ot({});
  }, [De]), Fn = P((t, i) => {
    const a = R.find(($) => v($) === t);
    if (!a || e.allowColumnResizing !== !0 || a.allowResizing === !1) return;
    const h = Ge(a, A[t]), k = R.findIndex(($) => v($) === t), C = R.slice(k + 1).find(($) => $.allowResizing !== !1), K = C ? v(C) : void 0, W = C ? Ge(C, A[K]) : 0;
    let F = h;
    Kt(t);
    const j = ($) => {
      const ee = h + $.clientX - i, Y = Math.min(a.maxWidth ?? Number.MAX_SAFE_INTEGER, Math.max(a.minWidth ?? 48, ee));
      F = Y, ce((D) => {
        const te = { ...D, [t]: Y };
        return e.columnResizingMode === "nextColumn" && C && K && (te[K] = Math.min(C.maxWidth ?? Number.MAX_SAFE_INTEGER, Math.max(C.minWidth ?? 48, W - (Y - h)))), te;
      });
    }, me = () => {
      var $;
      window.removeEventListener("pointermove", j), window.removeEventListener("pointerup", me), Kt(null), ($ = e.onColumnResized) == null || $.call(e, { column: a, field: t, previousWidth: h, width: F });
    };
    window.addEventListener("pointermove", j), window.addEventListener("pointerup", me);
  }, [R, A, e.allowColumnResizing, e.columnResizingMode, e.onColumnResized]), Ft = P((t) => {
    const i = R.find((C) => v(C) === t);
    if (!i) return;
    const a = T.slice(0, 100).map((C) => String(we(C, i) ?? "")), h = Math.max(String(i.caption ?? t).length, ...a.map((C) => C.length)), k = Math.min(i.maxWidth ?? 520, Math.max(i.minWidth ?? 64, h * 8 + 32));
    ce((C) => ({ ...C, [t]: k }));
  }, [R, T]), An = P((t, i) => {
    const a = T.findIndex((C) => X(C, _) === t), h = R.findIndex((C) => v(C) === i);
    if (a < 0 || h < 0) return;
    const k = { rowIndex: a, columnIndex: h, rowKey: t, field: i };
    f.setFocusedCell(k), requestAnimationFrame(() => {
      var C, K;
      return (K = (C = se.current) == null ? void 0 : C.querySelector(`[data-grid-row="${a}"][data-grid-column="${h}"]`)) == null ? void 0 : K.focus();
    });
  }, [T, R, _, f.setFocusedCell]), At = P(() => {
    var t;
    re !== null && de.current.has(re) && (Oe(Z.filter((i) => X(i, _) !== re)), le(ae.filter((i) => i.key !== re)), de.current.delete(re)), Re(), (t = e.onEditCanceled) == null || t.call(e);
  }, [re, Z, _, le, ae, Re, e.onEditCanceled]), st = {
    refresh: L.reload,
    reload: L.reload,
    repaint: () => {
      var t;
      return (t = se.current) == null ? void 0 : t.getBoundingClientRect();
    },
    selectRows: (t, i = !1) => oe(i ? [.../* @__PURE__ */ new Set([...f.selection, ...t])] : t),
    deselectRows: (t) => oe(f.selection.filter((i) => !t.includes(i))),
    selectAll: () => oe(Pe(g.selectAllMode === "page" ? T : L.rows)),
    deselectAll: () => oe([]),
    getSelectedRowKeys: () => f.selection,
    getSelectedRowsData: () => kn,
    getVisibleRows: () => T,
    getVisibleColumns: () => R,
    getRowIndexByKey: (t) => T.findIndex((i) => X(i, _) === t),
    getKeyByRowIndex: (t) => T[t] ? X(T[t], _) : void 0,
    pageIndex: (t) => (t !== void 0 && ot(t), t ?? f.pageIndex),
    pageSize: (t) => (t !== void 0 && Yt(t), t ?? f.pageSize),
    pageCount: () => Fe,
    totalCount: () => at,
    sort: (t) => {
      var i;
      return t && (f.setSort(t), (i = e.onSortingChanged) == null || i.call(e, t)), t ?? f.sort;
    },
    search: (t) => (t !== void 0 && Nt(t), t ?? f.search),
    filter: (t) => (t && Le(t), t ?? f.filters),
    clearFilter: () => {
      Le([]), Nt("");
    },
    group: (t) => (t && Qt(t), t ?? f.groups),
    expandAllGroups: () => nt(/* @__PURE__ */ new Set()),
    collapseAllGroups: () => {
      const t = gt(T, R, f.groups), i = [], a = (h) => h.forEach((k) => {
        i.push(k.id), a(k.children);
      });
      a(t), nt(new Set(i));
    },
    addRow: Ut,
    editRow: (t) => lt(t),
    editCell: (t, i) => {
      Et(t, i);
    },
    deleteRow: Jt,
    getChanges: () => ae,
    saveChanges: () => Ce(ae, Z),
    cancelChanges: Xt,
    autoFitColumn: Ft,
    autoFitColumns: () => R.forEach((t) => Ft(v(t))),
    fixColumn: (t, i = "left") => Zt(t, i),
    unfixColumn: (t) => Zt(t, null),
    showColumn: (t) => Dt(t, !0),
    hideColumn: (t) => Dt(t, !1),
    resetColumnLayout: en,
    navigateToCell: An,
    focus: () => {
      var t;
      return (t = se.current) == null ? void 0 : t.focus();
    },
    getDataSource: () => z
  };
  Mn(n, () => st), ye(() => {
    var t;
    et.current || (et.current = !0, (t = e.onInitialized) == null || t.call(e, st));
  }, [e.onInitialized]), ye(() => {
    var t;
    L.loading || (t = e.onContentReady) == null || t.call(e, st);
  }, [L.loading, T]);
  const $t = P((t) => {
    var a, h;
    f.setFocusedCell(t), (a = e.onFocusedCellChanged) == null || a.call(e, t);
    const i = T[t.rowIndex];
    i && ((h = e.onFocusedRowChanged) == null || h.call(e, { data: i, key: X(i, _), rowIndex: t.rowIndex }));
  }, [f.setFocusedCell, e.onFocusedCellChanged, e.onFocusedRowChanged, T, _]), dt = Number(Se) + Number(ke), Pt = Number(fe), He = R.length + dt + Pt, Xe = Se ? { position: "sticky", left: 0, zIndex: 4 } : void 0, Je = ke ? { position: "sticky", left: Se ? 44 : 0, zIndex: 4 } : void 0, Ye = fe ? { position: "sticky", right: 0, zIndex: 4 } : void 0, ct = ne(() => Xn(R, A, (Se ? 44 : 0) + (ke ? 60 : 0), fe ? 150 : 0), [R, A, Se, ke, fe]), Ie = ne(() => Jn(R), [R]), $n = (t) => {
    if (e.disabled || !R.length || !T.length || t.target.matches("input, select, textarea, button")) return;
    if ((t.ctrlKey || t.metaKey) && t.key.toLowerCase() === "a" && Ae === "multiple") {
      t.preventDefault(), st.selectAll();
      return;
    }
    const i = f.focusedCell ?? { rowIndex: 0, columnIndex: 0 };
    let a = i.rowIndex, h = i.columnIndex;
    if (t.key === "ArrowDown") a++;
    else if (t.key === "ArrowUp") a--;
    else if (t.key === "ArrowRight" || t.key === "Tab" && !t.shiftKey) h++;
    else if (t.key === "ArrowLeft" || t.key === "Tab" && t.shiftKey) h--;
    else if (t.key === "Home") h = 0;
    else if (t.key === "End") h = R.length - 1;
    else if (t.key === "PageDown") a += Math.max(1, Math.floor(T.length / 2));
    else if (t.key === "PageUp") a -= Math.max(1, Math.floor(T.length / 2));
    else if (t.key === " " && Ae !== "none") {
      t.preventDefault(), pt(a, t);
      return;
    } else return;
    t.preventDefault(), a = Math.max(0, Math.min(T.length - 1, a)), h = Math.max(0, Math.min(R.length - 1, h));
    const k = X(T[a], _), C = v(R[h]);
    $t({ rowIndex: a, columnIndex: h, rowKey: k, field: C }), requestAnimationFrame(() => {
      var K, W;
      return (W = (K = se.current) == null ? void 0 : K.querySelector(`[data-grid-row="${a}"][data-grid-column="${h}"]`)) == null ? void 0 : W.focus();
    });
  }, tn = (t, i) => {
    const a = X(t, _), h = re === a, k = de.current.has(a), C = h ? { ...t, ...ge } : t, K = new Set(R.filter(($) => $.allowEditing !== !1).map(v)), W = /* @__PURE__ */ new Set();
    h && H === "row" && K.forEach(($) => W.add($)), (J == null ? void 0 : J.key) === a && W.add(J.field);
    const F = ae.find(($) => $.key === a), j = new Set(Object.keys((F == null ? void 0 : F.data) ?? {})), me = N.paging || B ? f.pageIndex * f.pageSize + i : i;
    return /* @__PURE__ */ c(
      yi,
      {
        row: C,
        rowKey: a,
        rowIndex: i,
        absoluteRowIndex: me,
        columns: R,
        locale: O,
        selected: f.selection.includes(a),
        focusedCell: f.focusedCell,
        showSelection: Se,
        showRowNumber: ke,
        searchText: f.search,
        highlightSearchText: y.highlightSearchText === !0,
        editingFields: W,
        changedFields: j,
        errors: h ? Wt : {},
        saving: Be,
        showCommands: fe,
        canEdit: xt(t) && H !== "cell" && H !== "batch",
        canDelete: kt(t),
        rowEditing: h && H === "row",
        onValueChange: ($, ee) => {
          const Y = { ...ge, [$]: ee };
          je(Y), H === "batch" && k && Rt(a, { [$]: ee });
        },
        onCommitCell: () => void Ue(),
        onCancelCell: At,
        onEdit: () => lt(a),
        onSave: () => void Ht(),
        onCancel: At,
        onDelete: () => void Jt(a),
        commandTexts: { edit: $e.edit, delete: $e.delete, save: $e.save, cancel: $e.cancel },
        onSelect: () => pt(i, {}),
        onRowClick: ($) => {
          var ee;
          pt(i, $), (ee = e.onRowClick) == null || ee.call(e, { data: t, key: a, rowIndex: i, event: $ });
        },
        onRowDoubleClick: ($) => {
          var ee;
          return (ee = e.onRowDoubleClick) == null ? void 0 : ee.call(e, { data: t, key: a, rowIndex: i, event: $ });
        },
        onCellClick: ($, ee) => {
          var D;
          const Y = R[$];
          $t({ rowIndex: i, columnIndex: $, rowKey: a, field: v(Y) }), (D = e.onCellClick) == null || D.call(e, { data: t, key: a, rowIndex: i, column: Y, columnIndex: $, value: we(t, Y), event: ee }), (H === "cell" || H === "batch") && S.startEditAction !== "doubleClick" && Y.allowEditing !== !1 && Et(a, v(Y));
        },
        onCellDoubleClick: ($, ee) => {
          var D;
          const Y = R[$];
          (D = e.onCellDoubleClick) == null || D.call(e, { data: t, key: a, rowIndex: i, column: Y, columnIndex: $, value: we(t, Y), event: ee }), (H === "cell" || H === "batch") && Y.allowEditing !== !1 && Et(a, v(Y));
        },
        onCellFocus: ($) => $t({ rowIndex: i, columnIndex: $, rowKey: a, field: v(R[$]) }),
        columnStyles: ct,
        selectionStyle: Xe,
        rowNumberStyle: Je,
        commandStyle: Ye
      },
      a
    );
  }, Pn = gt(T, R, f.groups), nn = (t) => t.flatMap((i) => {
    const a = !_n.has(i.id), h = R.find((C) => v(C) === i.field), k = [
      /* @__PURE__ */ c(
        ii,
        {
          node: i,
          column: h,
          colSpan: He,
          expanded: a,
          collapsible: p.allowCollapsing !== !1,
          summaries: M.groupItems ?? [],
          onToggle: () => nt((C) => {
            const K = new Set(C);
            return K.has(i.id) ? K.delete(i.id) : K.add(i.id), K;
          })
        },
        `group-${i.id}`
      )
    ];
    return a && (i.children.length ? k.push(...nn(i.children)) : k.push(...i.rows.map((C) => tn(C, T.indexOf(C))))), k;
  });
  return e.visible === !1 ? null : /* @__PURE__ */ x(
    "div",
    {
      ref: se,
      role: "grid",
      "aria-rowcount": at,
      "aria-colcount": He,
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
      style: { width: zt(e.width), height: zt(e.height), minHeight: zt(e.minHeight), ...e.style },
      onKeyDown: $n,
      children: [
        (y.visible || G.visible || fe || E.enabled) && /* @__PURE__ */ x("div", { className: "tmiv-grid__toolbar", children: [
          fe && /* @__PURE__ */ x("div", { className: "tmiv-grid__editing-toolbar", children: [
            S.allowAdding === !0 && /* @__PURE__ */ x("button", { type: "button", disabled: Be || re !== null, onClick: Ut, children: [
              "＋ ",
              $e.add
            ] }),
            H === "batch" && /* @__PURE__ */ x(ze, { children: [
              /* @__PURE__ */ c("button", { type: "button", disabled: Be || !ae.length && J === null, onClick: () => void Rn(), children: $e.saveAll }),
              /* @__PURE__ */ c("button", { type: "button", disabled: Be || !ae.length && J === null, onClick: Xt, children: $e.cancelAll })
            ] }),
            Vt && /* @__PURE__ */ c("span", { role: "alert", className: "tmiv-grid__edit-error", children: Vt.message })
          ] }),
          G.visible && /* @__PURE__ */ c(
            ni,
            {
              columns: R,
              groups: f.groups,
              emptyText: G.emptyText ?? he.groupPanel,
              allowDragging: G.allowColumnDragging !== !1,
              onChange: Qt
            }
          ),
          y.visible && /* @__PURE__ */ c(ti, { config: y, value: f.search, onChange: Nt }),
          E.enabled && /* @__PURE__ */ c(
            Un,
            {
              config: E,
              columns: ue,
              visibleFields: new Set(ue.filter((t) => mt[v(t)] ?? t.visible !== !1).map(v)),
              buttonText: he.columns,
              resetText: he.resetColumns,
              onVisibilityChange: Dt,
              onOrderChange: tt,
              onReset: en
            }
          )
        ] }),
        (H === "form" || H === "popup") && re !== null && /* @__PURE__ */ c(
          oi,
          {
            row: ge,
            columns: R,
            errors: Wt,
            colCount: ((an = S.form) == null ? void 0 : an.colCount) ?? 2,
            title: H === "popup" ? ((ln = S.popup) == null ? void 0 : ln.title) ?? "Edit row" : void 0,
            saving: Be,
            popup: H === "popup",
            width: (on = S.popup) == null ? void 0 : on.width,
            onChange: (t, i) => je((a) => ({ ...a, [t]: i })),
            onSave: () => void Ht(),
            onCancel: At
          }
        ),
        /* @__PURE__ */ c("div", { className: "tmiv-grid__viewport", children: /* @__PURE__ */ x("table", { className: `tmiv-grid__table ${e.columnAutoWidth ? "tmiv-grid__table--auto" : ""}`, children: [
          /* @__PURE__ */ x("colgroup", { children: [
            Se && /* @__PURE__ */ c("col", { style: { width: 44 } }),
            ke && /* @__PURE__ */ c("col", { style: { width: 60 } }),
            R.map((t, i) => {
              const a = v(t);
              return /* @__PURE__ */ c("col", { style: { width: A[a] ?? t.width, minWidth: t.minWidth, maxWidth: t.maxWidth } }, a || i);
            }),
            fe && /* @__PURE__ */ c("col", { style: { width: 150 } })
          ] }),
          /* @__PURE__ */ x("thead", { className: "tmiv-grid__head", children: [
            Ie.map((t, i) => /* @__PURE__ */ x("tr", { role: "row", className: "tmiv-grid__band-row", children: [
              i === 0 && Se && /* @__PURE__ */ c("th", { rowSpan: Ie.length + 1, role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--selection tmiv-grid__cell--fixed-left", style: { ...Xe, zIndex: 7 }, children: /* @__PURE__ */ c(
                "input",
                {
                  type: "checkbox",
                  "aria-label": he.selectAll,
                  checked: T.length > 0 && Pe(T).every((a) => f.selection.includes(a)),
                  onChange: () => {
                    const a = Pe(T), h = a.every((k) => f.selection.includes(k));
                    oe(h ? f.selection.filter((k) => !a.includes(k)) : [.../* @__PURE__ */ new Set([...f.selection, ...a])]);
                  }
                }
              ) }),
              i === 0 && ke && /* @__PURE__ */ c("th", { rowSpan: Ie.length + 1, role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--row-number tmiv-grid__cell--fixed-left", style: { ...Je, zIndex: 7 }, children: "#" }),
              t.map((a, h) => /* @__PURE__ */ c("th", { colSpan: a.colSpan, role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--band", children: a.caption }, `${a.caption}-${h}`)),
              i === 0 && fe && /* @__PURE__ */ c("th", { rowSpan: Ie.length + 1, role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--commands tmiv-grid__cell--fixed-right", style: { ...Ye, zIndex: 7 }, children: "Actions" })
            ] }, `band-${i}`)),
            /* @__PURE__ */ x("tr", { role: "row", children: [
              !Ie.length && Se && /* @__PURE__ */ c("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--selection tmiv-grid__cell--fixed-left", style: { ...Xe, zIndex: 7 }, children: /* @__PURE__ */ c(
                "input",
                {
                  type: "checkbox",
                  "aria-label": he.selectAll,
                  checked: T.length > 0 && Pe(T).every((t) => f.selection.includes(t)),
                  onChange: () => {
                    const t = Pe(T), i = t.every((a) => f.selection.includes(a));
                    oe(i ? f.selection.filter((a) => !t.includes(a)) : [.../* @__PURE__ */ new Set([...f.selection, ...t])]);
                  }
                }
              ) }),
              !Ie.length && ke && /* @__PURE__ */ c("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--row-number tmiv-grid__cell--fixed-left", style: { ...Je, zIndex: 7 }, children: "#" }),
              R.map((t, i) => {
                var a;
                return /* @__PURE__ */ c(
                  qn,
                  {
                    column: { ...t, width: A[v(t)] ?? t.width },
                    columnIndex: i + dt,
                    sort: f.sort,
                    onSort: En,
                    rows: L.rows,
                    headerFilterVisible: b.visible === !0,
                    headerFilterSearchable: b.searchable !== !1,
                    headerFilterValues: ((a = f.filters.find((h) => h.field === v(t) && h.operator === "in")) == null ? void 0 : a.value) ?? [],
                    reorderable: e.allowColumnReordering === !0 && t.allowReordering !== !1,
                    dragEnabled: e.allowColumnReordering === !0 && t.allowReordering !== !1 || G.visible === !0 && G.allowColumnDragging !== !1 && t.allowGrouping !== !1,
                    dragging: Ve === v(t),
                    dropTarget: Cn === v(t),
                    onHeaderFilterChange: (h) => Nn(v(t), h),
                    onDragStart: () => wt(v(t)),
                    onDragEnd: () => {
                      wt(null), bt(null);
                    },
                    onDragOver: () => bt(v(t)),
                    onDrop: () => Dn(v(t)),
                    resizable: e.allowColumnResizing === !0 && t.allowResizing !== !1,
                    resizing: Sn === v(t),
                    layoutStyle: ct[v(t)],
                    onResizeStart: (h) => Fn(v(t), h),
                    onAutoFit: () => Ft(v(t))
                  },
                  v(t) || i
                );
              }),
              !Ie.length && fe && /* @__PURE__ */ c("th", { role: "columnheader", className: "tmiv-grid__header-cell tmiv-grid__header-cell--commands tmiv-grid__cell--fixed-right", style: { ...Ye, zIndex: 7 }, children: "Actions" })
            ] }),
            u.visible && /* @__PURE__ */ c(ei, { columns: R, filters: f.filters.filter((t) => t.operator !== "in"), columnOffset: dt, commandOffset: Pt, columnStyles: ct, offsetStyles: [Xe, Je].filter(Boolean), commandStyle: Ye, onChange: pn })
          ] }),
          /* @__PURE__ */ x("tbody", { className: "tmiv-grid__body", children: [
            L.loading && /* @__PURE__ */ c("tr", { role: "row", children: /* @__PURE__ */ c("td", { role: "gridcell", colSpan: He, className: "tmiv-grid__state", children: ((sn = e.loadingRender) == null ? void 0 : sn.call(e)) ?? he.loading }) }),
            !L.loading && L.error && /* @__PURE__ */ c("tr", { role: "row", children: /* @__PURE__ */ c("td", { role: "gridcell", colSpan: He, className: "tmiv-grid__state tmiv-grid__state--error", children: ((dn = e.errorRender) == null ? void 0 : dn.call(e, L.error, L.reload)) ?? /* @__PURE__ */ x(ze, { children: [
              /* @__PURE__ */ c("span", { children: L.error.message }),
              /* @__PURE__ */ c("button", { type: "button", onClick: () => void L.reload(), children: he.retry })
            ] }) }) }),
            !L.loading && !L.error && T.length === 0 && /* @__PURE__ */ c("tr", { role: "row", children: /* @__PURE__ */ c("td", { role: "gridcell", colSpan: He, className: "tmiv-grid__state", children: ((cn = e.noDataRender) == null ? void 0 : cn.call(e)) ?? he.noData }) }),
            !L.loading && !L.error && (f.groups.length ? nn(Pn) : T.map(tn))
          ] }),
          !!((gn = M.totalItems) != null && gn.length) && /* @__PURE__ */ c(wi, { rows: qe, columns: R, items: M.totalItems, columnOffset: dt, commandOffset: Pt, locale: O, columnStyles: ct, offsetStyles: [Xe, Je].filter(Boolean), commandStyle: Ye })
        ] }) }),
        B && w.visible !== !1 && /* @__PURE__ */ c(
          gi,
          {
            pageIndex: f.pageIndex,
            pageSize: f.pageSize,
            pageCount: Fe,
            totalCount: at,
            allowedPageSizes: w.allowedPageSizes ?? [10, 20, 50, 100],
            showPageSizeSelector: w.showPageSizeSelector !== !1,
            showNavigationButtons: w.showNavigationButtons !== !1,
            showInfo: w.showInfo !== !1,
            messages: he,
            onPageIndexChange: ot,
            onPageSizeChange: Yt
          }
        )
      ]
    }
  );
}
const Si = mn(vi);
function Ci(e, n) {
  var o, m;
  const { gridOption: r = {}, showSelectionCheckbox: d, ...l } = e, s = (e.columns ?? []).map((w) => ({
    ...w,
    field: w.field ?? w.dataField,
    allowSorting: w.allowSorting !== !1
  })), g = {
    ...r.selection ?? {},
    ...e.selection ?? {},
    showCheckBoxes: d ?? ((o = e.selection) == null ? void 0 : o.showCheckBoxes) ?? ((m = r.selection) == null ? void 0 : m.showCheckBoxes)
  };
  return /* @__PURE__ */ c(
    Si,
    {
      ...r,
      ...l,
      ref: n,
      dataSource: e.dataSource ?? e.rows ?? [],
      columns: s,
      selection: g,
      sorting: e.sorting ?? r.sorting ?? { mode: "multiple" },
      paging: e.paging ?? r.paging,
      pager: e.pager ?? r.pager
    }
  );
}
const Ri = mn(Ci);
class Ei {
  constructor(n, r = "id") {
    Qe(this, "key");
    Qe(this, "items");
    this.items = [...n], this.key = r;
  }
  async load(n) {
    return {
      data: this.items.slice(n.skip, n.skip + n.take),
      totalCount: this.items.length
    };
  }
  async byKey(n) {
    return this.items.find((r) => ie(r, String(this.key)) === n);
  }
  async insert(n) {
    const r = n;
    return this.items.push(r), r;
  }
  async update(n, r) {
    const d = this.items.findIndex((l) => ie(l, String(this.key)) === n);
    if (d < 0) throw new Error(`Row with key ${String(n)} was not found.`);
    return this.items[d] = { ...this.items[d], ...r }, this.items[d];
  }
  async remove(n) {
    this.items = this.items.filter((r) => ie(r, String(this.key)) !== n);
  }
}
class pi {
  constructor(n) {
    Qe(this, "key");
    Qe(this, "options");
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
  update(n, r) {
    return this.options.update ? this.options.update(n, r) : Promise.reject(new Error("Update is not supported by this data source."));
  }
  remove(n) {
    return this.options.remove ? this.options.remove(n) : Promise.reject(new Error("Remove is not supported by this data source."));
  }
}
export {
  Si as DataGrid,
  Ri as DxCompatibleDataGrid,
  Ei as GridArrayStore,
  pi as GridCustomStore
};
