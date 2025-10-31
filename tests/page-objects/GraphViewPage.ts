import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Position {
  x: number;
  y: number;
}

export class GraphViewPage extends BasePage {
  readonly canvas: Locator;
  readonly addEntityButton: Locator;

  constructor(page: Page) {
    super(page);
    // React Flow canvas - use the rf__wrapper test id which is specific to ReactFlow
    this.canvas = page.getByTestId('rf__wrapper');
    // The add entity button is a floating action button (FAB) in bottom-right corner
    // It's a rounded-full button with bg-primary-500 containing a Plus icon
    this.addEntityButton = page.locator('button.rounded-full.bg-primary-500');
  }

  /**
   * Get an entity node by its name
   */
  getEntityNode(entityName: string): Locator {
    // React Flow nodes typically have a specific structure
    return this.page.locator('.react-flow__node').filter({ hasText: entityName });
  }

  /**
   * Check if an entity exists in the graph
   */
  async hasEntity(entityName: string): Promise<boolean> {
    const node = this.getEntityNode(entityName);
    return node.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get the position of an entity node
   */
  async getEntityPosition(entityName: string): Promise<Position> {
    const node = this.getEntityNode(entityName);
    await expect(node).toBeVisible();

    const boundingBox = await node.boundingBox();
    if (!boundingBox) {
      throw new Error(`Could not get bounding box for entity: ${entityName}`);
    }

    return {
      x: Math.round(boundingBox.x),
      y: Math.round(boundingBox.y),
    };
  }

  /**
   * Drag an entity node to a new position
   */
  async dragEntity(entityName: string, deltaX: number, deltaY: number) {
    const node = this.getEntityNode(entityName);
    await expect(node).toBeVisible();

    // Get current position
    const box = await node.boundingBox();
    if (!box) {
      throw new Error(`Could not get bounding box for entity: ${entityName}`);
    }

    // Drag from center of node
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
    await this.page.mouse.up();

    // Wait a bit for position to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Double-click an entity to open edit modal
   */
  async doubleClickEntity(entityName: string) {
    const node = this.getEntityNode(entityName);
    await expect(node).toBeVisible();
    await node.dblclick();
  }

  /**
   * Click the add entity button to open create modal
   */
  async clickAddEntity() {
    await this.addEntityButton.click();
  }

  /**
   * Get count of entities in the graph
   */
  async getEntityCount(): Promise<number> {
    const nodes = this.page.locator('.react-flow__node');
    return nodes.count();
  }

  /**
   * Get count of relationship lines in the graph
   */
  async getRelationshipCount(): Promise<number> {
    const edges = this.page.locator('.react-flow__edge');
    return edges.count();
  }

  /**
   * Verify the canvas is loaded and interactive
   */
  async waitForCanvasReady() {
    await expect(this.canvas).toBeVisible({ timeout: 10000 });
    // Wait for React Flow to initialize
    await this.page.waitForTimeout(1000);
  }
}
