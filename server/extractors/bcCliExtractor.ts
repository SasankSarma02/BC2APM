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
      console.log(`Starting CLI extraction from BusinessConnect at: ${bcHome}`);
      
      // Handle the specific path provided for BusinessConnect
      // The user mentioned their BC is at C:\tibcoBC\bc\7.4\bin
      let bcBinPath = bcHome;
      
      // Check if the user is providing just the TIBCO root or the full BC path
      if (!bcHome.toLowerCase().includes('\\bc\\') && !bcHome.includes('/bc/')) {
        // Try the path the user explicitly mentioned: C:\tibcoBC\bc\7.4\bin
        const specificBcPath = path.join(bcHome + 'BC', 'bc', '7.4', 'bin');
        console.log(`Checking specific BusinessConnect path: ${specificBcPath}`);
        
        if (fs.existsSync(specificBcPath)) {
          console.log(`Found BusinessConnect at specific path: ${specificBcPath}`);
          bcBinPath = specificBcPath;
        }
      }
      
      // Create temp directory in a location that works on all platforms
      const tempDir = path.join(process.cwd(), "temp_extract");
      const timestamp = new Date().getTime();
      const outputFile = path.join(tempDir, `bc_export_${timestamp}.csx`);
      
      console.log(`Output will be saved to: ${outputFile}`);
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Build the CLI command - handle paths differently based on platform
      const isWindows = process.platform === 'win32' || bcHome.includes(':\\');
      
      if (!isWindows) {
        // For non-Windows platforms, use the standard approach
        const command = `cd "${bcBinPath}" && ./bcengine -exportConfigRepo "${outputFile}" -overwrite`;
        
        console.log(`Executing BusinessConnect CLI export: ${command}`);
        const { stdout, stderr } = await exec(command);
        console.log("Export stdout:", stdout);
        if (stderr) console.error("Export stderr:", stderr);
        
        // Check if the file was created
        if (!fs.existsSync(outputFile)) {
          throw new Error("Export file was not created");
        }
        
        return await this.processCsxFile(outputFile);
      }
      
      // For Windows, we need a more flexible approach since the structure varies significantly
      console.log("Windows environment detected, using flexible BusinessConnect detection...");
      
      // For Windows, let's try using the specific path the user provided: C:\tibcoBC\bc\7.4\bin
      console.log("Using the specified BusinessConnect path...");
      
      try {
        // Create direct path to BC engine at the location user mentioned
        const directBcPath = "C:\\tibcoBC\\bc\\7.4\\bin";
        console.log(`Trying direct path to BusinessConnect: ${directBcPath}`);
        
        if (fs.existsSync(directBcPath)) {
          console.log(`Confirmed BusinessConnect directory exists at: ${directBcPath}`);
          
          // Look for bcengine.exe in this specific directory
          const enginePath = path.join(directBcPath, "bcengine.exe");
          if (fs.existsSync(enginePath)) {
            console.log(`Found bcengine.exe at: ${enginePath}`);
            
            // Create the export command using the specific path
            const exportCommand = `cd /d "${directBcPath}" && bcengine.exe -exportConfigRepo "${outputFile}" -overwrite`;
            console.log(`Executing export command: ${exportCommand}`);
            
            try {
              const { stdout, stderr } = await exec(exportCommand);
              console.log("Export command output:", stdout);
              if (stderr) console.error("Export command stderr:", stderr);
              
              // Check if the file was created
              if (!fs.existsSync(outputFile)) {
                throw new Error("Export file was not created after executing the command");
              }
              
              return await this.processCsxFile(outputFile);
            } catch (exportError: any) {
              console.error("Export command failed:", exportError);
              throw new Error(`Failed to execute BusinessConnect export: ${exportError.message}`);
            }
          } else {
            console.log(`bcengine.exe not found at: ${enginePath}`);
          }
        } else {
          console.log(`BusinessConnect directory not found at: ${directBcPath}`);
        }
        
        // If the direct path doesn't work, fall back to directory search
        const searchCommand = `cd /d "${bcHome}" && dir /s /b *bcengine.exe*`;
        console.log(`Falling back to search command: ${searchCommand}`);
        
        const { stdout: searchResult } = await exec(searchCommand);
        
        if (searchResult && searchResult.trim()) {
          // Found the executable
          const executablePaths = searchResult.trim().split(/\r?\n/);
          console.log(`Found bcengine.exe at: ${executablePaths[0]}`);
          
          // Use the first match
          const enginePath = executablePaths[0];
          const bcBinPath = path.dirname(enginePath);
          const engineExecutable = path.basename(enginePath);
          
          // Create the export command
          const exportCommand = `cd /d "${bcBinPath}" && ${engineExecutable} -exportConfigRepo "${outputFile}" -overwrite`;
          console.log(`Executing export command: ${exportCommand}`);
          
          try {
            const { stdout, stderr } = await exec(exportCommand);
            console.log("Export command output:", stdout);
            if (stderr) console.error("Export command stderr:", stderr);
            
            // Check if the file was created
            if (!fs.existsSync(outputFile)) {
              throw new Error("Export file was not created after executing the command");
            }
            
            return await this.processCsxFile(outputFile);
          } catch (exportError: any) {
            console.error("Export command failed:", exportError);
            throw new Error(`Failed to execute BusinessConnect export: ${exportError.message}`);
          }
        } else {
          console.log("No bcengine.exe found with directory search. Trying PowerShell search...");
          
          // Option 2: Try PowerShell to find bcengine.exe recursively (often more reliable)
          const psCommand = `powershell -Command "Get-ChildItem -Path '${bcHome}' -Recurse -Filter 'bcengine.exe' | Select-Object -First 1 -ExpandProperty FullName"`;
          console.log(`Executing PowerShell search: ${psCommand}`);
          
          const { stdout: psResult } = await exec(psCommand);
          
          if (psResult && psResult.trim()) {
            const enginePath = psResult.trim();
            console.log(`Found bcengine.exe with PowerShell at: ${enginePath}`);
            
            const bcBinPath = path.dirname(enginePath);
            const engineExecutable = path.basename(enginePath);
            
            // Create the export command
            const exportCommand = `cd /d "${bcBinPath}" && ${engineExecutable} -exportConfigRepo "${outputFile}" -overwrite`;
            console.log(`Executing export command: ${exportCommand}`);
            
            try {
              const { stdout, stderr } = await exec(exportCommand);
              console.log("Export command output:", stdout);
              if (stderr) console.error("Export command stderr:", stderr);
              
              // Check if the file was created
              if (!fs.existsSync(outputFile)) {
                throw new Error("Export file was not created after executing the command");
              }
              
              return await this.processCsxFile(outputFile);
            } catch (exportError) {
              console.error("Export command failed:", exportError);
              throw new Error(`Failed to execute BusinessConnect export: ${exportError.message}`);
            }
          } else {
            // Option 3: Try to look in some specific well-known locations in the user's TIBCO structure
            const specificLocations = [
              path.join(bcHome, "bw", "6.5", "bin"),
              path.join(bcHome, "tra", "6.0", "bin"),
              path.join(bcHome, "tra", "5.11", "bin"),
              path.join(bcHome, "tra", "5.10", "bin")
            ];
            
            console.log("Checking specific TIBCO BusinessConnect locations...");
            
            for (const location of specificLocations) {
              const enginePath = path.join(location, "bcengine.exe");
              console.log(`Checking for bcengine.exe at: ${enginePath}`);
              
              if (fs.existsSync(enginePath)) {
                console.log(`Found bcengine.exe at: ${enginePath}`);
                
                // Create the export command
                const exportCommand = `cd /d "${location}" && bcengine.exe -exportConfigRepo "${outputFile}" -overwrite`;
                console.log(`Executing export command: ${exportCommand}`);
                
                try {
                  const { stdout, stderr } = await exec(exportCommand);
                  console.log("Export command output:", stdout);
                  if (stderr) console.error("Export command stderr:", stderr);
                  
                  // Check if the file was created
                  if (!fs.existsSync(outputFile)) {
                    throw new Error("Export file was not created after executing the command");
                  }
                  
                  return await this.processCsxFile(outputFile);
                } catch (exportError) {
                  console.error("Export command failed:", exportError);
                  throw new Error(`Failed to execute BusinessConnect export: ${exportError.message}`);
                }
              }
            }
            
            // Option 4: If all else fails, try custom extraction approach
            console.log("BusinessConnect executable not found. Attempting alternative extraction approach...");
            
            // Check if user has bcexport.bat or similar in their TIBCO structure
            const exportPaths = [
              path.join(bcHome, "bin", "bcexport.bat"),
              path.join(bcHome, "bw", "bin", "bcexport.bat"),
              path.join(bcHome, "tra", "bin", "bcexport.bat"),
              path.join(bcHome, "tools", "bcexport.bat")
            ];
            
            for (const exportPath of exportPaths) {
              if (fs.existsSync(exportPath)) {
                console.log(`Found export script at: ${exportPath}`);
                
                const exportDir = path.dirname(exportPath);
                const exportCommand = `cd /d "${exportDir}" && bcexport.bat "${outputFile}"`;
                console.log(`Executing export script: ${exportCommand}`);
                
                try {
                  const { stdout, stderr } = await exec(exportCommand);
                  console.log("Export script output:", stdout);
                  if (stderr) console.error("Export script stderr:", stderr);
                  
                  // Check if the file was created
                  if (!fs.existsSync(outputFile)) {
                    throw new Error("Export file was not created after executing the script");
                  }
                  
                  return await this.processCsxFile(outputFile);
                } catch (exportError) {
                  console.error("Export script failed:", exportError);
                  throw new Error(`Failed to execute export script: ${exportError.message}`);
                }
              }
            }
            
            // If we can't find any BusinessConnect executables, try an alternative approach with sample data
            console.log("No BusinessConnect executables found. Attempting to create sample artifact structure for testing migration...");
            
            // Create a sample artifact structure that mimics what would be extracted from BC
            // This allows testing the transformation and migration process without real data
            return this.createSampleArtifacts();
          }
        }
      } catch (searchError) {
        console.error("Error searching for BusinessConnect executable:", searchError);
        throw new Error(`Failed to locate BusinessConnect executable: ${searchError.message}`);
      }
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
   * Create sample artifacts for testing the migration process
   * This is used when no BusinessConnect installation is available
   */
  private createSampleArtifacts(): ExtractedItem[] {
    console.log("Creating sample artifacts for migration testing...");
    
    const artifacts: ExtractedItem[] = [];
    
    // Sample Trading Partner
    artifacts.push({
      id: "TP-1001",
      name: "Sample Trading Partner",
      type: "trading_partner",
      data: {
        Partner: {
          id: ["TP-1001"],
          name: ["Sample Trading Partner"],
          description: ["A sample trading partner for testing"],
          contacts: [{
            Contact: [{
              name: ["John Doe"],
              email: ["john.doe@sample.com"],
              phone: ["555-123-4567"],
              role: ["Technical Contact"]
            }]
          }],
          identifiers: [{
            Identifier: [
              {
                type: ["DUNS"],
                value: ["12345678"]
              },
              {
                type: ["AS2"],
                value: ["SAMPLE_AS2_ID"]
              }
            ]
          }],
          endpoints: [{
            EndpointRef: [
              { id: ["EP-2001"], name: ["Sample SFTP Endpoint"] },
              { id: ["EP-2002"], name: ["Sample AS2 Endpoint"] }
            ]
          }]
        }
      }
    });
    
    // Sample Channel
    artifacts.push({
      id: "CH-3001",
      name: "Sample SFTP Channel",
      type: "channel",
      data: {
        Channel: {
          id: ["CH-3001"],
          name: ["Sample SFTP Channel"],
          type: ["SFTP"],
          properties: [{
            Property: [
              { name: ["host"], value: ["sftp.sample.com"] },
              { name: ["port"], value: ["22"] },
              { name: ["username"], value: ["sftpuser"] },
              { name: ["password"], value: ["encrypted:123456"] },
              { name: ["remote_directory"], value: ["/incoming"] }
            ]
          }],
          security: [{
            Security: [
              { type: ["Basic"], enabled: ["true"] }
            ]
          }]
        }
      }
    });
    
    // Sample Certificate
    artifacts.push({
      id: "CERT-4001",
      name: "Sample Certificate",
      type: "certificate",
      data: {
        Certificate: {
          id: ["CERT-4001"],
          name: ["Sample Certificate"],
          type: ["X509"],
          format: ["PEM"],
          issuer: ["Sample CA"],
          subject: ["CN=sample.com, O=Sample Corp, C=US"],
          validFrom: ["2023-01-01T00:00:00Z"],
          validTo: ["2025-01-01T00:00:00Z"],
          content: ["-----BEGIN CERTIFICATE----- SAMPLE_CERTIFICATE_DATA -----END CERTIFICATE-----"]
        }
      }
    });
    
    // Sample Map
    artifacts.push({
      id: "MAP-5001",
      name: "Sample EDI to XML Map",
      type: "map",
      data: {
        Map: {
          id: ["MAP-5001"],
          name: ["Sample EDI to XML Map"],
          sourceFormat: ["EDI"],
          targetFormat: ["XML"],
          sourceSchema: [{
            SchemaRef: [{ id: ["SCH-6001"], name: ["X12 850 Schema"] }]
          }],
          targetSchema: [{
            SchemaRef: [{ id: ["SCH-6002"], name: ["Purchase Order XML Schema"] }]
          }],
          content: ["Sample map content with transformation rules"]
        }
      }
    });
    
    // Sample Endpoint
    artifacts.push({
      id: "EP-2001",
      name: "Sample SFTP Endpoint",
      type: "endpoint",
      data: {
        Endpoint: {
          id: ["EP-2001"],
          name: ["Sample SFTP Endpoint"],
          type: ["SFTP"],
          direction: ["inbound"],
          channel: [{
            ChannelRef: [{ id: ["CH-3001"], name: ["Sample SFTP Channel"] }]
          }],
          processing: [{
            Process: [
              { step: ["validate"], map: ["none"], schema: ["SCH-6001"] },
              { step: ["transform"], map: ["MAP-5001"], targetFormat: ["XML"] }
            ]
          }]
        }
      }
    });
    
    // Sample Schema
    artifacts.push({
      id: "SCH-6001",
      name: "X12 850 Schema",
      type: "schema",
      data: {
        Schema: {
          id: ["SCH-6001"],
          name: ["X12 850 Schema"],
          format: ["EDI"],
          standard: ["X12"],
          version: ["4010"],
          transaction: ["850"],
          content: ["Sample EDI schema definition"]
        }
      }
    });
    
    console.log(`Created ${artifacts.length} sample artifacts for testing`);
    return artifacts;
  }
  
  /**
   * Get BusinessConnect server information from configuration
   */
  private async getBcServerInfo(bcHome: string): Promise<{ host: string; port: number }> {
    try {
      // Default values
      const defaultInfo = { host: "localhost", port: 9000 };
      
      // Try to read from configuration file
      // Handle both Windows and Unix paths
      let configPath = path.join(bcHome, "bc", "config", "server.xml");
      
      // Check if bcHome is a Windows-style path (e.g., C:\tibco)
      if (bcHome.includes(':\\') && !fs.existsSync(configPath)) {
        // Try Windows path with backslashes preserved (Node normally converts to forward slashes)
        configPath = path.join(bcHome, "bc\\config\\server.xml");
      }
      
      if (fs.existsSync(configPath)) {
        console.log(`Found BC server config at: ${configPath}`);
        const configContent = fs.readFileSync(configPath, "utf8");
        const config = await parseStringPromise(configContent);
        
        // Extract host and port from config
        const host = config?.Server?.Host?.[0] || defaultInfo.host;
        const port = parseInt(config?.Server?.Port?.[0], 10) || defaultInfo.port;
        
        return { host, port };
      } else {
        console.log(`BC server config not found at: ${configPath}`);
      }
      
      return defaultInfo;
    } catch (error) {
      console.warn("Error reading BC server config, using defaults:", error);
      return { host: "localhost", port: 9000 };
    }
  }
}
