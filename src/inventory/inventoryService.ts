import type { AddInventoryInput, InventoryRepository, UpdateInventoryInput } from "./inventoryRepository";
import { MAX_INVENTORY_NOTES_LENGTH } from "./inventoryNotes";

export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async list() {
    return this.repository.list();
  }

  async addOrUpdate(input: AddInventoryInput): Promise<void> {
    assertPositiveQuantity(input.quantity);
    await this.repository.addOrUpdate({
      ...input,
      notes: normalizeNotes(input.notes)
    });
  }

  async update(id: string, input: UpdateInventoryInput): Promise<void> {
    if (input.quantity !== undefined) {
      assertPositiveQuantity(input.quantity);
    }

    await this.repository.update(id, {
      ...input,
      notes: normalizeNotes(input.notes)
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

function normalizeNotes(notes: string | null | undefined): string | null | undefined {
  if (notes === undefined) {
    return undefined;
  }

  if (notes === null) {
    return null;
  }

  const trimmed = notes.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_INVENTORY_NOTES_LENGTH) {
    throw new Error(`Notes must be ${MAX_INVENTORY_NOTES_LENGTH} characters or fewer.`);
  }

  return trimmed;
}
