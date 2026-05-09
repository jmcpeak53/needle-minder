import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const threadTypes = sqliteTable("thread_types", {
  id: text("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  productLine: text("product_line").notNull(),
  displayName: text("display_name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const referenceColors = sqliteTable(
  "reference_colors",
  {
    id: text("id").primaryKey(),
    threadTypeId: text("thread_type_id")
      .notNull()
      .references(() => threadTypes.id),
    colorCode: text("color_code").notNull(),
    colorName: text("color_name").notNull(),
    colorFamily: text("color_family").notNull(),
    hexRgb: text("hex_rgb").notNull(),
    isVariegated: integer("is_variegated", { mode: "boolean" }).notNull().default(false),
    threadSubtype: text("thread_subtype").notNull().default("solid"),
    upc: text("upc"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    threadColorUnique: uniqueIndex("reference_colors_thread_color_unique").on(
      table.threadTypeId,
      table.colorCode
    )
  })
);

export const userInventory = sqliteTable("user_inventory", {
  id: text("id").primaryKey(),
  referenceColorId: text("reference_color_id")
    .notNull()
    .references(() => referenceColors.id),
  quantity: integer("quantity").notNull(),
  condition: text("condition", { enum: ["full", "partial"] }).notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  folder: text("folder"),
  name: text("name").notNull(),
  author: text("author"),
  canvasMesh: integer("canvas_mesh"),
  status: text("status", { enum: ["not_started", "pattern", "wip", "finished"] }).notNull(),
  startDate: text("start_date"),
  completedDate: text("completed_date"),
  imageUri: text("image_uri"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const projectThreadReservations = sqliteTable(
  "project_thread_reservations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    referenceColorId: text("reference_color_id")
      .notNull()
      .references(() => referenceColors.id),
    quantity: integer("quantity").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    projectColorUnique: uniqueIndex("project_thread_reservations_project_color_unique").on(
      table.projectId,
      table.referenceColorId
    )
  })
);
