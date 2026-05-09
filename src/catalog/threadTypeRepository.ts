import type { ThreadType } from "../types";

export interface ThreadTypeRepository {
  list(): Promise<ThreadType[]>;
  findById(id: string): Promise<ThreadType | null>;
}
