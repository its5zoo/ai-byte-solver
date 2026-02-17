/**
 * Math Rendering Utility
 * Handles KaTeX rendering for inline and block math expressions
 */

import katex from 'katex';

export interface MathRenderOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    strict?: boolean;
}

/**
 * Renders math expression using KaTeX
 */
export function renderMath(
    expression: string,
    options: MathRenderOptions = {}
): string {
    const defaultOptions: MathRenderOptions = {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false,
        ...options,
    };

    try {
        return katex.renderToString(expression.trim(), defaultOptions as katex.KatexOptions);
    } catch (error) {
        console.error('KaTeX rendering error:', error);
        // Return the original expression wrapped in code tags
        return `<code class="math-error">${expression}</code>`;
    }
}

/**
 * Renders all math expressions in text (inline and block)
 * Converts LaTeX delimiters to rendered HTML
 */
export function renderMathInText(text: string): string {
    if (!text) return '';

    let html = text;

    // Render block math \[...\]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        return renderMath(math, { displayMode: true });
    });

    // Render inline math \(...\)
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        return renderMath(math, { displayMode: false });
    });

    // Render block math $$...$$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        return renderMath(math, { displayMode: true });
    });

    // Render inline math $...$
    html = html.replace(/\$([^\$\n]+)\$/g, (_, math) => {
        return renderMath(math, { displayMode: false });
    });

    return html;
}

/**
 * Checks if text contains math expressions
 */
export function hasMath(text: string): boolean {
    if (!text) return false;

    const mathPatterns = [
        /\\\[[\s\S]*?\\\]/,    // Block math \[...\]
        /\\\([\s\S]*?\\\)/,    // Inline math \(...\)
        /\$\$[\s\S]*?\$\$/,    // Block math $$...$$
        /\$[^\$\n]+\$/,        // Inline math $...$
    ];

    return mathPatterns.some(pattern => pattern.test(text));
}

/**
 * Extracts math expressions from text
 */
export function extractMathExpressions(text: string): {
    inline: string[];
    block: string[];
} {
    const inline: string[] = [];
    const block: string[] = [];

    // Extract block math
    text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        block.push(math.trim());
        return '';
    });

    text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        block.push(math.trim());
        return '';
    });

    // Extract inline math
    text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        inline.push(math.trim());
        return '';
    });

    text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
        inline.push(math.trim());
        return '';
    });

    return { inline, block };
}

/**
 * Validates if a math expression can be rendered
 */
export function isValidMath(expression: string): boolean {
    try {
        katex.renderToString(expression.trim(), {
            displayMode: false,
            throwOnError: true,
            strict: 'error',
        } as katex.KatexOptions);
        return true;
    } catch {
        return false;
    }
}
