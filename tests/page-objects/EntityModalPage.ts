import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface EntityData {
  name: string;
  type: 'data-source' | 'data-stream' | 'dlo' | 'dmo' | 'data-transform';
  businessPurpose?: string;
  implementationNotes?: string;
  implementationStatus?: 'not-started' | 'in-progress' | 'completed';
}

export class EntityModalPage extends BasePage {
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modal = page.locator('[role="dialog"]').or(page.locator('.entity-modal'));
    // Use data-testid attributes from EntityModal.tsx
    this.nameInput = page.getByTestId('input-entity-name');
    this.typeSelect = page.getByTestId('select-entity-type');
    this.saveButton = page.getByTestId('button-save-entity');
    this.cancelButton = page.getByTestId('button-cancel');
  }

  async waitForModal() {
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  async fillForm(data: EntityData) {
    await this.nameInput.fill(data.name);

    // Select entity type
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(data.type, 'i') }).click();

    // Fill optional fields if provided
    if (data.businessPurpose) {
      // Use data-testid for business purpose textarea
      const purposeInput = this.page.getByTestId('textarea-business-purpose');
      if (await purposeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await purposeInput.fill(data.businessPurpose);
      }
    }

    if (data.implementationNotes) {
      const notesInput = this.page.getByLabel(/implementation notes|notes/i);
      if (await notesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await notesInput.fill(data.implementationNotes);
      }
    }

    if (data.implementationStatus) {
      const statusSelect = this.page.getByLabel(/implementation status|status/i);
      if (await statusSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await statusSelect.click();
        await this.page
          .getByRole('option', {
            name: new RegExp(data.implementationStatus, 'i'),
          })
          .click();
      }
    }

    // Add a field since the save button is disabled without at least one field
    const addFieldButton = this.page.getByTestId('button-add-field');
    await addFieldButton.click();

    // Fill in the first field with a default ID field
    // Wait for the field to appear and then fill it
    const firstFieldNameInput = this.page.getByPlaceholder(/field name/i).first();
    await firstFieldNameInput.waitFor({ timeout: 2000 });
    await firstFieldNameInput.fill('id');
  }

  async save() {
    await this.saveButton.click();
    // Wait for modal to close
    await expect(this.modal).not.toBeVisible({ timeout: 5000 });
  }

  async cancel() {
    await this.cancelButton.click();
    await expect(this.modal).not.toBeVisible({ timeout: 5000 });
  }

  async createEntity(data: EntityData) {
    await this.waitForModal();
    await this.fillForm(data);
    await this.save();
  }
}
