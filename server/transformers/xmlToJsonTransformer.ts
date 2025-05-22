import { parseStringPromise, Builder } from 'xml2js';
import { artifactTypes } from '@shared/schema';

export class XmlToJsonTransformer {
  /**
   * Transform BC XML data to canonical JSON model
   * @param originalData The original XML data from BC
   * @returns Transformed JSON data in APM-compatible format
   */
  async transform(originalData: any): Promise<any> {
    try {
      // Determine the type of artifact
      const artifactType = this.determineArtifactType(originalData);
      
      // Call the appropriate transformation method based on type
      switch (artifactType) {
        case 'trading_partner':
          return this.transformTradingPartner(originalData);
        case 'channel':
          return this.transformChannel(originalData);
        case 'certificate':
          return this.transformCertificate(originalData);
        case 'map':
          return this.transformMap(originalData);
        case 'endpoint':
          return this.transformEndpoint(originalData);
        case 'schema':
          return this.transformSchema(originalData);
        default:
          return this.transformGeneric(originalData);
      }
    } catch (error) {
      console.error('Error transforming data:', error);
      throw new Error(`Transformation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine the type of artifact based on the XML structure
   */
  private determineArtifactType(xmlData: any): string {
    if (xmlData.Partner) {
      return 'trading_partner';
    } else if (xmlData.Channel) {
      return 'channel';
    } else if (xmlData.Certificate) {
      return 'certificate';
    } else if (xmlData.Map) {
      return 'map';
    } else if (xmlData.Endpoint) {
      return 'endpoint';
    } else if (xmlData.Schema) {
      return 'schema';
    } else {
      return 'other';
    }
  }

  /**
   * Transform Trading Partner XML to JSON
   */
  private transformTradingPartner(xmlData: any): any {
    const partner = xmlData.Partner;
    
    if (!partner) {
      throw new Error('Invalid trading partner data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      partner: {
        id: getValue(partner, 'id'),
        name: getValue(partner, 'name'),
        type: 'trading_partner',
        status: getValue(partner, 'status') || 'active',
        contact: this.transformContact(partner.Contact?.[0]),
        identifiers: this.transformIdentifiers(partner.Identifiers?.[0]),
        endpoints: this.transformEndpointRefs(partner.Endpoints?.[0]),
        created: getValue(partner, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform contact information
   */
  private transformContact(contactData: any): any {
    if (!contactData) {
      return null;
    }
    
    return {
      name: contactData.name?.[0] || '',
      email: contactData.email?.[0] || '',
      phone: contactData.phone?.[0] || ''
    };
  }

  /**
   * Transform identifiers
   */
  private transformIdentifiers(identifiersData: any): any[] {
    if (!identifiersData || !identifiersData.Identifier) {
      return [];
    }
    
    return identifiersData.Identifier.map((id: any) => {
      return {
        type: id.type?.[0] || 'custom',
        value: id.value?.[0] || '',
        name: id.name?.[0] || null
      };
    });
  }

  /**
   * Transform endpoint references
   */
  private transformEndpointRefs(endpointsData: any): string[] {
    if (!endpointsData || !endpointsData.Endpoint) {
      return [];
    }
    
    return endpointsData.Endpoint.map((ep: any) => {
      return ep.id?.[0] || ep;
    });
  }

  /**
   * Transform Channel XML to JSON
   */
  private transformChannel(xmlData: any): any {
    const channel = xmlData.Channel;
    
    if (!channel) {
      throw new Error('Invalid channel data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      channel: {
        id: getValue(channel, 'id'),
        name: getValue(channel, 'name'),
        type: getValue(channel, 'type'),
        protocol: getValue(channel, 'protocol'),
        direction: getValue(channel, 'direction'),
        properties: this.transformProperties(channel.Properties?.[0]),
        security: this.transformSecurity(channel.Security?.[0]),
        created: getValue(channel, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform properties
   */
  private transformProperties(propsData: any): any {
    if (!propsData || !propsData.Property) {
      return {};
    }
    
    const result: Record<string, any> = {};
    
    propsData.Property.forEach((prop: any) => {
      const name = prop.name?.[0];
      const value = prop.value?.[0];
      
      if (name && value !== undefined) {
        result[name] = value;
      }
    });
    
    return result;
  }

  /**
   * Transform security settings
   */
  private transformSecurity(securityData: any): any {
    if (!securityData) {
      return null;
    }
    
    return {
      type: securityData.type?.[0] || '',
      certificate: securityData.certificate?.[0] || null,
      username: securityData.username?.[0] || null,
      password: securityData.password?.[0] || null
    };
  }

  /**
   * Transform Certificate XML to JSON
   */
  private transformCertificate(xmlData: any): any {
    const cert = xmlData.Certificate;
    
    if (!cert) {
      throw new Error('Invalid certificate data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      certificate: {
        id: getValue(cert, 'id'),
        name: getValue(cert, 'name'),
        type: getValue(cert, 'type') || 'x509',
        format: getValue(cert, 'format') || 'PEM',
        data: getValue(cert, 'data'),
        fingerprint: getValue(cert, 'fingerprint'),
        issuer: getValue(cert, 'issuer'),
        subject: getValue(cert, 'subject'),
        validFrom: getValue(cert, 'validFrom'),
        validTo: getValue(cert, 'validTo'),
        created: getValue(cert, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform Map XML to JSON
   */
  private transformMap(xmlData: any): any {
    const map = xmlData.Map;
    
    if (!map) {
      throw new Error('Invalid map data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      map: {
        id: getValue(map, 'id'),
        name: getValue(map, 'name'),
        type: getValue(map, 'type') || 'EDI',
        sourceFormat: getValue(map, 'sourceFormat'),
        targetFormat: getValue(map, 'targetFormat'),
        transformation: getValue(map, 'transformation'),
        created: getValue(map, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform Endpoint XML to JSON
   */
  private transformEndpoint(xmlData: any): any {
    const endpoint = xmlData.Endpoint;
    
    if (!endpoint) {
      throw new Error('Invalid endpoint data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      endpoint: {
        id: getValue(endpoint, 'id'),
        name: getValue(endpoint, 'name'),
        type: getValue(endpoint, 'type'),
        url: getValue(endpoint, 'url'),
        properties: this.transformProperties(endpoint.Properties?.[0]),
        channelId: getValue(endpoint, 'channelId'),
        partnerId: getValue(endpoint, 'partnerId'),
        created: getValue(endpoint, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform Schema XML to JSON
   */
  private transformSchema(xmlData: any): any {
    const schema = xmlData.Schema;
    
    if (!schema) {
      throw new Error('Invalid schema data');
    }
    
    const getValue = (obj: any, prop: string) => {
      return obj && obj[prop] ? obj[prop][0] : null;
    };
    
    const result = {
      schema: {
        id: getValue(schema, 'id'),
        name: getValue(schema, 'name'),
        type: getValue(schema, 'type'),
        standard: getValue(schema, 'standard'),
        version: getValue(schema, 'version'),
        format: getValue(schema, 'format'),
        content: getValue(schema, 'content'),
        created: getValue(schema, 'created'),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }

  /**
   * Transform generic XML to JSON
   */
  private transformGeneric(xmlData: any): any {
    // For unknown types, convert the whole XML structure to JSON
    // and add a wrapper with standardized metadata
    const rootElement = Object.keys(xmlData)[0];
    
    if (!rootElement) {
      throw new Error('Invalid data structure');
    }
    
    const entity = xmlData[rootElement];
    
    const result: any = {
      genericArtifact: {
        type: 'other',
        originalType: rootElement,
        id: entity.id?.[0] || '',
        name: entity.name?.[0] || '',
        data: entity,
        created: entity.created?.[0] || new Date().toISOString(),
        modified: new Date().toISOString(),
        apm_id: null
      }
    };
    
    return result;
  }
}
