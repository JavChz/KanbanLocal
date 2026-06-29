# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kanban.spec.ts >> KanbanLocal E2E Tests >> should support sidebar collapse/expand and custom delete confirmation modals
- Location: tests\kanban.spec.ts:80:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h3')
Expected substring: "Task Details"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h3')

```

```yaml
- complementary:
  - text: KanbanLocal
  - button "Collapse Sidebar"
  - navigation:
    - link "Home":
      - /url: "#/"
    - link "Global View":
      - /url: "#/global"
    - text: Projects
    - button "Add Project"
    - link "Delete Me Project":
      - /url: "#/project/0d2de10b-1ff8-41b3-ade7-752c6524262e"
  - button "Settings"
- main:
  - heading "Delete Me Project" [level=2]
  - button "Edit Project"
  - heading "To Do" [level=4]
  - text: "1"
  - button "Add Task"
  - button "Delete Me Task"
  - button "Add Task"
  - heading "In Progress" [level=4]
  - text: "0"
  - button "Add Task"
  - button "Add Task"
  - heading "Done" [level=4]
  - text: "0"
  - button "Add Task"
  - button "Add Task"
  - status
```

# Test source

```ts
  18  |     await page.locator('input[placeholder="e.g., Personal Errands"]').fill('Work Board');
  19  |     
  20  |     // Click blue-500 color circle or similar color picker button (we'll just submit the form)
  21  |     await page.locator('button:has-text("Create")').click();
  22  | 
  23  |     // Page should redirect to the project board view
  24  |     await expect(page).toHaveURL(/.*\/project\/.*/);
  25  |     await expect(page.locator('h2')).toContainText('Work Board');
  26  |   });
  27  | 
  28  |   test('should allow task creation, updating task details, and global view list integration', async ({ page }) => {
  29  |     // 1. Create a project first
  30  |     await page.locator('button:has-text("Add Project")').first().click();
  31  |     await page.locator('input[placeholder="e.g., Personal Errands"]').fill('E2E Project');
  32  |     await page.locator('button:has-text("Create")').click();
  33  | 
  34  |     // 2. Add task to Todo column
  35  |     // The columns have add buttons. We'll target the one in the TODO column
  36  |     const todoColumn = page.locator('.glass-panel').filter({ has: page.locator('h4', { hasText: 'To Do' }) });
  37  |     await todoColumn.locator('button[title="Add Task"]').click();
  38  | 
  39  |     // Fill task input and press Enter to submit
  40  |     const taskInput = page.locator('input[placeholder="Task Title"]');
  41  |     await taskInput.fill('Write Tests');
  42  |     await taskInput.press('Enter');
  43  | 
  44  |     // Verify card is added
  45  |     await expect(todoColumn.locator('div.glass-card')).toContainText('Write Tests');
  46  | 
  47  |     // 3. Open details modal
  48  |     await todoColumn.locator('div.glass-card:has-text("Write Tests")').click();
  49  |     await expect(page.locator('h3')).toContainText('Task Details');
  50  | 
  51  |     // Fill details
  52  |     await page.locator('textarea[placeholder="Description"]').fill('Ensure E2E coverage.');
  53  |     
  54  |     // Add tag
  55  |     await page.locator('input[placeholder="Add Tag"]').fill('playwright');
  56  |     await page.locator('input[placeholder="Add Tag"]').press('Enter');
  57  |     
  58  |     // Add link
  59  |     await page.locator('input[placeholder="example.com"]').fill('https://playwright.dev');
  60  |     await page.locator('input[placeholder="example.com"]').press('Enter');
  61  | 
  62  |     // Save details
  63  |     await page.locator('button:has-text("Save")').click();
  64  | 
  65  |     // 4. Verify in Global View
  66  |     await page.locator('nav').locator('a:has-text("Global View")').click();
  67  |     await expect(page.locator('table')).toContainText('Write Tests');
  68  |     await expect(page.locator('table')).toContainText('Ensure E2E coverage.');
  69  | 
  70  |     // 5. Verify Settings language toggle
  71  |     await page.locator('button:has-text("Settings")').click();
  72  |     // Open language dropdown (current language is English)
  73  |     await page.locator('button:has-text("English")').click();
  74  |     // Click Spanish language button
  75  |     await page.locator('button:has-text("Español")').click();
  76  |     // The dashboard header or sidebar should reflect Spanish
  77  |     await expect(page.locator('nav')).toContainText('Vista Global');
  78  |   });
  79  | 
  80  |   test('should support sidebar collapse/expand and custom delete confirmation modals', async ({ page }) => {
  81  |     // 1. Sidebar Collapse and Expand
  82  |     const sidebar = page.locator('aside');
  83  |     const collapseBtn = page.locator('button[aria-label="Collapse Sidebar"]');
  84  |     
  85  |     // Check sidebar starts visible (translate-x-0 or not collapsed)
  86  |     await expect(sidebar).toBeVisible();
  87  |     
  88  |     // Collapse the sidebar
  89  |     await collapseBtn.click();
  90  |     
  91  |     // Check that sidebar is hidden (w-0 / -translate-x-full classes)
  92  |     await expect(sidebar).toHaveClass(/md:w-0/);
  93  |     
  94  |     // Expand sidebar using the floating expand button
  95  |     const expandBtn = page.locator('button[aria-label="Expand Sidebar"]');
  96  |     await expect(expandBtn).toBeVisible();
  97  |     await expandBtn.click();
  98  |     
  99  |     // Sidebar should be visible again
  100 |     await expect(sidebar).toHaveClass(/md:w-64/);
  101 | 
  102 |     // 2. Create Project
  103 |     await page.locator('button:has-text("Add Project")').first().click();
  104 |     await page.locator('input[placeholder="e.g., Personal Errands"]').fill('Delete Me Project');
  105 |     await page.locator('button:has-text("Create")').click();
  106 |     await expect(page.locator('h2')).toContainText('Delete Me Project');
  107 | 
  108 |     // 3. Add a Task
  109 |     const todoColumn = page.locator('.glass-panel').filter({ has: page.locator('h4', { hasText: 'To Do' }) });
  110 |     await todoColumn.locator('button[title="Add Task"]').click();
  111 |     const taskInput = page.locator('input[placeholder="Task Title"]');
  112 |     await taskInput.fill('Delete Me Task');
  113 |     await taskInput.press('Enter');
  114 |     await expect(todoColumn.locator('div.glass-card')).toContainText('Delete Me Task');
  115 | 
  116 |     // 4. Test Task Delete Custom Confirmation
  117 |     await todoColumn.locator('div.glass-card:has-text("Delete Me Task")').click();
> 118 |     await expect(page.locator('h3')).toContainText('Task Details');
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  119 |     
  120 |     // Click Delete button inside Task details
  121 |     await page.locator('button:has-text("Delete")').first().click();
  122 |     
  123 |     // Verify custom ConfirmModal appears
  124 |     const confirmModalHeader = page.locator('h3:has-text("Delete")').last();
  125 |     await expect(confirmModalHeader).toBeVisible();
  126 |     await expect(page.locator('text=Confirm deleting this task.')).toBeVisible();
  127 |     
  128 |     // Click Cancel
  129 |     await page.locator('button:has-text("Cancel")').last().click();
  130 |     // Modal should close and Task Details should still be visible
  131 |     await expect(page.locator('h3')).toContainText('Task Details');
  132 | 
  133 |     // Click Delete again, and Confirm
  134 |     await page.locator('button:has-text("Delete")').first().click();
  135 |     await page.locator('button:has-text("Delete")').last().click(); // Custom confirm button has 'Delete' text
  136 |     
  137 |     // Task should be gone
  138 |     await expect(page.locator('text=Delete Me Task')).not.toBeVisible();
  139 |     
  140 |     // 5. Test Project Delete Custom Confirmation
  141 |     await page.locator('button:has-text("Edit Project")').click();
  142 |     await expect(page.locator('h3')).toContainText('Edit Project');
  143 |     
  144 |     // Click Delete project
  145 |     await page.locator('button:has-text("Delete")').first().click();
  146 |     
  147 |     // Verify custom ConfirmModal appears
  148 |     await expect(page.locator('h3:has-text("Delete Project")')).toBeVisible();
  149 |     await expect(page.locator('text=Confirm deleting this project. All associated tasks will be permanently removed.')).toBeVisible();
  150 |     
  151 |     // Click Cancel
  152 |     await page.locator('button:has-text("Cancel")').last().click();
  153 |     await expect(page.locator('h3')).toContainText('Edit Project');
  154 |     
  155 |     // Click Delete again, and Confirm
  156 |     await page.locator('button:has-text("Delete")').first().click();
  157 |     await page.locator('button:has-text("Delete")').last().click();
  158 |     
  159 |     // Should be redirected to home page
  160 |     await expect(page).toHaveURL(/.*\/$/);
  161 |     await expect(page.locator('h1')).toContainText('Home');
  162 |   });
  163 | });
  164 | 
```