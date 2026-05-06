import type { AddInventoryInput, InventoryRepository, UpdateInventoryInput } from "./inventoryRepository";

export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async list() {
    return this.repository.list();
  }

  async addOrUpdate(input: AddInventoryInput): Promise<void> {
    assertPositiveQuantity(input.quantity);
    await this.repository.addOrUpdate({
      ...input,
      notes: input.notes?.trim() || null
    });
  }

  async update(id: string, input: UpdateInventoryInput): Promise<void> {
    if (input.quantity !== undefined) {
      assertPositiveQuantity(input.quantity);
    }

    await this.repository.update(id, {
      ...input,
      notes: input.notes?.trim() || null
    });
  }

  async decrement(id: string, amount = 1): Promise<void> {
    assertPositiveQuantity(amount);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("Inventory item not found.");
    }

    if (amount > item.quantity) {
      throw new Error("Cannot decrement more skeins than are in inventory.");
    }

    const nextQuantity = item.quantity - amount;
    if (nextQuantity === 0) {
      await this.repository.remove(id);
      return;
    }

    await this.repository.update(id, { quantity: nextQuantity });
  }

  async remove(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}

function assertPositiveQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }
}
