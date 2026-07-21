import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { createRoot } from "react-dom/client";

/**
 * Single Toast Item component
 */
export const ToastItem = ({ toast, onClose }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [progress, setProgress] = useState(100);

    const {
        id,
        title,
        content = "",
        message = "",
        type = "info", // "success" | "warning" | "fail" | "error" | "info"
        duration = 4000,
        onClick,
        position = "bottom-right"
    } = toast;

    const htmlContent = content || message;
    const normalizedType = type === "fail" ? "error" : type;

    useEffect(() => {
        if (duration <= 0) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (elapsed >= duration) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 30);

        return () => clearInterval(interval);
    }, [duration]);

    const handleDismiss = (e) => {
        if (e) e.stopPropagation();
        setIsFadingOut(true);
        setTimeout(() => {
            onClose(id);
        }, 300);
    };

    const handleToastClick = (e) => {
        if (onClick && typeof onClick === "function") {
            onClick(toast, e);
        }
    };

    const getTheme = () => {
        switch (normalizedType) {
            case "success":
                return {
                    icon: "✓",
                    bg: "#f0fdf4",
                    border: "#22c55e",
                    color: "#15803d",
                    badgeBg: "#22c55e"
                };
            case "warning":
                return {
                    icon: "⚠️",
                    bg: "#fffbeb",
                    border: "#f59e0b",
                    color: "#b45309",
                    badgeBg: "#f59e0b"
                };
            case "error":
                return {
                    icon: "✕",
                    bg: "#fef2f2",
                    border: "#ef4444",
                    color: "#b91c1c",
                    badgeBg: "#ef4444"
                };
            case "info":
            default:
                return {
                    icon: "ℹ",
                    bg: "#eff6ff",
                    border: "#3b82f6",
                    color: "#1d4ed8",
                    badgeBg: "#3b82f6"
                };
        }
    };

    const theme = getTheme();

    return (
        <div
            className={`tmiv-toast-item ${isFadingOut ? "fade-out" : "fade-in"}`}
            onClick={handleToastClick}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minWidth: "300px",
                maxWidth: "450px",
                padding: "14px 18px",
                borderRadius: "10px",
                background: theme.bg,
                borderLeft: `5px solid ${theme.border}`,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                color: "#1e293b",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: isFadingOut ? 0 : 1,
                transform: isFadingOut ? "translateY(10px) scale(0.95)" : "translateY(0) scale(1)",
                pointerEvents: "auto",
                overflow: "hidden",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {/* Type Badge */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: theme.badgeBg,
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "bold",
                    flexShrink: 0,
                    marginTop: "2px"
                }}>
                    {theme.icon}
                </div>

                {/* Body Content */}
                <div style={{ flex: 1, paddingRight: "16px" }}>
                    {title && (
                        <div style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#0f172a",
                            marginBottom: htmlContent ? "4px" : "0"
                        }}>
                            {title}
                        </div>
                    )}
                    {htmlContent && (
                        <div
                            style={{
                                fontSize: "13px",
                                color: "#475569",
                                lineHeight: "1.4"
                            }}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    )}
                </div>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "0 4px",
                        lineHeight: 1,
                        marginLeft: "4px"
                    }}
                    onMouseEnter={(e) => e.target.style.color = "#475569"}
                    onMouseLeave={(e) => e.target.style.color = "#94a3b8"}
                >
                    ✕
                </button>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
                <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "3px",
                    width: `${progress}%`,
                    backgroundColor: theme.border,
                    transition: "width 30ms linear",
                    opacity: 0.8
                }} />
            )}
        </div>
    );
};

/**
 * Container component for multi-toast management
 */
export const ToastContainer = forwardRef((props, ref) => {
    const [toasts, setToasts] = useState([]);

    useImperativeHandle(ref, () => ({
        addToast(toastOptions) {
            const id = Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            const newToast = { id, ...toastOptions };
            setToasts((prev) => [...prev, newToast]);
            return id;
        },
        removeToast(id) {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        },
        clearAll() {
            setToasts([]);
        }
    }));

    const positions = {
        "top-right": toasts.filter(t => t.position === "top-right"),
        "top-left": toasts.filter(t => t.position === "top-left"),
        "top-center": toasts.filter(t => t.position === "top-center"),
        "bottom-left": toasts.filter(t => t.position === "bottom-left"),
        "bottom-center": toasts.filter(t => t.position === "bottom-center"),
        "bottom-right": toasts.filter(t => (!t.position || t.position === "bottom-right" || t.position === "right-bottom"))
    };

    const getPositionStyle = (pos) => {
        const baseStyle = {
            position: "fixed",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            pointerEvents: "none"
        };

        switch (pos) {
            case "top-left":
                return { ...baseStyle, top: "20px", left: "20px" };
            case "top-center":
                return { ...baseStyle, top: "20px", left: "50%", transform: "translateX(-50%)" };
            case "top-right":
                return { ...baseStyle, top: "20px", right: "20px" };
            case "bottom-left":
                return { ...baseStyle, bottom: "20px", left: "20px" };
            case "bottom-center":
                return { ...baseStyle, bottom: "20px", left: "50%", transform: "translateX(-50%)" };
            case "bottom-right":
            case "right-bottom":
            default:
                return { ...baseStyle, bottom: "20px", right: "20px" };
        }
    };

    const handleClose = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <>
            {Object.keys(positions).map((pos) => {
                const toastList = positions[pos];
                if (toastList.length === 0) return null;
                return (
                    <div key={pos} style={getPositionStyle(pos)}>
                        {toastList.map((toast) => (
                            <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
                        ))}
                    </div>
                );
            })}
        </>
    );
});

ToastContainer.displayName = "ToastContainer";

let globalToastRef = null;
let globalToastHost = null;
const pendingQueue = [];

export const notify = (optionsOrTitle, type = "info", duration = 4000) => {
    let opts = {};
    if (typeof optionsOrTitle === "string") {
        opts = {
            title: "",
            content: optionsOrTitle,
            type: type,
            duration: duration,
            position: "bottom-right"
        };
    } else if (typeof optionsOrTitle === "object") {
        opts = {
            position: "bottom-right",
            duration: 4000,
            type: "info",
            ...optionsOrTitle
        };
    }

    pendingQueue.push(opts);

    const flushQueue = () => {
        if (globalToastRef) {
            while (pendingQueue.length > 0) {
                const item = pendingQueue.shift();
                globalToastRef.addToast(item);
            }
        }
    };

    if (globalToastRef) {
        flushQueue();
    } else if (!globalToastHost) {
        globalToastHost = document.createElement("div");
        globalToastHost.id = "tmiv-toast-root";
        document.body.appendChild(globalToastHost);

        const root = createRoot(globalToastHost);
        const refCallback = (r) => {
            globalToastRef = r;
            flushQueue();
        };
        root.render(<ToastContainer ref={refCallback} />);
    } else {
        const checkInterval = setInterval(() => {
            if (globalToastRef) {
                clearInterval(checkInterval);
                flushQueue();
            }
        }, 30);
    }
};

export default { ToastContainer, ToastItem, notify };
