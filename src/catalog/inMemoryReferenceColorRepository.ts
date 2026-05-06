import type { ReferenceColor } from "../types";
import type { ReferenceColorRepository } from "./referenceColorRepository";

export class InMemoryReferenceColorRepository implements ReferenceColorRepository {
  constructor(private readonly colors: ReferenceColor[]) {}

  async list(): Promise<ReferenceColor[]> {
    return this.colors;
  }

  async search(query: string): Promise<ReferenceColor[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.colors;
    }

    return this.colors.filter((color) => {
      return (
        color.colorCode.toLowerCase().includes(normalized) ||
        color.colorName.toLowerCase().includes(normalized) ||
        color.colorFamily.toLowerCase().includes(normalized)
      );
    });
  }

  async listByFamily(family: string): Promise<ReferenceColor[]> {
    return this.colors.filter((color) => color.colorFamily === family);
  }

  async findByCode(code: string): Promise<ReferenceColor | null> {
    const normalized = code.trim().toUpperCase();
    return this.colors.find((color) => color.colorCode === normalized) ?? null;
  }

  async findByUpc(upc: string): Promise<ReferenceColor | null> {
    return this.colors.find((color) => color.upc === upc) ?? null;
  }
}
