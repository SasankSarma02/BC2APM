import { 
  Artifact, InsertArtifact, 
  Extraction, InsertExtraction,
  Migration, InsertMigration,
  Configuration, InsertConfiguration,
  User, InsertUser,
  artifacts, extractions, migrations, configurations, users
} from "@shared/schema";

// Extended storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Artifact operations
  getArtifacts(): Promise<Artifact[]>;
  getArtifactsByStatus(status: string): Promise<Artifact[]>;
  getArtifactsByType(type: string): Promise<Artifact[]>;
  getArtifact(id: number): Promise<Artifact | undefined>;
  getArtifactByOriginalId(originalId: string): Promise<Artifact | undefined>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: number, updates: Partial<InsertArtifact>): Promise<Artifact | undefined>;
  deleteArtifact(id: number): Promise<boolean>;

  // Extraction operations
  getExtractions(): Promise<Extraction[]>;
  getExtraction(id: number): Promise<Extraction | undefined>;
  getLatestExtraction(): Promise<Extraction | undefined>;
  createExtraction(extraction: InsertExtraction): Promise<Extraction>;
  updateExtraction(id: number, updates: Partial<InsertExtraction>): Promise<Extraction | undefined>;

  // Migration operations
  getMigrations(): Promise<Migration[]>;
  getMigrationsByArtifactId(artifactId: number): Promise<Migration[]>;
  getMigration(id: number): Promise<Migration | undefined>;
  createMigration(migration: InsertMigration): Promise<Migration>;

  // Configuration operations
  getConfigurations(): Promise<Configuration[]>;
  getConfiguration(key: string): Promise<Configuration | undefined>;
  setConfiguration(config: InsertConfiguration): Promise<Configuration>;

  // Dashboard data
  getDashboardStats(): Promise<{
    artifactCount: number;
    migratedCount: number;
    pendingCount: number;
    errorCount: number;
    lastExtracted?: Date;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artifacts: Map<number, Artifact>;
  private extractions: Map<number, Extraction>;
  private migrations: Map<number, Migration>;
  private configurations: Map<string, Configuration>;
  
  private userId: number;
  private artifactId: number;
  private extractionId: number;
  private migrationId: number;
  private configId: number;

  constructor() {
    this.users = new Map();
    this.artifacts = new Map();
    this.extractions = new Map();
    this.migrations = new Map();
    this.configurations = new Map();

    this.userId = 1;
    this.artifactId = 1;
    this.extractionId = 1;
    this.migrationId = 1;
    this.configId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Artifact operations
  async getArtifacts(): Promise<Artifact[]> {
    return Array.from(this.artifacts.values());
  }

  async getArtifactsByStatus(status: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(
      (artifact) => artifact.status === status
    );
  }

  async getArtifactsByType(type: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(
      (artifact) => artifact.type === type
    );
  }

  async getArtifact(id: number): Promise<Artifact | undefined> {
    return this.artifacts.get(id);
  }

  async getArtifactByOriginalId(originalId: string): Promise<Artifact | undefined> {
    return Array.from(this.artifacts.values()).find(
      (artifact) => artifact.originalId === originalId
    );
  }

  async createArtifact(insertArtifact: InsertArtifact): Promise<Artifact> {
    const id = this.artifactId++;
    const now = new Date();
    const artifact: Artifact = { 
      ...insertArtifact, 
      id,
      createdAt: now
    };
    this.artifacts.set(id, artifact);
    return artifact;
  }

  async updateArtifact(id: number, updates: Partial<InsertArtifact>): Promise<Artifact | undefined> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return undefined;

    const updatedArtifact: Artifact = {
      ...artifact,
      ...updates,
      lastModified: new Date()
    };
    
    this.artifacts.set(id, updatedArtifact);
    return updatedArtifact;
  }

  async deleteArtifact(id: number): Promise<boolean> {
    return this.artifacts.delete(id);
  }

  // Extraction operations
  async getExtractions(): Promise<Extraction[]> {
    return Array.from(this.extractions.values());
  }

  async getExtraction(id: number): Promise<Extraction | undefined> {
    return this.extractions.get(id);
  }

  async getLatestExtraction(): Promise<Extraction | undefined> {
    const allExtractions = Array.from(this.extractions.values());
    if (allExtractions.length === 0) return undefined;
    
    return allExtractions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }

  async createExtraction(insertExtraction: InsertExtraction): Promise<Extraction> {
    const id = this.extractionId++;
    const extraction: Extraction = { ...insertExtraction, id };
    this.extractions.set(id, extraction);
    return extraction;
  }

  async updateExtraction(id: number, updates: Partial<InsertExtraction>): Promise<Extraction | undefined> {
    const extraction = this.extractions.get(id);
    if (!extraction) return undefined;

    const updatedExtraction: Extraction = {
      ...extraction,
      ...updates
    };
    
    this.extractions.set(id, updatedExtraction);
    return updatedExtraction;
  }

  // Migration operations
  async getMigrations(): Promise<Migration[]> {
    return Array.from(this.migrations.values());
  }

  async getMigrationsByArtifactId(artifactId: number): Promise<Migration[]> {
    return Array.from(this.migrations.values()).filter(
      (migration) => migration.artifactId === artifactId
    );
  }

  async getMigration(id: number): Promise<Migration | undefined> {
    return this.migrations.get(id);
  }

  async createMigration(insertMigration: InsertMigration): Promise<Migration> {
    const id = this.migrationId++;
    const migration: Migration = { ...insertMigration, id };
    this.migrations.set(id, migration);
    return migration;
  }

  // Configuration operations
  async getConfigurations(): Promise<Configuration[]> {
    return Array.from(this.configurations.values());
  }

  async getConfiguration(key: string): Promise<Configuration | undefined> {
    return Array.from(this.configurations.values()).find(
      (config) => config.key === key
    );
  }

  async setConfiguration(insertConfig: InsertConfiguration): Promise<Configuration> {
    const existingConfig = await this.getConfiguration(insertConfig.key);
    
    if (existingConfig) {
      const updatedConfig: Configuration = {
        ...existingConfig,
        value: insertConfig.value,
        updatedAt: new Date()
      };
      this.configurations.set(existingConfig.key, updatedConfig);
      return updatedConfig;
    }
    
    const id = this.configId++;
    const config: Configuration = { 
      ...insertConfig, 
      id, 
      updatedAt: new Date() 
    };
    this.configurations.set(config.key, config);
    return config;
  }

  // Dashboard data
  async getDashboardStats(): Promise<{
    artifactCount: number;
    migratedCount: number;
    pendingCount: number;
    errorCount: number;
    lastExtracted?: Date;
  }> {
    const allArtifacts = Array.from(this.artifacts.values());
    const latestExtraction = await this.getLatestExtraction();

    return {
      artifactCount: allArtifacts.length,
      migratedCount: allArtifacts.filter(a => a.status === 'migrated').length,
      pendingCount: allArtifacts.filter(a => a.status === 'pending').length,
      errorCount: allArtifacts.filter(a => a.status === 'error').length,
      lastExtracted: latestExtraction?.timestamp,
    };
  }
}

export const storage = new MemStorage();
