import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavbarPage extends BasePage {
  readonly projectSelector: Locator;

  constructor(page: Page) {
    super(page);
    // "Select Project" dropdown button in navbar
    this.projectSelector = page.getByRole('button', { name: /select project/i });
  }

  async createProject(projectName: string) {
    // Check if we're on the empty state (no projects) - shows "Create Your First Project" button
    const firstProjectButton = this.page.getByRole('button', {
      name: /create your first project/i,
    });
    const hasFirstProjectButton = await firstProjectButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasFirstProjectButton) {
      // Click the "Create Your First Project" button in the center of the page
      await firstProjectButton.click();
    } else {
      // Otherwise, click the "Select Project" dropdown to find new project option
      await this.projectSelector.click();
      // Look for an option or button to create a new project in the dropdown
      const newProjectOption = this.page.getByRole('button', {
        name: /new project|\+ project|add project/i,
      });
      await newProjectOption.click();
    }

    // Fill in project name in dialog
    const nameInput = this.page
      .getByLabel(/project name/i)
      .or(this.page.getByPlaceholder(/project name/i));
    await nameInput.fill(projectName);

    // Click create/save button
    const createButton = this.page.getByRole('button', { name: /create|save/i });
    await createButton.click();

    // Wait for dialog to close
    await expect(nameInput).not.toBeVisible({ timeout: 5000 });
  }

  async selectProject(projectName: string) {
    await this.projectSelector.click();
    await this.page.getByRole('option', { name: projectName }).click();
  }

  async getCurrentProjectName(): Promise<string> {
    const text = await this.projectSelector.textContent();
    return text?.trim() || '';
  }

  async exportAsJSON() {
    // Click export button/menu item
    const exportButton = this.page.getByRole('button', { name: /export/i });
    await exportButton.click();

    // Wait for download
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .getByRole('menuitem', { name: /json/i })
      .or(this.page.getByRole('button', { name: /json/i }))
      .click();

    const download = await downloadPromise;
    return download;
  }
}
