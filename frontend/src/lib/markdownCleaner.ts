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

  // ---- STEP 2: Code Blocks ----

  // Triple backtick code blocks ```[lang]\n[code]\n```
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    // Basic HTML escaping for code content
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();

    return `<div class="code-block-container my-4 group/code shadow-lg">
      <div class="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl border-x border-t border-slate-700/50">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">${lang || 'code'}</span>
        <div class="flex gap-1.5">
          <div class="h-2.5 w-2.5 rounded-full bg-slate-600/50"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" title="Byte AI Snippet"></div>
        </div>
      </div>
      <pre class="code-block m-0 p-4 bg-slate-900 border-x border-b border-slate-700/50 rounded-b-xl overflow-x-auto custom-scrollbar"><code class="text-[13px] font-mono leading-relaxed text-slate-200">${escaped}</code></pre>
    </div>`;
  });

  // ---- STEP 3: Tables ----

  // Detect and render markdown tables
  // Matches: | col | col | \n |---|---| \n | val | val |
  const tableRegex = /^\|(.+)\|\s*\n\|([-| :]+)\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
  html = html.replace(tableRegex, (_match, header, _separator, body) => {
    const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h !== '');
    const rows = body.trim().split('\n').map((row: string) => {
      return row.split('|').map((c: string) => c.trim()).filter((c: string, i: number, arr: string[]) => {
        // Only ignore empty strings at the start/end of the row split by |
        return (i > 0 && i < arr.length - 1) || c !== '';
      });
    });

    const headerHtml = `<thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${rows.map((row: string[]) => `<tr>${row.map((c: string) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;

    return `<div class="table-wrapper prose"><table>${headerHtml}${bodyHtml}</table></div>`;
  });

  // ---- STEP 4: Clean markdown syntax ----

  // Remove --- horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="my-3 border-slate-300 dark:border-slate-600"/>');

  // Headings → bold text (Increased spacing and size)
  html = html.replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block text-lg mt-6 mb-2 text-[hsl(var(--foreground))]">$1</strong>');

  // Bold/italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Inline code (Non-block)
  html = html.replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-sm font-mono">$1</code>');

  // Clean backslash escapes (e.g. \< \> \[ \] used in text)
  html = html.replace(/\\([<>[\]{}()|#*_`~\\])/g, '$1');

  // ---- STEP 4: List processing ----

  // Unordered lists — mark with data-type for wrapping
  html = html.replace(/^[\t ]*[-*+]\s+(.+)$/gm, (match, content) => {
    if (content.includes('code-block-container') || content.includes('table-wrapper')) return match;
    return `<li data-type="ul">${content}</li>`;
  });

  // Ordered lists — mark with data-type for wrapping
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, (match, content) => {
    if (content.includes('code-block-container') || content.includes('table-wrapper')) return match;
    return `<li data-type="ol">${content}</li>`;
  });

  // Wrap consecutive list items in their respective list tags
  html = wrapLists(html);

  // ---- STEP 5: Paragraphs and line breaks ----

  // Avoid braking code blocks and tables into paragraphs
  // Split by code-block or table-wrapper blocks
  const parts = html.split(/(<div class="(?:code-block-container|table-wrapper)[\s\S]*?<\/div>)/);
  html = parts.map(part => {
    if (part.startsWith('<div class="code-block-container') || part.startsWith('<div class="table-wrapper')) {
      return part;
    }

    let processed = part;
    // Double newlines → paragraph breaks
    processed = processed.replace(/\n\n+/g, '</p><p class="mt-2.5">');
    // Single newlines → line breaks
    processed = processed.replace(/\n/g, '<br/>');
    return processed;
  }).join('');

  // Wrap in paragraph if not already a block element
  if (html.trim() && !html.startsWith('<p') && !html.startsWith('<div') && !html.startsWith('<strong')) {
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
