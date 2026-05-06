import { InventoryService } from "../src/inventory/inventoryService";
import type { InventoryRepository } from "../src/inventory/inventoryRepository";
import type { InventoryItem } from "../src/types";

const sampleItem: InventoryItem = {
  id: "inv-1",
  referenceColor: {
    id: "color-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    upc: null
  },
  quantity: 2,
  condition: "full",
  notes: null
};

function createRepository(item: InventoryItem | null = sampleItem): InventoryRepository {
  return {
    list: jest.fn(async () => (item ? [item] : [])),
    findById: jest.fn(async () => item),
    addOrUpdate: jest.fn(async () => undefined),
    update: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined)
  };
}

describe("InventoryService", () => {
  it("rejects zero or negative quantities when adding inventory", async () => {
    const repository = createRepository();
    const service = new InventoryService(repository);

    await expect(
      service.addOrUpdate({
        referenceColorId: "color-310",
        quantity: 0,
        condition: "full"
      })
    ).rejects.toThrow("Quantity must be at least 1.");

    expect(repository.addOrUpdate).not.toHaveBeenCalled();
  });

  it("decrements an inventory item by one by default", async () => {
    const repository = createRepository(sampleItem);
    const service = new InventoryService(repository);

    await service.decrement("inv-1");

    expect(repository.update).toHaveBeenCalledWith("inv-1", { quantity: 1 });
  });

  it("removes an item when decrementing its final skein", async () => {
    const repository = createRepository({ ...sampleItem, quantity: 1 });
    const service = new InventoryService(repository);

    await service.decrement("inv-1");

    expect(repository.remove).toHaveBeenCalledWith("inv-1");
  });

  it("blocks decrement amounts larger than the inventory quantity", async () => {
    const repository = createRepository(sampleItem);
    const service = new InventoryService(repository);

    await expect(service.decrement("inv-1", 3)).rejects.toThrow(
      "Cannot decrement more skeins than are in inventory."
    );
  });
});
