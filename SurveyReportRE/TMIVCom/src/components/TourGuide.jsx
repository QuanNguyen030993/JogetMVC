import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Utility helper to parse and render Markdown or HTML descriptions
 */
const parseDescription = (text) => {
    if (!text) return '';

    // Check if the input is HTML
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(text);

    let html = text;
    if (!isHtml) {
        // Escape HTML entities to prevent rendering arbitrary scripts if text is strictly markdown
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // Markdown parser rules
    html = html
        .replace(/^### (.*$)/gim, '<h5 style="margin: 6px 0; font-weight: 700; color: #1e293b;">$1</h5>')
        .replace(/^## (.*$)/gim, '<h4 style="margin: 8px 0; font-weight: 700; color: #1e293b;">$1</h4>')
        .replace(/^# (.*$)/gim, '<h3 style="margin: 8px 0; font-weight: 800; color: #0f172a;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #0f172a;">$1</strong>')
        .replace(/__(.*?)__/g, '<strong style="font-weight: 700; color: #0f172a;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
        .replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #e11d48; font-weight: 500;">$1</code>')
        .replace(/^\s*[-*]\s+(.*)$/gim, '<li style="margin-left: 14px; list-style-type: disc; margin-bottom: 4px; color: #475569;">$1</li>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">$1</a>');

    // Convert newlines to breaks
    html = html.replace(/\n/g, '<br />');

    return html;
};

/**
 * React Component Wrapper around driver.js
 */
const TourGuide = forwardRef(({
    steps = [], // Array of { element, title, content|intro|description, position }
    active = false,
    onComplete,
    onExit,
    options = {}
}, ref) => {
    const driverInstanceRef = useRef(null);

    const startTour = () => {
        if (steps.length === 0) return;

        // Map steps to driver.js format and handle missing DOM elements gracefully
        const driverSteps = steps.map(step => {
            const rawDescription = step.content || step.intro || step.description || '';
            const formattedDescription = parseDescription(rawDescription);
            const elementExists = step.element ? !!document.querySelector(step.element) : false;

            return {
                element: elementExists ? step.element : undefined, // Centered modal fallback if element not found
                popover: {
                    title: step.title || '',
                    description: formattedDescription,
                    side: step.position || step.side || 'bottom',
                    align: step.align || 'start'
                }
            };
        });

        // Initialize driver with active interaction enabled by default (disableActiveInteraction: false)
        const driverObj = driver({
            showProgress: true,
            allowClose: true,
            disableActiveInteraction: false, // Allow clicks and inputs on highlighted element
            overlayColor: 'rgba(15, 23, 42, 0.65)',
            steps: driverSteps,
            onDestroyStarted: () => {
                onExit?.();
                driverObj.destroy();
            },
            ...options
        });

        driverInstanceRef.current = driverObj;
        driverObj.drive();
    };

    const destroyTour = () => {
        if (driverInstanceRef.current) {
            driverInstanceRef.current.destroy();
            driverInstanceRef.current = null;
        }
    };

    useEffect(() => {
        if (active) {
            startTour();
        } else {
            destroyTour();
        }

        return () => {
            destroyTour();
        };
    }, [active, steps]);

    useImperativeHandle(ref, () => ({
        start() {
            startTour();
        },
        exit() {
            destroyTour();
        },
        next() {
            driverInstanceRef.current?.moveNext();
        },
        prev() {
            driverInstanceRef.current?.movePrevious();
        },
        isActive() {
            return !!driverInstanceRef.current;
        }
    }));

    return null;
});

TourGuide.displayName = "TourGuide";

/**
 * Singleton trigger helper for quick programmatic tours
 */
export const startTour = (stepsArray = [], options = {}) => {
    if (!stepsArray || stepsArray.length === 0) return null;

    const driverSteps = stepsArray.map(step => {
        const rawDescription = step.content || step.intro || step.description || '';
        const formattedDescription = parseDescription(rawDescription);
        const elementExists = step.element ? !!document.querySelector(step.element) : false;

        return {
            element: elementExists ? step.element : undefined,
            popover: {
                title: step.title || '',
                description: formattedDescription,
                side: step.position || step.side || 'bottom',
                align: step.align || 'start'
            }
        };
    });

    const driverObj = driver({
        showProgress: true,
        allowClose: true,
        disableActiveInteraction: false, // Allow inputs, edits, clicks on the highlighted element
        overlayColor: 'rgba(15, 23, 42, 0.65)',
        steps: driverSteps,
        onDestroyStarted: () => {
            options.onExit?.();
            driverObj.destroy();
        },
        ...options
    });

    driverObj.drive();
    return driverObj;
};

/**
 * Exports tour steps into Markdown, HTML Manual, or HTML Slide Deck
 */
export const exportTour = (stepsArray = [], format = 'markdown', filename = 'huong-dan-he-thong') => {
    if (!stepsArray || stepsArray.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'markdown' || format === 'md') {
        extension = 'md';
        mimeType = 'text/markdown;charset=utf-8;';
        content = `# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG\n\n`;
        stepsArray.forEach((step, idx) => {
            const desc = step.content || step.intro || step.description || '';
            const plainDesc = desc.replace(/<[^>]*>/g, ''); // Strip simple HTML tags for markdown
            content += `## Bước ${idx + 1}: ${step.title || 'Chi tiết hướng dẫn'}\n`;
            if (step.element) {
                content += `*Vùng tiêu điểm: \`${step.element}\`*\n\n`;
            }
            content += `${plainDesc}\n\n`;
            content += `---\n\n`;
        });
    } else if (format === 'html' || format === 'html-doc') {
        extension = 'html';
        mimeType = 'text/html;charset=utf-8;';
        content = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Tài liệu Hướng dẫn sử dụng</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.7; color: #334155; max-width: 900px; margin: 40px auto; padding: 20px; background: #f8fafc; }
        .doc-container { background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        h1 { text-align: center; color: #0f172a; font-size: 28px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; letter-spacing: -0.5px; }
        .step-card { background: #ffffff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 25px; border-radius: 0 12px 12px 0; background: #f8fafc; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
        .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .step-num { font-size: 11px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; }
        .step-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 5px; }
        .step-desc { font-size: 14px; color: #475569; }
        .step-desc ul, .step-desc ol { margin-top: 8px; margin-bottom: 8px; padding-left: 20px; }
        .step-desc li { margin-bottom: 4px; }
        .step-element { font-size: 11px; color: #94a3b8; margin-top: 12px; font-family: monospace; }
        @media print {
            body { background: none; margin: 0; padding: 0; }
            .doc-container { box-shadow: none; border: none; padding: 0; }
            .step-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="doc-container">
        <h1>TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG</h1>
`;
        stepsArray.forEach((step, idx) => {
            const desc = step.content || step.intro || step.description || '';
            const htmlDesc = parseDescription(desc);
            content += `
        <div class="step-card">
            <div class="step-header">
                <span class="step-num">Bước ${idx + 1} / ${stepsArray.length}</span>
            </div>
            <div class="step-title">${step.title || 'Chi tiết hướng dẫn'}</div>
            <div class="step-desc">${htmlDesc}</div>
            ${step.element ? `<div class="step-element">Phần tử giao diện: <code>${step.element}</code></div>` : ''}
        </div>
`;
        });
        content += `
    </div>
</body>
</html>`;
    } else if (format === 'slides' || format === 'html-slides' || format === 'pptx') {
        extension = 'html';
        mimeType = 'text/html;charset=utf-8;';
        content = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Trình chiếu Hướng dẫn sử dụng</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; height: 100vh; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .slide { display: none; width: 80%; max-width: 900px; background: #1e293b; border-radius: 20px; padding: 50px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; min-height: 450px; display: flex; flex-direction: column; justify-content: space-between; }
        .slide.active { display: flex; }
        .slide-header { display: flex; justify-content: space-between; align-items: center; }
        .slide-progress { font-size: 14px; font-weight: bold; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; }
        .slide-title { font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 20px; margin-bottom: 25px; line-height: 1.2; }
        .slide-body { font-size: 18px; color: #cbd5e1; line-height: 1.6; flex-grow: 1; }
        .slide-body ul, .slide-body ol { margin-top: 15px; padding-left: 25px; }
        .slide-body li { margin-bottom: 8px; }
        .slide-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-prev { background: #334155; color: #cbd5e1; }
        .btn-prev:hover { background: #475569; }
        .btn-next { background: #2563eb; color: #ffffff; }
        .btn-next:hover { background: #1d4ed8; }
        .slide-element { font-size: 12px; color: #64748b; font-family: monospace; margin-top: 15px; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    </style>
</head>
<body>
`;
        stepsArray.forEach((step, idx) => {
            const desc = step.content || step.intro || step.description || '';
            const htmlDesc = parseDescription(desc);
            content += `
    <div class="slide ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
        <div>
            <div class="slide-header">
                <span class="slide-progress">Slide ${idx + 1} / ${stepsArray.length}</span>
            </div>
            <div class="slide-title">${step.title || 'Chi tiết hướng dẫn'}</div>
            <div class="slide-body">
                ${htmlDesc}
                ${step.element ? `<div class="slide-element">Target Element: <code>${step.element}</code></div>` : ''}
            </div>
        </div>
        <div class="slide-footer">
            <button class="btn btn-prev" onclick="changeSlide(${idx - 1})" ${idx === 0 ? 'disabled' : ''}>◀ Trước</button>
            <button class="btn btn-next" onclick="changeSlide(${idx + 1})">${idx === stepsArray.length - 1 ? 'Hoàn tất 🎉' : 'Tiếp theo ▶'}</button>
        </div>
    </div>
`;
        });

        content += `
    <script>
        function changeSlide(index) {
            if (index === ${stepsArray.length}) {
                alert('Hoàn thành trình chiếu hướng dẫn! 🎉');
                return;
            }
            const activeSlide = document.querySelector('.slide.active');
            if (activeSlide) activeSlide.classList.remove('active');
            const targetSlide = document.getElementById('slide-' + index);
            if (targetSlide) {
                targetSlide.classList.add('active');
            }
        }
        document.addEventListener('keydown', (e) => {
            const activeIndex = Array.from(document.querySelectorAll('.slide')).findIndex(s => s.classList.contains('active'));
            if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
                if (activeIndex < ${stepsArray.length - 1}) changeSlide(activeIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                if (activeIndex > 0) changeSlide(activeIndex - 1);
            }
        });
    </script>
</body>
</html>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default { TourGuide, startTour, exportTour };
