import { test, expect, type Page } from '@playwright/test';

interface StoredTask {
  id: string;
  title: string;
  projectId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  description?: string;
  tags?: string[];
  links?: string[];
  deadline?: string;
  priority?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
}

const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: 'Alpha Board', color: 'blue-500' },
  { id: 'proj-2', name: 'Beta Board', color: 'emerald-500' },
];

async function seedInitialState(
  page: Page,
  tasks: StoredTask[],
  projects = DEFAULT_PROJECTS
) {
  await page.addInitScript(
    (payload) => {
      if (!localStorage.getItem('__e2e_seeded')) {
        localStorage.setItem('__e2e_seeded', '1');
        localStorage.setItem(
          'kanban-local-storage',
          JSON.stringify({
            state: {
              tasks: payload.tasks,
              projects: payload.projects,
              language: 'en',
              lastOpenedProject: payload.projects[0]?.id ?? null,
            },
            version: 0,
          })
        );
      }
    },
    { tasks, projects }
  );
}

async function readStoredTask(page: Page, taskId: string): Promise<StoredTask | null> {
  return page.evaluate((id) => {
    const raw = localStorage.getItem('kanban-local-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed.state?.tasks || []).find((t: StoredTask) => t.id === id) ?? null;
  }, taskId);
}

test.describe('TaskModal auto-save', () => {
  test('auto-saves discrete fields immediately (priority/urgency, tags, links, deadline, project) and persists across reload', async ({
    page,
  }) => {
    await seedInitialState(page, [
      {
        id: 'task-1',
        title: 'Initial Task',
        projectId: 'proj-1',
        status: 'TODO',
        description: '',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1');
    await page.locator('div.glass-card', { hasText: 'Initial Task' }).locator('span').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('status')).toContainText('Auto-save');

    // No Save / Cancel buttons; Close button is present
    await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeVisible();

    // 1. Urgency / priority selector saves immediately
    await dialog.getByRole('button', { name: 'Urgent', exact: true }).click();
    await expect(dialog.getByRole('status')).toContainText('Saved');
    let stored = await readStoredTask(page, 'task-1');
    expect(stored?.priority).toBe('urgent_important');
    expect(stored?.isUrgent).toBe(true);
    expect(stored?.isImportant).toBe(true);

    // 2. Tags save immediately
    const tagInput = dialog.locator('input[placeholder="Add Tag"]');
    await tagInput.fill('backend');
    await tagInput.press('Enter');
    stored = await readStoredTask(page, 'task-1');
    expect(stored?.tags).toEqual(['backend']);

    // 3. Links save immediately
    const linkInput = dialog.locator('input[placeholder="example.com"]');
    await linkInput.fill('playwright.dev');
    await linkInput.press('Enter');
    stored = await readStoredTask(page, 'task-1');
    expect(stored?.links).toEqual(['https://playwright.dev']);

    // 4. Deadline saves immediately
    await dialog.locator('input[type="date"]').fill('2026-12-31');
    stored = await readStoredTask(page, 'task-1');
    expect(stored?.deadline).toBe('2026-12-31');

    // 5. Project change saves immediately
    await dialog.locator('select').selectOption('proj-2');
    stored = await readStoredTask(page, 'task-1');
    expect(stored?.projectId).toBe('proj-2');

    // Close with Escape and reload to confirm persistence
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.reload();
    await page.goto('/KanbanLocal/#/project/proj-2');
    await expect(page.locator('div.glass-card', { hasText: 'Initial Task' })).toBeVisible();
    stored = await readStoredTask(page, 'task-1');
    expect(stored).toMatchObject({
      priority: 'urgent_important',
      isUrgent: true,
      isImportant: true,
      tags: ['backend'],
      links: ['https://playwright.dev'],
      deadline: '2026-12-31',
      projectId: 'proj-2',
    });
  });

  test('debounces description typing and flushes pending title edits immediately on close', async ({
    page,
  }) => {
    await seedInitialState(page, [
      {
        id: 'task-2',
        title: 'Draft Title',
        projectId: 'proj-1',
        status: 'TODO',
        description: '',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1');
    await page.locator('div.glass-card', { hasText: 'Draft Title' }).locator('span').first().click();

    const dialog = page.getByRole('dialog');
    const descriptionArea = dialog.locator('textarea[placeholder="Description"]');

    await descriptionArea.click();
    await descriptionArea.fill('Debounced body text');

    // Immediately after typing, status indicates Saving... and storage is not written yet
    await expect(dialog.getByRole('status')).toContainText('Saving...');
    let stored = await readStoredTask(page, 'task-2');
    expect(stored?.description).toBe('');

    // Wait for debounce (400ms) to finish
    await expect(dialog.getByRole('status')).toContainText('Saved');
    stored = await readStoredTask(page, 'task-2');
    expect(stored?.description).toBe('Debounced body text');

    // Type a new title and close immediately before the 400ms debounce fires
    const titleInput = dialog.locator('input[placeholder="Task Title"]');
    await titleInput.fill('Flushed Title');
    await expect(dialog.getByRole('status')).toContainText('Saving...');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    stored = await readStoredTask(page, 'task-2');
    expect(stored?.title).toBe('Flushed Title');
    await expect(page.locator('div.glass-card', { hasText: 'Flushed Title' })).toBeVisible();
  });

  test('immediately saves markdown checklist toggles in Preview mode', async ({ page }) => {
    await seedInitialState(page, [
      {
        id: 'task-3',
        title: 'Checklist Task',
        projectId: 'proj-1',
        status: 'TODO',
        description: '- [ ] Step 1\n- [ ] Step 2',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1');
    await page.locator('div.glass-card', { hasText: 'Checklist Task' }).locator('span').first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Preview', exact: true }).click();
    await dialog.getByText('Step 1').click();

    await expect(dialog.getByRole('status')).toContainText('Saved');
    const stored = await readStoredTask(page, 'task-3');
    expect(stored?.description).toBe('- [x] Step 1\n- [ ] Step 2');
  });

  test('prevents saving empty title and preserves previous valid title on close', async ({
    page,
  }) => {
    await seedInitialState(page, [
      {
        id: 'task-4',
        title: 'Valid Title',
        projectId: 'proj-1',
        status: 'TODO',
        description: '',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1');
    await page.locator('div.glass-card', { hasText: 'Valid Title' }).locator('span').first().click();

    const dialog = page.getByRole('dialog');
    const titleInput = dialog.locator('input[placeholder="Task Title"]');
    await titleInput.fill('   ');

    await expect(dialog.getByRole('status')).toContainText('Title is required');
    await expect(dialog.getByRole('status')).not.toContainText('Saved');

    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toBeHidden();

    const stored = await readStoredTask(page, 'task-4');
    expect(stored?.title).toBe('Valid Title');
    await expect(page.locator('div.glass-card', { hasText: 'Valid Title' })).toBeVisible();
  });

  test('cancels pending debounced save when task is deleted', async ({ page }) => {
    await seedInitialState(page, [
      {
        id: 'task-5',
        title: 'Delete While Typing',
        projectId: 'proj-1',
        status: 'TODO',
        description: '',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1');
    await page.locator('div.glass-card', { hasText: 'Delete While Typing' }).locator('span').first().click();

    const dialog = page.getByRole('dialog');
    await dialog.locator('textarea[placeholder="Description"]').fill('Unsaved edit');
    await expect(dialog.getByRole('status')).toContainText('Saving...');

    await dialog.locator('button[title="Delete"]').click();
    const confirmDialog = page.getByRole('dialog').last();
    await confirmDialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(600);

    const stored = await readStoredTask(page, 'task-5');
    expect(stored).toBeNull();
  });

  test('keeps modal open when changing project on a task opened via ?task= query param', async ({
    page,
  }) => {
    await seedInitialState(page, [
      {
        id: 'task-6',
        title: 'Deep Linked Task',
        projectId: 'proj-1',
        status: 'TODO',
        description: '',
        tags: [],
        links: [],
      },
    ]);

    await page.goto('/KanbanLocal/#/project/proj-1?task=task-6');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('select').selectOption('proj-2');

    // Modal remains open and reflects Saved + updated projectId
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('status')).toContainText('Saved');
    const stored = await readStoredTask(page, 'task-6');
    expect(stored?.projectId).toBe('proj-2');
  });
});
