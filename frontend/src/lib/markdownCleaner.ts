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
 * Format specialized DeepSeek JSON coding responses into a premium UI card
 */
function buildStructuredCodingResponse(parsed: any): string {
  let explanationHtml = '';
  if (parsed.explanation) {
    // Process the explanation to support markdown inside it
    explanationHtml = processAIResponse(parsed.explanation);
  }

  const escapedCode = (parsed.codePatch || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

  return `<div class="ai-structured-response my-6 flex flex-col overflow-hidden rounded-2xl border border-[hsl(var(--glass-border))] bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
    <div class="flex items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-violet-400"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
      <span class="text-[13px] font-bold tracking-wide text-slate-200">AI Coding Assistant</span>
    </div>
    ${explanationHtml ? `
    <div class="px-5 py-5 prose prose-invert max-w-none text-[14.5px] leading-relaxed text-slate-300 [&_strong]:text-white [&_strong]:font-semibold">
      ${explanationHtml}
    </div>
    ` : ''}
    ${escapedCode ? `
    <div class="border-t border-white/10 bg-[#0a0f1a] p-5">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Implementation</span>
        </div>
        <div class="flex gap-1.5">
          <div class="h-2 w-2 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <div class="h-2 w-2 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          <div class="h-2 w-2 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
        </div>
      </div>
      <div class="relative rounded-xl border border-white/5 bg-black/40 p-4">
        <pre class="m-0 overflow-x-auto custom-scrollbar"><code class="block text-[13.5px] font-mono leading-relaxed text-slate-200">${escapedCode}</code></pre>
      </div>
    </div>
    ` : ''}
  </div>`;
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

  // ---- STEP 1.1: Reasoning Blocks ----
  // Detect and render <thought> blocks (DeepSeek Reasoning)
  html = html.replace(/<thought>([\s\S]*?)<\/thought>/g, (_, content) => {
    return `<div class="ai-reasoning my-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-5 shadow-sm backdrop-blur-sm">
      <div class="mb-3 flex items-center gap-2 text-amber-600/80 dark:text-amber-500/80">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><path d="M10 22h4"/></svg>
        <span class="text-[11px] font-black uppercase tracking-[0.1em] font-sans">Byte Reasoning</span>
      </div>
      <div class="text-[13.5px] italic leading-relaxed text-slate-600 dark:text-slate-400/90 font-sans border-l-2 border-amber-500/20 pl-4 py-1">
        ${content.trim().replace(/\n/g, '<br/>')}
      </div>
    </div>`;
  });

  // ---- STEP 1.5: Clean backslash escapes ----
  // DeepSeek often returns `\*\*Explanation\*\*` and `\```cpp`. We unescape these before formatting.
  html = html.replace(/\\([<>[\]{}()|#*_`~\\])/g, '$1');

  // ---- STEP 2: Code Blocks ----

  // Triple backtick code blocks ```[lang]\n[code]\n```
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    if (lang?.toLowerCase() === 'json') {
      try {
        const parsed = JSON.parse(code);
        if (parsed.explanation || parsed.codePatch) {
          return buildStructuredCodingResponse(parsed);
        }
      } catch (e) {
        // Fall back to standard code block formatting if JSON is invalid
      }
    }

    // Basic HTML escaping for code content
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();

    // Check if it's a tiny snippet (often used in explanations)
    const lines = code.trim().split('\n');
    const isTiny = lines.length <= 2 && code.length < 150;

    if (isTiny && lang !== 'json') {
      return `<div class="my-3 rounded-xl bg-slate-900 border border-slate-800/50 px-5 py-3.5 font-mono text-[13.5px] text-slate-300 shadow-inner group/tiny relative overflow-x-auto custom-scrollbar">
        <code class="whitespace-pre">${escaped}</code>
        <div class="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-violet-500/30"></div>
      </div>`;
    }

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

  // Images ![alt](url) - DISABLED
  // html = html.replace(/!\[(.*?)\]\s*\((.*?)\)/g, (_match, alt, url) => {
  //   const safeUrl = url.trim().replace(/ /g, '%20');
  //   return `<img src="${safeUrl}" alt="${alt}" class="my-4 w-full max-w-md rounded-2xl shadow-lg border border-[hsl(var(--glass-border))] object-cover object-center bg-slate-900/50" loading="lazy" />`;
  // });

  // Links [text](url)
  html = html.replace(/(?<!!)\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 underline underline-offset-2 transition-colors">$1</a>');

  // Headings → bold text (Increased spacing and size)
  html = html.replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block text-lg mt-6 mb-2 text-[hsl(var(--foreground))]">$1</strong>');

  // Bold/italic
  html = html.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/___([\s\S]+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');

  // Inline code (Non-block)
  html = html.replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-sm font-mono">$1</code>');

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
