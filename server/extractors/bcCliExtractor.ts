import { promisify } from "util";
import { exec as execCallback } from "child_process";
import fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";

const exec = promisify(execCallback);

interface ExtractedItem {
  id: string;
  name: string;
  type: string;
  data: any;
}

export class BcCliExtractor {
  /**
   * Extract BusinessConnect artifacts
   * @param bcHome TIBCO_HOME path where BusinessConnect is installed
   * @param method Extraction method: cli, rest, or both
   * @param credentials Optional credentials for REST API
   */
  async extract(
    bcHome: string,
    method: "cli" | "rest" | "both",
    credentials?: { username?: string; password?: string }
  ): Promise<ExtractedItem[]> {
    const results: ExtractedItem[] = [];

    if (method === "cli" || method === "both") {
      const cliResults = await this.extractWithCli(bcHome);
      results.push(...cliResults);
    }

    if (method === "rest" || method === "both") {
      if (!credentials?.username || !credentials?.password) {
        throw new Error("REST API extraction requires username and password");
      }
      const restResults = await this.extractWithRest(bcHome, credentials);
      
      // Merge results, avoiding duplicates
      for (const item of restResults) {
        if (!results.some(r => r.id === item.id)) {
          results.push(item);
        }
      }
    }

    return results;
  }

  /**
   * Extract using BusinessConnect CLI
   */
  private async extractWithCli(bcHome: string): Promise<ExtractedItem[]> {
    try {
      const tempDir = path.join(process.cwd(), "temp_extract");
      const timestamp = new Date().getTime();
      const outputFile = path.join(tempDir, `bc_export_${timestamp}.csx`);
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Build the CLI command
      const bcBinPath = path.join(bcHome, "bc", "bin");
      const command = `cd "${bcBinPath}" && ./bcengine -exportConfigRepo "${outputFile}" -overwrite`;
      
      console.log(`Executing BusinessConnect CLI export: ${command}`);
      
      // Execute the command
      const { stdout, stderr } = await exec(command);
      console.log("Export stdout:", stdout);
      
      if (stderr) {
        console.error("Export stderr:", stderr);
      }
      
      // Check if the file was created
      if (!fs.existsSync(outputFile)) {
        throw new Error("Export file was not created");
      }
      
      // Extract and parse the CSX file (which is a ZIP of XML files)
      return await this.processCsxFile(outputFile);
    } catch (error) {
      console.error("Error during CLI extraction:", error);
      throw new Error(`CLI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process the CSX file (a ZIP file containing XML fragments)
   */
  private async processCsxFile(csxFile: string): Promise<ExtractedItem[]> {
    const AdmZip = require("adm-zip");
    const results: ExtractedItem[] = [];
    
    try {
      // Open the CSX file (it's a ZIP archive)
      const zip = new AdmZip(csxFile);
      const zipEntries = zip.getEntries();
      
      // Extract and process each XML file
      for (const entry of zipEntries) {
        if (entry.entryName.endsWith(".xml")) {
          try {
            const content = entry.getData().toString("utf8");
            const xmlObj = await parseStringPromise(content);
            
            // Determine the type of artifact based on XML structure
            const type = this.determineArtifactType(entry.entryName, xmlObj);
            
            // Extract ID and name from XML
            const { id, name } = this.extractIdAndName(entry.entryName, xmlObj, type);
            
            results.push({
              id,
              name,
              type,
              data: xmlObj
            });
          } catch (parseError) {
            console.error(`Error parsing ${entry.entryName}:`, parseError);
            // Continue with other entries
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error processing CSX file:", error);
      throw new Error(`Failed to process CSX file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine the type of artifact based on file name and XML structure
   */
  private determineArtifactType(fileName: string, xmlObj: any): string {
    // Common patterns for artifact types
    if (fileName.includes("Partner")) {
      return "trading_partner";
    } else if (fileName.includes("Channel") || fileName.includes("Connection")) {
      return "channel";
    } else if (fileName.includes("Certificate")) {
      return "certificate";
    } else if (fileName.includes("Map")) {
      return "map";
    } else if (fileName.includes("Endpoint")) {
      return "endpoint";
    } else if (fileName.includes("Schema")) {
      return "schema";
    } else {
      return "other";
    }
  }

  /**
   * Extract ID and name from XML
   */
  private extractIdAndName(fileName: string, xmlObj: any, type: string): { id: string, name: string } {
    let id = "";
    let name = "";
    
    // Extract based on artifact type
    if (type === "trading_partner") {
      id = xmlObj?.Partner?.id?.[0] || fileName;
      name = xmlObj?.Partner?.name?.[0] || fileName;
    } else if (type === "channel") {
      id = xmlObj?.Channel?.id?.[0] || fileName;
      name = xmlObj?.Channel?.name?.[0] || fileName;
    } else if (type === "certificate") {
      id = xmlObj?.Certificate?.id?.[0] || fileName;
      name = xmlObj?.Certificate?.name?.[0] || fileName;
    } else if (type === "map") {
      id = xmlObj?.Map?.id?.[0] || fileName;
      name = xmlObj?.Map?.name?.[0] || fileName;
    } else if (type === "endpoint") {
      id = xmlObj?.Endpoint?.id?.[0] || fileName;
      name = xmlObj?.Endpoint?.name?.[0] || fileName;
    } else if (type === "schema") {
      id = xmlObj?.Schema?.id?.[0] || fileName;
      name = xmlObj?.Schema?.name?.[0] || fileName;
    } else {
      // Use filename for other types
      id = fileName;
      name = fileName.replace(/\.xml$/, "");
    }
    
    return { id, name };
  }

  /**
   * Extract using BusinessConnect REST API
   */
  private async extractWithRest(
    bcHome: string, 
    credentials: { username?: string; password?: string }
  ): Promise<ExtractedItem[]> {
    try {
      const results: ExtractedItem[] = [];
      const { username, password } = credentials;
      
      // Determine BC server information (typically localhost:9000)
      const bcServerInfo = await this.getBcServerInfo(bcHome);
      const baseUrl = `http://${bcServerInfo.host}:${bcServerInfo.port}/businessconnect/v1`;
      
      // Create authentication header
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
      
      // Fetch trading partners
      const partnersResponse = await fetch(`${baseUrl}/partners`, {
        headers: { 
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      });
      
      if (!partnersResponse.ok) {
        throw new Error(`Failed to fetch partners: ${partnersResponse.statusText}`);
      }
      
      const partners = await partnersResponse.json();
      
      // Process each partner
      for (const partner of partners) {
        results.push({
          id: partner.id,
          name: partner.name,
          type: "trading_partner",
          data: partner
        });
        
        // Fetch partner details if needed
        const partnerDetailsResponse = await fetch(`${baseUrl}/partners/${partner.id}`, {
          headers: { 
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        
        if (partnerDetailsResponse.ok) {
          const partnerDetails = await partnerDetailsResponse.json();
          // Update the partner data with detailed information
          results[results.length - 1].data = partnerDetails;
        }
      }
      
      // Similar process for other artifact types...
      // This would be extended to handle channels, certificates, etc.
      
      return results;
    } catch (error) {
      console.error("Error during REST extraction:", error);
      throw new Error(`REST API extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get BusinessConnect server information from configuration
   */
  private async getBcServerInfo(bcHome: string): Promise<{ host: string; port: number }> {
    try {
      // Default values
      const defaultInfo = { host: "localhost", port: 9000 };
      
      // Try to read from configuration file
      const configPath = path.join(bcHome, "bc", "config", "server.xml");
      
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf8");
        const config = await parseStringPromise(configContent);
        
        // Extract host and port from config
        const host = config?.Server?.Host?.[0] || defaultInfo.host;
        const port = parseInt(config?.Server?.Port?.[0], 10) || defaultInfo.port;
        
        return { host, port };
      }
      
      return defaultInfo;
    } catch (error) {
      console.warn("Error reading BC server config, using defaults:", error);
      return { host: "localhost", port: 9000 };
    }
  }
}
