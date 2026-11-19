/**
 * Converts Markdown-formatted task descriptions into clean plain text for single-line previews.
 */
export function stripMarkdown(text?: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
    )
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s*\[([ xX])\]\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*(\*{3,}|-{3,}|_{3,})\s*$/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Counts markdown checklist items (`- [ ]` and `- [x]`) in a description.
 */
export function getChecklistProgress(text?: string): { done: number; total: number } {
  if (!text) return { done: 0, total: 0 };
  let total = 0;
  let done = 0;
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s*\[([ xX])\]/);
    if (match) {
      total++;
      if (match[1].toLowerCase() === 'x') {
        done++;
      }
    }
  }
  return { done, total };
}

export type DeadlineState = 'overdue' | 'today' | 'soon' | 'normal';

/**
 * Evaluates a YYYY-MM-DD deadline string against the local calendar date.
 */
export function getDeadlineState(deadline?: string, isDone?: boolean): DeadlineState {
  if (!deadline || isDone) return 'normal';
  const match = deadline.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'normal';

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const due = new Date(year, month, day);
  if (Number.isNaN(due.getTime())) return 'normal';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 2) return 'soon';
  return 'normal';
}
