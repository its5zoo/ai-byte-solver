import { useRef, useEffect, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
    fileId: string;
    language: string;
    content: string;
    onChange: (content: string) => void;
    onSave: (content: string) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    cpp: 'cpp',
    c: 'c',
    csharp: 'csharp',
    java: 'java',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    markdown: 'markdown',
    shell: 'shell',
    bash: 'shell',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    rust: 'rust',
    go: 'go',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    text: 'plaintext',
    other: 'plaintext',
};

export default function CodeEditor({ fileId, language, content, onChange, onSave }: CodeEditorProps) {
    const monaco = useMonaco();
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // Define custom dark theme once Monaco is ready
    useEffect(() => {
        if (!monaco) return;

        monaco.editor.defineTheme('ide-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'c084fc', fontStyle: 'bold' },
                { token: 'variable', foreground: '7dd3fc' },
                { token: 'string', foreground: '4ade80' },
                { token: 'string.escape', foreground: '10b981', fontStyle: 'bold' },
                { token: 'number', foreground: 'fb923c' },
                { token: 'comment', foreground: '475569', fontStyle: 'italic' },
                { token: 'function', foreground: 'facc15', fontStyle: 'bold' },
                { token: 'type', foreground: '38bdf8' },
                { token: 'identifier', foreground: '94a3b8' },
                { token: 'operator', foreground: '6366f1' },
                { token: 'delimiter', foreground: '475569' },
                { token: 'tag', foreground: 'f43f5e', fontStyle: 'bold' },
                { token: 'attribute.name', foreground: 'c084fc' },
                { token: 'attribute.value', foreground: '4ade80' },
            ],
            colors: {
                'editor.background': '#0f172a',
                'editor.foreground': '#94a3b8',
                'editor.lineHighlightBackground': '#1e293b50',
                'editor.selectionBackground': '#6366f140',
                'editor.selectionHighlightBackground': '#6366f120',
                'editorLineNumber.foreground': '#334155',
                'editorLineNumber.activeForeground': '#6366f1',
                'editorCursor.foreground': '#6366f1',
                'editorIndentGuide.background': '#1e293b',
                'editorIndentGuide.activeBackground': '#6366f150',
                'editorGutter.background': '#0f172a',
                'editorWidget.background': '#0f172a',
                'editorWidget.border': '#1e293b',
                'editorSuggestWidget.background': '#0f172a',
                'editorSuggestWidget.border': '#1e293b',
                'editorSuggestWidget.selectedBackground': '#6366f130',
                'scrollbar.shadow': '#00000000',
                'scrollbarSlider.background': '#33415550',
                'scrollbarSlider.hoverBackground': '#33415580',
                'scrollbarSlider.activeBackground': '#6366f140',
                'minimap.background': '#0f172a',
                'input.background': '#1e293b',
                'input.border': '#334155',
                'focusBorder': '#6366f1',
            },
        });

        monaco.editor.setTheme('ide-dark');
    }, [monaco]);

    const handleMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monacoInstance: any) => {
        editorRef.current = editorInstance;

        // Ctrl+S / Cmd+S to save
        editorInstance.addCommand(
            monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
            () => {
                const value = editorInstance.getValue();
                onSave(value);
            }
        );

        // Ctrl+K inline AI (placeholder - opens AI panel)
        editorInstance.addCommand(
            monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyK,
            () => {
                // Dispatch custom event that AIAssistantPanel listens to
                window.dispatchEvent(new CustomEvent('ide:ai-inline', {
                    detail: { selection: editorInstance.getModel()?.getValueInRange(editorInstance.getSelection()!) }
                }));
            }
        );

        // Format on button click
        const formatAction = editorInstance.getAction('editor.action.formatDocument');
        if (formatAction) {
            (window as any).__ideFormat = () => editorInstance.trigger('keyboard', 'editor.action.formatDocument', null);
        }
    }, [monaco, onSave]);

    return (
        <div className="h-full w-full overflow-hidden">
            <Editor
                key={fileId}
                height="100%"
                language={LANGUAGE_MAP[language] || 'plaintext'}
                value={content}
                theme="ide-dark"
                onChange={(val) => onChange(val || '')}
                onMount={handleMount}
                options={{
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
                    fontLigatures: true,
                    lineNumbers: 'on',
                    minimap: { enabled: true, scale: 1 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    autoIndent: 'full',
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: { other: true, comments: false, strings: true },
                    parameterHints: { enabled: true },
                    wordWrap: 'off',
                    smoothScrolling: true,
                    cursorBlinking: 'phase',
                    cursorSmoothCaretAnimation: 'on',
                    renderWhitespace: 'selection',
                    bracketPairColorization: { enabled: true },
                    guides: { bracketPairs: true, indentation: true },
                    padding: { top: 12, bottom: 12 },
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                }}
                loading={
                    <div className="flex h-full items-center justify-center bg-[#0f172a]">
                        <div className="text-sm text-slate-500 animate-pulse">Loading editor…</div>
                    </div>
                }
            />
        </div>
    );
}
