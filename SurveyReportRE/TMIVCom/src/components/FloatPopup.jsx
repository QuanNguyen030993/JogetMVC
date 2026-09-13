import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { createPortal } from "react-dom";

const DEFAULT_OPTIONS = {
    visible: false,
    title: "",
    showTitle: true,
    showCloseButton: false,
    width: "80vw",
    height: "80vh",
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "calc(100vh - 32px)",
    shading: true,
    shadingColor: "rgba(15, 23, 42, .45)",
    hideOnOutsideClick: false,
    closeOnEscape: true,
    dragEnabled: false,
    resizeEnabled: false,
    restorePosition: true,
    enableBodyScroll: false,
    position: "center",
    rtlEnabled: false,
    animationDuration: 180,
    zIndex: 1500
};

const cssSize = (value) => typeof value === "number" ? `${value}px` : value;

const resolveElement = (value) => {
    if (!value || typeof document === "undefined") return null;
    if (value === window || value === document) return document.body;
    if (typeof value === "string") return document.querySelector(value);
    if (value.jquery) return value[0] || null;
    if (value.current) return value.current;
    return value instanceof Element ? value : null;
};

const splitPoint = (point, fallback) => {
    const values = String(point || fallback).trim().split(/\s+/);
    if (values.length === 1) {
        if (["top", "bottom"].includes(values[0])) return ["center", values[0]];
        return [values[0], "center"];
    }
    return [values[0], values[1]];
};

const coordinate = (start, size, alignment) => {
    if (["right", "bottom"].includes(alignment)) return start + size;
    if (alignment === "center") return start + size / 2;
    return start;
};

const selfOffset = (size, alignment) => {
    if (["right", "bottom"].includes(alignment)) return size;
    if (alignment === "center") return size / 2;
    return 0;
};

const parseOffset = (offset) => {
    if (Array.isArray(offset)) return [Number(offset[0]) || 0, Number(offset[1]) || 0];
    if (typeof offset === "string") {
        const [x, y] = offset.trim().split(/\s+/);
        return [Number(x) || 0, Number(y) || 0];
    }
    return [Number(offset?.x) || 0, Number(offset?.y) || 0];
};

const DomContent = ({ node }) => {
    const hostRef = useRef(null);

    useLayoutEffect(() => {
        if (!hostRef.current || !node) return undefined;
        const actualNode = node.jquery ? node[0] : node;
        if (!(actualNode instanceof Node)) return undefined;
        hostRef.current.appendChild(actualNode);
        return () => {
            if (actualNode.parentNode === hostRef.current) hostRef.current.removeChild(actualNode);
        };
    }, [node]);

    return <div ref={hostRef} className="tmivcom-floatpopup-dom-content" />;
};

const renderValue = (value) => {
    if (value === null || value === undefined || value === false) return null;
    if (React.isValidElement(value)) return value;
    if (typeof value === "string") {
        return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }
    if (typeof Node !== "undefined" && (value instanceof Node || value?.jquery)) {
        return <DomContent node={value} />;
    }
    return value;
};

const Toolbar = ({ items, location, component }) => {
    const visibleItems = (items || []).filter(
        (item) => item && item.visible !== false && (item.toolbar || "top") === location
    );
    if (!visibleItems.length) return null;

    return (
        <div className={`tmivcom-floatpopup-toolbar tmivcom-floatpopup-toolbar-${location}`}>
            {["before", "center", "after"].map((group) => (
                <div key={group} className={`tmivcom-floatpopup-toolbar-${group}`}>
                    {visibleItems.filter((item) => (item.location || "center") === group).map((item, index) => {
                        const key = item.name || `${group}-${index}`;
                        const click = (event) => {
                            item.onClick?.({ component, event, itemData: item });
                            item.options?.onClick?.({ component, event, itemData: item });
                        };
                        if (item.render || item.template) {
                            return <React.Fragment key={key}>{renderValue((item.render || item.template)({ component, itemData: item }))}</React.Fragment>;
                        }
                        return (
                            <button
                                key={key}
                                type="button"
                                className={`tmivcom-floatpopup-toolbar-button ${item.cssClass || ""}`.trim()}
                                disabled={item.disabled || item.options?.disabled}
                                title={item.options?.hint || item.hint}
                                onClick={click}
                            >
                                {(item.icon || item.options?.icon) && <span aria-hidden="true">{item.icon || item.options.icon}</span>}
                                {item.text ?? item.options?.text ?? item.name}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const FloatPopup = forwardRef((props, ref) => {
    const [options, setOptions] = useState(() => ({ ...DEFAULT_OPTIONS, ...props }));
    const [isVisible, setIsVisible] = useState(() => Boolean(props.visible ?? props.defaultVisible));
    const [manualPosition, setManualPosition] = useState(null);
    const popupRef = useRef(null);
    const contentRef = useRef(null);
    const previousFocusRef = useRef(null);
    const resizeStartRef = useRef(null);
    const apiRef = useRef(null);

    useEffect(() => {
        setOptions((current) => ({ ...current, ...props }));
    }, [props]);

    useEffect(() => {
        if (props.visible !== undefined) setIsVisible(Boolean(props.visible));
    }, [props.visible]);

    const eventArgs = useCallback((extra = {}) => ({
        component: apiRef.current,
        element: popupRef.current,
        ...extra
    }), []);

    const fireOptionChanged = useCallback((name, value, previousValue) => {
        options.onOptionChanged?.(eventArgs({
            name,
            fullName: name,
            value,
            previousValue
        }));
    }, [eventArgs, options]);

    const changeVisibility = useCallback((nextVisible, nativeEvent) => {
        if (nextVisible === isVisible) return Promise.resolve(nextVisible);
        const beforeName = nextVisible ? "onShowing" : "onHiding";
        const afterName = nextVisible ? "onShown" : "onHidden";
        const args = eventArgs({ cancel: false, event: nativeEvent });
        const result = options[beforeName]?.(args);
        if (args.cancel || result === false) return Promise.resolve(false);

        const previousValue = isVisible;
        setIsVisible(nextVisible);
        setOptions((current) => ({ ...current, visible: nextVisible }));
        options.onVisibleChange?.(nextVisible);
        options.onVisibilityChanged?.(eventArgs({ visible: nextVisible }));
        fireOptionChanged("visible", nextVisible, previousValue);

        if (!nextVisible && options.restorePosition) setManualPosition(null);

        return new Promise((resolve) => {
            const duration = Math.max(0, Number(options.animationDuration) || 0);
            setTimeout(() => {
                options[afterName]?.(eventArgs());
                resolve(nextVisible);
            }, duration);
        });
    }, [eventArgs, fireOptionChanged, isVisible, options]);

    const setOption = useCallback((name, value) => {
        if (name === "visible") return changeVisibility(Boolean(value));
        const previousValue = options[name];
        setOptions((current) => ({ ...current, [name]: value }));
        fireOptionChanged(name, value, previousValue);
        return value;
    }, [changeVisibility, fireOptionChanged, options]);

    const api = useMemo(() => ({
        show: () => changeVisibility(true),
        hide: () => changeVisibility(false),
        toggle: (showing) => changeVisibility(showing === undefined ? !isVisible : Boolean(showing)),
        option(name, value) {
            if (arguments.length === 0) return { ...options, visible: isVisible };
            if (typeof name === "object" && name) {
                Object.entries(name).forEach(([optionName, optionValue]) => setOption(optionName, optionValue));
                return this;
            }
            if (arguments.length === 1) return name === "visible" ? isVisible : options[name];
            setOption(name, value);
            return this;
        },
        content: () => contentRef.current,
        element: () => popupRef.current,
        repaint: () => {
            setManualPosition((current) => current ? { ...current } : current);
            return apiRef.current;
        },
        focus: () => popupRef.current?.focus()
    }), [changeVisibility, isVisible, options, setOption]);
    apiRef.current = api;
    useImperativeHandle(ref, () => api, [api]);

    const portalTarget = useMemo(() => {
        if (typeof document === "undefined") return null;
        return resolveElement(options.container) || document.body;
    }, [options.container]);

    useLayoutEffect(() => {
        if (!isVisible || !popupRef.current || manualPosition) return;
        const position = options.position;
        if (!position || typeof position === "string") return;

        const panelRect = popupRef.current.getBoundingClientRect();
        const target = resolveElement(position.of);
        const targetRect = target && target !== document.body
            ? target.getBoundingClientRect()
            : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const [atX, atY] = splitPoint(position.at, "center center");
        const [myX, myY] = splitPoint(position.my, "center center");
        const [offsetX, offsetY] = parseOffset(position.offset);
        const left = coordinate(targetRect.left, targetRect.width, atX) - selfOffset(panelRect.width, myX) + offsetX;
        const top = coordinate(targetRect.top, targetRect.height, atY) - selfOffset(panelRect.height, myY) + offsetY;
        setManualPosition({ left, top });
    }, [isVisible, manualPosition, options.position]);

    useEffect(() => {
        if (!isVisible || options.enableBodyScroll || typeof document === "undefined") return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previousOverflow; };
    }, [isVisible, options.enableBodyScroll]);

    useEffect(() => {
        if (!isVisible || !popupRef.current) return undefined;
        previousFocusRef.current = document.activeElement;
        popupRef.current.focus({ preventScroll: true });
        const onKeyDown = (event) => {
            if (event.key === "Escape" && options.closeOnEscape) {
                event.preventDefault();
                changeVisibility(false, event);
                return;
            }
            if (event.key !== "Tab") return;
            const focusable = popupRef.current?.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable?.length) {
                event.preventDefault();
                popupRef.current?.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            previousFocusRef.current?.focus?.({ preventScroll: true });
        };
    }, [changeVisibility, isVisible, options.closeOnEscape]);

    useEffect(() => {
        if (!isVisible || !options.resizeEnabled || !popupRef.current || typeof ResizeObserver === "undefined") return undefined;
        let initialized = false;
        const observer = new ResizeObserver((entries) => {
            if (!initialized) { initialized = true; return; }
            const size = entries[0]?.contentRect;
            options.onResize?.(eventArgs({ width: size?.width, height: size?.height }));
        });
        observer.observe(popupRef.current);
        return () => observer.disconnect();
    }, [eventArgs, isVisible, options]);

    const startDrag = (event) => {
        if (!options.dragEnabled || event.button !== 0 || event.target.closest("button")) return;
        const rect = popupRef.current.getBoundingClientRect();
        const start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
        setManualPosition({ left: rect.left, top: rect.top });
        options.onDragStart?.(eventArgs({ event }));
        const move = (moveEvent) => {
            const width = popupRef.current?.offsetWidth || rect.width;
            const height = popupRef.current?.offsetHeight || rect.height;
            const left = Math.min(Math.max(0, start.left + moveEvent.clientX - start.x), Math.max(0, window.innerWidth - width));
            const top = Math.min(Math.max(0, start.top + moveEvent.clientY - start.y), Math.max(0, window.innerHeight - height));
            setManualPosition({ left, top });
            options.onDrag?.(eventArgs({ event: moveEvent, left, top }));
        };
        const end = (upEvent) => {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", end);
            options.onDragEnd?.(eventArgs({ event: upEvent }));
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", end);
        event.preventDefault();
    };

    if (!isVisible || !portalTarget) return null;

    const positionName = typeof options.position === "string" ? options.position : "center";
    const titleValue = options.titleRender
        ? options.titleRender({ component: api })
        : options.titleTemplate
            ? options.titleTemplate({ component: api })
            : options.title;
    let bodyValue = props.children;
    if (bodyValue === undefined) {
        if (options.contentRender) bodyValue = options.contentRender({ component: api });
        else if (options.contentComponent) bodyValue = React.createElement(options.contentComponent, { component: api });
        else if (options.contentTemplate) bodyValue = options.contentTemplate({ component: api });
        else bodyValue = options.content;
    }

    const wrapperAttr = options.wrapperAttr || {};
    const elementAttr = options.elementAttr || {};
    const panelStyle = {
        width: options.fullScreen ? "100%" : cssSize(options.width),
        height: options.fullScreen ? "100%" : cssSize(options.height),
        minWidth: cssSize(options.minWidth),
        minHeight: cssSize(options.minHeight),
        maxWidth: options.fullScreen ? "100%" : cssSize(options.maxWidth),
        maxHeight: options.fullScreen ? "100%" : cssSize(options.maxHeight),
        resize: options.resizeEnabled && !options.fullScreen ? "both" : "none",
        ...(manualPosition ? { left: manualPosition.left, top: manualPosition.top, transform: "none" } : {}),
        ...elementAttr.style
    };

    return createPortal(
        <div
            {...wrapperAttr}
            className={`tmivcom-floatpopup-wrapper ${options.shading ? "tmivcom-floatpopup-shaded" : ""} ${wrapperAttr.className || ""}`.trim()}
            style={{
                "--tmivcom-floatpopup-duration": `${Math.max(0, Number(options.animationDuration) || 0)}ms`,
                background: options.shading ? options.shadingColor : "transparent",
                zIndex: options.zIndex,
                ...wrapperAttr.style
            }}
            onMouseDown={(event) => {
                if (event.target !== event.currentTarget) return;
                const rule = options.hideOnOutsideClick ?? options.closeOnOutsideClick;
                if (rule === true || (typeof rule === "function" && rule(event))) changeVisibility(false, event);
            }}
        >
            <div
                {...elementAttr}
                ref={popupRef}
                className={`tmivcom-floatpopup tmivcom-floatpopup-${positionName.replace(/\s+/g, "-")} ${options.fullScreen ? "tmivcom-floatpopup-fullscreen" : ""} ${options.rtlEnabled ? "tmivcom-floatpopup-rtl" : ""} ${elementAttr.className || ""}`.trim()}
                style={panelStyle}
                role="dialog"
                aria-modal={options.shading ? "true" : "false"}
                aria-label={!options.showTitle && typeof options.title === "string" ? options.title : undefined}
                aria-labelledby={options.showTitle ? "tmivcom-floatpopup-title" : undefined}
                tabIndex={-1}
                onPointerUp={(event) => {
                    if (resizeStartRef.current) {
                        options.onResizeEnd?.(eventArgs({ event }));
                        resizeStartRef.current = null;
                    }
                }}
                onPointerDown={(event) => {
                    const rect = popupRef.current.getBoundingClientRect();
                    if (options.resizeEnabled && event.clientX > rect.right - 18 && event.clientY > rect.bottom - 18) {
                        resizeStartRef.current = rect;
                        options.onResizeStart?.(eventArgs({ event }));
                    }
                }}
            >
                {options.showTitle && (
                    <div className={`tmivcom-floatpopup-titlebar ${options.dragEnabled ? "tmivcom-floatpopup-draggable" : ""}`} onPointerDown={startDrag}>
                        <div id="tmivcom-floatpopup-title" className="tmivcom-floatpopup-title">{renderValue(titleValue)}</div>
                        {options.showCloseButton && (
                            <button type="button" className="tmivcom-floatpopup-close" aria-label="Close" onClick={(event) => changeVisibility(false, event)}>×</button>
                        )}
                    </div>
                )}
                <Toolbar items={options.toolbarItems} location="top" component={api} />
                <div ref={contentRef} className="tmivcom-floatpopup-content">{renderValue(bodyValue)}</div>
                <Toolbar items={options.toolbarItems} location="bottom" component={api} />
            </div>
        </div>,
        portalTarget
    );
});

FloatPopup.displayName = "FloatPopup";

export default FloatPopup;
