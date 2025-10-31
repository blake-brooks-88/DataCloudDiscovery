import { type Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForLoadState() {
    await this.page.waitForLoadState('networkidle');
  }

  async reload() {
    await this.page.reload();
    await this.waitForLoadState();
  }

  /**
   * Clear localStorage to reset app state
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Get data from localStorage
   */
  async getLocalStorage(key: string): Promise<unknown> {
    return this.page.evaluate((storageKey) => {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    }, key);
  }
}
