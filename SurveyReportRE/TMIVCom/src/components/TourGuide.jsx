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

export default { TourGuide, startTour };
