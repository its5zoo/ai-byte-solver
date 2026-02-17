/**
 * Markdown Cleaner Utility
 * Cleans markdown syntax artifacts and converts to clean, friendly HTML
 */

/**
 * Removes markdown artifacts and converts markdown to clean HTML
 * - Removes ** (bold markers)
 * - Removes ## (heading markers) 
 * - Converts markdown lists to HTML lists
 * - Preserves math delimiters for KaTeX rendering
 * - Creates friendly, readable text
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Preserve math expressions (we'll process them separately)
  const mathPlaceholders: { placeholder: string; original: string }[] = [];
  let mathCounter = 0;
  
  // Store block math \[...\]
  cleaned = cleaned.replace(/\\\[[\s\S]*?\\\]/g, (match) => {
    const placeholder = `__BLOCK_MATH_${mathCounter}__`;
    mathPlaceholders.push({ placeholder, original: match });
    mathCounter++;
    return placeholder;
  });
  
  // Store inline math \(...\)
  cleaned = cleaned.replace(/\\\([\s\S]*?\\\)/g, (match) => {
    const placeholder = `__INLINE_MATH_${mathCounter}__`;
    mathPlaceholders.push({ placeholder, original: match });
    mathCounter++;
    return placeholder;
  });
  
  // Store $...$ inline math
  cleaned = cleaned.replace(/\$([^\$\n]+)\$/g, (match) => {
    const placeholder = `__INLINE_MATH_${mathCounter}__`;
    mathPlaceholders.push({ placeholder, original: match });
    mathCounter++;
    return placeholder;
  });
  
  // Store $$...$$ block math
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const placeholder = `__BLOCK_MATH_${mathCounter}__`;
    mathPlaceholders.push({ placeholder, original: match });
    mathCounter++;
    return placeholder;
  });
  
  // Remove markdown heading markers (##, ###, etc.) but preserve the text
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>');
  
  // Remove bold/italic markers but preserve emphasis with HTML
  cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '<em>$1</em>');
  cleaned = cleaned.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  cleaned = cleaned.replace(/__(.+?)__/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Convert unordered lists
  cleaned = cleaned.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  cleaned = cleaned.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert ordered lists
  cleaned = cleaned.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Convert line breaks
  cleaned = cleaned.replace(/\n\n+/g, '</p><p>');
  cleaned = cleaned.replace(/\n/g, '<br/>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!cleaned.startsWith('<') && !cleaned.includes('<p>')) {
    cleaned = `<p>${cleaned}</p>`;
  }
  
  // Restore math expressions
  mathPlaceholders.forEach(({ placeholder, original }) => {
    cleaned = cleaned.replace(placeholder, original);
  });
  
  return cleaned;
}

/**
 * Converts markdown to friendly plain text (no HTML)
 * Useful for previews and summaries
 */
export function markdownToPlainText(text: string): string {
  if (!text) return '';
  
  let plain = text;
  
  // Remove markdown syntax
  plain = plain.replace(/^#{1,6}\s+/gm, '');
  plain = plain.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  plain = plain.replace(/\*\*(.+?)\*\*/g, '$1');
  plain = plain.replace(/\*(.+?)\*/g, '$1');
  plain = plain.replace(/___(.+?)___/g, '$1');
  plain = plain.replace(/__(.+?)__/g, '$1');
  plain = plain.replace(/_(.+?)_/g, '$1');
  plain = plain.replace(/^\s*[-*+]\s+/gm, '• ');
  plain = plain.replace(/^\s*\d+\.\s+/gm, '');
  
  // Clean up extra whitespace
  plain = plain.replace(/\n\n+/g, '\n\n');
  plain = plain.trim();
  
  return plain;
}

/**
 * Checks if text contains markdown syntax
 */
export function hasMarkdown(text: string): boolean {
  if (!text) return false;
  
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headings
    /\*\*(.+?)\*\*/,          // Bold
    /\*(.+?)\*/,              // Italic
    /__(.+?)__/,              // Bold (underscores)
    /_(.+?)_/,                // Italic (underscores)
    /^\s*[-*+]\s+/m,          // Unordered lists
    /^\s*\d+\.\s+/m,          // Ordered lists
    /\[.+?\]\(.+?\)/,         // Links
    /!\[.+?\]\(.+?\)/,        // Images
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}
