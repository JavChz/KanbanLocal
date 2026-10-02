import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  ListOrdered,
  Code,
  Quote,
  Link,
  Eye,
  Edit3,
  Columns,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { MarkdownPreview } from '../ui/MarkdownPreview';

interface TaskDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSave?: () => void;
  placeholder?: string;
}

type EditorMode = 'write' | 'preview' | 'split';

export const TaskDescriptionEditor: React.FC<TaskDescriptionEditorProps> = ({
  value,
  onChange,
  isExpanded = false,
  onToggleExpand,
  onSave,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EditorMode>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If collapsed, 'split' mode falls back to 'write'
  const effectiveMode: EditorMode = !isExpanded && mode === 'split' ? 'write' : mode;

  // Compute text statistics
  const stats = useMemo(() => {
    const trimmed = value.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const characters = value.length;
    const lines = value ? value.split('\n').length : 0;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, characters, lines, readMinutes };
  }, [value]);

  // Text insertion helper for toolbar buttons
  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const replacement = before + selectedText + after;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(
        start + before.length,
        newCursorPos
      );
    }, 0);
  };

  // Line prefix helper (for lists, headers, quotes)
  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const effectiveLineEnd = lineEnd === -1 ? value.length : lineEnd;

    const currentLine = value.substring(lineStart, effectiveLineEnd);
    let updatedLine = '';

    if (currentLine.startsWith(prefix)) {
      // Toggle off
      updatedLine = currentLine.substring(prefix.length);
    } else {
      // Add prefix
      updatedLine = prefix + currentLine;
    }

    const newValue = value.substring(0, lineStart) + updatedLine + value.substring(effectiveLineEnd);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + updatedLine.length, lineStart + updatedLine.length);
    }, 0);
  };

  // Keyboard navigation & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Toggle bold on Ctrl/Cmd + B
    if (e.key === 'b' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      insertText('**', '**', 'bold');
      return;
    }

    // Toggle italic on Ctrl/Cmd + I
    if (e.key === 'i' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      insertText('*', '*', 'italic');
      return;
    }

    // Tab key: Insert 2 spaces instead of leaving focus
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      insertText('  ');
    }
  };

  // Toggle checklist item from preview
  const handleToggleTask = (taskIndex: number, newChecked: boolean) => {
    let currentTaskCount = 0;
    const lines = value.split('\n');
    const newLines = lines.map((line) => {
      if (/^[-*]\s*\[([ xX])\]/.test(line)) {
        if (currentTaskCount === taskIndex) {
          currentTaskCount++;
          return line.replace(/^([ -*]*\[)([ xX])(\])/, `$1${newChecked ? 'x' : ' '}$3`);
        }
        currentTaskCount++;
      }
      return line;
    });
    onChange(newLines.join('\n'));
  };

  return (
    <div className={`w-full flex flex-col gap-2 ${isExpanded ? 'flex-1 min-h-0' : ''}`}>
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-800/40 select-none">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t('task_description')}
          </label>
          {isExpanded && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {t('optimal_measure', '65–75ch optimal measure')}
            </span>
          )}
        </div>

        {/* View Mode Switcher & Expand Toggle */}
        <div className="flex items-center gap-1">
          {/* Write / Preview / Split Mode Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                effectiveMode === 'write'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('write', 'Write')}
            >
              <Edit3 size={13} />
              <span>{t('write', 'Write')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                effectiveMode === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('preview', 'Preview')}
            >
              <Eye size={13} />
              <span>{t('preview', 'Preview')}</span>
            </button>
            {isExpanded && (
              <button
                type="button"
                onClick={() => setMode('split')}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  effectiveMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={t('split_view', 'Split view')}
              >
                <Columns size={13} />
                <span>{t('split_view', 'Split')}</span>
              </button>
            )}
          </div>

          {/* Expand / Minimize Toggle Button */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--project-color,#3b82f6)] hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              title={isExpanded ? t('collapse_view', 'Collapse view') : t('expand_view', 'Expand view')}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Formatting Toolbar (shown when in Write or Split mode) */}
      {(effectiveMode === 'write' || effectiveMode === 'split') && (
        <div className="flex items-center gap-0.5 flex-wrap py-1 px-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 select-none">
          <button
            type="button"
            onClick={() => insertText('**', '**', 'bold')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*', 'italic')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('### ')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Heading"
          >
            <Heading size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Bullet List"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('- [ ] ')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Checklist Item"
          >
            <CheckSquare size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertText('`', '`', 'code')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Inline Code"
          >
            <Code size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('> ')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Quote"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](url)', 'link text')}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-350 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Link"
          >
            <Link size={14} />
          </button>
        </div>
      )}

      {/* Editor Body: Write, Preview, or Split View */}
      <div
        className={`w-full ${
          isExpanded ? 'flex-1 min-h-[340px] flex flex-col md:flex-row gap-4' : 'flex flex-col'
        }`}
      >
        {/* Write Pane */}
        {(effectiveMode === 'write' || effectiveMode === 'split') && (
          <div
            className={`w-full flex flex-col ${
              effectiveMode === 'split' ? 'md:w-1/2 flex-1' : isExpanded ? 'flex-1' : ''
            }`}
          >
            <div
              className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3.5 focus-within:border-[var(--project-color,#3b82f6)] focus-within:ring-2 focus-within:ring-[var(--project-color,#3b82f6)]/20 transition-all shadow-xs ${
                isExpanded ? 'flex-1 flex flex-col' : ''
              }`}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || t('task_description')}
                rows={isExpanded ? 14 : 5}
                className={`w-full bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-450 dark:placeholder:text-slate-500 font-sans leading-relaxed text-[15px] resize-none max-w-[72ch] ${
                  isExpanded ? 'flex-1 min-h-[280px]' : 'min-h-[120px]'
                }`}
              />
            </div>
          </div>
        )}

        {/* Preview Pane */}
        {(effectiveMode === 'preview' || effectiveMode === 'split') && (
          <div
            className={`w-full rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/40 p-4 overflow-y-auto text-left ${
              effectiveMode === 'split'
                ? 'md:w-1/2 flex-1 min-h-[300px]'
                : isExpanded
                ? 'flex-1 min-h-[340px]'
                : 'min-h-[140px]'
            }`}
          >
            <MarkdownPreview
              content={value}
              emptyText={t('no_description', 'No description provided yet.')}
              onToggleTask={handleToggleTask}
            />
          </div>
        )}
      </div>

      {/* Editor Footer: Typography Metrics & Keyboard Hint */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-2xs text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-3 font-mono">
          <span>
            {stats.words} {t('words', 'words')}
          </span>
          <span>•</span>
          <span>
            {stats.characters} {t('characters', 'chars')}
          </span>
          <span>•</span>
          <span>
            {stats.lines} {t('lines', 'lines')}
          </span>
          {stats.words > 30 && (
            <>
              <span>•</span>
              <span>
                ~{stats.readMinutes} {t('reading_time', 'min read')}
              </span>
            </>
          )}
        </div>
        <div className="text-2xs text-slate-400 dark:text-slate-500">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-2xs">
            Ctrl + Enter
          </kbd>{' '}
          {t('save', 'to save')}
        </div>
      </div>
    </div>
  );
};
