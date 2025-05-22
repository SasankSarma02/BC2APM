import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertArtifactSchema, insertExtractionSchema, insertMigrationSchema, insertConfigurationSchema } from "@shared/schema";
import { BcCliExtractor } from "./extractors/bcCliExtractor";
import { XmlToJsonTransformer } from "./transformers/xmlToJsonTransformer";
import { ApmLoader } from "./loaders/apmLoader";
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import path from "path";
import fs from "fs";

const exec = promisify(execCallback);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize extractor, transformer and loader
  const extractor = new BcCliExtractor();
  const transformer = new XmlToJsonTransformer();
  const loader = new ApmLoader();
  
  // Get all artifacts
  app.get("/api/artifacts", async (req, res) => {
    try {
      const artifacts = await storage.getArtifacts();
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ message: `Error getting artifacts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get artifact by ID
  app.get("/api/artifacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }

      const artifact = await storage.getArtifact(id);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }

      res.json(artifact);
    } catch (error) {
      res.status(500).json({ message: `Error getting artifact: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Update artifact
  app.patch("/api/artifacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }

      const result = insertArtifactSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid artifact data", errors: result.error.format() });
      }

      const updatedArtifact = await storage.updateArtifact(id, result.data);
      if (!updatedArtifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }

      res.json(updatedArtifact);
    } catch (error) {
      res.status(500).json({ message: `Error updating artifact: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get all extractions
  app.get("/api/extractions", async (req, res) => {
    try {
      const extractions = await storage.getExtractions();
      res.json(extractions);
    } catch (error) {
      res.status(500).json({ message: `Error getting extractions: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get extraction by ID
  app.get("/api/extractions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid extraction ID" });
      }

      const extraction = await storage.getExtraction(id);
      if (!extraction) {
        return res.status(404).json({ message: "Extraction not found" });
      }

      res.json(extraction);
    } catch (error) {
      res.status(500).json({ message: `Error getting extraction: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Trigger extraction
  app.post("/api/extract", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        method: z.enum(["cli", "rest", "both"]),
        bcHome: z.string(),
        credentials: z.object({
          username: z.string().optional(),
          password: z.string().optional()
        }).optional()
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid extraction parameters", errors: result.error.format() });
      }

      const { method, bcHome, credentials } = result.data;

      // Create extraction record
      const extraction = await storage.createExtraction({
        method,
        status: "in_progress",
        timestamp: new Date(),
        artifactCount: 0,
        metadata: { bcHome, ...credentials }
      });

      // Execute extraction asynchronously
      extractor.extract(bcHome, method, credentials)
        .then(async (extractedData) => {
          // Process extracted data
          const artifacts = await Promise.all(
            extractedData.map(async (item) => {
              return storage.createArtifact({
                name: item.name,
                originalId: item.id,
                type: item.type,
                status: "new",
                originalData: item.data,
                extractionId: extraction.id,
                lastModified: new Date()
              });
            })
          );

          // Update extraction with results
          await storage.updateExtraction(extraction.id, {
            status: "completed",
            artifactCount: artifacts.length
          });
        })
        .catch(async (error) => {
          // Update extraction with error
          await storage.updateExtraction(extraction.id, {
            status: "failed",
            metadata: { 
              ...extraction.metadata, 
              error: error instanceof Error ? error.message : String(error) 
            }
          });
        });

      // Respond with the extraction ID
      res.status(202).json({ 
        message: "Extraction started", 
        extractionId: extraction.id 
      });
    } catch (error) {
      res.status(500).json({ message: `Error starting extraction: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Transform artifact
  app.post("/api/transform/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }

      const artifact = await storage.getArtifact(id);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }

      // Transform artifact
      const transformed = await transformer.transform(artifact.originalData);
      
      // Update artifact with transformed data
      const updatedArtifact = await storage.updateArtifact(id, {
        transformedData: transformed,
        status: "pending"
      });

      res.json(updatedArtifact);
    } catch (error) {
      res.status(500).json({ message: `Error transforming artifact: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Transform all new artifacts
  app.post("/api/transform", async (req, res) => {
    try {
      const newArtifacts = await storage.getArtifactsByStatus("new");
      
      const results = await Promise.all(
        newArtifacts.map(async (artifact) => {
          try {
            const transformed = await transformer.transform(artifact.originalData);
            return await storage.updateArtifact(artifact.id, {
              transformedData: transformed,
              status: "pending"
            });
          } catch (error) {
            return await storage.updateArtifact(artifact.id, {
              status: "error"
            });
          }
        })
      );

      res.json({
        message: "Transformation completed",
        transformed: results.length
      });
    } catch (error) {
      res.status(500).json({ message: `Error transforming artifacts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get all migrations
  app.get("/api/migrations", async (req, res) => {
    try {
      const migrations = await storage.getMigrations();
      res.json(migrations);
    } catch (error) {
      res.status(500).json({ message: `Error getting migrations: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get migrations by artifact ID
  app.get("/api/migrations/artifact/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }

      const migrations = await storage.getMigrationsByArtifactId(id);
      res.json(migrations);
    } catch (error) {
      res.status(500).json({ message: `Error getting migrations: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Migrate artifact to APM
  app.post("/api/migrate/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }

      // Validate request body
      const schema = z.object({
        apmCredentials: z.object({
          clientId: z.string(),
          clientSecret: z.string()
        })
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid APM credentials", errors: result.error.format() });
      }

      const { apmCredentials } = result.data;
      
      const artifact = await storage.getArtifact(id);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }

      if (!artifact.transformedData) {
        return res.status(400).json({ message: "Artifact must be transformed before migration" });
      }

      // Migrate artifact to APM
      try {
        const apmResponse = await loader.load(artifact.transformedData, artifact.type, apmCredentials);
        
        // Create migration record
        const migration = await storage.createMigration({
          artifactId: artifact.id,
          timestamp: new Date(),
          status: "success",
          apmResponse
        });

        // Update artifact with APM ID
        const updatedArtifact = await storage.updateArtifact(id, {
          status: "migrated",
          apmId: apmResponse.id
        });

        res.json({
          message: "Migration successful",
          migration,
          artifact: updatedArtifact
        });
      } catch (error) {
        // Create migration record with error
        const migration = await storage.createMigration({
          artifactId: artifact.id,
          timestamp: new Date(),
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error)
        });

        // Update artifact status
        await storage.updateArtifact(id, {
          status: "error"
        });

        res.status(500).json({ 
          message: "Migration failed", 
          error: error instanceof Error ? error.message : String(error),
          migration
        });
      }
    } catch (error) {
      res.status(500).json({ message: `Error migrating artifact: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Migrate all pending artifacts
  app.post("/api/migrate", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        apmCredentials: z.object({
          clientId: z.string(),
          clientSecret: z.string()
        })
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid APM credentials", errors: result.error.format() });
      }

      const { apmCredentials } = result.data;
      
      const pendingArtifacts = await storage.getArtifactsByStatus("pending");
      
      const results = await Promise.all(
        pendingArtifacts.map(async (artifact) => {
          try {
            if (!artifact.transformedData) {
              throw new Error("Missing transformed data");
            }
            
            const apmResponse = await loader.load(artifact.transformedData, artifact.type, apmCredentials);
            
            // Create migration record
            const migration = await storage.createMigration({
              artifactId: artifact.id,
              timestamp: new Date(),
              status: "success",
              apmResponse
            });

            // Update artifact with APM ID
            await storage.updateArtifact(artifact.id, {
              status: "migrated",
              apmId: apmResponse.id
            });

            return { success: true, artifactId: artifact.id };
          } catch (error) {
            // Create migration record with error
            await storage.createMigration({
              artifactId: artifact.id,
              timestamp: new Date(),
              status: "failed",
              errorMessage: error instanceof Error ? error.message : String(error)
            });

            // Update artifact status
            await storage.updateArtifact(artifact.id, {
              status: "error"
            });

            return { success: false, artifactId: artifact.id, error: error instanceof Error ? error.message : String(error) };
          }
        })
      );

      res.json({
        message: "Migration batch completed",
        results
      });
    } catch (error) {
      res.status(500).json({ message: `Error migrating artifacts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get configurations
  app.get("/api/configurations", async (req, res) => {
    try {
      const configs = await storage.getConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: `Error getting configurations: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get configuration by key
  app.get("/api/configurations/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const config = await storage.getConfiguration(key);
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.json(config);
    } catch (error) {
      res.status(500).json({ message: `Error getting configuration: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Set configuration
  app.post("/api/configurations", async (req, res) => {
    try {
      const result = insertConfigurationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid configuration data", errors: result.error.format() });
      }

      const config = await storage.setConfiguration(result.data);
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: `Error setting configuration: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Get dashboard statistics
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: `Error getting dashboard statistics: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
