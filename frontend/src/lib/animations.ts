/**
 * Animation Utilities
 * Reusable animation helpers and variants
 */

export type AnimationVariant =
    | 'fade-in'
    | 'fade-out'
    | 'fade-in-up'
    | 'fade-in-down'
    | 'slide-in-left'
    | 'slide-in-right'
    | 'scale-in'
    | 'scale-out'
    | 'bounce'
    | 'shake'
    | 'pulse';

export interface AnimationConfig {
    duration?: number;
    delay?: number;
    easing?: string;
    iterations?: number | 'infinite';
}

/**
 * Get animation class name
 */
export function getAnimationClass(variant: AnimationVariant): string {
    return `animate-${variant}`;
}

/**
 * Apply animation programmatically
 */
export function applyAnimation(
    element: HTMLElement,
    variant: AnimationVariant,
    config: AnimationConfig = {}
): Promise<void> {
    return new Promise((resolve) => {
        const {
            duration = 300,
            delay = 0,
            easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
            iterations = 1,
        } = config;

        const className = getAnimationClass(variant);
        element.classList.add(className);

        // Apply custom styles if provided
        if (duration !== 300) {
            element.style.animationDuration = `${duration}ms`;
        }
        if (delay > 0) {
            element.style.animationDelay = `${delay}ms`;
        }
        if (easing !== 'cubic-bezier(0.4, 0, 0.2, 1)') {
            element.style.animationTimingFunction = easing;
        }
        if (iterations !== 1) {
            element.style.animationIterationCount = iterations.toString();
        }

        // Remove animation class after completion
        const handleAnimationEnd = () => {
            element.classList.remove(className);
            element.style.animationDuration = '';
            element.style.animationDelay = '';
            element.style.animationTimingFunction = '';
            element.style.animationIterationCount = '';
            element.removeEventListener('animationend', handleAnimationEnd);
            resolve();
        };

        if (iterations !== 'infinite') {
            element.addEventListener('animationend', handleAnimationEnd);
        }
    });
}

/**
 * Stagger animations for multiple elements
 */
export function staggerAnimation(
    elements: HTMLElement[],
    variant: AnimationVariant,
    staggerDelay = 100,
    config: AnimationConfig = {}
): Promise<void[]> {
    const promises = elements.map((element, index) => {
        return applyAnimation(element, variant, {
            ...config,
            delay: (config.delay || 0) + index * staggerDelay,
        });
    });

    return Promise.all(promises);
}

/**
 * Create a spring animation using Web Animations API
 */
export function springAnimation(
    element: HTMLElement,
    from: Partial<CSSStyleDeclaration>,
    to: Partial<CSSStyleDeclaration>,
    config: {
        tension?: number;
        friction?: number;
        mass?: number;
    } = {}
): Animation {
    const { tension = 170, friction = 26, mass = 1 } = config;

    // Calculate spring duration (simplified)
    const duration = Math.sqrt(mass / tension) * friction * 100;

    // Create keyframes
    const keyframes = [from, to] as Keyframe[];

    return element.animate(keyframes, {
        duration,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
        fill: 'forwards',
    });
}

/**
 * Ripple effect animation
 */
export function createRipple(
    event: MouseEvent,
    element: HTMLElement,
    color = 'rgba(255, 255, 255, 0.6)'
): void {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background-color: ${color};
    left: ${x}px;
    top: ${y}px;
    transform: scale(0);
    animation: ripple 600ms ease-out;
    pointer-events: none;
  `;

    // Ensure parent is positioned
    if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
    }

    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(
    element: HTMLElement,
    options: {
        offset?: number;
        behavior?: ScrollBehavior;
    } = {}
): void {
    const { offset = 0, behavior = 'smooth' } = options;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior,
    });
}

/**
 * Count-up animation for numbers
 */
export function countUp(
    element: HTMLElement,
    start: number,
    end: number,
    duration = 1000,
    options: {
        decimals?: number;
        suffix?: string;
        prefix?: string;
    } = {}
): void {
    const { decimals = 0, suffix = '', prefix = '' } = options;
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = prefix + current.toFixed(decimals) + suffix;
    }, 16);
}

/**
 * Parallax scroll effect
 */
export function setupParallax(
    element: HTMLElement,
    speed = 0.5
): () => void {
    const handleScroll = () => {
        const scrolled = window.pageYOffset;
        const offset = element.offsetTop;
        const distance = scrolled - offset;
        element.style.transform = `translateY(${distance * speed}px)`;
    };

    window.addEventListener('scroll', handleScroll);

    // Return cleanup function
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}
