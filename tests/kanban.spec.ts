import { test, expect } from '@playwright/test';

test.describe('PersonalKanban E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL (configured base basename is /KanbanLocal/)
    await page.goto('/KanbanLocal/');
  });

  test('should display initial empty state and allow project creation', async ({ page }) => {
    // Ensure title or branding is present
    await expect(page.locator('aside')).toContainText('PersonalKanban');

    // Click on Add Project button
    await page.locator('button:has-text("Add Project")').first().click();

    // Fill project form
    await page.locator('input[placeholder="e.g., Personal Errands"]').fill('Work Board');
    
    // Click blue-500 color circle or similar color picker button (we'll just submit the form)
    await page.locator('button:has-text("Create")').click();

    // Page should redirect to the project board view
    await expect(page).toHaveURL(/.*\/project\/.*/);
    await expect(page.locator('h2')).toContainText('Work Board');
  });

  test('should allow task creation, updating task details, and global view list integration', async ({ page }) => {
    // 1. Create a project first
    await page.locator('button:has-text("Add Project")').first().click();
    await page.locator('input[placeholder="e.g., Personal Errands"]').fill('E2E Project');
    await page.locator('button:has-text("Create")').click();

    // 2. Add task to Todo column
    // The columns have add buttons. We'll target the one in the TODO column
    const todoColumn = page.locator('.glass-panel').filter({ has: page.locator('h4', { hasText: 'To Do' }) });
    await todoColumn.locator('button[title="Add Task"]').click();

    // Fill task input and press Enter to submit
    const taskInput = page.locator('input[placeholder="Task Title"]');
    await taskInput.fill('Write Tests');
    await taskInput.press('Enter');

    // Verify card is added
    await expect(todoColumn.locator('div.glass-card')).toContainText('Write Tests');

    // 3. Open details modal
    await todoColumn.locator('div.glass-card:has-text("Write Tests")').click();
    await expect(page.locator('h3')).toContainText('Task Details');

    // Fill details
    await page.locator('textarea[placeholder="Description"]').fill('Ensure E2E coverage.');
    
    // Add tag
    await page.locator('input[placeholder="Add Tag"]').fill('playwright');
    await page.locator('input[placeholder="Add Tag"]').press('Enter');
    
    // Add link
    await page.locator('input[placeholder="example.com"]').fill('https://playwright.dev');
    await page.locator('input[placeholder="example.com"]').press('Enter');

    // Save details
    await page.locator('button:has-text("Save")').click();

    // 4. Verify in Global View
    await page.locator('nav').locator('a:has-text("Global View")').click();
    await expect(page.locator('table')).toContainText('Write Tests');
    await expect(page.locator('table')).toContainText('Ensure E2E coverage.');

    // 5. Verify Settings language toggle
    await page.locator('button:has-text("Settings")').click();
    // Open language dropdown (current language is English)
    await page.locator('button:has-text("English")').click();
    // Click Spanish language button
    await page.locator('button:has-text("Español")').click();
    // The dashboard header or sidebar should reflect Spanish
    await expect(page.locator('nav')).toContainText('Vista Global');
  });

  test('should support sidebar collapse/expand and custom delete confirmation modals', async ({ page }) => {
    // 1. Sidebar Collapse and Expand
    const sidebar = page.locator('aside');
    const collapseBtn = page.locator('button[aria-label="Collapse Sidebar"]');
    
    // Check sidebar starts visible (translate-x-0 or not collapsed)
    await expect(sidebar).toBeVisible();
    
    // Collapse the sidebar
    await collapseBtn.click();
    
    // Check that sidebar is hidden (w-0 / -translate-x-full classes)
    await expect(sidebar).toHaveClass(/md:w-0/);
    
    // Expand sidebar using the floating expand button
    const expandBtn = page.locator('button[aria-label="Expand Sidebar"]');
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();
    
    // Sidebar should be visible again
    await expect(sidebar).toHaveClass(/md:w-64/);

    // 2. Create Project
    await page.locator('button:has-text("Add Project")').first().click();
    await page.locator('input[placeholder="e.g., Personal Errands"]').fill('Delete Me Project');
    await page.locator('button:has-text("Create")').click();
    await expect(page.locator('h2')).toContainText('Delete Me Project');

    // 3. Add a Task
    const todoColumn = page.locator('.glass-panel').filter({ has: page.locator('h4', { hasText: 'To Do' }) });
    await todoColumn.locator('button[title="Add Task"]').click();
    const taskInput = page.locator('input[placeholder="Task Title"]');
    await taskInput.fill('Delete Me Task');
    await taskInput.press('Enter');
    await expect(todoColumn.locator('div.glass-card')).toContainText('Delete Me Task');

    // 4. Test Task Delete Custom Confirmation
    await todoColumn.locator('div.glass-card:has-text("Delete Me Task")').click();
    await expect(page.locator('h3')).toContainText('Task Details');
    
    // Click Delete button inside Task details
    await page.locator('button:has-text("Delete")').first().click();
    
    // Verify custom ConfirmModal appears
    const confirmModalHeader = page.locator('h3:has-text("Delete")').last();
    await expect(confirmModalHeader).toBeVisible();
    await expect(page.locator('text=Confirm deleting this task.')).toBeVisible();
    
    // Click Cancel
    await page.locator('button:has-text("Cancel")').last().click();
    // Modal should close and Task Details should still be visible
    await expect(page.locator('h3')).toContainText('Task Details');

    // Click Delete again, and Confirm
    await page.locator('button:has-text("Delete")').first().click();
    await page.locator('button:has-text("Delete")').last().click(); // Custom confirm button has 'Delete' text
    
    // Task should be gone
    await expect(page.locator('text=Delete Me Task')).not.toBeVisible();
    
    // 5. Test Project Delete Custom Confirmation
    await page.locator('button:has-text("Edit Project")').click();
    await expect(page.locator('h3')).toContainText('Edit Project');
    
    // Click Delete project
    await page.locator('button:has-text("Delete")').first().click();
    
    // Verify custom ConfirmModal appears
    await expect(page.locator('h3:has-text("Delete Project")')).toBeVisible();
    await expect(page.locator('text=Confirm deleting this project. All associated tasks will be permanently removed.')).toBeVisible();
    
    // Click Cancel
    await page.locator('button:has-text("Cancel")').last().click();
    await expect(page.locator('h3')).toContainText('Edit Project');
    
    // Click Delete again, and Confirm
    await page.locator('button:has-text("Delete")').first().click();
    await page.locator('button:has-text("Delete")').last().click();
    
    // Should be redirected to home page
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('h1')).toContainText('Home');
  });
});
