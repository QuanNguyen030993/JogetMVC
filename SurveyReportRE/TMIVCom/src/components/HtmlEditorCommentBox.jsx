import React, {
    useRef,
    useEffect,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    useState
} from "react";
import SelectBox from "./SelectBox.jsx";
import { createPortal } from "react-dom";




const RouteSelectBoxDropUp = ({
    value = "",
    onChange,
    dataSource = [],
    valueExpr = "id",
    displayExpr = "name",
    placeholder = "Select routing department..."
}) => {
    const triggerRef = useRef(null);
    const popupRef = useRef(null);
    const [opened, setOpened] = useState(false);
    const [popupStyle, setPopupStyle] = useState(null);

    const getValue = (item) => (
        typeof item === "object"
            ? (item?.[valueExpr] ?? item?.id ?? item?.key ?? "")
            : item
    );

    const getText = (item) => (
        typeof item === "object"
            ? (item?.[displayExpr] ?? item?.value ?? item?.name ?? "")
            : item
    );

    const selectedItem = (dataSource || []).find(
        item => String(getValue(item)) === String(value ?? "")
    );

    const selectedText = selectedItem
        ? getText(selectedItem)
        : "";

    const positionPopup = () => {
        const el = triggerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();

        setPopupStyle({
            position: "fixed",
            left: rect.left,
            bottom: window.innerHeight - rect.top + 4,
            width: rect.width,
            maxHeight: Math.min(260, Math.max(120, rect.top - 16)),
            overflowY: "auto",
            zIndex: 20001,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(15, 23, 42, .18)",
            boxSizing: "border-box"
        });
    };

    const toggle = () => {
        if (!opened) {
            positionPopup();
        }
        setOpened(prev => !prev);
    };

    useEffect(() => {
        if (!opened) return;

        const reposition = () => positionPopup();

        const handleOutside = (e) => {
            if (
                triggerRef.current?.contains(e.target) ||
                popupRef.current?.contains(e.target)
            ) {
                return;
            }
            setOpened(false);
        };

        document.addEventListener("mousedown", handleOutside, true);
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);

        return () => {
            document.removeEventListener("mousedown", handleOutside, true);
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [opened]);

    return (
        <>
            <div
                ref={triggerRef}
                className="tmiv-route-selectbox-dropup"
                onClick={toggle}
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "0 9px",
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    userSelect: "none",
                    fontSize: 13,
                    zIndex: 1
                }}
            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: selectedText ? "#0f172a" : "#94a3b8"
                    }}
                >
                    {selectedText || placeholder}
                </span>

                <i
                    className="fa fa-chevron-up"
                    style={{
                        flex: "0 0 auto",
                        fontSize: 10,
                        color: "#64748b",
                        transform: opened ? "rotate(180deg)" : "none",
                        transition: "transform .15s ease"
                    }}
                />
            </div>

            {opened && popupStyle && createPortal(
                <div
                    ref={popupRef}
                    className="tmiv-route-selectbox-popup drop-up"
                    style={popupStyle}
                >
                    {(dataSource || []).length === 0 ? (
                        <div
                            style={{
                                padding: "9px 10px",
                                color: "#94a3b8",
                                fontSize: 13
                            }}
                        >
                            No data
                        </div>
                    ) : (
                        (dataSource || []).map((item, index) => {
                            const itemValue = getValue(item);
                            const itemText = getText(item);
                            const selected =
                                String(itemValue) === String(value ?? "");

                            return (
                                <div
                                    key={`${String(itemValue)}_${index}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange?.(itemValue);
                                        setOpened(false);
                                    }}
                                    style={{
                                        padding: "8px 10px",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        background: selected ? "#eff6ff" : "#fff",
                                        color: selected ? "#2563eb" : "#0f172a",
                                        fontWeight: selected ? 600 : 400
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selected) {
                                            e.currentTarget.style.background = "#f8fafc";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            selected ? "#eff6ff" : "#fff";
                                    }}
                                >
                                    {itemText}
                                </div>
                            );
                        })
                    )}
                </div>,
                document.body
            )}
        </>
    );
};

const HtmlEditor = forwardRef(({
    value = "",
    height = 150,
    onChange,
    onFocus,
    onBlur,

    showSendButton = true,
    sendLabel = "Send Comment",
    sendIcon = "fa fa-paper-plane",
    onSendComment,

    // Route department
    departments = [],
    valueExpr = "id",
    displayExpr = "name",
    selectedDepartment = "",
    routePlaceholder = "Select routing department...",
    routeLabel = "Send message to:",

    // Comment context
    currentSection = "",
    currentDepartment = "",
    fromDepartment = "",
    authorName = "You",
    roleName = "Member",
    recordGuid = "",
    type = null,
    onItemsChange,
    onSubmit,
    items = [],
    submitUrl = "",

    // Route behavior:
    // true  => bắt buộc chọn phòng ban, nếu thiếu sẽ cảnh báo
    // false => nếu chưa chọn thì comment vào currentSection/currentDepartment
    requireDepartment = false,

    // Array of dxButton-like configs.
    customButtons = []
}, ref) => {

    const editorRef = useRef();
    const lastValueRef = useRef(null);
    const isComposingRef = useRef(false);

    const [actionButtons, setActionButtons] = useState(
        Array.isArray(customButtons) ? customButtons : []
    );

    const [comments, setComments] = useState(Array.isArray(items) ? items : []);

    useEffect(() => {
        setComments(Array.isArray(items) ? items : []);
    }, [items]);

    useEffect(() => {
        setActionButtons(Array.isArray(customButtons) ? customButtons : []);
    }, [customButtons]);

    const [selectedDeptId, setSelectedDeptId] = useState(selectedDepartment);
    const [departmentItems, setDepartmentItems] = useState(
        Array.isArray(departments) ? departments : []
    );

    useEffect(() => {
        setSelectedDeptId(selectedDepartment);
    }, [selectedDepartment]);

    useEffect(() => {
        setDepartmentItems(
            Array.isArray(departments) ? departments : []
        );
    }, [departments]);

    const getSelectedDeptName = () => {
        const found = (departmentItems || []).find(item => {
            const itemValue = typeof item === "object"
                ? (item?.[valueExpr] ?? item?.id ?? item?.key ?? "")
                : item;

            return String(itemValue) === String(selectedDeptId);
        });

        if (!found) return "";

        return typeof found === "object"
            ? (found?.[displayExpr] ?? found?.value ?? found?.name ?? "")
            : found;
    };

    const getCurrentValue = () => (
        showSource
            ? sourceHtml
            : (editorRef.current?.innerHTML ?? "")
    );


    const generateGuid = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16).toUpperCase();
        });
    };

    const formatDate = (date) => {
        const pad = (num, size = 2) => {
            let s = String(num);
            while (s.length < size) s = "0" + s;
            return s;
        };

        return [
            date.getFullYear(),
            "-",
            pad(date.getMonth() + 1),
            "-",
            pad(date.getDate()),
            " ",
            pad(date.getHours()),
            ":",
            pad(date.getMinutes()),
            ":",
            pad(date.getSeconds()),
            ".",
            pad(date.getMilliseconds(), 3),
            "0000"
        ].join("");
    };

    const resolveRoute = () => {
        if (selectedDeptId) {
            return {
                id: selectedDeptId,
                name: getSelectedDeptName()
            };
        }

        const fallbackName =
            currentSection ||
            currentDepartment ||
            fromDepartment ||
            "";

        return {
            id: fallbackName,
            name: fallbackName
        };
    };

    const postCommentToApi = async (commentData) => {
        if (!submitUrl) return null;

        const response = await fetch(submitUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(commentData)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        try {
            return await response.json();
        } catch {
            return null;
        }
    };

    const addComment = async (event = null) => {
        const htmlText = getCurrentValue();
        const textOnly = (htmlText || "")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/gi, " ")
            .trim();

        const hasMedia =
            /<img[\s>]/i.test(htmlText || "") ||
            /<iframe[\s>]/i.test(htmlText || "");

        if (!textOnly && !hasMedia) {
            alert("Please enter a comment!");
            return null;
        }

        if (requireDepartment && !selectedDeptId) {
            alert("Please select a routing department!");
            return null;
        }

        const route = resolveRoute();

        const now = new Date();
        const formattedDate = formatDate(now);
        const generatedGuid = generateGuid();

        const nextComment = {
            Id: Date.now(),
            RecordGuid: recordGuid,
            FromDepartment:
                fromDepartment ||
                currentDepartment ||
                currentSection ||
                "",
            ToDepartment: route.name || null,
            CurrentDepartment:
                currentDepartment ||
                currentSection ||
                "",
            Type: type || null,
            Content: htmlText,
            Guid: generatedGuid,
            CreatedDate: formattedDate,
            ModifiedDate: formattedDate,
            Author: authorName,

            // Legacy/UI aliases
            id: Date.now(),
            author: authorName,
            role:
                currentDepartment ||
                currentSection ||
                roleName,
            text: htmlText,
            time: now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),
            toDepartmentId: route.id || null,
            toDepartment: route.name || null
        };

        const nextComments = [nextComment, ...comments];

        setComments(nextComments);
        onItemsChange?.(nextComments);
        onSubmit?.(nextComment, nextComments);

        onSendComment?.({
            event,
            value: htmlText,
            html: htmlText,
            comment: nextComment,
            comments: nextComments,
            departmentId: route.id || null,
            departmentName: route.name || null,
            editor: editorRef.current,
            component: editorRef.current
        });

        try {
            await postCommentToApi(nextComment);
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Có lỗi xảy ra khi lưu dữ liệu!");
            return null;
        }

        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }

        setSourceHtml("");
        lastValueRef.current = "";
        onChange?.("");

        return nextComment;
    };

    const renderActionButton = (button, index) => {
        if (!button || button.visible === false) return null;

        const key = button.key ?? button.name ?? button.id ?? index;
        const text = button.text ?? button.label ?? button.name ?? "";

        if (typeof button.render === "function") {
            return (
                <React.Fragment key={key}>
                    {button.render({
                        button,
                        index,
                        value: getCurrentValue(),
                        editor: editorRef.current
                    })}
                </React.Fragment>
            );
        }

        return (
            <button
                key={key}
                type="button"
                className={[
                    "comment-custom-btn",
                    button.className || "",
                    button.type ? `dx-button-${button.type}` : "",
                    button.stylingMode ? `dx-button-mode-${button.stylingMode}` : ""
                ].filter(Boolean).join(" ")}
                disabled={!!button.disabled}
                title={button.hint || button.title || text}
                {...(button.elementAttr || {})}
                onClick={(event) => {
                    if (button.disabled) return;

                    button.onClick?.({
                        event,
                        value: getCurrentValue(),
                        button,
                        index,
                        editor: editorRef.current,
                        component: editorRef.current
                    });
                }}
                style={{
                    minHeight: 32,
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    background: "#fff",
                    padding: "6px 10px",
                    cursor: button.disabled ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    ...(button.style || {})
                }}
            >
                {button.icon && <i className={button.icon} />}
                {text}
            </button>
        );
    };

    // View Code mode
    const [showSource, setShowSource] = useState(false);
    const [sourceHtml, setSourceHtml] = useState(value ?? "");
    const [isFocused, setIsFocused] = useState(false);

    const handleFocusIn = (e) => {
        setIsFocused(true);

        onFocus?.({
            event: e,
            value: showSource
                ? sourceHtml
                : (editorRef.current?.innerHTML ?? ""),
            isFocused: true
        });
    };

    const handleFocusOut = (e) => {
        setIsFocused(false);

        const html = showSource
            ? sourceHtml
            : (editorRef.current?.innerHTML ?? "");

        onBlur?.({
            event: e,
            value: html,
            isFocused: false
        });
    };

    const [showCropper, setShowCropper] =
    useState(false);

const [imageSrc, setImageSrc] =
    useState("");

const selectedImageRef =
    useRef(null);


const [selectedImage, setSelectedImage] =
    useState(null);

const [imageRect, setImageRect] =
    useState(null);

const resizeState =
    useRef(null);


const change = () => {

    const html =
        editorRef.current.innerHTML;

    lastValueRef.current = html;

    onChange?.(html);
};

const cropImageRef =
    useRef(null);

const cropperRef =
    useRef(null);

    // const resizeState = useRef({
    //     active: false,
    //     startX: 0,
    //     startWidth: 0,
    //     startHeight: 0
    // });

   
    useLayoutEffect(() => {

        if (!editorRef.current)
            return;

        const nextValue = value ?? "";

        if (
            document.activeElement !==
            editorRef.current &&
            lastValueRef.current !== nextValue
        ) {

            editorRef.current.innerHTML =
                nextValue;
            lastValueRef.current = nextValue;
            setSourceHtml(nextValue);
        }
    }, [value]);


    const update = () => {

        if (!editorRef.current) return;

        const result =
            editorRef.current.innerHTML;

        lastValueRef.current = result;
        onChange?.(result);
    };

    const focusEditor = () => {
        editorRef.current?.focus();
    };

    const insertHtml = (html) => {
        focusEditor();
        document.execCommand(
            "insertHTML",
            false,
            html
        );
        update();
    };

    const command = (cmd, param = null) => {

        focusEditor();

        document.execCommand(
            cmd,
            false,
            param
        );

        update();
    };

    const startResizeTop = (e) => {

    e.preventDefault();
    e.stopPropagation();

    const img =
        selectedImageRef.current;

    resizeState.current = {
        type: "top",
        startY: e.clientY,
        startHeight: img.offsetHeight
    };
};
const startResize = e => {

    e.preventDefault();

    resizeState.current = {

        startX:
            e.clientX,
        startY:
            e.clientY,
        startWidth:
            imageRect.width,

        startHeight:
            imageRect.height
    };
};
const startResizeHorizontal = (e) => {

    e.preventDefault();
    e.stopPropagation();

    resizeState.current = {
        type: "horizontal",
        startX: e.clientX,
        startWidth: imageRect.width
    };
};

const startResizeVertical = (e) => {

    e.preventDefault();
    e.stopPropagation();

    const img = selectedImageRef.current;

    resizeState.current = {
        type: "vertical",
        startY: e.clientY,
        startHeight: img.offsetHeight,
        startWidth: img.offsetWidth
    };
};
const startResizeCorner = (e) => {

    e.preventDefault();
    e.stopPropagation();

    resizeState.current = {
        type: "corner",
        startX: e.clientX,
        startY: e.clientY,
        startWidth: imageRect.width,
        startHeight: imageRect.height
    };
};

useEffect(() => {

    const editor =
        editorRef.current;

    const click = e => {

        if (
            e.target.tagName === "IMG"
        ) {

            const rect =
                e.target.getBoundingClientRect();

            setSelectedImage(
                e.target
            );

            setImageRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        }
        else {

            setSelectedImage(null);

        }

    };

    editor.addEventListener(
        "click",
        click
    );

    return () =>
        editor.removeEventListener(
            "click",
            click
        );

}, []);
useEffect(() => {

    if (
        !showCropper ||
        !cropImageRef.current
    )
        return;

    cropperRef.current =
        new Cropper(
            cropImageRef.current,
            {
                viewMode: 1,
                autoCropArea: 1,
                responsive: true,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true
            }
        );

    return () => {

        cropperRef.current?.destroy();

        cropperRef.current = null;
    };

}, [showCropper]);
// useEffect(() => {

//     const move = (e) => {

//         if (!resizeState.current.active)
//             return;

//         const deltaX =
//             e.clientX -
//             resizeState.current.startX;

//         const width =
//             Math.max(
//                 50,
//                 resizeState.current.startWidth +
//                 deltaX
//             );

//         const ratio =
//             resizeState.current.startHeight /
//             resizeState.current.startWidth;

//         const height =
//             Math.round(width * ratio);

//         const img =
//             selectedImage?.element;

//         if (!img)
//             return;

//         img.style.width =
//             width + "px";

//         img.style.height =
//             height + "px";

//         const rect =
//             img.getBoundingClientRect();

//         setSelectedImage({
//             element: img,
//             width,
//             height,
//             x:
//                 rect.left +
//                 window.scrollX,
//             y:
//                 rect.top +
//                 window.scrollY
//         });
//     };

//     const up = () => {

//         if (
//             resizeState.current.active
//         ) {

//             resizeState.current.active =
//                 false;

//             change();
//         }
//     };

//     document.addEventListener(
//         "mousemove",
//         move
//     );

//     document.addEventListener(
//         "mouseup",
//         up
//     );

//     return () => {

//         document.removeEventListener(
//             "mousemove",
//             move
//         );

//         document.removeEventListener(
//             "mouseup",
//             up
//         );

//     };

// }, [selectedImage]);

useEffect(() => {

    const move = e => {

        if (
            !resizeState.current ||
            !selectedImage
        )
            return;

        const img = selectedImage;

        if (resizeState.current.type === "horizontal") {
            const deltaX =
                e.clientX -
                resizeState.current.startX;

            const width =
                Math.max(
                    20,
                    resizeState.current.startWidth +
                    deltaX
                );

            img.style.width =
                width + "px";
        }
        else if (
            resizeState.current.type ===
            "vertical"
        ) {
            const deltaY =
                e.clientY -
                resizeState.current.startY;

            const height =
                Math.max(
                    20,
                    resizeState.current.startHeight +
                    deltaY
                );

            img.style.height =
                height + "px";
        }
        else if (
            resizeState.current.type ===
            "corner"
        ) {
            const deltaX =
                e.clientX -
                resizeState.current.startX;

            const deltaY =
                e.clientY -
                resizeState.current.startY;

            const width =
                Math.max(
                    20,
                    resizeState.current.startWidth +
                    deltaX
                );

            const height =
                Math.max(
                    20,
                    resizeState.current.startHeight +
                    deltaY
                );

            img.style.width =
                width + "px";
            img.style.height =
                height + "px";
        }
        else {
            return;
        }

        const rect =
            img.getBoundingClientRect();

        setImageRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        });
    };

    const up = () => {

        resizeState.current =
            null;

        change();
    };

    document.addEventListener(
        "mousemove",
        move
    );

    document.addEventListener(
        "mouseup",
        up
    );

    return () => {

        document.removeEventListener(
            "mousemove",
            move
        );

        document.removeEventListener(
            "mouseup",
            up
        );

    };

}, [selectedImage]);

const [rotationDegrees, setRotationDegrees] =
        useState(0);

    const rotateImage = (direction) => {

        if (!selectedImage)
            return;

        const current =
            parseInt(
                selectedImage.dataset.rotation ||
                "0",
                10
            );

        const next =
            (current + direction + 360) %
            360;

        selectedImage.dataset.rotation =
            next;
        selectedImage.style.transform =
            `rotate(${next}deg)`;
        setRotationDegrees(next);

        const rect =
            selectedImage.getBoundingClientRect();

        setImageRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        });

        change();
    };

    const setImageRotation = (degrees) => {
        if (!selectedImage) return;

        const next =
            ((degrees % 360) + 360) % 360;

        selectedImage.dataset.rotation =
            next;
        selectedImage.style.transform =
            `rotate(${next}deg)`;
        setRotationDegrees(next);

        const rect =
            selectedImage.getBoundingClientRect();

        setImageRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        });

        change();
    };

    const rotateLeft = () => rotateImage(-90);
    const rotateRight = () => rotateImage(90);

    const zoomIn = () => {

    cropperRef.current?.zoom(
        0.1
    );

};

const zoomOut = () => {

    cropperRef.current?.zoom(
        -0.1
    );

};
const applyCrop = () => {

    if (
        !cropperRef.current
    )
        return;

    const canvas =
        cropperRef.current
            .getCroppedCanvas();

    const base64 =
        canvas.toDataURL(
            "image/png"
        );

    if (
        selectedImageRef.current
    ) {

        selectedImageRef.current.src =
            base64;

    }

    change();

    setShowCropper(false);
};

const cancelCrop = () => {

    setShowCropper(false);

};
useEffect(() => {

    const editor = editorRef.current;

    if (!editor) return;

    const handleClick = (e) => {

        editor
            .querySelectorAll("img")
            .forEach(img =>
                img.classList.remove(
                    "tmiv-selected-image"
                )
            );

        if (e.target.tagName === "IMG") {

            const img = e.target;

            img.classList.add(
                "tmiv-selected-image"
            );

            const rect =
                img.getBoundingClientRect();

            selectedImageRef.current = img;
            setSelectedImage(img);
            setImageRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        }
        else {
            selectedImageRef.current = null;
            setSelectedImage(null);
            setImageRect(null);
        }
    };

    editor.addEventListener(
        "click",
        handleClick
    );

    return () =>
        editor.removeEventListener(
            "click",
            handleClick
        );

}, []);
    const toggleSourceView = () => {
        if (!showSource) {
            // Editor vẫn mounted, chỉ lấy HTML hiện tại đưa sang source view.
            const html = editorRef.current?.innerHTML ?? lastValueRef.current ?? "";
            setSourceHtml(html);
            lastValueRef.current = html;
            setShowSource(true);
            return;
        }

        // Editor không bị unmount khi ở source mode nên ref luôn còn tồn tại.
        // Chỉ restore DOM đúng 1 lần khi quay lại visual editor.
        const html = sourceHtml ?? "";

        if (editorRef.current && editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }

        lastValueRef.current = html;
        onChange?.(html);
        setShowSource(false);
    };

    useImperativeHandle(ref, () => ({
        option(name, value) {
            switch (name) {
                case "value":
                    if (arguments.length === 1) {
                        return getCurrentValue();
                    }

                    if (editorRef.current) {
                        editorRef.current.innerHTML = value ?? "";
                        lastValueRef.current = editorRef.current.innerHTML;
                    }

                    setSourceHtml(value ?? "");
                    onChange?.(value ?? "");
                    return;

                case "buttons":
                case "customButtons":
                    if (arguments.length === 1) {
                        return actionButtons;
                    }

                    setActionButtons(Array.isArray(value) ? value : []);
                    return;

                case "selectedDepartment":
                    if (arguments.length === 1) {
                        return selectedDeptId;
                    }

                    setSelectedDeptId(value ?? "");
                    return;

                case "departments":
                    if (arguments.length === 1) {
                        return departmentItems;
                    }

                    setDepartmentItems(
                        Array.isArray(value) ? value : []
                    );
                    return;

                default:
                    return undefined;
            }
        },

        value() {
            return {
                text: getCurrentValue(),
                departmentId: selectedDeptId,
                departmentName: getSelectedDeptName()
            };
        },

        focus() {
            focusEditor();
        },

        buttons: {
            get() {
                return actionButtons;
            },

            set(items) {
                setActionButtons(Array.isArray(items) ? items : []);
            },

            push(...items) {
                setActionButtons(prev => [...prev, ...items]);
            },

            unshift(...items) {
                setActionButtons(prev => [...items, ...prev]);
            },

            pop() {
                setActionButtons(prev => prev.slice(0, -1));
            },

            shift() {
                setActionButtons(prev => prev.slice(1));
            },

            splice(start, deleteCount, ...items) {
                setActionButtons(prev => {
                    const next = [...prev];
                    next.splice(start, deleteCount, ...items);
                    return next;
                });
            },

            remove(nameOrPredicate) {
                setActionButtons(prev => prev.filter((button, index) => {
                    if (typeof nameOrPredicate === "function") {
                        return !nameOrPredicate(button, index);
                    }

                    const key = button?.name ?? button?.key ?? button?.id;
                    return String(key) !== String(nameOrPredicate);
                }));
            },

            clear() {
                setActionButtons([]);
            }
        },

        setDepartments(items) {
            const next = Array.isArray(items) ? items : [];
            setDepartmentItems(next);
            return next;
        },

        getDepartments() {
            return departmentItems;
        },

        addComment(event = null) {
            return addComment(event);
        },

        addButton(button, position = "push") {
            if (position === "unshift") {
                setActionButtons(prev => [button, ...prev]);
            } else {
                setActionButtons(prev => [...prev, button]);
            }
        },

        removeButton(nameOrPredicate) {
            setActionButtons(prev => prev.filter((button, index) => {
                if (typeof nameOrPredicate === "function") {
                    return !nameOrPredicate(button, index);
                }

                const key = button?.name ?? button?.key ?? button?.id;
                return String(key) !== String(nameOrPredicate);
            }));
        }
    }));

    return (
        <div className="jira-comment-box">
            <div className="jira-comment-editor-wrap">

                <div className="tmiv-html-editor-route">

                    <div className="tmiv-html-toolbar">

    <div
        className="tmiv-tool-item"
        onClick={() => command("undo")}
    >
        ↶
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("redo")}
    >
        ↷
    </div>

    <div className="tmiv-toolbar-separator" />

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "fontName",
                e.target.value
            )
        }
    >
         <option value="Asap">
            Asap
        </option>
        <option value="Arial">
            Arial
        </option>

        <option value="Tahoma">
            Tahoma
        </option>

        <option value="Verdana">
            Verdana
        </option>

        <option value="Times New Roman">
            Times
        </option>
    </select>

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "fontSize",
                e.target.value
            )
        }
    >
        <option value="1">8</option>
        <option value="2">10</option>
        <option value="3">12</option>
        <option value="4">16</option>
        <option value="5">24</option>
        <option value="6">32</option>
        <option value="7">48</option>
    </select>

    <div className="tmiv-toolbar-separator" />

    <select
        className="tmiv-select"
        onChange={e =>
            command(
                "formatBlock",
                e.target.value
            )
        }
    >
        <option value="p">
            Normal
        </option>

        <option value="h1">
            H1
        </option>

        <option value="h2">
            H2
        </option>

        <option value="h3">
            H3
        </option>

        <option value="blockquote">
            Quote
        </option>
    </select>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => command("bold")}
    >
        <b>B</b>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("italic")}
    >
        <i>I</i>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("underline")}
    >
        <u>U</u>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("strikeThrough")}
    >
        <s>S</s>
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("superscript")}
    >
        x²
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() => command("subscript")}
    >
        x₂
    </div>

    <div className="tmiv-toolbar-separator" />

    <input
        type="color"
        title="Text Color"
        onChange={e =>
            command(
                "foreColor",
                e.target.value
            )
        }
    />

    <input
        type="color"
        title="Background Color"
        onChange={e =>
            command(
                "hiliteColor",
                e.target.value
            )
        }
    />

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item fa fa-align-left"
        onClick={() => command("justifyLeft")}
    />

    <div
        className="tmiv-tool-item fa fa-align-center"
        onClick={() => command("justifyCenter")}
    />

    <div
        className="tmiv-tool-item fa fa-align-right"
        onClick={() => command("justifyRight")}
    />

    <div
        className="tmiv-tool-item"
        onClick={() => command("justifyFull")}
    >
        J
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("insertUnorderedList")
        }
    >
        •
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("insertOrderedList")
        }
    >
        1.
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("indent")
        }
    >
        ⇥
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("outdent")
        }
    >
        ⇤
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => {
            const url = prompt("URL");

            if (url) {
                command(
                    "createLink",
                    url
                );
            }
        }}
    >
        🔗
    </div>

   
        <div
            className="tmiv-tool-item"
            onClick={() => {

                const url =
                    prompt("Image URL");

                if (!url) return;

                insertHtml(
                    `<img src="${url}" style="max-width:100%; height:auto;"/>`
                );
            }}
        >
            🖼️
        </div>

        <div
            className="tmiv-tool-item"
            onClick={rotateLeft}
            title="Rotate selected image left"
        >
            ⟲
        </div>

        <div
            className="tmiv-tool-item"
            onClick={rotateRight}
            title="Rotate selected image right"
        >
            ⟳
        </div>

        <div className="tmiv-tool-item">
            <input
                type="number"
                value={rotationDegrees}
                onChange={(e) =>
                    setRotationDegrees(
                        Number(e.target.value)
                    )
                }
                onBlur={() =>
                    setImageRotation(rotationDegrees)
                }
                style={{
                    width: 56,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: "2px 4px",
                    fontSize: 12,
                    marginRight: 4,
                    height: 26
                }}
                title="Rotate selected image degree"
            />
            <button
                type="button"
                onClick={() => setImageRotation(rotationDegrees)}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 12,
                    cursor: "pointer"
                }}
            >
                ↻
            </button>
        </div>

    <div
        className="tmiv-tool-item"
        onClick={() => {

            insertHtml(`
                <table border="1" style="border-collapse:collapse;width:100%">
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                </table>
                `);
        }}
    >
        ⊞
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className="tmiv-tool-item"
        onClick={() => {

            const text =
                window
                    .getSelection()
                    ?.toString() || "";

            document.execCommand(
                "insertHTML",
                false,
                `<pre><code>${text}</code></pre>`
            );

            change();
        }}
    >
        {"</>"}
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command(
                "insertHorizontalRule"
            )
        }
    >
        ─
    </div>

    <div className="tmiv-toolbar-separator" />

    <div
        className={`tmiv-tool-item ${showSource ? "is-active" : ""}`}
        onClick={toggleSourceView}
        title={showSource ? "Back to editor" : "View / edit HTML source"}
    >
        {"</>"}
    </div>

    <div
        className="tmiv-tool-item"
        onClick={() =>
            command("removeFormat")
        }
    >
        Tx
    </div>

</div>

                    {showSource && (
                        <textarea
                            className={`tmiv-html-source ${isFocused ? "is-focused" : ""}`}
                            value={sourceHtml}
                            onFocus={handleFocusIn}
                            onBlur={handleFocusOut}
                            onChange={(e) => {
                                const html = e.target.value;
                                setSourceHtml(html);
                                lastValueRef.current = html;
                                onChange?.(html);
                            }}
                            spellCheck={false}
                            style={{
                                minHeight: height,
                                width: "100%",
                                boxSizing: "border-box",
                                resize: "vertical",
                                padding: 12,
                                border: "none",
                                outline: "none",
                                fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                                fontSize: 13,
                                lineHeight: 1.5,
                                whiteSpace: "pre",
                                overflow: "auto"
                            }}
                        />
                    )}

                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={handleFocusIn}
                        onBlur={handleFocusOut}
                        onCompositionStart={() => {
                            isComposingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            isComposingRef.current = false;
                            update();
                        }}
                        onInput={() => {
                            if (!isComposingRef.current) {
                                update();
                            }
                        }}
                        className={`tmiv-html-content ${isFocused ? "is-focused" : ""}`}
                        style={{
                            minHeight: height,
                            height: height,
                            display: showSource ? "none" : "block",
                            resize: "vertical",
                            overflow: "auto",
                            boxSizing: "border-box"
                        }}
                    />

                    {!showSource && selectedImage && imageRect && (
                        <div
                            className="tmiv-image-overlay"
                            style={{
                                left: imageRect.left,
                                top: imageRect.top,
                                width: imageRect.width,
                                height: imageRect.height
                            }}
                        >
                            <div
                                className="resize-r"
                                onMouseDown={startResizeHorizontal}
                            />
                            <div
                                className="resize-b"
                                onMouseDown={startResizeVertical}
                            />
                            <div
                                className="resize-br"
                                onMouseDown={startResizeCorner}
                            />
                            <div className="size-label">
                                {Math.round(imageRect.width)} x {Math.round(imageRect.height)}
                            </div>
                        </div>
                    )}

                    <div
                        className="comment-editor-actions"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                            gap: 8,
                            paddingTop: 10,
                            marginTop: 8,
                            borderTop: "1px solid #e2e8f0"
                        }}
                    >
                        <div
                            className="comment-custom-buttons"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8
                            }}
                        >
                            {actionButtons.map(renderActionButton)}
                        </div>

                        <div
                            className="comment-route-actions"
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 8,
                                flexWrap: "nowrap"
                            }}
                        >
                            <div
                                className="comment-route-wrap"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 8
                                }}
                            >
                                {routeLabel && (
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 13,
                                            color: "#475569",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {routeLabel}
                                    </span>
                                )}

                                <div style={{ width: 200, minWidth: 160 }}>
                                    <RouteSelectBoxDropUp
                                        value={selectedDeptId}
                                        onChange={setSelectedDeptId}
                                        dataSource={departmentItems}
                                        valueExpr={valueExpr}
                                        displayExpr={displayExpr}
                                        placeholder={routePlaceholder}
                                    />
                                </div>
                            </div>

                            {showSendButton && (
                                <button
                                    type="button"
                                    className="comment-send-btn"
                                    title={sendLabel || "Send"}
                                    onClick={addComment}
                                    style={{
                                        position: "static",
                                        width: 30,
                                        minWidth: 30,
                                        height: 30,
                                        minHeight: 30,
                                        border: "none",
                                        borderRadius: 6,
                                        background: "#2563eb",
                                        color: "#fff",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                        margin: 0,
                                        fontSize: 13,
                                        lineHeight: 1,
                                        flex: "0 0 30px"
                                    }}
                                >
                                    <i className={sendIcon || "fa fa-paper-plane"} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

     

            </div>
        </div>
    );
});

export default HtmlEditor;


// import React, {
//     useRef,
//     useState,
//     useEffect
// } from "react";
// import { createRoot } from "react-dom/client";

// function HtmlEditor({
//     value = "",
//     height = 300,
//     onChange
// }) {

// const editorRef = useRef();


//     const [html,setHtml] =
//         useState(value);



//     useEffect(()=>{

//         setHtml(value);

//     },[value]);



//     const command=(cmd,param=null)=>{


//         editorRef.current.focus();


//         document.execCommand(
//             cmd,
//             false,
//             param
//         );


//         update();


//     };



//     const update=()=>{


//         let result =
//             editorRef.current.innerHTML;


//         setHtml(result);


//         onChange?.(result);

//     };


//     const change = () => {

//         let html = editorRef.current.innerHTML;

//         onChange?.(html);
//     };


//     return (
// <div className="jira-comment-box">
// <div className="jira-comment-editor-wrap">


//         <div className="tmiv-html-editor">

// <div className="tmiv-html-toolbar">

//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("undo")}
//     >
//         ↶
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("redo")}
//     >
//         ↷
//     </div>


//     <div className="tmiv-toolbar-separator"/>


//     <select
//         className="tmiv-select"
//         onChange={
//             e=>command(
//                 "formatBlock",
//                 e.target.value
//             )
//         }
//     >
//         <option value="p">
//             Normal
//         </option>

//         <option value="h1">
//             Heading 1
//         </option>

//         <option value="h2">
//             Heading 2
//         </option>

//     </select>



//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("bold")}
//     >
//         <b>B</b>
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("italic")}
//     >
//         <i>I</i>
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>command("underline")}
//     >
//         <u>U</u>
//     </div>



//     <div className="tmiv-toolbar-separator"/>



//     <div
//         className="tmiv-tool-item fa fa-align-left"
//         onClick={()=>command("justifyLeft")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item fa fa-align-center"
//         onClick={()=>command("justifyCenter")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item fa fa-align-right"
//         onClick={()=>command("justifyRight")}
//     >
        
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>
//             command("insertUnorderedList")
//         }
//     >
//         •
//     </div>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>
//             command("insertOrderedList")
//         }
//     >
//         1.
//     </div>



//     <div className="tmiv-toolbar-separator"/>


//     <div
//         className="tmiv-tool-item"
//         onClick={()=>{
//             let url=prompt("URL");

//             if(url)
//                 command(
//                     "createLink",
//                     url
//                 );
//         }}
//     >
//         🔗
//     </div>

// </div>





//             <div 

//                 ref={editorRef}

//                 contentEditable

//                 suppressContentEditableWarning


//                 dangerouslySetInnerHTML={{
//                     __html:value
//                 }}


//                 onInput={change}


//                 className="tmiv-html-content"


//                 style={{
//                     minHeight: "150px"
//                 }}

//             />

//         </div>
// </div>
// </div>
//     );

// }

// export default HtmlEditor;  

