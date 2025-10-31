import { test, expect } from '@playwright/test';
import { NavbarPage } from '../page-objects/NavbarPage';
import { GraphViewPage } from '../page-objects/GraphViewPage';
import { EntityModalPage } from '../page-objects/EntityModalPage';

test.describe('Entity Position Persistence', () => {
  let navbarPage: NavbarPage;
  let graphPage: GraphViewPage;
  let entityModal: EntityModalPage;

  test.beforeEach(async ({ page }) => {
    navbarPage = new NavbarPage(page);
    graphPage = new GraphViewPage(page);
    entityModal = new EntityModalPage(page);

    // Clear storage and start fresh
    await navbarPage.goto();
    await navbarPage.clearStorage();
    await navbarPage.reload();
  });

  test('should persist entity position across page reload', async () => {
    // Step 1: Create a project
    await navbarPage.createProject('Position Test Project');
    await graphPage.waitForCanvasReady();

    // Step 2: Create an entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Customer Entity',
      type: 'dmo',
      businessPurpose: 'Track customer data',
    });

    // Wait for entity to appear
    await expect(graphPage.getEntityNode('Customer Entity')).toBeVisible();

    // Step 3: Get initial position
    const initialPosition = await graphPage.getEntityPosition('Customer Entity');

    // Step 4: Drag entity to a new position (move right 200px, down 150px)
    await graphPage.dragEntity('Customer Entity', 200, 150);

    // Step 5: Get position after drag
    const afterDragPosition = await graphPage.getEntityPosition('Customer Entity');

    // Verify entity moved
    expect(afterDragPosition.x).toBeGreaterThan(initialPosition.x + 150);
    expect(afterDragPosition.y).toBeGreaterThan(initialPosition.y + 100);

    // Step 6: Reload the page (simulate user closing and reopening)
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Step 7: Verify entity still exists
    await expect(graphPage.getEntityNode('Customer Entity')).toBeVisible({ timeout: 10000 });

    // Step 8: Get position after reload
    const afterReloadPosition = await graphPage.getEntityPosition('Customer Entity');

    // Step 9: CRITICAL - Verify position persisted (allow small tolerance for rendering)
    expect(Math.abs(afterReloadPosition.x - afterDragPosition.x)).toBeLessThan(5);
    expect(Math.abs(afterReloadPosition.y - afterDragPosition.y)).toBeLessThan(5);
  });

  test('should persist positions for multiple entities', async () => {
    // Create project
    await navbarPage.createProject('Multi Entity Test');
    await graphPage.waitForCanvasReady();

    // Create first entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Data Stream',
      type: 'data-stream',
    });

    // Create second entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'DLO',
      type: 'dlo',
    });

    // Create third entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'DMO',
      type: 'dmo',
    });

    // Wait for all entities
    await expect(graphPage.getEntityNode('Data Stream')).toBeVisible();
    await expect(graphPage.getEntityNode('DLO')).toBeVisible();
    await expect(graphPage.getEntityNode('DMO')).toBeVisible();

    // Drag entities to different positions
    await graphPage.dragEntity('Data Stream', 100, 50);
    await graphPage.dragEntity('DLO', 200, 150);
    await graphPage.dragEntity('DMO', -50, 100);

    // Get positions after drag
    const positions = {
      dataStream: await graphPage.getEntityPosition('Data Stream'),
      dlo: await graphPage.getEntityPosition('DLO'),
      dmo: await graphPage.getEntityPosition('DMO'),
    };

    // Reload page
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Verify all entities still exist
    await expect(graphPage.getEntityNode('Data Stream')).toBeVisible({ timeout: 10000 });
    await expect(graphPage.getEntityNode('DLO')).toBeVisible();
    await expect(graphPage.getEntityNode('DMO')).toBeVisible();

    // Get positions after reload
    const afterReload = {
      dataStream: await graphPage.getEntityPosition('Data Stream'),
      dlo: await graphPage.getEntityPosition('DLO'),
      dmo: await graphPage.getEntityPosition('DMO'),
    };

    // Verify all positions persisted
    expect(Math.abs(afterReload.dataStream.x - positions.dataStream.x)).toBeLessThan(5);
    expect(Math.abs(afterReload.dataStream.y - positions.dataStream.y)).toBeLessThan(5);

    expect(Math.abs(afterReload.dlo.x - positions.dlo.x)).toBeLessThan(5);
    expect(Math.abs(afterReload.dlo.y - positions.dlo.y)).toBeLessThan(5);

    expect(Math.abs(afterReload.dmo.x - positions.dmo.x)).toBeLessThan(5);
    expect(Math.abs(afterReload.dmo.y - positions.dmo.y)).toBeLessThan(5);
  });

  test('should persist entity position with decimal precision', async ({ page: _page }) => {
    // Create project and entity
    await navbarPage.createProject('Precision Test');
    await graphPage.waitForCanvasReady();

    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Precise Entity',
      type: 'dlo',
    });

    await expect(graphPage.getEntityNode('Precise Entity')).toBeVisible();

    // Make several small drags to create decimal positions
    await graphPage.dragEntity('Precise Entity', 33, 27);
    await graphPage.dragEntity('Precise Entity', 17, 13);
    await graphPage.dragEntity('Precise Entity', 11, 9);

    const positionBefore = await graphPage.getEntityPosition('Precise Entity');

    // Reload
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    await expect(graphPage.getEntityNode('Precise Entity')).toBeVisible({ timeout: 10000 });

    const positionAfter = await graphPage.getEntityPosition('Precise Entity');

    // Verify decimal precision is maintained (very tight tolerance)
    expect(Math.abs(positionAfter.x - positionBefore.x)).toBeLessThan(2);
    expect(Math.abs(positionAfter.y - positionBefore.y)).toBeLessThan(2);
  });
});
