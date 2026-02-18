/**
 * Markdown Cleaner + Math Renderer
 * Cleans markdown syntax and renders math in one pass to avoid placeholder issues
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Render a single math expression with KaTeX
 */
function renderKatex(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      strict: false,
    } as katex.KatexOptions);
  } catch {
    return `<code class="math-error">${expr}</code>`;
  }
}

/**
 * Wrap consecutive <li data-type="ul"> in <ul> and <li data-type="ol"> in <ol>
 */
function wrapLists(html: string): string {
  // Wrap unordered list items
  html = html.replace(/((?:<li data-type="ul">[\s\S]*?<\/li>\n?)+)/g, (match) => {
    const items = match.replace(/<li data-type="ul">/g, '<li>');
    return `<ul class="list-disc pl-5 my-1.5 space-y-0.5">${items}</ul>`;
  });

  // Wrap ordered list items
  html = html.replace(/((?:<li data-type="ol">[\s\S]*?<\/li>\n?)+)/g, (match) => {
    const items = match.replace(/<li data-type="ol">/g, '<li>');
    return `<ol class="list-decimal pl-5 my-1.5 space-y-0.5">${items}</ol>`;
  });

  return html;
}

/**
 * Process AI response: render math first, then clean markdown
 * This avoids the placeholder corruption bugs
 */
export function processAIResponse(text: string): string {
  if (!text) return '';

  let html = text;

  // ---- STEP 1: Render math FIRST (before any markdown processing) ----

  // Block math $$...$$ (must be before single $)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) =>
    renderKatex(math, true)
  );

  // Block math \[...\]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
    renderKatex(math, true)
  );

  // Inline math \(...\)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) =>
    renderKatex(math, false)
  );

  // Inline math $...$ (single dollar, not inside katex output)
  html = html.replace(/\$([^\$\n]+)\$/g, (_, math) => {
    if (math.includes('class="katex"')) return `$${math}$`;
    return renderKatex(math, false);
  });

  // ---- STEP 2: Clean markdown syntax ----

  // Remove --- horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="my-3 border-slate-300 dark:border-slate-600"/>');

  // Headings → bold text
  html = html.replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block text-base mt-3 mb-1">$1</strong>');

  // Bold/italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-sm font-mono">$1</code>');

  // Clean backslash escapes (e.g. \< \> \[ \] used in text)
  html = html.replace(/\\([<>[\]{}()|#*_`~\\])/g, '$1');

  // ---- STEP 3: List processing ----

  // Unordered lists — mark with data-type for wrapping
  html = html.replace(/^[\t ]*[-*+]\s+(.+)$/gm, '<li data-type="ul">$1</li>');

  // Ordered lists — mark with data-type for wrapping
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li data-type="ol">$1</li>');

  // Wrap consecutive list items in their respective list tags
  html = wrapLists(html);

  // ---- STEP 4: Paragraphs and line breaks ----

  // Double newlines → paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="mt-2">');

  // Single newlines → line breaks
  html = html.replace(/\n/g, '<br/>');

  // Wrap in paragraph if not already a block element
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

/**
 * Process user message (minimal formatting, just math + line breaks)
 */
export function processUserMessage(text: string): string {
  if (!text) return '';

  let html = text;

  // Render math
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => renderKatex(m, true));
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => renderKatex(m, true));
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => renderKatex(m, false));
  html = html.replace(/\$([^\$\n]+)\$/g, (_, m) => renderKatex(m, false));

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}
