import React from 'react';
import { CheckSquare, Square, ExternalLink } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  emptyText?: string;
  className?: string;
  onToggleTask?: (index: number, newChecked: boolean) => void;
}

/**
 * Parses inline formatting: bold, italic, code, strikethrough, and links.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex matches:
  // 1: `code`
  // 2: **bold** or __bold__
  // 3: *italic* or _italic_
  // 4: ~~strikethrough~~
  // 5: [link text](url)
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)|(~~[^~]+~~)|(\[[^\]]+\]\([^)]+\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith('`') && matched.endsWith('`')) {
      nodes.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800/80 font-mono text-[13px] text-blue-600 dark:text-blue-400 font-medium"
        >
          {matched.slice(1, -1)}
        </code>
      );
    } else if (
      (matched.startsWith('**') && matched.endsWith('**')) ||
      (matched.startsWith('__') && matched.endsWith('__'))
    ) {
      nodes.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-slate-50">
          {matched.slice(2, -2)}
        </strong>
      );
    } else if (
      (matched.startsWith('*') && matched.endsWith('*')) ||
      (matched.startsWith('_') && matched.endsWith('_'))
    ) {
      nodes.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {matched.slice(1, -1)}
        </em>
      );
    } else if (matched.startsWith('~~') && matched.endsWith('~~')) {
      nodes.push(
        <del key={match.index} className="line-through text-slate-400 dark:text-slate-500">
          {matched.slice(2, -2)}
        </del>
      );
    } else if (matched.startsWith('[') && matched.includes('](')) {
      const linkMatch = matched.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, href] = linkMatch;
        nodes.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--project-color,#3b82f6)] hover:underline font-medium"
          >
            <span>{linkText}</span>
            <ExternalLink size={12} className="inline opacity-70" />
          </a>
        );
      } else {
        nodes.push(matched);
      }
    } else {
      nodes.push(matched);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  emptyText = 'No description provided yet.',
  className = '',
  onToggleTask,
}) => {
  if (!content || !content.trim()) {
    return (
      <div className={`p-4 text-center text-slate-400 dark:text-slate-500 italic text-sm ${className}`}>
        {emptyText}
      </div>
    );
  }

  // Parse lines and blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let checklistCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={`codeblock-${i}`} className="my-3 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm">
            {codeBlockLang && (
              <div className="px-3 py-1 bg-slate-900/90 text-2xs font-mono uppercase text-slate-400 border-b border-slate-800">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3.5 bg-slate-950/90 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-slate-200/80 dark:border-slate-800/80" />
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-4 mb-2 first:mt-0 tracking-tight"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-1.5 first:mt-0 tracking-tight"
        >
          {renderInlineFormatting(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1 first:mt-0"
        >
          {renderInlineFormatting(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-[var(--project-color,#3b82f6)] pl-3.5 my-2.5 py-0.5 italic text-slate-600 dark:text-slate-350 bg-slate-100/40 dark:bg-slate-900/20 rounded-r-lg"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Checklist Item: - [ ] or - [x]
    const checkMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[1].toLowerCase() === 'x';
      const itemText = checkMatch[2];
      const taskIndex = checklistCounter++;

      elements.push(
        <div
          key={`check-${i}`}
          onClick={() => onToggleTask && onToggleTask(taskIndex, !isChecked)}
          className={`flex items-start gap-2.5 my-1.5 select-none ${
            onToggleTask ? 'cursor-pointer group' : ''
          }`}
        >
          <span className="mt-0.5 text-slate-500 dark:text-slate-400 group-hover:text-[var(--project-color,#3b82f6)] transition-colors">
            {isChecked ? (
              <CheckSquare size={16} className="text-[var(--project-color,#3b82f6)]" />
            ) : (
              <Square size={16} />
            )}
          </span>
          <span
            className={`text-[15px] leading-relaxed ${
              isChecked
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {renderInlineFormatting(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // Unordered List item: - or *
    if (/^[-*]\s+/.test(trimmed)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--project-color,#3b82f6)] mt-2 shrink-0 opacity-80" />
          <span className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
            {renderInlineFormatting(trimmed.replace(/^[-*]\s+/, ''))}
          </span>
        </div>
      );
      continue;
    }

    // Ordered List item: 1. 2.
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 my-1 pl-1 font-sans">
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 shrink-0 min-w-[18px]">
            {orderedMatch[1]}.
          </span>
          <span className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
            {renderInlineFormatting(orderedMatch[2])}
          </span>
        </div>
      );
      continue;
    }

    // Empty line -> paragraph separator
    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-2.5" />);
      continue;
    }

    // Standard paragraph with line-height and optimal reading measure
    elements.push(
      <p
        key={`p-${i}`}
        className="text-[15px] sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 mb-2 last:mb-0 max-w-[72ch] text-pretty"
      >
        {renderInlineFormatting(rawLine)}
      </p>
    );
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <div key="codeblock-unclosed" className="my-3 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm">
        <pre className="p-3.5 bg-slate-950/90 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`prose-container max-w-[72ch] text-left break-words ${className}`}>
      {elements}
    </div>
  );
};
