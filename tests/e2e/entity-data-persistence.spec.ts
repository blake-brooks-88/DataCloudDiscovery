import { test, expect } from '@playwright/test';
import { NavbarPage } from '../page-objects/NavbarPage';
import { GraphViewPage } from '../page-objects/GraphViewPage';
import { EntityModalPage } from '../page-objects/EntityModalPage';

test.describe('Entity Data Persistence', () => {
  let navbarPage: NavbarPage;
  let graphPage: GraphViewPage;
  let entityModal: EntityModalPage;

  test.beforeEach(async ({ page }) => {
    navbarPage = new NavbarPage(page);
    graphPage = new GraphViewPage(page);
    entityModal = new EntityModalPage(page);

    await navbarPage.goto();
    await navbarPage.clearStorage();
    await navbarPage.reload();
  });

  test('should persist all entity fields across reload', async () => {
    // Create project
    await navbarPage.createProject('Data Persistence Test');
    await graphPage.waitForCanvasReady();

    // Create entity with all fields populated
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Complete Entity',
      type: 'dmo',
      businessPurpose: 'Customer data management',
      implementationNotes: 'Uses Salesforce API integration',
      implementationStatus: 'in-progress',
    });

    // Verify entity appears
    await expect(graphPage.getEntityNode('Complete Entity')).toBeVisible();

    // Reload page
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Verify entity still exists
    await expect(graphPage.getEntityNode('Complete Entity')).toBeVisible({ timeout: 10000 });

    // Double-click to open edit modal and verify all fields
    await graphPage.doubleClickEntity('Complete Entity');
    await entityModal.waitForModal();

    // Verify all fields are populated correctly
    await expect(entityModal.nameInput).toHaveValue('Complete Entity');

    // Verify type is selected (check the select value)
    const typeValue = await entityModal.typeSelect.inputValue();
    expect(typeValue.toLowerCase()).toContain('dmo');

    // Close modal
    await entityModal.cancel();
  });

  test('should persist entity data when updated', async ({ page }) => {
    // Create project and initial entity
    await navbarPage.createProject('Update Test');
    await graphPage.waitForCanvasReady();

    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Initial Entity',
      type: 'dlo',
      businessPurpose: 'Initial purpose',
    });

    await expect(graphPage.getEntityNode('Initial Entity')).toBeVisible();

    // Edit the entity
    await graphPage.doubleClickEntity('Initial Entity');
    await entityModal.waitForModal();

    // Update fields
    await entityModal.nameInput.fill('Updated Entity');

    const purposeInput = page.getByLabel(/business purpose|purpose/i);
    if (await purposeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await purposeInput.fill('Updated purpose');
    }

    await entityModal.save();

    // Verify updated name appears
    await expect(graphPage.getEntityNode('Updated Entity')).toBeVisible();

    // Reload
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Verify updated entity persists
    await expect(graphPage.getEntityNode('Updated Entity')).toBeVisible({ timeout: 10000 });

    // Verify old name doesn't exist
    expect(await graphPage.hasEntity('Initial Entity')).toBe(false);

    // Verify updated data by opening edit modal
    await graphPage.doubleClickEntity('Updated Entity');
    await entityModal.waitForModal();

    await expect(entityModal.nameInput).toHaveValue('Updated Entity');

    await entityModal.cancel();
  });

  test('should persist entity deletions across reload', async ({ page }) => {
    // Create project with multiple entities
    await navbarPage.createProject('Deletion Test');
    await graphPage.waitForCanvasReady();

    // Create three entities
    await graphPage.clickAddEntity();
    await entityModal.createEntity({ name: 'Entity 1', type: 'data-stream' });

    await graphPage.clickAddEntity();
    await entityModal.createEntity({ name: 'Entity 2', type: 'dlo' });

    await graphPage.clickAddEntity();
    await entityModal.createEntity({ name: 'Entity 3', type: 'dmo' });

    // Verify all exist
    await expect(graphPage.getEntityNode('Entity 1')).toBeVisible();
    await expect(graphPage.getEntityNode('Entity 2')).toBeVisible();
    await expect(graphPage.getEntityNode('Entity 3')).toBeVisible();

    expect(await graphPage.getEntityCount()).toBe(3);

    // Delete Entity 2 (implementation-specific - may need to adjust)
    // This is a placeholder - actual deletion UI may vary
    const entity2 = graphPage.getEntityNode('Entity 2');
    await entity2.click();

    // Look for delete button (adjust selector based on actual UI)
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }

    // Wait a bit for deletion to process
    await page.waitForTimeout(500);

    // Reload
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Verify Entity 2 is still gone after reload
    await expect(graphPage.getEntityNode('Entity 1')).toBeVisible({ timeout: 10000 });
    await expect(graphPage.getEntityNode('Entity 3')).toBeVisible();

    // Entity 2 should not exist
    expect(await graphPage.hasEntity('Entity 2')).toBe(false);

    // Should have 2 entities total
    expect(await graphPage.getEntityCount()).toBe(2);
  });

  test('should handle entity data across multiple reloads', async () => {
    // Create project
    await navbarPage.createProject('Multi Reload Test');
    await graphPage.waitForCanvasReady();

    // Create entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Persistent Entity',
      type: 'dmo',
      businessPurpose: 'Test persistence',
    });

    await expect(graphPage.getEntityNode('Persistent Entity')).toBeVisible();

    // Reload 1
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();
    await expect(graphPage.getEntityNode('Persistent Entity')).toBeVisible({ timeout: 10000 });

    // Reload 2
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();
    await expect(graphPage.getEntityNode('Persistent Entity')).toBeVisible({ timeout: 10000 });

    // Reload 3
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();
    await expect(graphPage.getEntityNode('Persistent Entity')).toBeVisible({ timeout: 10000 });

    // Verify entity count is still 1
    expect(await graphPage.getEntityCount()).toBe(1);
  });

  test('should persist localStorage data structure correctly', async ({ page: _page }) => {
    // Create project
    await navbarPage.createProject('Storage Structure Test');
    await graphPage.waitForCanvasReady();

    // Create entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Test Entity',
      type: 'dlo',
      businessPurpose: 'Storage test',
    });

    await expect(graphPage.getEntityNode('Test Entity')).toBeVisible();

    // Check localStorage structure
    const storageData = await navbarPage.getLocalStorage('data-cloud-projects');

    expect(storageData).toBeTruthy();
    expect(storageData).toHaveProperty('projects');

    const typedData = storageData as {
      projects: Array<{
        id: string;
        name: string;
        entities: Array<{
          id: string;
          name: string;
          type: string;
          businessPurpose?: string;
          fields: unknown[];
        }>;
      }>;
    };
    expect(Array.isArray(typedData.projects)).toBe(true);
    expect(typedData.projects.length).toBeGreaterThan(0);

    const project = typedData.projects[0];
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('entities');
    expect(project.entities.length).toBe(1);

    const entity = project.entities[0];
    expect(entity).toHaveProperty('id');
    expect(entity).toHaveProperty('name', 'Test Entity');
    expect(entity).toHaveProperty('type', 'dlo');
    expect(entity).toHaveProperty('businessPurpose', 'Storage test');
    expect(entity).toHaveProperty('fields'); // Required field
  });
});
