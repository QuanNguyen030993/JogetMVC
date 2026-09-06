export const buildPlaceholderToken = (type = "data", rawFieldName = "FieldName") => {
    const fieldName = String(rawFieldName || "FieldName").trim() || "FieldName";
    if (type === "editor") return `{{${fieldName}}}`;
    if (type === "position") return `{${fieldName.replace(/\D/g, "") || "0"}}`;
    if (type === "special") return `<${fieldName.replace(/^<|>$/g, "")}>`;
    return `@@${fieldName.replace(/^@@/, "")}`;
};

export const registerTemplatePlaceholder = (editor) => {
    if (!editor || editor.DomComponents.getType("tmiv-placeholder")) return;

    editor.DomComponents.addType("tmiv-placeholder", {
        isComponent: (element) => {
            if (!element?.getAttribute?.("data-placeholder-field")) return false;
            return {
                type: "tmiv-placeholder",
                fieldName: element.getAttribute("data-placeholder-field") || "FieldName",
                placeholderType: element.getAttribute("data-placeholder-type") || "data"
            };
        },
        model: {
            defaults: {
                tagName: "span",
                fieldName: "FieldName",
                placeholderType: "data",
                draggable: true,
                droppable: false,
                editable: false,
                attributes: {
                    class: "tmiv-placeholder",
                    "data-placeholder-field": "FieldName",
                    "data-placeholder-type": "data"
                }
            },
            init() {
                const attributes = this.getAttributes();
                this.set({
                    fieldName: attributes["data-placeholder-field"] || this.get("fieldName") || "FieldName",
                    placeholderType: attributes["data-placeholder-type"] || this.get("placeholderType") || "data"
                }, { silent: true });
                this.on("change:fieldName change:placeholderType", this.updatePlaceholderToken);
                this.updatePlaceholderToken();
            },
            updatePlaceholderToken() {
                const fieldName = this.get("fieldName") || "FieldName";
                const placeholderType = this.get("placeholderType") || "data";
                this.addAttributes({
                    class: "tmiv-placeholder",
                    "data-placeholder-field": fieldName,
                    "data-placeholder-type": placeholderType
                });
                this.components(buildPlaceholderToken(placeholderType, fieldName));
            }
        }
    });

    editor.BlockManager.add("tmiv-placeholder-block", {
        label: "Placeholder",
        category: "Basic",
        content: { type: "tmiv-placeholder" },
        attributes: { title: "Kéo vào dòng chữ, sau đó chọn để nhập field" }
    });
};

export const serializeTemplateContent = (sourceHtml, wrapperSelector) => {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(String(sourceHtml || ""), "text/html");
    const root = documentNode.querySelector(wrapperSelector) || documentNode.body;
    const tokens = [];

    root.querySelectorAll("[data-placeholder-field]").forEach((element, index) => {
        const token = buildPlaceholderToken(
            element.getAttribute("data-placeholder-type") || "data",
            element.getAttribute("data-placeholder-field") || "FieldName"
        );
        const marker = `__TMIV_PLACEHOLDER_${index}__`;
        tokens.push({ marker, token });
        element.replaceWith(documentNode.createTextNode(marker));
    });

    let html = root.innerHTML;
    const clearRoot = root.cloneNode(true);
    clearRoot.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
    clearRoot.querySelectorAll("p,div,h1,h2,h3,h4,h5,h6,li,tr").forEach((element) => element.append("\n"));
    let clearContent = clearRoot.textContent || "";

    tokens.forEach(({ marker, token }) => {
        html = html.split(marker).join(token);
        clearContent = clearContent.split(marker).join(token);
    });

    clearContent = clearContent.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return { html, clearContent };
};
