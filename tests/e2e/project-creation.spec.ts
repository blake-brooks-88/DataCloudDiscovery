import { test, expect } from '@playwright/test';
import { NavbarPage } from '../page-objects/NavbarPage';
import { GraphViewPage } from '../page-objects/GraphViewPage';
import { EntityModalPage } from '../page-objects/EntityModalPage';

test.describe('Project Creation Journey', () => {
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

  test('should create project and add first entity', async ({ page }) => {
    // User lands on app with no projects - verify the heading
    await expect(page.getByRole('heading', { name: /no project/i })).toBeVisible({
      timeout: 5000,
    });

    // Create new project
    await navbarPage.createProject('My First Project');

    // Canvas should be visible and ready
    await graphPage.waitForCanvasReady();

    // Verify project name appears in navbar (if there's a project selector)
    // Note: We're not testing project selection persistence per user request

    // Add first entity
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Customer',
      type: 'dmo',
      businessPurpose: 'Track customer data',
    });

    // Verify entity appears in graph
    await expect(graphPage.getEntityNode('Customer')).toBeVisible();
    expect(await graphPage.getEntityCount()).toBe(1);
  });

  test('should create project with multiple entities', async () => {
    await navbarPage.createProject('Multi-Entity Project');
    await graphPage.waitForCanvasReady();

    // Add Data Stream
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Customer Data Stream',
      type: 'data-stream',
      businessPurpose: 'Ingest customer data',
    });

    // Add DLO
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Customer DLO',
      type: 'dlo',
      businessPurpose: 'Store raw customer data',
    });

    // Add DMO
    await graphPage.clickAddEntity();
    await entityModal.createEntity({
      name: 'Customer Profile DMO',
      type: 'dmo',
      businessPurpose: 'Unified customer profile',
    });

    // Verify all entities exist
    await expect(graphPage.getEntityNode('Customer Data Stream')).toBeVisible();
    await expect(graphPage.getEntityNode('Customer DLO')).toBeVisible();
    await expect(graphPage.getEntityNode('Customer Profile DMO')).toBeVisible();

    expect(await graphPage.getEntityCount()).toBe(3);

    // Reload and verify persistence
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    await expect(graphPage.getEntityNode('Customer Data Stream')).toBeVisible({
      timeout: 10000,
    });
    await expect(graphPage.getEntityNode('Customer DLO')).toBeVisible();
    await expect(graphPage.getEntityNode('Customer Profile DMO')).toBeVisible();

    expect(await graphPage.getEntityCount()).toBe(3);
  });

  test('should handle empty project correctly', async () => {
    // Create project but don't add entities
    await navbarPage.createProject('Empty Project');
    await graphPage.waitForCanvasReady();

    // Verify canvas is empty
    expect(await graphPage.getEntityCount()).toBe(0);

    // Reload
    await navbarPage.reload();
    await graphPage.waitForCanvasReady();

    // Should still be empty
    expect(await graphPage.getEntityCount()).toBe(0);
  });

  // NOTE: Project selection persistence is a known limitation and is deferred.
  // See: https://github.com/yourrepo/issues/XXX
  // When implemented, add test: "should persist selected project across reload"
});
