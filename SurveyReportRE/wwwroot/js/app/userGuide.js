(function (window, document) {
    "use strict";

    const STORAGE_KEY = "tmiv.user-guides.v1";
    const VALID_PLACEMENTS = ["auto", "top", "right", "bottom", "left", "center"];
    let activeTour = null;
    let activeDriver = null;
    let studioState = null;
    let capturedElement = null;
    let repositionFrame = null;

    function uid(prefix) {
        return `${prefix || "guide"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function sanitizeHtml(html) {
        const template = document.createElement("template");
        template.innerHTML = String(html || "");
        template.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta").forEach(node => node.remove());
        template.content.querySelectorAll("*").forEach(node => {
            [...node.attributes].forEach(attribute => {
                const name = attribute.name.toLowerCase();
                const value = attribute.value.trim().toLowerCase();
                if (name.startsWith("on") || name === "srcdoc" || name === "style"
                    || ((name === "href" || name === "src") && /^(javascript|data|vbscript):/.test(value))) {
                    node.removeAttribute(attribute.name);
                }
            });
        });
        return template.innerHTML;
    }

    function inlineMarkdown(value) {
        let text = escapeHtml(value);
        text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
        text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        return text;
    }

    function markdownToHtml(markdown) {
        const lines = String(markdown || "").replace(/\r/g, "").split("\n");
        const output = [];
        let listType = null;
        const closeList = () => {
            if (listType) output.push(`</${listType}>`);
            listType = null;
        };

        lines.forEach(line => {
            const heading = line.match(/^(#{1,4})\s+(.+)$/);
            const bullet = line.match(/^\s*[-*]\s+(.+)$/);
            const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
            if (heading) {
                closeList();
                const level = Math.min(4, heading[1].length + 1);
                output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
            } else if (bullet || ordered) {
                const nextType = bullet ? "ul" : "ol";
                if (listType !== nextType) {
                    closeList();
                    listType = nextType;
                    output.push(`<${listType}>`);
                }
                output.push(`<li>${inlineMarkdown((bullet || ordered)[1])}</li>`);
            } else if (!line.trim()) {
                closeList();
            } else {
                closeList();
                output.push(`<p>${inlineMarkdown(line)}</p>`);
            }
        });
        closeList();
        return sanitizeHtml(output.join(""));
    }

    function renderContent(content, format) {
        return format === "html" ? sanitizeHtml(content) : markdownToHtml(content);
    }

    const localStorageAdapter = {
        async list() {
            try {
                const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
                return Array.isArray(value) ? value : [];
            } catch {
                return [];
            }
        },
        async save(guide) {
            const guides = await this.list();
            const index = guides.findIndex(item => item.id === guide.id);
            const saved = { ...clone(guide), updatedAt: new Date().toISOString() };
            if (index >= 0) guides[index] = saved;
            else guides.push(saved);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
            return saved;
        },
        async remove(id) {
            const guides = (await this.list()).filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
        }
    };

    let apiGuideCache = null;
    let apiGuideRequest = null;

    const apiStorageAdapter = {
        async list() {
            if (apiGuideCache) return clone(apiGuideCache);
            if (apiGuideRequest) return clone(await apiGuideRequest);

            try {
                apiGuideRequest = (async () => {
                    const response = await fetch("/api/GuideStep/GetGuides", { credentials: "include" });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const result = await response.json();
                    return Array.isArray(result?.data) ? result.data : [];
                })();
                apiGuideCache = await apiGuideRequest;
                return clone(apiGuideCache);
            } catch (error) {
                console.warn("Guide API is unavailable; no database guides were loaded.", error);
                return [];
            } finally {
                apiGuideRequest = null;
            }
        },
        async save(guide) {
            try {
                const response = await fetch("/api/GuideStep/SaveGuide", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(guide)
                });
                if (!response.ok) {
                    const error = new Error((await response.text()) || `HTTP ${response.status}`);
                    error.status = response.status;
                    throw error;
                }
                const result = await response.json();
                const submittedStepCount = Array.isArray(guide.steps) ? guide.steps.length : 0;
                if (Number(result?.savedStepCount) !== submittedStepCount) {
                    throw new Error("The guide could not be verified after saving.");
                }
                const savedGuide = result?.data || guide;
                if (apiGuideCache) {
                    const identity = savedGuide.id || savedGuide.key;
                    const index = apiGuideCache.findIndex(item => (item.id || item.key) === identity);
                    if (index >= 0) apiGuideCache[index] = clone(savedGuide);
                    else apiGuideCache.push(clone(savedGuide));
                }
                return savedGuide;
                //debugger
                //ajaxPut('/api/GuideStep/UpdateData',
                //    {
                //        key: guide.key,
                //        values: JSON.stringify(guide)
                //    },
                //    {
                //        onSuccess: function (response) {
                //            globalLoadPanel.dxLoadPanel("instance").hide();
                //        },
                //        onError: function (err) {
                //            globalLoadPanel.dxLoadPanel("instance").hide();
                //        }
                //    }
                //);
            } catch (error) {
                console.warn("Guide API save failed.", error);
                throw error;
            }
        },
        async remove(id) {
            try {
                const response = await fetch(`/api/GuideStep/DeleteGuide/${encodeURIComponent(id)}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (!response.ok) {
                    const error = new Error((await response.text()) || `HTTP ${response.status}`);
                    error.status = response.status;
                    throw error;
                }
                if (apiGuideCache) {
                    apiGuideCache = apiGuideCache.filter(item => (item.id || item.key) !== id);
                }
            } catch (error) {
                console.warn("Guide API delete failed.", error);
                throw error;
            }
        }
    };

    let storage = apiStorageAdapter;

    function currentContextRoute() {
        const activePanel = document.querySelector(
            '#tablist > .content-wrapper[aria-hidden="false"], #tablist > .content-wrapper[style*="z-index: 10000"]'
        );
        return activePanel?.getAttribute("data-source-url")
            || `${location.pathname}${location.hash}`;
    }

    function canManageGuides() {
        const values = [window._role, window._roleAppName]
            .map(value => String(value || "").trim().toUpperCase());
        return values.some(value => ["IT", "ADMIN", "SUPERUSER"].includes(value))
            || String(window._isSuperUser || "").toLowerCase() === "true";
    }

    async function waitForElement(selector, timeout) {
        if (!selector) return null;
        const started = Date.now();
        while (Date.now() - started < (timeout || 5000)) {
            try {
                const element = document.querySelector(selector);
                if (element) return element;
            } catch {
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    }

    function ensureTourDom() {
        let root = document.getElementById("tmivUserGuideTour");
        if (root) return root;
        root = document.createElement("div");
        root.id = "tmivUserGuideTour";
        root.className = "ug-tour";
        root.innerHTML = `
            <div class="ug-backdrop"></div>
            <div class="ug-highlight" aria-hidden="true"></div>
            <section class="ug-popover" role="dialog" aria-modal="true" aria-labelledby="ugStepTitle">
                <div class="ug-popover-head">
                    <span class="ug-step-count"></span>
                    <button type="button" class="ug-icon-button ug-close" aria-label="Close guide">&times;</button>
                </div>
                <h3 id="ugStepTitle" class="ug-step-title"></h3>
                <div class="ug-step-content"></div>
                <div class="ug-popover-actions">
                    <button type="button" class="ug-button ug-secondary ug-prev">Back</button>
                    <button type="button" class="ug-button ug-primary ug-next">Next</button>
                </div>
            </section>`;
        document.body.appendChild(root);
        root.querySelector(".ug-close").addEventListener("click", stop);
        root.querySelector(".ug-prev").addEventListener("click", () => showStep(activeTour.index - 1));
        root.querySelector(".ug-next").addEventListener("click", () => {
            if (!activeTour || activeTour.index >= activeTour.guide.steps.length - 1) stop();
            else showStep(activeTour.index + 1);
        });
        return root;
    }

    function placePopover(popover, rect, placement) {
        const gap = 14;
        const margin = 12;
        const width = popover.offsetWidth;
        const height = popover.offsetHeight;
        let resolved = VALID_PLACEMENTS.includes(placement) ? placement : "auto";
        if (resolved === "auto") {
            resolved = rect && window.innerWidth - rect.right > width + gap ? "right"
                : rect && rect.left > width + gap ? "left"
                    : rect && window.innerHeight - rect.bottom > height + gap ? "bottom" : "top";
        }

        let top;
        let left;
        if (!rect || resolved === "center") {
            top = (window.innerHeight - height) / 2;
            left = (window.innerWidth - width) / 2;
            resolved = "center";
        } else if (resolved === "right") {
            top = rect.top + (rect.height - height) / 2;
            left = rect.right + gap;
        } else if (resolved === "left") {
            top = rect.top + (rect.height - height) / 2;
            left = rect.left - width - gap;
        } else if (resolved === "bottom") {
            top = rect.bottom + gap;
            left = rect.left + (rect.width - width) / 2;
        } else {
            top = rect.top - height - gap;
            left = rect.left + (rect.width - width) / 2;
        }
        popover.dataset.placement = resolved;
        popover.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - height - margin))}px`;
        popover.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - width - margin))}px`;
    }

    async function showStep(index) {
        if (!activeTour) return;
        const steps = activeTour.guide.steps || [];
        if (index < 0 || index >= steps.length) return;
        activeTour.index = index;
        const step = steps[index];
        const root = ensureTourDom();
        const highlight = root.querySelector(".ug-highlight");
        const popover = root.querySelector(".ug-popover");
        root.querySelector(".ug-step-count").textContent = `Step ${index + 1} of ${steps.length}`;
        root.querySelector(".ug-step-title").textContent = step.title || `Step ${index + 1}`;
        root.querySelector(".ug-step-content").innerHTML = renderContent(step.content, step.format || "html");
        root.querySelector(".ug-prev").disabled = index === 0;
        root.querySelector(".ug-next").textContent = index === steps.length - 1 ? "Finish" : "Next";
        root.classList.add("is-visible");

        const element = await waitForElement(step.selector, step.waitTimeout || 5000);

        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            await new Promise(resolve => setTimeout(resolve, 260));
            const rect = element.getBoundingClientRect();
            highlight.hidden = false;
            highlight.style.top = `${Math.max(4, rect.top - 5)}px`;
            highlight.style.left = `${Math.max(4, rect.left - 5)}px`;
            highlight.style.width = `${Math.max(12, rect.width + 10)}px`;
            highlight.style.height = `${Math.max(12, rect.height + 10)}px`;
            placePopover(popover, rect, step.placement);
        } else {
            highlight.hidden = true;
            placePopover(popover, null, "center");
        }

    }

    function repositionTour() {
        if (!activeTour || repositionFrame) return;
        repositionFrame = window.requestAnimationFrame(() => {
            repositionFrame = null;
            if (!activeTour) return;
            const root = ensureTourDom();
            const step = activeTour.guide.steps[activeTour.index];
            let element = null;
            try { element = step.selector ? document.querySelector(step.selector) : null; } catch { }
            const highlight = root.querySelector(".ug-highlight");
            if (!element) {
                highlight.hidden = true;
                placePopover(root.querySelector(".ug-popover"), null, "center");
                return;
            }
            const rect = element.getBoundingClientRect();
            highlight.hidden = false;
            highlight.style.top = `${Math.max(4, rect.top - 5)}px`;
            highlight.style.left = `${Math.max(4, rect.left - 5)}px`;
            highlight.style.width = `${Math.max(12, rect.width + 10)}px`;
            highlight.style.height = `${Math.max(12, rect.height + 10)}px`;
            placePopover(root.querySelector(".ug-popover"), rect, step.placement);
        });
    }

    async function start(guideOrId) {
        const guides = await storage.list();
        const guide = typeof guideOrId === "string"
            ? guides.find(item => item.id === guideOrId || item.key === guideOrId)
            : guideOrId;
        if (!guide || !Array.isArray(guide.steps) || !guide.steps.length) return false;
        stop();

        const tourSteps = convertGuideStepsForControl(guide.steps);
        const staticTourStarter = window.jQuery?.tmivtourguide || window.TMIVCom?.startTour;
        if (typeof staticTourStarter === "function") {
            activeTour = { guide: clone(guide), index: 0 };
            document.body.classList.add("ug-tour-active");
            activeDriver = staticTourStarter(tourSteps, {
                isAdmin: canManageGuides(),
                onExit: function () {
                    activeDriver = null;
                    activeTour = null;
                    document.body.classList.remove("ug-tour-active");
                }
            });
            return true;
        }

        if (typeof window.jQuery?.fn?.tmivtourguide === "function") {
            activeTour = { guide: clone(guide), index: 0 };
            document.body.classList.add("ug-tour-active");
            window.jQuery(document).tmivtourguide(tourSteps, {
                isAdmin: canManageGuides(),
                onExit: function () {
                    activeTour = null;
                    document.body.classList.remove("ug-tour-active");
                }
            });
            return true;
        }

        activeTour = { guide: clone(guide), index: 0 };
        document.body.classList.add("ug-tour-active");
        window.addEventListener("resize", repositionTour);
        window.addEventListener("scroll", repositionTour, true);
        await showStep(0);
        return true;
    }

    function convertGuideStepsForControl(steps) {
        const driverPlacements = ["top", "right", "bottom", "left"];
        return (Array.isArray(steps) ? steps : []).map((step, index) => {
            const element = String(step.element || step.selector || "").trim();
            const placement = String(step.position || step.placement || "bottom").toLowerCase();
            const controlStep = {
                title: step.title || step.stepTitle || `Step ${index + 1}`,
                content: renderContent(step.content, step.contentFormat || step.format || "html"),
                position: driverPlacements.includes(placement) ? placement : "bottom"
            };

            if (element) controlStep.element = element;
            return controlStep;
        });
    }

    function stop() {
        if (activeDriver) {
            const driver = activeDriver;
            activeDriver = null;
            driver.destroy?.();
        }
        activeTour = null;
        document.body.classList.remove("ug-tour-active");
        window.removeEventListener("resize", repositionTour);
        window.removeEventListener("scroll", repositionTour, true);
        if (repositionFrame) window.cancelAnimationFrame(repositionFrame);
        repositionFrame = null;
        document.getElementById("tmivUserGuideTour")?.classList.remove("is-visible");
    }

    function selectorFor(element) {
        if (!element || element === document.body) return "body";
        if (element.id && document.querySelectorAll(`#${CSS.escape(element.id)}`).length === 1) {
            return `#${CSS.escape(element.id)}`;
        }
        for (const attribute of ["data-guide", "data-testid", "name", "aria-label"]) {
            const value = element.getAttribute(attribute);
            if (!value) continue;
            const selector = `[${attribute}="${CSS.escape(value)}"]`;
            if (document.querySelectorAll(selector).length === 1) return selector;
        }
        const parts = [];
        let current = element;
        while (current && current !== document.body && parts.length < 6) {
            let part = current.tagName.toLowerCase();
            const usefulClass = [...current.classList]
                .find(name => !name.startsWith("dx-") && !name.startsWith("ug-") && /^[a-zA-Z][\w-]+$/.test(name));
            if (usefulClass) part += `.${CSS.escape(usefulClass)}`;
            const siblings = current.parentElement
                ? [...current.parentElement.children].filter(node => node.tagName === current.tagName) : [];
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            parts.unshift(part);
            const candidate = parts.join(" > ");
            if (document.querySelectorAll(candidate).length === 1) return candidate;
            current = current.parentElement;
        }
        return parts.join(" > ");
    }

    function newGuide() {
        return {
            id: uid("guide"),
            key: "",
            title: "New user guide",
            route: currentContextRoute(),
            source: "manual",
            wikiUrl: "",
            version: 1,
            maxLoginHours: 0,
            autoStart: false,
            enabled: true,
            steps: []
        };
    }

    function normalizePlacement(value) {
        const placement = String(value || "auto").trim().toLowerCase();
        return VALID_PLACEMENTS.includes(placement) ? placement : "auto";
    }

    function parseMetadata(lines) {
        const metadata = {};
        const content = [];
        lines.forEach(line => {
            const match = line.match(/^\s*(selector|placement|route|format)\s*:\s*`?(.+?)`?\s*$/i);
            if (match) metadata[match[1].toLowerCase()] = match[2];
            else content.push(line);
        });
        return { metadata, content: content.join("\n").trim() };
    }

    function parseWikiMarkdown(source) {
        const lines = String(source || "").replace(/\r/g, "").split("\n");
        let title = "Wiki user guide";
        const sections = [];
        let current = null;
        lines.forEach(line => {
            const h1 = line.match(/^#\s+(.+)$/);
            const stepHeading = line.match(/^##+\s+(?:Step\s*\d+\s*[:.-]?\s*)?(.+)$/i);
            if (h1 && sections.length === 0 && !current) title = h1[1].trim();
            else if (stepHeading) {
                if (current) sections.push(current);
                current = { title: stepHeading[1].trim(), lines: [] };
            } else if (current) current.lines.push(line);
        });
        if (current) sections.push(current);
        return {
            title,
            steps: sections.map(section => {
                const parsed = parseMetadata(section.lines);
                return {
                    id: uid("step"),
                    title: section.title,
                    selector: parsed.metadata.selector || "",
                    placement: normalizePlacement(parsed.metadata.placement),
                    route: parsed.metadata.route || "",
                    format: parsed.metadata.format === "html" ? "html" : "markdown",
                    content: parsed.content
                };
            })
        };
    }

    function parseWikiHtml(source) {
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const title = parsed.querySelector("h1")?.textContent.trim() || "Wiki user guide";
        const headings = [...parsed.querySelectorAll("h2, h3")];
        const steps = headings.map(heading => {
            const parts = [];
            let node = heading.nextSibling;
            while (node && !(node.nodeType === 1 && /^(H2|H3)$/.test(node.tagName))) {
                parts.push(node.cloneNode(true));
                node = node.nextSibling;
            }
            const holder = document.createElement("div");
            parts.forEach(part => holder.appendChild(part));
            const selectorNode = holder.querySelector("[data-selector], code.selector");
            const selector = heading.getAttribute("data-selector")
                || selectorNode?.getAttribute("data-selector")
                || selectorNode?.textContent.trim() || "";
            selectorNode?.remove();
            return {
                id: uid("step"),
                title: heading.textContent.replace(/^Step\s*\d+\s*[:.-]?\s*/i, "").trim(),
                selector,
                placement: normalizePlacement(heading.getAttribute("data-placement")),
                format: "html",
                content: sanitizeHtml(holder.innerHTML.trim())
            };
        });
        return { title, steps };
    }

    function parseWiki(source, format) {
        const looksLikeHtml = format === "html" || (format !== "markdown" && /<h[1-3][\s>]/i.test(source));
        return looksLikeHtml ? parseWikiHtml(source) : parseWikiMarkdown(source);
    }

    function studioRoot() {
        let root = document.getElementById("tmivGuideStudio");
        if (root) return root;
        root = document.createElement("div");
        root.id = "tmivGuideStudio";
        root.className = "ug-studio";
        root.innerHTML = `
            <div class="ug-studio-backdrop"></div>
            <div class="ug-studio-panel" role="dialog" aria-modal="true" aria-labelledby="ugStudioTitle">
                <header class="ug-studio-head">
                    <div><span class="ug-kicker">USER GUIDANCE</span><h2 id="ugStudioTitle">Guide Studio</h2></div>
                    <button type="button" class="ug-icon-button ug-studio-close" aria-label="Close">&times;</button>
                </header>
                <div class="ug-studio-body">
                    <div class="ug-field-row">
                        <label>Saved guide<select class="ug-input ug-guide-picker"></select></label>
                        <label>&nbsp;<button type="button" class="ug-button ug-secondary ug-new-guide">New guide</button></label>
                    </div>
                    <div class="ug-field-row">
                        <label>Guide title<input class="ug-input" data-guide-field="title" /></label>
                        <label>Key<input class="ug-input" data-guide-field="key" placeholder="quotation-create" /></label>
                    </div>
                    <label>Route<input class="ug-input" data-guide-field="route" placeholder="/Management*" /></label>
                    <div class="ug-field-row">
                        <label>Show below login hours<input type="number" min="0" step="0.25" class="ug-input" data-guide-field="maxLoginHours" /></label>
                        <label class="ug-check-field"><input type="checkbox" data-guide-field="autoStart" /> Auto-start when eligible</label>
                    </div>
              
                    <div id="experienceLevelId" data-guide-field="experienceLevelId" style="z-index: 100000"></div>
                    <div class="ug-tabs" role="tablist">
                        <button type="button" class="ug-tab is-active" data-tab="manual">Manual capture</button>
                        <button type="button" class="ug-tab" data-tab="wiki">From wiki</button>
                    </div>
                    <section class="ug-tab-panel" data-panel="manual">
                        <div class="ug-toolbar">
                            <button type="button" class="ug-button ug-primary ug-capture">Capture element</button>
                            <button type="button" class="ug-button ug-secondary ug-add-center">Add centered step</button>
                        </div>
                        <div class="ug-step-list"></div>
                        <div class="ug-step-editor" hidden>
                            <div class="ug-step-editor-title"><strong>Edit step</strong><button type="button" class="ug-link-button ug-delete-step">Delete</button></div>
                            <label>Title<input class="ug-input" data-step-field="title" /></label>
                            <label>Selector<input class="ug-input ug-mono" data-step-field="selector" placeholder="#element-id" /></label>
                            <div class="ug-field-row">
                                <label>Placement<select class="ug-input" data-step-field="placement"><option>auto</option><option>top</option><option>right</option><option>bottom</option><option>left</option><option>center</option></select></label>
                                <label>Content format<select class="ug-input" data-step-field="format"><option value="html">HTML</option><option value="markdown">Markdown</option></select></label>
                            </div>
                            <label>Formatted content<textarea class="ug-input ug-content-input" data-step-field="content" placeholder="Use HTML tags such as <p>, <strong>, <ul>..."></textarea></label>
                        </div>
                    </section>
                    <section class="ug-tab-panel" data-panel="wiki" hidden>
                        <p class="ug-help">Paste wiki Markdown/HTML. Each <code>## Step title</code> or <code>&lt;h2&gt;</code> becomes one step.</p>
                        <label>Wiki URL (optional)<div class="ug-inline-field"><input type="url" class="ug-input ug-wiki-url" data-guide-field="wikiUrl" placeholder="https://wiki.example/guide" /><button type="button" class="ug-button ug-secondary ug-load-wiki">Load URL</button></div></label>
                        <label>Wiki format<select class="ug-input ug-wiki-format"><option value="auto">Auto detect</option><option value="markdown">Markdown</option><option value="html">HTML</option></select></label>
                        <label>Wiki content<textarea class="ug-input ug-wiki-input" placeholder="# Guide title\n\n## Open quotation\nSelector: \`#quotationGrid\`\n\nSelect a quotation..."></textarea></label>
                        <button type="button" class="ug-button ug-primary ug-import-wiki">Build steps from wiki</button>
                    </section>
                </div>
                <footer class="ug-studio-footer">
                    <button type="button" class="ug-button ug-secondary ug-export">Export JSON</button>
                    <button type="button" class="ug-button ug-secondary ug-export-markdown">Export Markdown</button>
                    <button type="button" class="ug-button ug-secondary ug-export-slides">Export Slides</button>
                    <button type="button" class="ug-button ug-danger ug-delete-guide">Delete guide</button>
                    <span class="ug-footer-spacer"></span>
                    <button type="button" class="ug-button ug-secondary ug-preview">Preview</button>
                    <button type="button" class="ug-button ug-primary ug-save">Save guide</button>
                </footer>
            </div>`;
        document.body.appendChild(root);
        bindStudio(root);
        return root;
    }

    function updateDraftFromFields(root) {
        root.querySelectorAll("[data-guide-field]").forEach(input => {
            const field = input.dataset.guideField;
            if (field === "experienceLevelId") {
                //alert($(`#${field}`).dxSelectBox("instance").option("value"));
                studioState.guide[field] = $(`#${field}`).dxSelectBox("instance").option("value");
            }
            else {

            studioState.guide[field] = input.type === "checkbox"
                ? input.checked
                : (field === "maxLoginHours" ? Math.max(0, Number(input.value) || 0) : input.value);
            }
        });
        const selected = studioState.guide.steps[studioState.selectedStep];
        if (selected) {
            root.querySelectorAll("[data-step-field]").forEach(input => {
                selected[input.dataset.stepField] = input.value;
            });
        }
    }

    function renderStudio(root) {
        const guidePicker = root.querySelector(".ug-guide-picker");
        const guides = Array.isArray(studioState.guides) ? studioState.guides : [];
        guidePicker.innerHTML = [
            '<option value="">-- New guide --</option>',
            ...guides.map(guide => `<option value="${escapeHtml(guide.id || guide.key)}">${escapeHtml(guide.title || guide.key)}</option>`)
        ].join("");
        guidePicker.value = guides.some(guide => (guide.id || guide.key) === (studioState.guide.id || studioState.guide.key))
            ? (studioState.guide.id || studioState.guide.key)
            : "";

        root.querySelectorAll("[data-guide-field]").forEach(input => {
            const value = studioState.guide[input.dataset.guideField];
            if (input.type === "checkbox") input.checked = value === true;
            else input.value = value ?? "";
        });
        const list = root.querySelector(".ug-step-list");
        list.innerHTML = "";
        studioState.guide.steps.forEach((step, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `ug-step-card${index === studioState.selectedStep ? " is-selected" : ""}`;
            button.innerHTML = `<span>${index + 1}</span><div><strong>${escapeHtml(step.title || `Step ${index + 1}`)}</strong><small>${escapeHtml(step.selector || "Centered message")}</small></div>`;
            button.addEventListener("click", () => {
                updateDraftFromFields(root);
                studioState.selectedStep = index;
                renderStudio(root);
            });
            list.appendChild(button);
        });
        const editor = root.querySelector(".ug-step-editor");
        const selected = studioState.guide.steps[studioState.selectedStep];
        editor.hidden = !selected;
        if (selected) {
            root.querySelectorAll("[data-step-field]").forEach(input => {
                const fallbackValue = input.dataset.stepField === "placement"
                    ? "auto"
                    : (input.dataset.stepField === "format" ? "html" : "");
                input.value = selected[input.dataset.stepField] || fallbackValue;
            });
        }
    }

    function mapDatabaseGuide(guide) {
        const mappedGuide = {
            ...newGuide(),
            ...clone(guide || {}),
            steps: []
        };
        const databaseSteps = Array.isArray(guide?.steps)
            ? guide.steps.map((step, index) => {
                
                const waitTimeout = Number(step.waitTimeout);
                return {
                    id: step.id || uid("step"),
                    title: step.title || `Step ${index + 1}`,
                    selector: step.selector || "",
                    placement: normalizePlacement(step.placement),
                    format: String(step.format || "html").toLowerCase() === "markdown" ? "markdown" : "html",
                    content: step.content || "",
                    waitTimeout: Number.isFinite(waitTimeout) ? Math.max(0, waitTimeout) : 5000
                };
            })
            : [];

        // Push the GuideStep rows returned by GetGuides into the Studio control model.
        mappedGuide.steps.push(...databaseSteps);
        return mappedGuide;
    }

    async function loadStudioGuides(root, guideOrId) {
        const guidePicker = root.querySelector(".ug-guide-picker");
        guidePicker.disabled = true;
        guidePicker.innerHTML = '<option value="">Loading guides...</option>';

        try {
            // apiStorageAdapter.list() performs GET /api/GuideStep/GetGuides.
            const guides = await storage.list();
            const requestedGuide = typeof guideOrId === "string"
                ? guides.find(item => item.id === guideOrId || item.key === guideOrId)
                : guideOrId;
            const guide = requestedGuide
                || guides[0]
                || newGuide();

            studioState.guides = guides.map(mapDatabaseGuide);
            studioState.guide = mapDatabaseGuide(guide);
            studioState.selectedStep = studioState.guide.steps.length ? 0 : -1;
            renderStudio(root);
            $(`#experienceLevelId`).dxSelectBox({
                items: _enums.ExperienceLevel,
                valueExpr: 'id',
                displayExpr: 'value',
                searchEnabled: true,
                width: "100%",
                height: 40
        }
            );
        } finally {
            guidePicker.disabled = false;
        }
    }

    function endCapture() {
        document.body.classList.remove("ug-capture-active");
        capturedElement?.classList.remove("ug-capture-target");
        capturedElement = null;
        document.removeEventListener("mouseover", captureHover, true);
        document.removeEventListener("click", captureClick, true);
        document.removeEventListener("keydown", captureKey, true);
    }

    function captureHover(event) {
        if (event.target.closest("#tmivGuideStudio, #tmivGuideLauncherPanel")) return;
        capturedElement?.classList.remove("ug-capture-target");
        capturedElement = event.target;
        capturedElement.classList.add("ug-capture-target");
    }

    function captureClick(event) {
        if (!capturedElement) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const element = capturedElement;
        const selector = selectorFor(element);
        const title = element.getAttribute("aria-label") || element.getAttribute("title")
            || element.textContent.trim().replace(/\s+/g, " ").slice(0, 60) || "New step";
        endCapture();
        studioState.guide.steps.push({
            id: uid("step"), title, selector, placement: "auto", format: "html", content: "<p>Describe what the user should do here.</p>"
        });
        studioState.selectedStep = studioState.guide.steps.length - 1;
        const root = studioRoot();
        root.classList.add("is-visible");
        renderStudio(root);
    }

    function captureKey(event) {
        if (event.key === "Escape") {
            endCapture();
            studioRoot().classList.add("is-visible");
        }
    }

    function beginCapture(root) {
        updateDraftFromFields(root);
        root.classList.remove("is-visible");
        document.body.classList.add("ug-capture-active");
        document.addEventListener("mouseover", captureHover, true);
        document.addEventListener("click", captureClick, true);
        document.addEventListener("keydown", captureKey, true);
    }

    function downloadGuide(guide) {
        const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${guide.key || guide.id}.guide.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 0);
    }

    function exportGuideTour(guide, format, filename) {
        const exporter = window.jQuery?.tmivexporttour || window.TMIVCom?.exportTour;
        const steps = convertGuideStepsForControl(guide?.steps || []);
        if (!steps.length) {
            window.DevExpress?.ui?.notify?.("Add at least one guide step before exporting.", "warning", 3000);
            return false;
        }
        if (typeof exporter !== "function") {
            window.DevExpress?.ui?.notify?.("TMIV tour export is not available on this page.", "error", 3500);
            return false;
        }

        exporter(steps, format, filename);
        return true;
    }

    function bindStudio(root) {
        root.querySelector(".ug-studio-close").addEventListener("click", () => root.classList.remove("is-visible"));
        root.querySelector(".ug-guide-picker").addEventListener("change", event => {
            updateDraftFromFields(root);
            const guide = studioState.guides.find(item => (item.id || item.key) === event.target.value);
            studioState.guide = clone(guide || newGuide());
            studioState.selectedStep = studioState.guide.steps.length ? 0 : -1;
            renderStudio(root);
        });
        root.querySelector(".ug-new-guide").addEventListener("click", () => {
            updateDraftFromFields(root);
            studioState.guide = newGuide();
            studioState.selectedStep = -1;
            renderStudio(root);
        });
        root.querySelectorAll(".ug-tab").forEach(tab => tab.addEventListener("click", () => {
            root.querySelectorAll(".ug-tab").forEach(item => item.classList.toggle("is-active", item === tab));
            root.querySelectorAll(".ug-tab-panel").forEach(panel => panel.hidden = panel.dataset.panel !== tab.dataset.tab);
        }));
        root.querySelector(".ug-capture").addEventListener("click", () => beginCapture(root));
        root.querySelector(".ug-add-center").addEventListener("click", () => {
            updateDraftFromFields(root);
            studioState.guide.steps.push({
                id: uid("step"),
                title: `Step ${studioState.guide.steps.length + 1}`,
                selector: "",
                placement: "center",
                format: "html",
                content: "",
                waitTimeout: 5000
            });
            studioState.selectedStep = studioState.guide.steps.length - 1;
            renderStudio(root);
        });
        root.querySelector(".ug-delete-step").addEventListener("click", () => {
            studioState.guide.steps.splice(studioState.selectedStep, 1);
            studioState.selectedStep = Math.min(studioState.selectedStep, studioState.guide.steps.length - 1);
            renderStudio(root);
        });
        root.querySelector(".ug-load-wiki").addEventListener("click", async () => {
            const url = root.querySelector(".ug-wiki-url").value.trim();
            if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
                window.DevExpress?.ui?.notify?.("Enter an HTTP(S) or same-site wiki URL.", "warning", 3000);
                return;
            }
            const button = root.querySelector(".ug-load-wiki");
            button.disabled = true;
            button.textContent = "Loading...";
            try {
                const response = await fetch(url, { credentials: "include", headers: { Accept: "text/html,text/markdown,text/plain" } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                root.querySelector(".ug-wiki-input").value = await response.text();
                window.DevExpress?.ui?.notify?.("Wiki content loaded.", "success", 2200);
            } catch (error) {
                console.warn("Wiki guide could not be loaded.", error);
                window.DevExpress?.ui?.notify?.("Unable to load this wiki URL. Paste its Markdown or HTML instead.", "warning", 3500);
            } finally {
                button.disabled = false;
                button.textContent = "Load URL";
            }
        });
        root.querySelector(".ug-import-wiki").addEventListener("click", () => {
            updateDraftFromFields(root);
            const source = root.querySelector(".ug-wiki-input").value;
            const imported = parseWiki(source, root.querySelector(".ug-wiki-format").value);
            if (!imported.steps.length) {
                window.DevExpress?.ui?.notify?.("No wiki steps found. Use level-2 headings for each step.", "warning", 3000);
                return;
            }
            studioState.guide.title = imported.title || studioState.guide.title;
            studioState.guide.source = "wiki";
            studioState.guide.steps = imported.steps;
            studioState.selectedStep = 0;
            root.querySelector('[data-tab="manual"]').click();
            renderStudio(root);
        });
        root.querySelector(".ug-save").addEventListener("click", async () => {
            updateDraftFromFields(root);
            if (!studioState.guide.title.trim() || !studioState.guide.steps.length) {
                window.DevExpress?.ui?.notify?.("A guide needs a title and at least one step.", "warning", 3000);
                return;
            }
            const saveButton = root.querySelector(".ug-save");
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
            try {
                debugger
                studioState.guide.key = studioState.guide.key.trim() || studioState.guide.id;
                studioState.guide = await storage.save(studioState.guide);
                const savedIdentity = studioState.guide.id || studioState.guide.key;
                const savedIndex = studioState.guides.findIndex(item => (item.id || item.key) === savedIdentity);
                if (savedIndex >= 0) studioState.guides[savedIndex] = clone(studioState.guide);
                else studioState.guides.push(clone(studioState.guide));
                const savedStepCount = studioState.guide.steps.length;
                window.DevExpress?.ui?.notify?.(
                    `${savedStepCount} guide step${savedStepCount === 1 ? "" : "s"} saved to database.`,
                    "success",
                    2600);
                root.classList.remove("is-visible");
            } catch (error) {
                window.DevExpress?.ui?.notify?.(
                    error.status === 401 || error.status === 403
                        ? "Only IT administrators can save shared user guides."
                        : "Unable to save the user guide.",
                    "error",
                    3500);
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Save guide";
            }
        });
        root.querySelector(".ug-preview").addEventListener("click", () => {
            updateDraftFromFields(root);
            root.classList.remove("is-visible");
            start(studioState.guide);
        });
        root.querySelector(".ug-export").addEventListener("click", () => {
            updateDraftFromFields(root);
            downloadGuide(studioState.guide);
        });
        root.querySelector(".ug-export-markdown").addEventListener("click", () => {
            updateDraftFromFields(root);
            exportGuideTour(studioState.guide, "markdown", "huong-dan-he-thong");
        });
        root.querySelector(".ug-export-slides").addEventListener("click", () => {
            updateDraftFromFields(root);
            exportGuideTour(studioState.guide, "slides", "slides-trinh-chieu");
        });
        root.querySelector(".ug-delete-guide").addEventListener("click", async () => {
            if (!studioState.guide.id) return;
            if (typeof storage.remove !== "function") {
                window.DevExpress?.ui?.notify?.("The configured guide storage does not support deletion.", "warning", 3000);
                return;
            }
            if (!window.confirm(`Delete the guide “${studioState.guide.title}”?`)) return;
            try {
                await storage.remove(studioState.guide.id);
                root.classList.remove("is-visible");
                window.DevExpress?.ui?.notify?.("User guide deleted.", "success", 2200);
            } catch (error) {
                window.DevExpress?.ui?.notify?.(
                    error.status === 401 || error.status === 403
                        ? "Only IT administrators can delete shared user guides."
                        : "Unable to delete the user guide.",
                    "error",
                    3500);
            }
        });
    }

    async function openStudio(guideOrId) {
        stop();
        studioState = {
            guides: [],
            guide: newGuide(),
            selectedStep: -1
        };
        const root = studioRoot();
        root.classList.add("is-visible");
        await loadStudioGuides(root, guideOrId);
    }

    async function openLauncher(options) {
        const launcherOptions = options || {};
        let panel = document.getElementById("tmivGuideLauncherPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "tmivGuideLauncherPanel";
            panel.className = "ug-launcher-panel";
            document.body.appendChild(panel);
        }
        const guides = await storage.list();
        const canManage = launcherOptions.allowManage !== false && canManageGuides();
        const matching = canManage
            ? guides
            : guides.filter(item => item.enabled !== false && item.isEligible !== false);
        panel.innerHTML = `
            <div class="ug-launcher-head"><strong>User guides</strong><button type="button" class="ug-icon-button">&times;</button></div>
            <div class="ug-launcher-list">${matching.length ? matching.map(guide => `
                <div class="ug-launcher-row">
                    <button type="button" class="ug-launcher-guide" data-guide-id="${escapeHtml(guide.id)}">
                        <span class="fa fa-compass"></span><span><strong>${escapeHtml(guide.title)}</strong><small>${guide.steps.length} steps${canManage ? ` · ${escapeHtml(guide.route || "All screens")}` : ""}</small></span>
                    </button>
                    ${canManage ? `<button type="button" class="ug-launcher-edit" data-edit-guide-id="${escapeHtml(guide.id)}" aria-label="Edit ${escapeHtml(guide.title)}"><span class="fa fa-pencil"></span></button>` : ""}
                </div>`).join("") : '<p class="ug-empty">No user guide is configured.</p>'}</div>
            ${canManage ? '<button type="button" class="ug-button ug-secondary ug-open-studio">Set up guides</button>' : ""}`;
        panel.querySelector(".ug-icon-button").addEventListener("click", () => panel.classList.remove("is-visible"));
        panel.querySelector(".ug-open-studio")?.addEventListener("click", () => {
                panel.classList.remove("is-visible");
                openStudio();
            });
        panel.querySelectorAll("[data-guide-id]").forEach(button => button.addEventListener("click", () => {
            panel.classList.remove("is-visible");
            start(button.dataset.guideId);
        }));
        panel.querySelectorAll("[data-edit-guide-id]").forEach(button => button.addEventListener("click", () => {
            panel.classList.remove("is-visible");
            openStudio(button.dataset.editGuideId);
        }));
        panel.classList.toggle("is-visible");
    }

    function bindLauncher(selector, options) {
        const launcherOptions = options || {};
        const element = typeof selector === "string" ? document.querySelector(selector) : selector;
        if (element && !element.dataset.userGuideBound) {
            element.dataset.userGuideBound = "true";
            element.addEventListener("click", () => {
                if (launcherOptions.adminOnly === true && !canManageGuides()) {
                    window.DevExpress?.ui?.notify?.(
                        "Only IT administrators can set up user guides.",
                        "warning",
                        3000);
                    return;
                }
                openLauncher(launcherOptions);
            });
            if (launcherOptions.autoStart !== false) {
                window.setTimeout(startEligible, 900);
            }
        }
    }

    async function startEligible() {
        //if (activeTour || document.querySelector("#tmivGuideStudio.is-visible") || document.body.classList.contains("ug-capture-active")) return false;
        //const guides = await storage.list();
        //const guide = guides.find(item =>
        //    item.enabled !== false
        //    && item.autoStart === true
        //    && item.isEligible !== false
        //    && sessionStorage.getItem(`tmiv.guide-shown.${item.key || item.id}.v${item.version || 1}`) !== "true"
        //);
        //if (!guide) return false;
        //sessionStorage.setItem(`tmiv.guide-shown.${guide.key || guide.id}.v${guide.version || 1}`, "true");
        //return start(guide);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && activeTour) stop();
    });

    window.UserGuide = Object.freeze({
        start,
        stop,
        openStudio,
        openLauncher,
        startEligible,
        bindLauncher,
        parseWiki,
        renderContent,
        convertGuideStepsForControl,
        async list() { return storage.list(); },
        setStorageAdapter(adapter) {
            if (!adapter || typeof adapter.list !== "function" || typeof adapter.save !== "function") {
                throw new Error("A guide storage adapter must implement list() and save().");
            }
            storage = adapter;
        }
    });
})(window, document);
