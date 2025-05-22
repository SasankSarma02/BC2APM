import { apiRequest } from './queryClient';
import { API_ENDPOINTS } from '@shared/schema';

// Dashboard
export const getDashboardStats = async () => {
  const response = await fetch(API_ENDPOINTS.DASHBOARD);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return await response.json();
};

// Artifact operations
export const getArtifacts = async () => {
  const response = await fetch(API_ENDPOINTS.ARTIFACTS);
  if (!response.ok) {
    throw new Error('Failed to fetch artifacts');
  }
  return await response.json();
};

export const getArtifact = async (id: number) => {
  const response = await fetch(API_ENDPOINTS.ARTIFACT(id));
  if (!response.ok) {
    throw new Error('Failed to fetch artifact');
  }
  return await response.json();
};

export const updateArtifact = async (id: number, data: any) => {
  return apiRequest('PATCH', API_ENDPOINTS.ARTIFACT(id), data);
};

// Extraction operations
export const getExtractions = async () => {
  const response = await fetch(API_ENDPOINTS.EXTRACTIONS);
  if (!response.ok) {
    throw new Error('Failed to fetch extractions');
  }
  return await response.json();
};

export const getExtraction = async (id: number) => {
  const response = await fetch(API_ENDPOINTS.EXTRACTION(id));
  if (!response.ok) {
    throw new Error('Failed to fetch extraction');
  }
  return await response.json();
};

export const runExtraction = async (method: 'cli' | 'rest' | 'both', bcHome: string, credentials?: any) => {
  return apiRequest('POST', API_ENDPOINTS.EXTRACT, {
    method,
    bcHome,
    credentials
  });
};

// Transform operations
export const transformArtifact = async (id: number) => {
  return apiRequest('POST', `${API_ENDPOINTS.TRANSFORM}/${id}`, {});
};

export const transformAllNew = async () => {
  return apiRequest('POST', API_ENDPOINTS.TRANSFORM, {});
};

// Migration operations
export const getMigrations = async () => {
  const response = await fetch(API_ENDPOINTS.MIGRATIONS);
  if (!response.ok) {
    throw new Error('Failed to fetch migrations');
  }
  return await response.json();
};

export const getMigrationsForArtifact = async (artifactId: number) => {
  const response = await fetch(`${API_ENDPOINTS.MIGRATIONS}/artifact/${artifactId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch migrations for artifact');
  }
  return await response.json();
};

export const migrateArtifact = async (id: number, apmCredentials: { clientId: string, clientSecret: string }) => {
  return apiRequest('POST', `${API_ENDPOINTS.MIGRATE}/${id}`, { apmCredentials });
};

export const migrateAllPending = async (apmCredentials: { clientId: string, clientSecret: string }) => {
  return apiRequest('POST', API_ENDPOINTS.MIGRATE, { apmCredentials });
};

// Configuration operations
export const getConfigurations = async () => {
  const response = await fetch(API_ENDPOINTS.CONFIGURATIONS);
  if (!response.ok) {
    throw new Error('Failed to fetch configurations');
  }
  return await response.json();
};

export const getConfiguration = async (key: string) => {
  const response = await fetch(API_ENDPOINTS.CONFIGURATION(key));
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch configuration');
  }
  return await response.json();
};

export const setConfiguration = async (key: string, value: any) => {
  return apiRequest('POST', API_ENDPOINTS.CONFIGURATIONS, {
    key,
    value
  });
};
