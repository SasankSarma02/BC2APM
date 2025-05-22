import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model kept for authentication purposes
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Artifact types
export const artifactTypes = [
  "trading_partner",
  "channel",
  "certificate",
  "map",
  "endpoint",
  "schema",
  "other",
] as const;

export const artifactStatuses = [
  "new",
  "pending",
  "migrated",
  "error",
] as const;

// Artifact model to store BC extracted artifacts
export const artifacts = pgTable("artifacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalId: text("original_id").notNull(),
  type: text("type").$type<typeof artifactTypes[number]>().notNull(),
  status: text("status").$type<typeof artifactStatuses[number]>().notNull().default("new"),
  originalData: jsonb("original_data").notNull(),
  transformedData: jsonb("transformed_data"),
  apmId: text("apm_id"),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  extractionId: integer("extraction_id").notNull(),
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
});

export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type Artifact = typeof artifacts.$inferSelect;

// Extraction model to track extraction runs
export const extractions = pgTable("extractions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  method: text("method").notNull(),
  status: text("status").notNull(),
  artifactCount: integer("artifact_count").notNull().default(0),
  metadata: jsonb("metadata"),
});

export const insertExtractionSchema = createInsertSchema(extractions).omit({
  id: true,
});

export type InsertExtraction = z.infer<typeof insertExtractionSchema>;
export type Extraction = typeof extractions.$inferSelect;

// Migration model to track migration attempts
export const migrations = pgTable("migrations", {
  id: serial("id").primaryKey(),
  artifactId: integer("artifact_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull(),
  apmResponse: jsonb("apm_response"),
  errorMessage: text("error_message"),
});

export const insertMigrationSchema = createInsertSchema(migrations).omit({
  id: true,
});

export type InsertMigration = z.infer<typeof insertMigrationSchema>;
export type Migration = typeof migrations.$inferSelect;

// Configuration model to store settings
export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true,
});

export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurations.$inferSelect;

// API endpoint for reference in frontend code
export const API_ENDPOINTS = {
  ARTIFACTS: "/api/artifacts",
  ARTIFACT: (id: number) => `/api/artifacts/${id}`,
  EXTRACTIONS: "/api/extractions",
  EXTRACTION: (id: number) => `/api/extractions/${id}`,
  EXTRACT: "/api/extract",
  TRANSFORM: "/api/transform",
  MIGRATIONS: "/api/migrations",
  MIGRATION: (id: number) => `/api/migrations/${id}`,
  MIGRATE: "/api/migrate",
  CONFIGURATIONS: "/api/configurations",
  CONFIGURATION: (key: string) => `/api/configurations/${key}`,
  DASHBOARD: "/api/dashboard",
};
