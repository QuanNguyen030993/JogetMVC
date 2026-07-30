import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';

export const TourGuideTooltip = ({
    step,
    currentStepIndex,
    totalSteps,
    onNext,
    onPrev,
    onSkip,
    targetRect
}) => {
    const tooltipRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, arrowClass: 'arrow-top' });

    const {
        title = '',
        content = '',
        intro = '',
        position = 'bottom' // 'top' | 'bottom' | 'left' | 'right' | 'center'
    } = step;

    const htmlContent = content || intro;

    useEffect(() => {
        if (!targetRect || position === 'center') {
            // Centered overlay placement
            setCoords({
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 150,
                position: 'fixed'
            });
            return;
        }

        const tooltipEl = tooltipRef.current;
        if (!tooltipEl) return;

        const tooltipRect = tooltipEl.getBoundingClientRect();
        const gap = 15; // Distance from target element
        let top = 0;
        let left = 0;
        let arrowClass = 'arrow-top';

        // Calculate best positioning coordinates
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - gap;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                arrowClass = 'arrow-bottom';
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - gap;
                arrowClass = 'arrow-right';
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + gap;
                arrowClass = 'arrow-left';
                break;
            case 'bottom':
            default:
                top = targetRect.bottom + gap;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                arrowClass = 'arrow-top';
                break;
        }

        // Viewport bounds correction
        const margin = 10;
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }
        if (top < margin) top = margin;
        if (top + tooltipRect.height > window.innerHeight - margin) {
            top = window.innerHeight - tooltipRect.height - margin;
        }

        setCoords({ top, left, arrowClass, position: 'absolute' });
    }, [targetRect, position, step]);

    return (
        <div
            ref={tooltipRef}
            style={{
                position: coords.position || 'absolute',
                top: `${coords.top + window.scrollY}px`,
                left: `${coords.left + window.scrollX}px`,
                width: '320px',
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                padding: '16px',
                zIndex: 99999,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: 'auto'
            }}
        >
            {/* Steps Progress Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Bước {currentStepIndex + 1} / {totalSteps}
                </span>
                <button
                    type="button"
                    onClick={onSkip}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                    onMouseEnter={e => e.target.style.color = '#64748b'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >
                    Bỏ qua ✕
                </button>
            </div>

            {/* Content Title */}
            {title && (
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                    {title}
                </div>
            )}

            {/* Description Text with HTML support */}
            {htmlContent && (
                <div
                    style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '14px' }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={onPrev}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        color: currentStepIndex === 0 ? '#cbd5e1' : '#475569',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: currentStepIndex === 0 ? 'default' : 'pointer'
                    }}
                >
                    ◀ Trước
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    {currentStepIndex === totalSteps - 1 ? 'Hoàn tất 🎉' : 'Tiếp theo ▶'}
                </button>
            </div>
        </div>
    );
};

const TourGuide = forwardRef(({
    steps = [],
    onComplete,
    onExit,
    active = false
}, ref) => {
    const [isActive, setIsActive] = useState(active);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        setIsActive(active);
    }, [active]);

    // Track active element bounds dynamically
    useEffect(() => {
        if (!isActive || steps.length === 0 || currentStep >= steps.length) {
            setTargetRect(null);
            return;
        }

        const step = steps[currentStep];
        const el = step.element ? document.querySelector(step.element) : null;

        if (el) {
            // Scroll element into view smoothly if not visible
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Allow animation frame offset to complete
            const updateBounds = () => {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right,
                    bottom: rect.bottom
                });
            };

            setTimeout(updateBounds, 300);
        } else {
            // No target element, fallback to center overlay modal
            setTargetRect(null);
        }
    }, [isActive, currentStep, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        setIsActive(false);
        onExit?.();
    };

    const handleComplete = () => {
        setIsActive(false);
        onComplete?.();
    };

    useImperativeHandle(ref, () => ({
        start() {
            setCurrentStep(0);
            setIsActive(true);
        },
        next() {
            handleNext();
        },
        prev() {
            handlePrev();
        },
        exit() {
            handleSkip();
        },
        isActive() {
            return isActive;
        }
    }));

    if (!isActive || steps.length === 0 || currentStep >= steps.length) return null;

    // SVG clipPath cutout bounds for spotlight mask overlay
    const getSvgMaskPath = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        if (!targetRect) {
            // Full screen dimming if no element
            return `M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z`;
        }

        // Spotlight rectangle cutout overlay coordinates
        const { top, left, width, height } = targetRect;
        const padding = 6;
        const x = left - padding;
        const y = top - padding;
        const w = width + padding * 2;
        const h = height + padding * 2;
        const r = 6; // rounded spotlight corners

        // Path drawing background with custom rectangular cutout
        return `
            M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z 
            M ${x + r} ${y} 
            L ${x + w - r} ${y} 
            A ${r} ${r} 0 0 1 ${x + w} ${y + r} 
            L ${x + w} ${y + h - r} 
            A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} 
            L ${x + r} ${y + h} 
            A ${r} ${r} 0 0 1 ${x} ${y + h - r} 
            L ${x} ${y + r} 
            A ${r} ${r} 0 0 1 ${x + r} ${y} Z
        `;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 99990,
            pointerEvents: 'none'
        }}>
            {/* Backdrop Dimmer Spotlight SVG Cutout */}
            <svg style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto'
            }}>
                <path
                    d={getSvgMaskPath()}
                    fill="rgba(15, 23, 42, 0.65)"
                    fillRule="evenodd"
                    style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
            </svg>

            {/* Floating Onboarding Tooltip Card */}
            <TourGuideTooltip
                step={steps[currentStep]}
                currentStepIndex={currentStep}
                totalSteps={steps.length}
                onNext={handleNext}
                onPrev={handlePrev}
                onSkip={handleSkip}
                targetRect={targetRect}
            />
        </div>
    );
});

TourGuide.displayName = "TourGuide";

// Global singleton controller to quickly trigger tours programmatically
let globalTourRef = null;
let globalTourHost = null;

export const startTour = (stepsArray, options = {}) => {
    if (!stepsArray || stepsArray.length === 0) return;

    if (!globalTourHost) {
        globalTourHost = document.createElement("div");
        globalTourHost.id = "tmiv-tourguide-root";
        document.body.appendChild(globalTourHost);

        const root = createRoot(globalTourHost);
        const refCallback = (r) => {
            globalTourRef = r;
            if (r) {
                r.start();
            }
        };
        root.render(
            <TourGuide 
                ref={refCallback} 
                steps={stepsArray} 
                onComplete={options.onComplete}
                onExit={options.onExit}
            />
        );
    } else {
        if (globalTourRef) {
            // Re-render if steps changed
            const root = createRoot(globalTourHost);
            const refCallback = (r) => {
                globalTourRef = r;
                if (r) {
                    r.start();
                }
            };
            root.render(
                <TourGuide 
                    ref={refCallback} 
                    steps={stepsArray} 
                    onComplete={options.onComplete}
                    onExit={options.onExit}
                />
            );
        }
    }
};

export default { TourGuide, startTour };
