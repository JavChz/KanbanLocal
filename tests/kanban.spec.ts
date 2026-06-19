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
    const todoColumn = page.locator('div:has-text("To Do")').first();
    await todoColumn.locator('button[title="Add Task"]').click();

    // Fill task input
    await page.locator('input[placeholder="Task Title"]').fill('Write Tests');
    // Click check to submit
    await page.locator('button:has-text("")').locator('svg').nth(1).click(); // the check icon

    // Verify card is added
    await expect(page.locator('div.glass-card')).toContainText('Write Tests');

    // 3. Open details modal
    await page.locator('div.glass-card:has-text("Write Tests")').click();
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
    await page.locator('nav').locator('a:has-text("Settings")').click();
    // Click Spanish language button
    await page.locator('button:has-text("Español")').click();
    // The dashboard header or sidebar should reflect Spanish
    await expect(page.locator('nav')).toContainText('Vista Global');
  });
});
